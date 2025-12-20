import Phaser from 'phaser';
import { loadHighscoreData, saveHighscoreData } from '../persistence/storage';
import { updateHighscore } from '../persistence/serialization';

interface WinData {
  score: number;
}

/**
 * WinScene displays congratulations for completing all 8 levels.
 */
export class WinScene extends Phaser.Scene {
  private score: number = 0;
  private isNewHighscore: boolean = false;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data: WinData): void {
    this.score = data.score || 0;

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
    this.createBackground();
    this.createCongratulations();
    this.createScoreDisplay();
    this.createOptions();
    this.setupInput();
    this.createCelebration();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Dark background with golden tint
    const graphics = this.add.graphics();
    graphics.fillStyle(0x111100, 1);
    graphics.fillRect(0, 0, width, height);

    // Celebratory grid
    graphics.lineStyle(1, 0x333300, 0.5);
    for (let x = 0; x < width; x += 16) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 16) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private createCongratulations(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Congratulations text
    const congratsText = this.add.text(centerX, 60, 'CONGRATULATIONS!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#FFD700',
    });
    congratsText.setOrigin(0.5);
    congratsText.setShadow(0, 0, '#FFD700', 15, true, true);

    // You Win text
    const winText = this.add.text(centerX, 110, 'YOU WIN!', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#00FF00',
    });
    winText.setOrigin(0.5);
    winText.setShadow(0, 0, '#00FF00', 20, true, true);

    // Pulsing animation
    this.tweens.add({
      targets: winText,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Completion message
    this.add.text(centerX, 170, 'All 8 levels completed!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
  }

  private createScoreDisplay(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Final score label
    this.add.text(centerX, 230, 'FINAL SCORE', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // Score value
    const scoreText = this.add.text(centerX, 270, this.score.toString(), {
      fontFamily: 'Courier New',
      fontSize: '42px',
      color: '#FFFF00',
    });
    scoreText.setOrigin(0.5);
    scoreText.setShadow(0, 0, '#FFFF00', 10, true, true);

    // New highscore indicator
    if (this.isNewHighscore) {
      const newHighText = this.add.text(centerX, 320, '★ NEW HIGH SCORE! ★', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFD700',
      });
      newHighText.setOrigin(0.5);

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

    // Play again option
    const restartText = this.add.text(centerX, height - 120, 'Press ENTER to Play Again', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#00FFFF',
    });
    restartText.setOrigin(0.5);

    // Menu option
    const menuText = this.add.text(centerX, height - 80, 'Press M for Menu', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
    });
    menuText.setOrigin(0.5);

    // Touch hint
    this.add.text(centerX, height - 40, 'or TAP to continue', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);
  }

  private createCelebration(): void {
    const { width, height } = this.cameras.main;

    // Create particle-like celebration effect with graphics
    for (let i = 0; i < 20; i++) {
      const star = this.add.graphics();
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 50);
      const size = Phaser.Math.Between(2, 6);
      const color = Phaser.Math.RND.pick([0xFFD700, 0xFFFF00, 0x00FF00, 0x00FFFF]);

      star.fillStyle(color, 0.8);
      star.fillCircle(x, y, size);

      // Twinkling animation
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: Phaser.Math.Between(300, 800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 500),
      });
    }
  }

  private setupInput(): void {
    // Restart game
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.restartGame, this);

    // Return to menu
    this.input.keyboard?.on('keydown-M', this.goToMenu, this);
    this.input.keyboard?.on('keydown-ESC', this.goToMenu, this);

    // Touch input
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
