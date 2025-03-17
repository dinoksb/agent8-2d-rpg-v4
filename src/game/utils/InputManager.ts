import Phaser from "phaser";

export class InputManager {
  private static instance: InputManager;
  private keys: Map<string, Phaser.Input.Keyboard.Key> = new Map();
  private justPressedKeys: Set<string> = new Set();
  private scene: Phaser.Scene;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeys();
  }

  public static getInstance(scene?: Phaser.Scene): InputManager {
    if (!InputManager.instance && scene) {
      InputManager.instance = new InputManager(scene);
    }
    return InputManager.instance;
  }

  private setupKeys() {
    // Add common keys
    this.addKey('up', Phaser.Input.Keyboard.KeyCodes.UP);
    this.addKey('down', Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.addKey('left', Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.addKey('right', Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.addKey('space', Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.addKey('inventory', Phaser.Input.Keyboard.KeyCodes.I);
    this.addKey('escape', Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  public addKey(name: string, keyCode: number) {
    if (this.scene.input && this.scene.input.keyboard) {
      this.keys.set(name, this.scene.input.keyboard.addKey(keyCode));
    }
  }

  public isKeyDown(name: string): boolean {
    const key = this.keys.get(name);
    return key ? key.isDown : false;
  }

  public isKeyJustPressed(name: string): boolean {

    const key = this.keys.get(name);
    if (!key) return false;
    
    const justPressed = Phaser.Input.Keyboard.JustDown(key);
    
    // Track just pressed keys to avoid multiple triggers
    if (justPressed) {
      if (this.justPressedKeys.has(name)) {
        return false;
      }
      this.justPressedKeys.add(name);
      return true;
    } else if (key.isUp && this.justPressedKeys.has(name)) {
      this.justPressedKeys.delete(name);
    }
    
    return false;
  }

  public update() {
    // Reset just pressed keys if they're no longer down
    this.justPressedKeys.forEach(keyName => {
      const key = this.keys.get(keyName);
      if (key && key.isUp) {
        this.justPressedKeys.delete(keyName);
      }
    });
  }
}
