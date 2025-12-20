import Phaser from 'phaser';
import { BootScene, MenuScene, GameScene, GameOverScene, WinScene } from './scenes';
import { getResponsiveManager } from './responsive';

// Base game dimensions (28 cells × 16px, 31 cells × 16px)
const BASE_WIDTH = 448;
const BASE_HEIGHT = 496;

// Initialize responsive manager
const responsiveManager = getResponsiveManager({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  minScale: 0.5,
  maxScale: 2.0,
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: BASE_WIDTH * 0.5,
      height: BASE_HEIGHT * 0.5,
    },
    max: {
      width: BASE_WIDTH * 2,
      height: BASE_HEIGHT * 2,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
  callbacks: {
    postBoot: (game: Phaser.Game) => {
      // Initialize responsive manager after game boots
      responsiveManager.initialize();
      
      // Listen for resize events and update game scale
      responsiveManager.onResize((scaleResult) => {
        // Phaser's scale manager handles the actual scaling
        // We just need to ensure the game knows about viewport changes
        game.scale.refresh();
        
        // Enable performance mode if scale is very small (mobile)
        if (scaleResult.scale < 0.7) {
          responsiveManager.setPerformanceMode(true);
        } else {
          responsiveManager.setPerformanceMode(false);
        }
      });

      // Set up touch input if available
      if (responsiveManager.isTouchEnabled()) {
        // Touch input is handled by InputManager in GameScene
        console.log('Touch input enabled');
      }
    },
  },
};

const game = new Phaser.Game(config);

// Export for external access
export { responsiveManager };
export default game;
