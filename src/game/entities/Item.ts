import Phaser from "phaser";
import { Entity } from "./core/Entity";
import { RenderableMixin } from "./core/RenderableMixin";
import { PhysicsMixin } from "./core/PhysicsMixin";

export enum ItemType {
  HEALTH_POTION = 'health-potion',
  MANA_POTION = 'mana-potion',
  GOLD = 'gold',
  WEAPON = 'weapon',
  ARMOR = 'armor'
}

export interface ItemData {
  type: ItemType;
  value: number;
  name: string;
  description: string;
  stackable: boolean;
  maxStack?: number;
}

// Define item templates
export const ITEM_TEMPLATES: Record<ItemType, ItemData> = {
  [ItemType.HEALTH_POTION]: {
    type: ItemType.HEALTH_POTION,
    value: 20,
    name: "Health Potion",
    description: "Restores 20 health points",
    stackable: true,
    maxStack: 10
  },
  [ItemType.MANA_POTION]: {
    type: ItemType.MANA_POTION,
    value: 20,
    name: "Mana Potion",
    description: "Restores 20 mana points",
    stackable: true,
    maxStack: 10
  },
  [ItemType.GOLD]: {
    type: ItemType.GOLD,
    value: 10,
    name: "Gold",
    description: "Currency used for trading",
    stackable: true
  },
  [ItemType.WEAPON]: {
    type: ItemType.WEAPON,
    value: 5,
    name: "Sword",
    description: "A basic sword that deals 5 damage",
    stackable: false
  },
  [ItemType.ARMOR]: {
    type: ItemType.ARMOR,
    value: 5,
    name: "Leather Armor",
    description: "Basic armor that provides 5 defense",
    stackable: false
  }
};

export class Item extends PhysicsMixin(RenderableMixin(Entity<Phaser.Physics.Arcade.Sprite>)) {
  private itemData: ItemData;
  private floatTween: Phaser.Tweens.Tween;
  private glowEffect: Phaser.GameObjects.Sprite;
  private pickupRange: number = 20; // Range at which player can pick up the item

  constructor(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    // Create sprite based on item type
    const sprite = scene.physics.add.sprite(x, y, getItemSpriteKey(type));
    super(sprite, `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    
    // Store item data
    this.itemData = { ...ITEM_TEMPLATES[type] };
    
    // Set up physics body
    this.setBodySize(16, 16);
    this.setOffset(0, 0);
    
    // Create glow effect
    this.createGlowEffect(scene, x, y, type);
    
    // Add floating animation
    this.createFloatingAnimation(scene);
    
    // Set depth for rendering order
    this.setDepth(3);
    
    // Disable velocity - items should stay in place
    this.setVelocity(0, 0);
    
    // Store reference to this entity on the game object for easy access
    this.self.setData('entity', this);
  }

  private createGlowEffect(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    // Create a glow sprite beneath the item
    this.glowEffect = scene.add.sprite(x, y, 'item-glow');
    this.glowEffect.setAlpha(0.7);
    this.glowEffect.setScale(0.8);
    this.glowEffect.setDepth(2);
    
    // Set glow color based on item type
    switch (type) {
      case ItemType.HEALTH_POTION:
        this.glowEffect.setTint(0xff0000); // Red
        break;
      case ItemType.MANA_POTION:
        this.glowEffect.setTint(0x0000ff); // Blue
        break;
      case ItemType.GOLD:
        this.glowEffect.setTint(0xffff00); // Yellow
        break;
      case ItemType.WEAPON:
        this.glowEffect.setTint(0xff6600); // Orange
        break;
      case ItemType.ARMOR:
        this.glowEffect.setTint(0x00ff00); // Green
        break;
    }
    
    // Add pulsing animation to glow
    scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0.7, to: 0.3 },
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  private createFloatingAnimation(scene: Phaser.Scene) {
    // Add floating animation
    this.floatTween = scene.tweens.add({
      targets: [this.self, this.glowEffect],
      y: { from: this.y, to: this.y - 5 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  update(playerX: number, playerY: number) {
    // Update glow position to match item
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.x, this.y);
    }
    
    // Check if player is in pickup range
    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    
    // Return true if player can pick up the item
    return distanceToPlayer <= this.pickupRange;
  }

  getData(): ItemData {
    return { ...this.itemData };
  }

  override destroy() {
    // Clean up tweens
    if (this.floatTween) {
      this.floatTween.stop();
    }
    
    // Clean up glow effect
    if (this.glowEffect) {
      this.glowEffect.destroy();
    }
    
    super.destroy();
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
