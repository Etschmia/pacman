import { Direction } from '../types';

/**
 * Key codes for keyboard input mapping
 */
const KEY_MAPPINGS: Record<string, Direction> = {
  // Arrow keys
  ArrowUp: Direction.UP,
  ArrowDown: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  // WASD keys
  KeyW: Direction.UP,
  KeyS: Direction.DOWN,
  KeyA: Direction.LEFT,
  KeyD: Direction.RIGHT,
  // Alternative lowercase
  w: Direction.UP,
  s: Direction.DOWN,
  a: Direction.LEFT,
  d: Direction.RIGHT,
};

/**
 * Event listener callback type for direction changes
 */
export type DirectionChangeListener = (direction: Direction) => void;

/**
 * Swipe detection configuration
 */
export interface SwipeConfig {
  minDistance: number;
}

/**
 * InputManager handles keyboard and touch input for the game.
 * Implements input buffering for queued direction changes.
 */
export class InputManager {
  private currentDirection: Direction = Direction.NONE;
  private bufferedDirection: Direction = Direction.NONE;
  private listeners: DirectionChangeListener[] = [];
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private swipeConfig: SwipeConfig = { minDistance: 30 };

  constructor() {
    this.setupKeyboardInput();
  }

  /**
   * Set up keyboard event listeners
   */
  private setupKeyboardInput(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      const direction = this.mapKeyToDirection(e.code || e.key);
      if (direction !== Direction.NONE) {
        e.preventDefault();
        this.setDirection(direction);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keydownHandler);
    }
  }

  /**
   * Set up touch/swipe event listeners
   */
  public setupTouchInput(element?: HTMLElement): void {
    const target = element || (typeof document !== 'undefined' ? document.body : null);
    if (!target) return;

    this.touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };

    this.touchEndHandler = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const direction = this.detectSwipeDirection(
          this.touchStartX,
          this.touchStartY,
          touch.clientX,
          touch.clientY
        );
        if (direction !== Direction.NONE) {
          e.preventDefault();
          this.setDirection(direction);
        }
      }
    };

    target.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    target.addEventListener('touchend', this.touchEndHandler, { passive: false });
  }

  /**
   * Map keyboard key code to game direction
   */
  public mapKeyToDirection(keyCode: string): Direction {
    return KEY_MAPPINGS[keyCode] || Direction.NONE;
  }

  /**
   * Detect swipe direction from touch coordinates
   */
  public detectSwipeDirection(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Direction {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe distance meets minimum threshold
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < this.swipeConfig.minDistance) {
      return Direction.NONE;
    }

    // Determine dominant axis for diagonal swipes
    if (absX > absY) {
      // Horizontal swipe
      return deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      // Vertical swipe
      return deltaY > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  /**
   * Set the current direction and notify listeners
   */
  private setDirection(direction: Direction): void {
    this.bufferedDirection = direction;
    this.emitDirectionChange(direction);
  }

  /**
   * Get the current buffered direction
   */
  public getBufferedDirection(): Direction {
    return this.bufferedDirection;
  }

  /**
   * Get the current active direction
   */
  public getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Apply the buffered direction as the current direction
   * Called when the buffered direction becomes valid
   */
  public applyBufferedDirection(): void {
    if (this.bufferedDirection !== Direction.NONE) {
      this.currentDirection = this.bufferedDirection;
    }
  }

  /**
   * Clear the buffered direction
   */
  public clearBuffer(): void {
    this.bufferedDirection = Direction.NONE;
  }

  /**
   * Check if there is a buffered direction waiting
   */
  public hasBufferedDirection(): boolean {
    return this.bufferedDirection !== Direction.NONE;
  }

  /**
   * Add a listener for direction change events
   */
  public onDirectionChange(listener: DirectionChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a direction change listener
   */
  public removeDirectionChangeListener(listener: DirectionChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Emit direction change event to all listeners
   */
  private emitDirectionChange(direction: Direction): void {
    for (const listener of this.listeners) {
      listener(direction);
    }
  }

  /**
   * Configure swipe detection settings
   */
  public setSwipeConfig(config: Partial<SwipeConfig>): void {
    this.swipeConfig = { ...this.swipeConfig, ...config };
  }

  /**
   * Get current swipe configuration
   */
  public getSwipeConfig(): SwipeConfig {
    return { ...this.swipeConfig };
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined' && this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }

    if (typeof document !== 'undefined') {
      if (this.touchStartHandler) {
        document.body.removeEventListener('touchstart', this.touchStartHandler);
      }
      if (this.touchEndHandler) {
        document.body.removeEventListener('touchend', this.touchEndHandler);
      }
    }

    this.listeners = [];
    this.keydownHandler = null;
    this.touchStartHandler = null;
    this.touchEndHandler = null;
  }

  /**
   * Reset input state
   */
  public reset(): void {
    this.currentDirection = Direction.NONE;
    this.bufferedDirection = Direction.NONE;
  }

  /**
   * Simulate keyboard input (for testing)
   */
  public simulateKeyInput(keyCode: string): void {
    const direction = this.mapKeyToDirection(keyCode);
    if (direction !== Direction.NONE) {
      this.setDirection(direction);
    }
  }

  /**
   * Simulate swipe input (for testing)
   */
  public simulateSwipe(startX: number, startY: number, endX: number, endY: number): void {
    const direction = this.detectSwipeDirection(startX, startY, endX, endY);
    if (direction !== Direction.NONE) {
      this.setDirection(direction);
    }
  }
}
