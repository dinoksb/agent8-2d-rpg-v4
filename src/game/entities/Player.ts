import { Unit } from "./Unit";
import { Item, ItemData, ItemType } from "./Item";
import { Inventory } from "../systems/Inventory";

export class Player extends Unit {
  // Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public attackDamage: number = 20;
  public level: number = 1;
  public experience: number = 0;
  public experienceToNextLevel: number = 100;
  
  // State
  public isAttacking: boolean = false;
  public isInvulnerable: boolean = false;
  public isStunned: boolean = false; // 피해를 입었을 때 움직임 제한을 위한 상태
  private invulnerabilityTime: number = 1000; // 1 second
  private invulnerabilityTimer: Phaser.Time.TimerEvent;
  private stunTime: number = 300; // 0.3초 동안 움직임 제한
  private stunTimer: Phaser.Time.TimerEvent;
  private attackCooldown: number = 500; // 0.5 seconds
  private lastAttackTime: number = 0;
  
  // Weapon
  private weapon: Phaser.GameObjects.Sprite;
  
  // Inventory
  public inventory: Inventory;
  
  // Knight specific properties
  private unitState: string = 'idle';
  private direction: { x: number; y: number } = { x: 0, y: 0 };
  
  // Animation state
  private animationsReady: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'knight', 'player', x, y);
    
    // Get knight config from cache
    const knightConfig = scene.cache.json.get('knightConfig');
    
    if (knightConfig) {
      // Set up physics body with values from loaded config
      if (knightConfig.body) {
        this.setBodySize(
          knightConfig.body.size.width, 
          knightConfig.body.size.height
        );
        this.setOffset(
          knightConfig.body.offset.x, 
          knightConfig.body.offset.y
        );
      }
      
      // Set origin for the knight sprite
      if (knightConfig.origin) {
        this.self.setOrigin(knightConfig.origin.x, knightConfig.origin.y);
      } else {
        this.self.setOrigin(0.5, 0.5);
      }
    } else {
      // Fallback to hardcoded values if config couldn't be loaded
      console.warn('Knight config not loaded, using fallback values');
      this.setBodySize(40, 40);
      this.setOffset(76, 120);
      this.self.setOrigin(0.5, 0.5);
    }
    
    // Scale down the knight sprite
    this.self.setScale(0.5);
    
    // Create weapon
    this.weapon = scene.add.sprite(x, y, 'weapon');
    this.weapon.setOrigin(0.5, 1);
    this.weapon.setVisible(false);
    
    // Set depth for rendering order
    this.setDepth(10);
    this.weapon.setDepth(11);
    
    // Initialize inventory
    this.inventory = new Inventory(20); // 20 slots
    
    // Store reference to this entity on the game object for easy access
    this.self.setData('entity', this);
    
    // Set up animation completion listener
    this.self.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (animation: Phaser.Animations.Animation) => {
        if (animation.key === 'attack') {
          this.isAttacking = false;
          this.unitState = 'idle';
          this.playAnimationSafely('idle');
          this.weapon.setVisible(false);
        }
      },
      this
    );
    
    // Check if animations are ready before trying to play them
    this.checkAnimationsAndInitialize();
  }

  // 애니메이션 준비 상태를 확인하고 초기화하는 메서드
  private checkAnimationsAndInitialize() {
    const scene = this.self.scene;
    
    // 필요한 애니메이션 목록
    const requiredAnimations = ['idle', 'move', 'attack'];
    
    // 애니메이션이 모두 존재하는지 확인
    const allAnimationsExist = requiredAnimations.every(key => {
      const anim = scene.anims.get(key);
      return anim && anim.frames && anim.frames.length > 0;
    });
    
    if (allAnimationsExist) {
      console.log('All animations are ready, initializing player animations');
      this.animationsReady = true;
      this.playAnimationSafely('idle');
    } else {
      console.warn('Animations not ready yet, will try again in next frame');
      // 다음 프레임에서 다시 시도
      scene.time.delayedCall(100, () => {
        this.checkAnimationsAndInitialize();
      });
    }
  }

  // 안전하게 애니메이션을 재생하는 메서드
  private playAnimationSafely(key: string) {
    // 애니메이션이 준비되지 않았으면 아무것도 하지 않음
    if (!this.animationsReady) {
      return;
    }
    
    try {
      const scene = this.self.scene;
      const anim = scene.anims.get(key);
      
      // 애니메이션과 프레임이 존재하는지 확인
      if (anim && anim.frames && anim.frames.length > 0) {
        this.self.play(key);
      } else {
        console.warn(`Animation '${key}' not properly defined or has no frames`);
      }
    } catch (error) {
      console.error(`Error playing animation '${key}':`, error);
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, attackKey: Phaser.Input.Keyboard.Key) {
    if (!cursors) return;
    
    // 애니메이션이 준비되지 않았으면 업데이트 중단
    if (!this.animationsReady) {
      return;
    }
    
    // Handle attack
    this.handleAttack(attackKey);
    
    // 공격 중이거나 스턴 상태일 때는 움직임 처리 중단
    if (this.isAttacking || this.isStunned) {
      // 움직임 중단 - 속도를 0으로 설정
      this.setVelocity(0, 0);
      return;
    }
    
    // Handle movement
    this.handleMovement(cursors);
    
    // Update weapon position
    this.updateWeaponPosition();
  }

  private handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // 공격 중이거나 스턴 상태일 때는 움직임 처리 중단
    if (this.isAttacking || this.isStunned) {
      this.setVelocity(0, 0);
      return;
    }
    
    // Reset velocity
    this.setVelocity(0, 0);
    
    // Reset direction
    this.direction = { x: 0, y: 0 };
    
    // Handle movement
    if (cursors.left.isDown) {
      this.direction.x = -1;
      this.self.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.direction.x = 1;
      this.self.setFlipX(false);
    }
    
    if (cursors.up.isDown) {
      this.direction.y = -1;
    } else if (cursors.down.isDown) {
      this.direction.y = 1;
    }
    
    // Apply movement if there's any direction
    const isMoving = this.direction.x !== 0 || this.direction.y !== 0;
    
    if (isMoving) {
      // Normalize for diagonal movement
      const normalizedDirection = new Phaser.Math.Vector2(this.direction.x, this.direction.y).normalize();
      this.setVelocity(
        normalizedDirection.x * this.moveSpeed,
        normalizedDirection.y * this.moveSpeed
      );
      
      // Play move animation if not already playing
      if (this.unitState !== 'move') {
        this.unitState = 'move';
        this.playAnimationSafely('move');
      }
    } else if (this.unitState !== 'idle') {
      // Play idle animation if not moving and not already idle
      this.unitState = 'idle';
      this.playAnimationSafely('idle');
    }
  }

  private handleAttack(attackKey: Phaser.Input.Keyboard.Key) {
    const scene = this.self.scene;
    const time = scene.time.now;
    
    if (attackKey.isDown && time > this.lastAttackTime + this.attackCooldown && !this.isAttacking && !this.isStunned) {
      this.isAttacking = true;
      this.lastAttackTime = time;
      this.unitState = 'attack';
      
      // 공격 시 움직임 중단
      this.setVelocity(0, 0);
      
      // Show weapon
      this.weapon.setVisible(true);
      
      // Play attack animation
      this.playAnimationSafely('attack');
      
      // Create attack effect
      const attackEffect = scene.add.sprite(this.x, this.y, 'attack-effect');
      attackEffect.setAlpha(0.7);
      attackEffect.setDepth(9);
      
      // Position attack effect based on direction
      const offsetX = this.self.flipX ? -20 : 20;
      attackEffect.setPosition(this.x + offsetX, this.y);
      
      // Animate attack effect
      scene.tweens.add({
        targets: attackEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          attackEffect.destroy();
        }
      });
      
      // Emit attack event
      scene.events.emit('player-attack');
    }
  }

  private updateWeaponPosition() {
    // Position weapon based on player direction
    const offsetX = this.self.flipX ? -15 : 15;
    this.weapon.setPosition(this.x + offsetX, this.y);
    this.weapon.setFlipX(this.self.flipX);
  }

  public takeDamage(amount: number) {
    if (this.isInvulnerable) return;
    
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    const scene = this.self.scene;
    
    // 피해를 입었을 때 스턴 상태 설정 (움직임 제한)
    this.setStunned(true);
    
    // Create hit effect
    const hitEffect = scene.add.sprite(this.x, this.y, 'hit-effect');
    hitEffect.setAlpha(0.7);
    hitEffect.setDepth(9);
    
    // Animate hit effect
    scene.tweens.add({
      targets: hitEffect,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => {
        hitEffect.destroy();
      }
    });
    
    // Flash player when hit
    scene.tweens.add({
      targets: this.self,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 3
    });
    
    // 피해를 입었을 때 무적 상태 설정
    this.setInvulnerable(true);
    
    // Emit health changed event
    this.emit('health-changed');
  }

  public setInvulnerable(isInvulnerable: boolean) {
    this.isInvulnerable = isInvulnerable;
    
    if (isInvulnerable) {
      const scene = this.self.scene;
      
      // Clear existing timer if there is one
      if (this.invulnerabilityTimer) {
        this.invulnerabilityTimer.remove();
      }
      
      // Set timer to remove invulnerability
      this.invulnerabilityTimer = scene.time.delayedCall(
        this.invulnerabilityTime,
        () => {
          this.isInvulnerable = false;
        }
      );
    }
  }
  
  // 스턴 상태 설정 메서드 (움직임 제한)
  public setStunned(isStunned: boolean) {
    this.isStunned = isStunned;
    
    if (isStunned) {
      const scene = this.self.scene;
      
      // 기존 타이머가 있으면 제거
      if (this.stunTimer) {
        this.stunTimer.remove();
      }
      
      // 스턴 상태 해제 타이머 설정
      this.stunTimer = scene.time.delayedCall(
        this.stunTime,
        () => {
          this.isStunned = false;
        }
      );
    }
  }

  public gainExperience(amount: number) {
    this.experience += amount;
    
    // Check for level up
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
    
    // Emit experience changed event
    this.emit('experience-changed');
  }

  private levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    
    // Increase stats
    this.maxHealth += 20;
    this.health = this.maxHealth;
    this.attackDamage += 5;
    this.moveSpeed += 10;
    
    // Increase experience required for next level
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    const scene = this.self.scene;
    
    // Create level up effect
    const levelUpEffect = scene.add.sprite(this.x, this.y, 'attack-effect');
    levelUpEffect.setTint(0xffff00);
    levelUpEffect.setAlpha(0.7);
    levelUpEffect.setDepth(9);
    
    // Animate level up effect
    scene.tweens.add({
      targets: levelUpEffect,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => {
        levelUpEffect.destroy();
      }
    });
    
    // Emit level changed event
    this.emit('level-changed');
    this.emit('health-changed');
  }

  // Add item to inventory
  public collectItem(item: Item): boolean {
    const itemData = item.getData();
    const added = this.inventory.addItem(itemData);
    
    if (added) {
      // Apply immediate effects if needed
      this.applyItemEffects(itemData);
      
      // Create pickup effect
      const scene = this.self.scene;
      const pickupEffect = scene.add.sprite(this.x, this.y, 'pickup-effect');
      pickupEffect.setAlpha(0.7);
      pickupEffect.setDepth(9);
      
      // Animate pickup effect
      scene.tweens.add({
        targets: pickupEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          pickupEffect.destroy();
        }
      });
      
      // Emit inventory changed event
      this.emit('inventory-changed');
      
      return true;
    }
    
    return false;
  }

  // Apply immediate effects from collected items
  private applyItemEffects(itemData: ItemData) {
    switch (itemData.type) {
      case ItemType.HEALTH_POTION:
        // Heal player
        this.health = Math.min(this.health + itemData.value, this.maxHealth);
        this.emit('health-changed');
        break;
      case ItemType.GOLD:
        // Gold is just stored in inventory
        break;
      case ItemType.WEAPON:
        // Equip weapon (would be handled by inventory system)
        break;
      case ItemType.ARMOR:
        // Equip armor (would be handled by inventory system)
        break;
    }
  }

  // Use item from inventory
  public useItem(slotIndex: number): boolean {
    const item = this.inventory.getItem(slotIndex);
    
    if (!item) return false;
    
    // Apply item effects
    this.applyItemEffects(item);
    
    // Remove item from inventory if it's consumable
    if (item.type === ItemType.HEALTH_POTION || item.type === ItemType.MANA_POTION) {
      this.inventory.removeItem(slotIndex, 1);
      this.emit('inventory-changed');
    }
    
    return true;
  }

  destroy() {
    if (this.weapon) {
      this.weapon.destroy();
    }
    
    // Remove animation complete listener
    this.self.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
    
    super.destroy();
  }
}
