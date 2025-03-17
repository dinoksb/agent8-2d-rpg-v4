export interface Renderable {
  setDepth(depth: number): void;
  setScale(x?: number, y?: number): void;
  setPosition(x: number, y: number): void;
  clearAlpha(): void;
  setAlpha(value?: number): void;
  setVisible(value: boolean): void;
  setAngle(degrees?: number): void;
  readonly x: number;
  readonly y: number;
}
