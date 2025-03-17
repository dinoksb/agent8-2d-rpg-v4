export interface PhysicsBody {
  setVelocity(x: number, y: number): void;
  setBodySize(width: number, height: number, center?: boolean): void;
  setOffset(x: number, y?: number): void;
  setCollideWorldBounds(collide: boolean): void;
  enableBody(reset?: boolean, x?: number, y?: number, enableGameObject?: boolean, showGameObject?: boolean): void;
  disableBody(disableGameObject?: boolean, hideGameObject?: boolean): void;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly x: number;
  readonly y: number;
}
