import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Item, ItemType } from "../entities/Item";
import { generateMap } from "../utils/mapGenerator";
import { InputManager } from "../utils/InputManager";

export class GameScene extends Phaser.Scene {
  private player: Player;
  private enemies: Phaser.Physics.Arcade.Group;
  private items: Phaser.Physics.Arcade.Group;
  private map: number[][];
  private tiles: Phaser.GameObjects.Group;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey: Phaser.Input.Keyboard.Key;
  private inventoryKey: Phaser.Input.Keyboard.Key;
  private lastEnemySpawnTime: number = 0;
  private enemySpawnInterval: number = 5000; // 5 seconds
  private maxEnemies: number = 10;
  private inputManager: InputManager;

  constructor() {
    super("GameScene");
  }

  create() {
    // Initialize input manager
    this.inputManager = InputManager.getInstance(this);
    
    // Generate map
    this.map = generateMap(25, 25);
    this.createMap();
    
    // Create player
    this.player = new Player(this, 400, 300);
    
    // Store player in registry for other scenes to access
    this.registry.set('player', this.player);
    
    // Create enemies group
    this.enemies = this.physics.add.group({
      runChildUpdate: true
    });
    
    // Create items group
    this.items = this.physics.add.group();
    
    // Spawn initial enemies
    this.spawnEnemies(3);
    
    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    
    // Set up collisions
    this.physics.add.collider(this.player.gameObject, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.items, this.walls);
    
    // Set up camera
    this.cameras.main.startFollow(this.player.gameObject, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, 25 * 32, 25 * 32);
    
    // Create event for player attack
    this.events.on("player-attack", this.handlePlayerAttack, this);
    
    // Start UI scene
    this.scene.launch("UIScene", { player: this.player });
    
    // Debug message to confirm scene is running
    console.log("GameScene created and running");
  }

  update(time: number, delta: number) {
    // Update input manager
    this.inputManager.update();
    
    // Update player
    this.player.update(this.cursors, this.attackKey);
    
    // Check for inventory key press using InputManager
    if (this.inputManager.isKeyJustPressed('inventory')) {
      this.toggleInventory();
      console.log("Inventory key pressed, toggling inventory");
    }
    
    // Spawn enemies over time
    if (time > this.lastEnemySpawnTime + this.enemySpawnInterval && this.enemies.getChildren().length < this.maxEnemies) {
      this.spawnEnemies(1);
      this.lastEnemySpawnTime = time;
    }
    
    // Update enemies to follow player
    this.enemies.getChildren().forEach((enemyObject) => {
      // Get the Enemy instance from the game object's data
      const enemy = enemyObject.getData('entity') as Enemy;
      if (enemy && typeof enemy.followPlayer === 'function') {
        enemy.followPlayer(this.player);
        
        // Explicitly call the enemy's update method to update UI elements
        enemy.update();
      }
    });
    
    // Update items and check for collection
    this.items.getChildren().forEach((itemObject) => {
      const item = itemObject.getData('entity') as Item;
      if (item) {
        // Update item and check if it can be collected
        const canCollect = item.update(this.player.x, this.player.y);
        
        if (canCollect) {
          // Try to add item to player's inventory
          const collected = this.player.collectItem(item);
          
          if (collected) {
            // Remove item from game
            item.destroy();
          }
        }
      }
    });
    
    // Check for collisions between player and enemies
    this.physics.overlap(this.player.gameObject, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
  }

  private createMap() {
    this.tiles = this.add.group();
    this.walls = this.physics.add.staticGroup();
    
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const tileX = x * 32;
        const tileY = y * 32;
        
        // 0 = grass, 1 = stone, 2 = wall
        switch (this.map[y][x]) {
          case 0:
            this.tiles.add(this.add.image(tileX + 16, tileY + 16, "grass-tile"));
            break;
          case 1:
            this.tiles.add(this.add.image(tileX + 16, tileY + 16, "stone-tile"));
            break;
          case 2:
            this.tiles.add(this.add.image(tileX + 16, tileY + 16, "wall-tile"));
            const wall = this.walls.create(tileX + 16, tileY + 16, "wall-tile");
            wall.setSize(32, 32);
            wall.setImmovable(true);
            break;
        }
      }
    }
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      let x, y;
      let validPosition = false;
      
