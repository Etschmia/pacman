import Phaser from 'phaser';

/**
 * LevelIndicator displays the current level number.
 * 
 * Requirements: 5.5
 */
export class LevelIndicator {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private levelText!: Phaser.GameObjects.Text;
  
  // Styling
  private readonly NEON_GREEN = '#00FF00';
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.create(x, y);
  }
  
  private create(x: number, y: number): void {
    this.container = this.scene.add.container(x, y);
    this.container.setDepth(50);
    
    // Label
    const label = this.scene.add.text(0, 0, 'LEVEL', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFFFFF',
    });
    label.setOrigin(0.5, 0);
    this.container.add(label);
    
    // Level number
    this.levelText = this.scene.add.text(0, 16, '1', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: this.NEON_GREEN,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: this.NEON_GREEN,
        blur: 8,
        fill: true,
      },
    });
    this.levelText.setOrigin(0.5, 0);
    this.container.add(this.levelText);
  }
  
  /**
   * Updates the displayed level number
   * @param level Current level (1-8)
   */
  updateLevel(level: number): void {
    this.levelText.setText(level.toString());
    
    // Brief scale animation on level change
    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }
  
  /**
   * Cleans up all UI elements
   */
  destroy(): void {
    this.container.destroy();
  }
}
