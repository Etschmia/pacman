import Phaser from 'phaser';
import { getAudioManager } from '../audio';

/**
 * BootScene handles initial asset loading and displays loading progress.
 * Generates programmatic graphics for game elements.
 */
export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  create(): void {
    // Generate programmatic graphics
    this.generateGraphics();
    
    // Initialize AudioManager with this scene
    const audioManager = getAudioManager();
    audioManager.initialize(this);
    
    // Transition to MenuScene
    this.scene.start('MenuScene');
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background bar
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 1);
    this.loadingBar.fillRect(centerX - 160, centerY - 15, 320, 30);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#00FFFF',
    });
    this.loadingText.setOrigin(0.5);

    // Title text with neon style
    const titleText = this.add.text(centerX, centerY - 120, 'PAC-MAN', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#FFFF00',
    });
    titleText.setOrigin(0.5);
    titleText.setShadow(0, 0, '#FFFF00', 10, true, true);
  }

  private setupLoadingEvents(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00FFFF, 1);
      this.progressBar.fillRect(centerX - 155, centerY - 10, 310 * value, 20);
      this.loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.loadingBar.destroy();
      this.loadingText.setText('Ready!');
    });
  }

  private loadAssets(): void {
    // Load audio assets
    // Note: Audio files need to be created/added to the project
    // Using try-catch to handle missing audio files gracefully
    try {
      this.load.audio('pellet', 'assets/audio/pellet.mp3');
      this.load.audio('powerPellet', 'assets/audio/power-pellet.mp3');
      this.load.audio('ghostEat', 'assets/audio/ghost-eat.mp3');
      this.load.audio('death', 'assets/audio/death.mp3');
      this.load.audio('levelComplete', 'assets/audio/level-complete.mp3');
    } catch {
      // Audio files not found, game will run without sound
      console.warn('Audio assets not found, running without sound');
    }
  }

  private generateGraphics(): void {
    // Generate pellet texture
    this.generatePelletTexture();
    
    // Generate power pellet texture
    this.generatePowerPelletTexture();
    
    // Generate wall texture
    this.generateWallTexture();
  }

  private generatePelletTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Small dot with glow
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillCircle(8, 8, 6);
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(8, 8, 3);
    
    graphics.generateTexture('pellet', 16, 16);
    graphics.destroy();
  }

  private generatePowerPelletTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Larger dot with stronger glow
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0xFFFFFF, 0.6);
    graphics.fillCircle(8, 8, 6);
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(8, 8, 5);
    
    graphics.generateTexture('powerPellet', 16, 16);
    graphics.destroy();
  }

  private generateWallTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Neon blue wall segment
    graphics.fillStyle(0x0000FF, 0.3);
    graphics.fillRect(0, 0, 16, 16);
    graphics.lineStyle(2, 0x0066FF, 1);
    graphics.strokeRect(1, 1, 14, 14);
    
    graphics.generateTexture('wall', 16, 16);
    graphics.destroy();
  }
}
