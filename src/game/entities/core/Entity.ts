import Phaser from "phaser";

export class Entity<T extends Phaser.GameObjects.GameObject> {
  protected readonly self: T;
  protected readonly entityID: string;

  constructor(self: T, id: string) {
    this.self = self;
    this.entityID = id;
  }

  setActive(active: boolean) {
    this.self.setActive(active);
  }

  destroy() {
    this.self.destroy();
  }

  get gameObject(): T {
    return this.self;
  }

  get id(): string {
    return this.entityID;
  }
}
