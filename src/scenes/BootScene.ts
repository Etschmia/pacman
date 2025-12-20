import Phaser from 'phaser';

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
    // Audio assets will be loaded here when AudioManager is implemented
    // For now, we simulate loading with a small delay
    
    // Create placeholder audio data (silent audio)
    // This ensures the loading bar shows progress
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 1, 22050);
    
    // We'll add actual audio loading in Task 11
    // For now, just ensure the scene transitions properly
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
