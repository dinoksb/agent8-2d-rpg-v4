import { Entity } from './Entity';
import { Renderable } from '../interfaces/Renderable';

export function RenderableMixin<
  T extends Phaser.GameObjects.GameObject &
    Phaser.GameObjects.Components.Transform &
    Phaser.GameObjects.Components.Depth &
    Phaser.GameObjects.Components.AlphaSingle &
    Phaser.GameObjects.Components.Visible,
>(Base: new (...args: any[]) => Entity<T>) {
  return class extends Base implements Renderable {
    setDepth(depth: number) {
      this.self.setDepth(depth);
    }

    setScale(x?: number, y?: number) {
      this.self.setScale(x, y);
    }

    setPosition(x: number, y: number) {
      this.self.setPosition(x, y);
    }

    clearAlpha() {
      this.self.clearAlpha();
    }

    setAlpha(value?: number) {
      this.self.setAlpha(value);
    }

    setVisible(value: boolean) {
      this.self.setVisible(value);
    }

    setAngle(degrees?: number) {
      this.self.setAngle(degrees);
    }

    get x(): number {
      return this.self.x;
    }

    get y(): number {
      return this.self.y;
    }
  };
}