      // Find a valid position for the enemy (not on a wall and not too close to player)
      while (!validPosition) {
        x = Phaser.Math.Between(100, 25 * 32 - 100);
        y = Phaser.Math.Between(100, 25 * 32 - 100);
        
        // Check distance from player
        const distance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        
        // Check if position is on a wall
        const tileX = Math.floor(x / 32);
        const tileY = Math.floor(y / 32);
        const isWall = tileX >= 0 && tileY >= 0 && tileX < this.map[0].length && tileY < this.map.length && this.map[tileY][tileX] === 2;
        
        if (distance > 200 && !isWall) {
          validPosition = true;
        }
      }
      
      const enemy = new Enemy(this, x, y);
      this.enemies.add(enemy.gameObject);
    }
  }

  private handlePlayerAttack() {
    // Check for enemies in attack range
    this.enemies.getChildren().forEach((enemyObject) => {
      const enemy = enemyObject.getData('entity') as Enemy;
      
      if (!enemy) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.player.x, 
        this.player.y, 
        enemy.x, 
        enemy.y
      );
      
      if (distance < 50) {
        enemy.takeDamage(this.player.attackDamage);
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
          // Spawn items at enemy's death location
          this.spawnItemsAtLocation(enemy.x, enemy.y);
          
          // Destroy enemy
          enemy.destroy();
          
          // Increase player experience
          this.player.gainExperience(10);
        }
      }
    });
  }

  private handlePlayerEnemyCollision(playerObject: Phaser.GameObjects.GameObject, enemyObject: Phaser.GameObjects.GameObject) {
    const player = this.player;
    const enemy = enemyObject.getData('entity') as Enemy;
    
    if (!enemy) return;
    
    if (!player.isInvulnerable) {
      player.takeDamage(enemy.attackDamage);
      
      // Knockback player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      player.setVelocity(
        Math.cos(angle) * 200,
        Math.sin(angle) * 200
      );
      
      // 피해를 입었을 때 움직임 제한 상태 설정 (이미 takeDamage에서 설정됨)
      
      // Check if player is dead
      if (player.health <= 0) {
        this.scene.restart();
      }
    }
  }

  private spawnItemsAtLocation(x: number, y: number) {
    // Determine what items to drop based on random chance
    const roll = Math.random();
    
    if (roll < 0.7) { // 70% chance to drop something
      let itemType: ItemType;
      
      // Determine item type
      const itemRoll = Math.random();
      
      if (itemRoll < 0.5) {
        itemType = ItemType.GOLD;
      } else if (itemRoll < 0.8) {
        itemType = ItemType.HEALTH_POTION;
      } else if (itemRoll < 0.9) {
        itemType = ItemType.WEAPON;
      } else {
        itemType = ItemType.ARMOR;
      }
      
      // Add some randomness to position
      const offsetX = Phaser.Math.Between(-10, 10);
      const offsetY = Phaser.Math.Between(-10, 10);
      
      // Create item
      const item = new Item(this, x + offsetX, y + offsetY, itemType);
      this.items.add(item.gameObject);
      
      // Make sure the item's physics body doesn't move
      const itemBody = item.self.body as Phaser.Physics.Arcade.Body;
      if (itemBody) {
        itemBody.setImmovable(true);
        itemBody.setVelocity(0, 0);
      }
      

      // Create drop effect
      const dropEffect = this.add.sprite(x, y, 'drop-effect');
      dropEffect.setAlpha(0.7);
      dropEffect.setDepth(2);
      
      // Animate drop effect
      this.tweens.add({
        targets: dropEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          dropEffect.destroy();
        }
      });
    }
  }

  private toggleInventory() {
    // Use the game's global event system to ensure the event is received
    this.game.events.emit('toggle-inventory', { source: 'GameScene' });
    
    // Also try direct scene communication
    const uiScene = this.scene.get('UIScene');
    if (uiScene && (uiScene as any).toggleInventory) {
      (uiScene as any).toggleInventory();
    }
  }
}
