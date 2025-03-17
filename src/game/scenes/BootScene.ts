import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    console.log("BootScene: Starting game...");
    
    // Ensure animations are ready before starting the game scene
    this.ensureAnimationsLoaded();
  }
  
  private ensureAnimationsLoaded() {
    // Check if the required animations exist
    const requiredAnimations = ['idle', 'move', 'attack'];
    const missingAnimations = requiredAnimations.filter(key => {
      const anim = this.anims.get(key);
      return !anim || !anim.frames || anim.frames.length === 0;
    });
    
    if (missingAnimations.length > 0) {
      console.warn(`Missing or invalid animations: ${missingAnimations.join(', ')}. Waiting to load...`);
      
      // Wait a short time and check again
      this.time.delayedCall(100, () => {
        this.ensureAnimationsLoaded();
      });
    } else {
      console.log("All required animations are loaded and valid, starting game scene");
      this.scene.start("GameScene");
    }
  }
}
