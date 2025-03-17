import { Entity } from './Entity';
import { PhysicsBody } from '../interfaces/PhysicsBody';

export function PhysicsMixin<T extends Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite>(Base: new (...args: any[]) => Entity<T>) {
  return class extends Base implements PhysicsBody {
    setVelocity(x: number, y: number) {
      this.self.setVelocity(x, y);
    }

    setBodySize(width: number, height: number, center?: boolean) {
      this.self.setBodySize(width, height, center);
    }

    setOffset(x: number, y?: number) {
      this.self.setOffset(x, y);
    }

    setCollideWorldBounds(collide: boolean) {
      this.self.setCollideWorldBounds(collide);
    }

    enableBody(reset?: boolean, x?: number, y?: number, enableGameObject?: boolean, showGameObject?: boolean) {
      this.self.enableBody(reset, x, y, enableGameObject, showGameObject);
    }

    disableBody(disableGameObject?: boolean, hideGameObject?: boolean) {
      this.self.disableBody(disableGameObject, hideGameObject);
    }

    get body() {
      return this.self.body;
    }

    get x(): number {
      return this.self.x;
    }

    get y(): number {
      return this.self.y;
    }
  };
}
