import Phaser from 'phaser';
import { loadHighscoreData, saveHighscoreData } from '../persistence/storage';
import { updateHighscore } from '../persistence/serialization';
import { analyticsManager } from '../analytics/AnalyticsManager';

interface GameOverData {
  score: number;
}

/**
 * GameOverScene displays the final score and options to restart or return to menu.
 */
export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private isNewHighscore: boolean = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.score = data.score || 0;
    
    // Log game over
    analyticsManager.logEvent('game_over', {
      score: this.score,
    });

    // Check and update highscore
    const highscoreData = loadHighscoreData();
    if (this.score > highscoreData.highscore) {
      this.isNewHighscore = true;
      const updated = updateHighscore(highscoreData, this.score);
      saveHighscoreData(updated);
    } else {
      this.isNewHighscore = false;
    }
  }

  create(): void {
    // Log page view
    analyticsManager.logPageView('game_over');

    this.createBackground();
    this.createGameOverText();
    this.createScoreDisplay();
    this.createOptions();
    this.setupInput();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Dark red tinted background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x110000, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Subtle grid
    graphics.lineStyle(1, 0x220000, 0.5);
    for (let x = 0; x < width; x += 16) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 16) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private createGameOverText(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Game Over text with red glow
    const gameOverText = this.add.text(centerX, 100, 'GAME OVER', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#FF0000',
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(0, 0, '#FF0000', 15, true, true);

    // Pulsing animation
    this.tweens.add({
      targets: gameOverText,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private createScoreDisplay(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Final score label
    this.add.text(centerX, 200, 'FINAL SCORE', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // Score value
    const scoreText = this.add.text(centerX, 240, this.score.toString(), {
      fontFamily: 'Courier New',
      fontSize: '42px',
      color: '#FFFF00',
    });
    scoreText.setOrigin(0.5);
    scoreText.setShadow(0, 0, '#FFFF00', 10, true, true);

    // New highscore indicator
    if (this.isNewHighscore) {
      const newHighText = this.add.text(centerX, 290, '★ NEW HIGH SCORE! ★', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#00FF00',
      });
      newHighText.setOrigin(0.5);

      // Blinking animation
      this.tweens.add({
        targets: newHighText,
        alpha: 0.3,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createOptions(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Restart option
    const restartText = this.add.text(centerX, height - 150, 'Press ENTER to Play Again', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#00FFFF',
    });
    restartText.setOrigin(0.5);

    // Menu option
    const menuText = this.add.text(centerX, height - 110, 'Press M for Menu', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
    });
    menuText.setOrigin(0.5);

    // Touch hint
    this.add.text(centerX, height - 60, 'or TAP to continue', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    // Restart game
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.restartGame, this);

    // Return to menu
    this.input.keyboard?.on('keydown-M', this.goToMenu, this);
    this.input.keyboard?.on('keydown-ESC', this.goToMenu, this);

    // Touch input - restart
    this.input.on('pointerdown', this.restartGame, this);
  }

  private restartGame(): void {
    this.cleanupInput();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private goToMenu(): void {
    this.cleanupInput();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  private cleanupInput(): void {
    this.input.keyboard?.off('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.off('keydown-SPACE', this.restartGame, this);
    this.input.keyboard?.off('keydown-M', this.goToMenu, this);
    this.input.keyboard?.off('keydown-ESC', this.goToMenu, this);
    this.input.off('pointerdown', this.restartGame, this);
  }
}

