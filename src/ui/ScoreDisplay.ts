import Phaser from 'phaser';

/**
 * Point popup animation data
 */
interface PointPopup {
  text: Phaser.GameObjects.Text;
  startY: number;
  lifetime: number;
  maxLifetime: number;
}

/**
 * ScoreDisplay handles the visual representation of score and highscore
 * with animated point popups when points are earned.
 * 
 * Requirements: 8.1, 8.5
 */
export class ScoreDisplay {
  private scene: Phaser.Scene;
  
  // UI elements
  private scoreLabel!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private highscoreLabel!: Phaser.GameObjects.Text;
  private highscoreText!: Phaser.GameObjects.Text;
  
  // Point popups
  private popups: PointPopup[] = [];
  private readonly POPUP_DURATION = 1000; // ms
  private readonly POPUP_RISE_DISTANCE = 40; // pixels
  
  // Styling
  private readonly NEON_YELLOW = '#FFFF00';
  private readonly NEON_CYAN = '#00FFFF';
  private readonly LABEL_COLOR = '#FFFFFF';
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }
  
  private create(): void {
    const { width } = this.scene.cameras.main;
    
    // Score label and value (left side)
    this.scoreLabel = this.scene.add.text(10, 8, 'SCORE', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: this.LABEL_COLOR,
    });
    
    this.scoreText = this.scene.add.text(10, 24, '0', {
      fontFamily: 'Courier New',
      fontSize: '24px',
      color: this.NEON_YELLOW,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: this.NEON_YELLOW,
        blur: 8,
        fill: true,
      },
    });
    
    // Highscore label and value (right side)
    this.highscoreLabel = this.scene.add.text(width - 110, 8, 'HIGH SCORE', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: this.LABEL_COLOR,
    });
    
    this.highscoreText = this.scene.add.text(width - 110, 24, '0', {
      fontFamily: 'Courier New',
      fontSize: '24px',
      color: this.NEON_CYAN,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: this.NEON_CYAN,
        blur: 8,
        fill: true,
      },
    });
    
    // Set depth to ensure UI is on top
    this.scoreLabel.setDepth(50);
    this.scoreText.setDepth(50);
    this.highscoreLabel.setDepth(50);
    this.highscoreText.setDepth(50);
  }
  
  /**
   * Updates the displayed score
   */
  updateScore(score: number): void {
    this.scoreText.setText(score.toString());
  }
  
  /**
   * Updates the displayed highscore
   */
  updateHighscore(highscore: number): void {
    this.highscoreText.setText(highscore.toString());
  }
  
  /**
   * Shows a point popup animation at the specified position
   * @param x X position in pixels
   * @param y Y position in pixels
   * @param points Points to display
   */
  showPointPopup(x: number, y: number, points: number): void {
    const color = points >= 200 ? '#FF00FF' : this.NEON_YELLOW;
    
    const popup = this.scene.add.text(x, y, `+${points}`, {
      fontFamily: 'Arial Black',
      fontSize: points >= 200 ? '20px' : '16px',
      color: color,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: color,
        blur: 6,
        fill: true,
      },
    });
    
    popup.setOrigin(0.5);
    popup.setDepth(60);
    
    this.popups.push({
      text: popup,
      startY: y,
      lifetime: 0,
      maxLifetime: this.POPUP_DURATION,
    });
  }
  
  /**
   * Updates popup animations
   * @param delta Time since last frame in ms
   */
  update(delta: number): void {
    const toRemove: number[] = [];
    
    this.popups.forEach((popup, index) => {
      popup.lifetime += delta;
      
      const progress = popup.lifetime / popup.maxLifetime;
      
      if (progress >= 1) {
        toRemove.push(index);
        return;
      }
      
      // Rise animation
      const newY = popup.startY - (this.POPUP_RISE_DISTANCE * progress);
      popup.text.setY(newY);
      
      // Fade out in second half
      if (progress > 0.5) {
        const fadeProgress = (progress - 0.5) * 2;
        popup.text.setAlpha(1 - fadeProgress);
      }
    });
    
    // Remove expired popups (reverse order to maintain indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const popup = this.popups[toRemove[i]];
      popup.text.destroy();
      this.popups.splice(toRemove[i], 1);
    }
  }
  
  /**
   * Cleans up all UI elements
   */
  destroy(): void {
    this.scoreLabel.destroy();
    this.scoreText.destroy();
    this.highscoreLabel.destroy();
    this.highscoreText.destroy();
    
    this.popups.forEach(popup => popup.text.destroy());
    this.popups = [];
  }
}
