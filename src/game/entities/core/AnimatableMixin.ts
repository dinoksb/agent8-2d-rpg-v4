import { Entity } from './Entity';
import { Animatable } from '../interfaces/Animatable';

export function AnimatableMixin<T extends Phaser.GameObjects.Sprite>(Base: new (...args: any[]) => Entity<T>) {
  return class extends Base implements Animatable {
    playAnimation(animationKey: string) {
      this.self.play(animationKey);
    }

    stopAnimation(): void {
      this.self.stop();
    }
  };
}
