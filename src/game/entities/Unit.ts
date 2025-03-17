import Phaser from "phaser";
import { AnimatableMixin } from "./core/AnimatableMixin";
import { Entity } from "./core/Entity";
import { PhysicsMixin } from "./core/PhysicsMixin";
import { RenderableMixin } from "./core/RenderableMixin";
import { PhysicsBody } from "./interfaces/PhysicsBody";
import { Renderable } from "./interfaces/Renderable";
import { Animatable } from "./interfaces/Animatable";

export interface Unit extends PhysicsBody, Renderable, Animatable {}

export class Unit extends AnimatableMixin(PhysicsMixin(RenderableMixin(Entity<Phaser.Physics.Arcade.Sprite>))) {
  protected direction: string = 'down';
  protected moveSpeed: number = 150;
  protected isMoving: boolean = false;

  constructor(scene: Phaser.Scene, texture: string, id: string, x: number = 0, y: number = 0) {
    const sprite = scene.physics.add.sprite(x, y, texture);
    super(sprite, id);
    
    // Add to scene
    scene.add.existing(this.self);
    
    // Set up physics body
    this.setCollideWorldBounds(true);
  }

  setDirection(direction: string) {
    this.direction = direction;
  }

  getDirection(): string {
    return this.direction;
  }

  setMoveSpeed(speed: number) {
    this.moveSpeed = speed;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  move(directionX: number, directionY: number) {
    this.setVelocity(directionX * this.moveSpeed, directionY * this.moveSpeed);
    this.isMoving = true;
  }

  stop() {
    this.setVelocity(0, 0);
    this.isMoving = false;
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    return this.self.emit(event, ...args);
  }

  on(event: string | symbol, fn: Function, context?: any): this {
    this.self.on(event, fn, context);
    return this;
  }
}
