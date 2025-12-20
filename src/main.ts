import Phaser from 'phaser';
import { BootScene, MenuScene, GameScene, GameOverScene, WinScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 448,  // 28 cells × 16px
  height: 496, // 31 cells × 16px
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);

export default game;
