import { Unit } from "./Unit";
import { Player } from "./Player";

export class Enemy extends Unit {
  // Stats
  public health: number = 50;
  public maxHealth: number = 50;
  public attackDamage: number = 10;
  public detectionRange: number = 200;
  public attackRange: number = 40;
  
  // State
  private isAttacking: boolean = false;
  private isStunned: boolean = false;
  private attackCooldown: number = 1000; // 1 second
  private lastAttackTime: number = 0;
  private stunTime: number = 300; // 0.3 seconds
  private stunTimer: Phaser.Time.TimerEvent;
  
  // Health bar
  private healthBar: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'knight', 'enemy', x, y);
    
    // Set enemy appearance
    this.self.setTint(0xff0000); // Red tint to distinguish from player
    this.self.setScale(0.4); // Slightly smaller than player
    
    // Set up physics body
    this.setBodySize(40, 40);
    this.setOffset(76, 120);
    
    // Create health bar
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    
    // Set depth for rendering order
    this.setDepth(5);
    
    // Store reference to this entity on the game object for easy access
    this.self.setData('entity', this);
  }

  update() {
    // Update health bar position
    this.updateHealthBar();
  }

  followPlayer(player: Player) {
    // Skip if attacking, stunned, or player is not valid
    if (this.isAttacking || this.isStunned || !player || player.health <= 0) {
      this.setVelocity(0, 0);
      return;
    }
    
    const distance = Phaser.Math.Distance.Between(
      this.x, 
      this.y, 
      player.x, 
      player.y
    );
    
    // If player is within detection range
    if (distance <= this.detectionRange) {
      // If player is within attack range
      if (distance <= this.attackRange) {
        // Stop and attack
        this.setVelocity(0, 0);
        this.tryAttack(player);
      } else {
        // Move towards player
        const angle = Phaser.Math.Angle.Between(
          this.x, 
          this.y, 
          player.x, 
          player.y
        );
        
        const speed = 50;
        this.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        
        // Set flip based on direction
        this.self.setFlipX(Math.cos(angle) < 0);
      }
    } else {
      // Stop if player is out of detection range
      this.setVelocity(0, 0);
    }
  }

  private tryAttack(player: Player) {
    const scene = this.self.scene;
    const time = scene.time.now;
    
    if (time > this.lastAttackTime + this.attackCooldown && !this.isAttacking) {
      this.isAttacking = true;
      this.lastAttackTime = time;
      
      // Play attack animation if available
      if (scene.anims.exists('attack')) {
        this.self.play('attack');
      }
      
      // Create attack effect
      const attackEffect = scene.add.sprite(this.x, this.y, 'attack-effect');
      attackEffect.setTint(0xff0000); // Red tint for enemy attack
      attackEffect.setAlpha(0.7);
      attackEffect.setDepth(4);
      
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
          this.isAttacking = false;
        }
      });
      
      // Check if player is in attack range
      const distance = Phaser.Math.Distance.Between(
        this.x, 
        this.y, 
        player.x, 
        player.y
      );
      
      if (distance <= this.attackRange) {
        // Deal damage to player
        player.takeDamage(this.attackDamage);
      }
    }
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // Update health bar
    this.updateHealthBar();
    
    // Set stunned state
    this.setStunned(true);
    
    const scene = this.self.scene;
    
    // Create hit effect
    const hitEffect = scene.add.sprite(this.x, this.y, 'hit-effect');
    hitEffect.setAlpha(0.7);
    hitEffect.setDepth(4);
    
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
    
    // Flash enemy when hit
    scene.tweens.add({
      targets: this.self,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
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
      
      // 스턴 상태일 때 속도를 0으로 설정
      this.setVelocity(0, 0);
    }
  }

  private updateHealthBar() {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    // Draw background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.x - 20, this.y - 30, 40, 5);
    
    // Draw health
    const healthPercentage = this.health / this.maxHealth;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(this.x - 20, this.y - 30, 40 * healthPercentage, 5);
  }

  destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    super.destroy();
  }
}
