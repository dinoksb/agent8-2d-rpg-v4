import Phaser from "phaser";
import { Player } from "../entities/Player";
import { ItemSlot } from "../systems/Inventory";
import { ItemType } from "../entities/Item";

export class UIScene extends Phaser.Scene {
  private player: Player;
  private healthBar: Phaser.GameObjects.Graphics;
  private experienceBar: Phaser.GameObjects.Graphics;
  private levelText: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  
  // Inventory UI
  private inventoryContainer: Phaser.GameObjects.Container;
  private inventorySlots: Phaser.GameObjects.Rectangle[];
  private inventoryItems: Phaser.GameObjects.Sprite[];
  private inventoryQuantities: Phaser.GameObjects.Text[];
  private inventoryVisible: boolean = false;
  private inventoryBackground: Phaser.GameObjects.Rectangle;
  private inventoryTitle: Phaser.GameObjects.Text;
  private slotSize: number = 40;
  private slotPadding: number = 5;
  private inventoryRows: number = 4;
  private inventoryCols: number = 5;
  private inventoryKey: Phaser.Input.Keyboard.Key;

  constructor() {
    super("UIScene");
  }

  init(data: { player: Player }) {
    this.player = data.player;
  }

  create() {
    // Create health bar
    this.healthBar = this.add.graphics();
    
    // Create experience bar
    this.experienceBar = this.add.graphics();
    
    // Create level text
    this.levelText = this.add.text(16, 16, `Level: ${this.player.level}`, {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this.levelText.setScrollFactor(0);
    
    // Create health text
    this.healthText = this.add.text(16, 40, `Health: ${this.player.health}/${this.player.maxHealth}`, {
      fontSize: "18px",
      color: "#ffffff"
    });
    this.healthText.setScrollFactor(0);
    
    // Create inventory UI
    this.createInventoryUI();
    
    // Listen for player events
    this.player.on("health-changed", this.updateHealthUI, this);
    this.player.on("experience-changed", this.updateExperienceUI, this);
    this.player.on("level-changed", this.updateLevelUI, this);
    this.player.on("inventory-changed", this.updateInventoryUI, this);
    
    // Listen for inventory toggle event from multiple sources
    this.events.on("toggle-inventory", this.toggleInventory, this);
    this.game.events.on("toggle-inventory", this.toggleInventory, this);
    
    // Also set up direct keyboard input in this scene as a backup
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    
    // Initial UI update
    this.updateHealthUI();
    this.updateExperienceUI();
    this.updateInventoryUI();
    
    // Add help text
    const helpText = this.add.text(
      this.cameras.main.width - 10, 
      this.cameras.main.height - 10, 
      "Arrow Keys: Move | Space: Attack | I: Inventory", 
      {
        fontSize: "12px",
        color: "#ffffff"
      }
    );
    helpText.setOrigin(1, 1);
    helpText.setScrollFactor(0);
    
    // Debug message to confirm scene is running
    console.log("UIScene created and running");
  }

  update() {
    // Check for inventory key press as a backup method
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
      console.log("Inventory key pressed directly in UIScene");
    }
  }

  private updateHealthUI() {
    // Update health bar
    this.healthBar.clear();
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(10, 70, 200, 20);
    
    // Health fill
    const healthPercentage = this.player.health / this.player.maxHealth;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(10, 70, 200 * healthPercentage, 20);
    
    // Update health text
    this.healthText.setText(`Health: ${this.player.health}/${this.player.maxHealth}`);
  }

  private updateExperienceUI() {
    // Update experience bar
    this.experienceBar.clear();
    
    // Background
    this.experienceBar.fillStyle(0x000000, 0.5);
    this.experienceBar.fillRect(10, 100, 200, 10);
    
    // Experience fill
    const experiencePercentage = this.player.experience / this.player.experienceToNextLevel;
    this.experienceBar.fillStyle(0x00ff00, 1);
    this.experienceBar.fillRect(10, 100, 200 * experiencePercentage, 10);
  }

  private updateLevelUI() {
    this.levelText.setText(`Level: ${this.player.level}`);
  }

  private createInventoryUI() {
    // Create container for inventory UI
    this.inventoryContainer = this.add.container(0, 0);
    this.inventoryContainer.setScrollFactor(0);
    this.inventoryContainer.setVisible(false);
    
    // Calculate inventory dimensions
    const inventoryWidth = this.inventoryCols * (this.slotSize + this.slotPadding) + this.slotPadding;
    const inventoryHeight = this.inventoryRows * (this.slotSize + this.slotPadding) + this.slotPadding + 40; // Extra height for title
    
    // Create inventory background
    this.inventoryBackground = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      inventoryWidth + 20,
      inventoryHeight + 20,
      0x000000,
      0.8
    );
    this.inventoryBackground.setStrokeStyle(2, 0x3498db);
    this.inventoryBackground.setScrollFactor(0);
    this.inventoryContainer.add(this.inventoryBackground);
    
    // Create inventory title
    this.inventoryTitle = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - inventoryHeight / 2 + 20,
      "Inventory",
      {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    );
    this.inventoryTitle.setOrigin(0.5);
    this.inventoryTitle.setScrollFactor(0);
    this.inventoryContainer.add(this.inventoryTitle);
    
    // Create inventory slots
    this.inventorySlots = [];
    this.inventoryItems = [];
    this.inventoryQuantities = [];
    
    const startX = this.cameras.main.width / 2 - inventoryWidth / 2 + this.slotPadding + this.slotSize / 2;
    const startY = this.cameras.main.height / 2 - inventoryHeight / 2 + this.slotPadding + this.slotSize / 2 + 40; // Extra offset for title
    
    for (let row = 0; row < this.inventoryRows; row++) {
      for (let col = 0; col < this.inventoryCols; col++) {
        const x = startX + col * (this.slotSize + this.slotPadding);
        const y = startY + row * (this.slotSize + this.slotPadding);
        
        // Create slot background
        const slot = this.add.rectangle(x, y, this.slotSize, this.slotSize, 0x333333);
        slot.setStrokeStyle(2, 0x666666);
        slot.setScrollFactor(0);
        slot.setInteractive();
        
        // Add hover effect
        slot.on('pointerover', () => {
          slot.setStrokeStyle(2, 0x3498db);
        });
        
        slot.on('pointerout', () => {
          slot.setStrokeStyle(2, 0x666666);
        });
        
        // Add click handler
        const slotIndex = row * this.inventoryCols + col;
        slot.on('pointerdown', () => this.handleSlotClick(slotIndex));
        
        this.inventorySlots.push(slot);
        this.inventoryContainer.add(slot);
        
        // Create placeholder for item sprite
        const itemSprite = this.add.sprite(x, y, 'item-placeholder');
        itemSprite.setVisible(false);
        itemSprite.setScrollFactor(0);
        this.inventoryItems.push(itemSprite);
        this.inventoryContainer.add(itemSprite);
        
        // Create placeholder for quantity text
        const quantityText = this.add.text(x + this.slotSize / 2 - 5, y + this.slotSize / 2 - 5, "", {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#333333"
        });
        quantityText.setOrigin(1, 1);
        quantityText.setScrollFactor(0);
        quantityText.setVisible(false);
        this.inventoryQuantities.push(quantityText);
        this.inventoryContainer.add(quantityText);
      }
    }
    
    // Add close button
    const closeButton = this.add.text(
      this.cameras.main.width / 2 + inventoryWidth / 2 + 10,
      this.cameras.main.height / 2 - inventoryHeight / 2 + 10,
      "X",
      {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#e74c3c",
        padding: { x: 8, y: 5 }
      }
    );
    closeButton.setOrigin(1, 0);
    closeButton.setScrollFactor(0);
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => this.toggleInventory(), this);
    this.inventoryContainer.add(closeButton);
    
