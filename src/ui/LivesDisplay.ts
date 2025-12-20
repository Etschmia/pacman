import Phaser from 'phaser';

/**
 * LivesDisplay shows remaining lives as Pac-Man icons.
 * Updates dynamically when lives are lost.
 * 
 * Requirements: 8.2
 */
export class LivesDisplay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private lifeIcons: Phaser.GameObjects.Graphics[] = [];
  
  // Positioning
  private x: number;
  private y: number;
  
  // Styling
  private readonly ICON_SIZE = 10;
  private readonly ICON_SPACING = 28;
  private readonly NEON_YELLOW = 0xFFFF00;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.create();
  }
  
  private create(): void {
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(50);
    
    // Add label
    const label = this.scene.add.text(0, -18, 'LIVES', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFFFFF',
    });
    this.container.add(label);
  }
  
  /**
   * Updates the lives display to show the specified number of lives
   * @param lives Number of lives to display
   */
  updateLives(lives: number): void {
    // Clear existing icons
    this.lifeIcons.forEach(icon => icon.destroy());
    this.lifeIcons = [];
    
    // Create new icons
    for (let i = 0; i < lives; i++) {
      const icon = this.createPacManIcon(i * this.ICON_SPACING);
      this.lifeIcons.push(icon);
      this.container.add(icon);
    }
  }
  
  /**
   * Creates a single Pac-Man icon at the specified x offset
   */
  private createPacManIcon(xOffset: number): Phaser.GameObjects.Graphics {
    const icon = this.scene.add.graphics();
    
    // Draw Pac-Man shape (circle with mouth)
    icon.fillStyle(this.NEON_YELLOW, 1);
    icon.beginPath();
    
    // Start from center, draw arc with mouth opening
    const centerX = xOffset + this.ICON_SIZE;
    const centerY = 0;
    const mouthAngle = Math.PI / 5; // 36 degrees mouth opening
    
    icon.moveTo(centerX, centerY);
    icon.arc(
      centerX,
      centerY,
      this.ICON_SIZE,
      mouthAngle,
      Math.PI * 2 - mouthAngle
    );
    icon.closePath();
    icon.fillPath();
    
    // Add glow effect
    icon.lineStyle(1, this.NEON_YELLOW, 0.5);
    icon.strokeCircle(centerX, centerY, this.ICON_SIZE + 2);
    
    return icon;
  }
  
  /**
   * Animates life loss (flash effect)
   */
  animateLifeLoss(): void {
    if (this.lifeIcons.length === 0) return;
    
    const lastIcon = this.lifeIcons[this.lifeIcons.length - 1];
    
    // Flash animation
    this.scene.tweens.add({
      targets: lastIcon,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Lives will be updated by updateLives call
      },
    });
  }
  
  /**
   * Cleans up all UI elements
   */
  destroy(): void {
    this.lifeIcons.forEach(icon => icon.destroy());
    this.lifeIcons = [];
    this.container.destroy();
  }
}
