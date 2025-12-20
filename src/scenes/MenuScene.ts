import Phaser from 'phaser';
import { loadHighscoreData } from '../persistence/storage';

/**
 * MenuScene displays the start screen with game title,
 * start button, and highscore.
 */
export class MenuScene extends Phaser.Scene {
  private highscore: number = 0;
  private startButton!: Phaser.GameObjects.Container;
  private blinkTimer: number = 0;
  private pressStartText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Load highscore
    const data = loadHighscoreData();
    this.highscore = data.highscore;

    this.createBackground();
    this.createTitle();
    this.createHighscoreDisplay();
    this.createStartButton();
    this.createInstructions();
    this.setupInput();
  }

  update(_time: number, delta: number): void {
    // Blink "Press Start" text
    this.blinkTimer += delta;
    if (this.blinkTimer >= 500) {
      this.blinkTimer = 0;
      this.pressStartText.setVisible(!this.pressStartText.visible);
    }
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;
    
    // Dark background with subtle grid pattern
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Grid lines for retro feel
    graphics.lineStyle(1, 0x111133, 0.3);
    for (let x = 0; x < width; x += 16) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 16) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private createTitle(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Main title with neon glow effect
    const title = this.add.text(centerX, 80, 'PAC-MAN', {
      fontFamily: 'Arial Black',
      fontSize: '56px',
      color: '#FFFF00',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, '#FFFF00', 15, true, true);

    // Subtitle
    const subtitle = this.add.text(centerX, 130, 'CLONE', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#00FFFF',
    });
    subtitle.setOrigin(0.5);
    subtitle.setShadow(0, 0, '#00FFFF', 8, true, true);

    // Animated Pac-Man icon
    this.createAnimatedPacMan(centerX, 200);
  }

  private createAnimatedPacMan(x: number, y: number): void {
    const graphics = this.add.graphics();
    
    // Animate mouth opening/closing
    this.tweens.addCounter({
      from: 0,
      to: Math.PI / 4,
      duration: 200,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const mouthAngle = tween.getValue();
        graphics.clear();
        
        // Glow
        graphics.fillStyle(0xFFFF00, 0.3);
        graphics.fillCircle(x, y, 28);
        
        // Body
        graphics.fillStyle(0xFFFF00, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.arc(x, y, 24, mouthAngle, Math.PI * 2 - mouthAngle);
        graphics.closePath();
        graphics.fillPath();
      },
    });
  }

  private createHighscoreDisplay(): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Highscore label
    const label = this.add.text(centerX, 280, 'HIGH SCORE', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FF0000',
    });
    label.setOrigin(0.5);

    // Highscore value
    const score = this.add.text(centerX, 305, this.highscore.toString().padStart(6, '0'), {
      fontFamily: 'Courier New',
      fontSize: '28px',
      color: '#FFFFFF',
    });
    score.setOrigin(0.5);
  }

  private createStartButton(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Press Start text (blinking)
    this.pressStartText = this.add.text(centerX, height - 150, 'PRESS ENTER TO START', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#00FFFF',
    });
    this.pressStartText.setOrigin(0.5);
    this.pressStartText.setShadow(0, 0, '#00FFFF', 5, true, true);

    // Touch/Click area
    const touchArea = this.add.text(centerX, height - 110, 'or TAP to play', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    });
    touchArea.setOrigin(0.5);
  }

  private createInstructions(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Controls info
    const controls = this.add.text(centerX, height - 50, '↑ ↓ ← → or WASD to move', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#666666',
    });
    controls.setOrigin(0.5);

    const pauseInfo = this.add.text(centerX, height - 30, 'ESC to pause', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#666666',
    });
    pauseInfo.setOrigin(0.5);
  }

  private setupInput(): void {
    // Keyboard input
    this.input.keyboard?.on('keydown-ENTER', this.startGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);

    // Touch/Click input
    this.input.on('pointerdown', this.startGame, this);
  }

  private startGame(): void {
    // Clean up input listeners
    this.input.keyboard?.off('keydown-ENTER', this.startGame, this);
    this.input.keyboard?.off('keydown-SPACE', this.startGame, this);
    this.input.off('pointerdown', this.startGame, this);

    // Fade out and start game
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