    // Add instructions text
    const instructionsText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + inventoryHeight / 2 - 15,
      "Click on items to use them",
      {
        fontSize: "14px",
        color: "#cccccc"
      }
    );
    instructionsText.setOrigin(0.5);
    instructionsText.setScrollFactor(0);
    this.inventoryContainer.add(instructionsText);
  }

  private updateInventoryUI() {
    // Get all items from inventory
    const items = this.player.inventory.getAllItems();
    
    // Update each slot
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemSprite = this.inventoryItems[i];
      const quantityText = this.inventoryQuantities[i];
      
      if (item) {
        // Update item sprite
        itemSprite.setTexture(getItemSpriteKey(item.type));
        itemSprite.setVisible(true);
        
        // Update quantity text if stackable
        if (item.stackable && item.quantity > 1) {
          quantityText.setText(item.quantity.toString());
          quantityText.setVisible(true);
        } else {
          quantityText.setVisible(false);
        }
      } else {
        // Hide item sprite and quantity text
        itemSprite.setVisible(false);
        quantityText.setVisible(false);
      }
    }
  }

  public toggleInventory() {
    console.log("Toggle inventory called, current state:", this.inventoryVisible);
    this.inventoryVisible = !this.inventoryVisible;
    this.inventoryContainer.setVisible(this.inventoryVisible);
    
    // Update inventory UI when opened
    if (this.inventoryVisible) {
      this.updateInventoryUI();
      console.log("Inventory opened");
    } else {
      console.log("Inventory closed");
    }
  }

  private handleSlotClick(slotIndex: number) {
    // Use item when clicked
    const used = this.player.useItem(slotIndex);
    
    if (used) {
      // Play sound effect (if we had one)
      // this.sound.play('item-use');
      
      // Add visual feedback
      const slot = this.inventorySlots[slotIndex];
      this.tweens.add({
        targets: slot,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });
    }
  }
}

// Helper function to get sprite key based on item type
function getItemSpriteKey(type: ItemType): string {
  switch (type) {
    case ItemType.HEALTH_POTION:
      return 'health-potion';
    case ItemType.MANA_POTION:
      return 'mana-potion';
    case ItemType.GOLD:
      return 'gold-coin';
    case ItemType.WEAPON:
      return 'weapon';
    case ItemType.ARMOR:
      return 'armor';
    default:
      return 'item-default';
  }
}
