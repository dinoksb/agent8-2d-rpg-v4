import { useEffect, useRef } from 'react';
import './App.css';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { PreloadScene } from './game/scenes/PreloadScene';
import { UIScene } from './game/scenes/UIScene';

function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!gameRef.current) return;
    
    // Clear any existing game instances
    while (gameRef.current.firstChild) {
      gameRef.current.removeChild(gameRef.current.firstChild);
    }
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [PreloadScene, BootScene, GameScene, UIScene],
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      input: {
        keyboard: {
          capture: [
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.I
          ]
        }
      }
    };
    
    const game = new Phaser.Game(config);
    
    // Add global event emitter for cross-scene communication
    game.events.on('toggle-inventory', () => {
      console.log('Global inventory toggle event received');
    });
    
    return () => {
      game.destroy(true);
    };
  }, []);
  
  return (
    <div className="game-container">
      <div ref={gameRef} className="phaser-container" />
    </div>
  );
}

export default App;
