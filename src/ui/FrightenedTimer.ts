import Phaser from 'phaser';

/**
 * FrightenedTimer displays the remaining time in frightened mode
 * with visual warning when time is running out.
 * 
 * Requirements: 3.7
 */
export class FrightenedTimer {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private warningText!: Phaser.GameObjects.Text;
  
  // Timer state
  private isActive: boolean = false;
  private totalDuration: number = 0;
  private remainingTime: number = 0;
  
  // Positioning
  private x: number;
  private y: number;
  private barWidth: number = 100;
  private barHeight: number = 8;
  
  // Styling
  private readonly NEON_BLUE = 0x0088FF;
  private readonly WARNING_COLOR = 0xFF4444;
  private readonly WARNING_THRESHOLD = 0.3; // 30% remaining triggers warning
  
  // Warning animation
  private warningTween?: Phaser.Tweens.Tween;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.create();
  }
  
  private create(): void {
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(50);
    this.container.setVisible(false);
    
    // Timer bar background
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x333333, 0.8);
    barBg.fillRoundedRect(-this.barWidth / 2, 0, this.barWidth, this.barHeight, 4);
    this.container.add(barBg);
    
    // Timer bar fill
    this.timerBar = this.scene.add.graphics();
    this.container.add(this.timerBar);
    
    // Timer text
    this.timerText = this.scene.add.text(0, this.barHeight + 4, '', {
      fontFamily: 'Courier New',
      fontSize: '12px',
      color: '#00FFFF',
    });
    this.timerText.setOrigin(0.5, 0);
    this.container.add(this.timerText);
    
    // Warning text (hidden initially)
    this.warningText = this.scene.add.text(0, -20, 'HURRY!', {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#FF4444',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#FF0000',
        blur: 6,
        fill: true,
      },
    });
    this.warningText.setOrigin(0.5);
    this.warningText.setVisible(false);
    this.container.add(this.warningText);
  }
  
  /**
   * Starts the frightened mode timer
   * @param duration Total duration in milliseconds
   */
  start(duration: number): void {
    this.totalDuration = duration;
    this.remainingTime = duration;
    this.isActive = true;
    this.container.setVisible(true);
    this.warningText.setVisible(false);
    
    // Stop any existing warning animation
    if (this.warningTween) {
      this.warningTween.stop();
    }
    
    this.updateDisplay();
  }
  
  /**
   * Stops and hides the timer
   */
  stop(): void {
    this.isActive = false;
    this.container.setVisible(false);
    this.warningText.setVisible(false);
    
    if (this.warningTween) {
      this.warningTween.stop();
    }
  }
  
  /**
   * Updates the timer
   * @param delta Time since last frame in ms
   */
  update(delta: number): void {
    if (!this.isActive) return;
    
    this.remainingTime = Math.max(0, this.remainingTime - delta);
    
    if (this.remainingTime <= 0) {
      this.stop();
      return;
    }
    
    this.updateDisplay();
    this.checkWarning();
  }
  
  /**
   * Updates the visual display
   */
  private updateDisplay(): void {
    const progress = this.remainingTime / this.totalDuration;
    const fillWidth = this.barWidth * progress;
    
    // Determine color based on remaining time
    const isWarning = progress <= this.WARNING_THRESHOLD;
    const fillColor = isWarning ? this.WARNING_COLOR : this.NEON_BLUE;
    
    // Redraw timer bar
    this.timerBar.clear();
    this.timerBar.fillStyle(fillColor, 1);
    this.timerBar.fillRoundedRect(
      -this.barWidth / 2,
      0,
      fillWidth,
      this.barHeight,
      4
    );
    
    // Add glow effect
    this.timerBar.lineStyle(2, fillColor, 0.5);
    this.timerBar.strokeRoundedRect(
      -this.barWidth / 2,
      0,
      fillWidth,
      this.barHeight,
      4
    );
    
    // Update text
    const seconds = Math.ceil(this.remainingTime / 1000);
    this.timerText.setText(`${seconds}s`);
    this.timerText.setColor(isWarning ? '#FF4444' : '#00FFFF');
  }
  
  /**
   * Checks and triggers warning state
   */
  private checkWarning(): void {
    const progress = this.remainingTime / this.totalDuration;
    
    if (progress <= this.WARNING_THRESHOLD && !this.warningText.visible) {
      this.warningText.setVisible(true);
      
      // Start blinking animation
      this.warningTween = this.scene.tweens.add({
        targets: this.warningText,
        alpha: 0.3,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });
    }
  }
  
  /**
   * Returns whether the timer is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
  
  /**
   * Returns the remaining time in milliseconds
   */
  get remaining(): number {
    return this.remainingTime;
  }
  
  /**
   * Cleans up all UI elements
   */
  destroy(): void {
    if (this.warningTween) {
      this.warningTween.stop();
    }
    this.container.destroy();
  }
}
