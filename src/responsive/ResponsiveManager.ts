/**
 * ResponsiveManager handles responsive canvas scaling and input method detection.
 * Maintains aspect ratio during window resize and auto-detects touch vs keyboard devices.
 */

export interface ResponsiveConfig {
  baseWidth: number;
  baseHeight: number;
  minScale: number;
  maxScale: number;
}

export interface ScaleResult {
  scale: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export type InputMethod = 'keyboard' | 'touch' | 'both';

export type ResizeListener = (result: ScaleResult) => void;
export type InputMethodListener = (method: InputMethod) => void;

/**
 * Calculate scale to fit viewport while maintaining aspect ratio
 */
export function calculateScale(
  baseWidth: number,
  baseHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  minScale: number = 0.5,
  maxScale: number = 2.0
): ScaleResult {
  const baseAspectRatio = baseWidth / baseHeight;
  const viewportAspectRatio = viewportWidth / viewportHeight;

  let scale: number;

  if (viewportAspectRatio > baseAspectRatio) {
    // Viewport is wider than game - fit to height
    scale = viewportHeight / baseHeight;
  } else {
    // Viewport is taller than game - fit to width
    scale = viewportWidth / baseWidth;
  }

  // Clamp scale to min/max bounds
  scale = Math.max(minScale, Math.min(maxScale, scale));

  return {
    scale,
    width: Math.floor(baseWidth * scale),
    height: Math.floor(baseHeight * scale),
    aspectRatio: baseAspectRatio,
  };
}

/**
 * Detect if the device supports touch input
 */
export function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect if the device has a physical keyboard (heuristic)
 */
export function detectKeyboardSupport(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Most desktop devices have keyboards
  // Mobile devices typically don't have physical keyboards
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return !isMobile;
}

/**
 * Detect the primary input method for the device
 */
export function detectInputMethod(): InputMethod {
  const hasTouch = detectTouchSupport();
  const hasKeyboard = detectKeyboardSupport();

  if (hasTouch && hasKeyboard) {
    return 'both';
  } else if (hasTouch) {
    return 'touch';
  } else {
    return 'keyboard';
  }
}

export class ResponsiveManager {
  private config: ResponsiveConfig;
  private currentScale: ScaleResult;
  private inputMethod: InputMethod;
  private resizeListeners: ResizeListener[] = [];
  private inputMethodListeners: InputMethodListener[] = [];
  private resizeHandler: (() => void) | null = null;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private performanceMode: boolean = false;

  constructor(config: Partial<ResponsiveConfig> = {}) {
    this.config = {
      baseWidth: config.baseWidth ?? 448,
      baseHeight: config.baseHeight ?? 496,
      minScale: config.minScale ?? 0.5,
      maxScale: config.maxScale ?? 2.0,
    };

    this.currentScale = this.calculateCurrentScale();
    this.inputMethod = detectInputMethod();
  }

  /**
   * Initialize resize event handling
   */
  public initialize(): void {
    if (typeof window === 'undefined') return;

    this.resizeHandler = () => {
      // Debounce resize events
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 100);
    };

    window.addEventListener('resize', this.resizeHandler);
    
    // Initial calculation
    this.handleResize();
  }

  /**
   * Handle window resize event
   */
  private handleResize(): void {
    const newScale = this.calculateCurrentScale();
    
    // Only notify if scale actually changed
    if (
      newScale.scale !== this.currentScale.scale ||
      newScale.width !== this.currentScale.width ||
      newScale.height !== this.currentScale.height
    ) {
      this.currentScale = newScale;
      this.notifyResizeListeners(newScale);
    }
  }

  /**
   * Calculate scale based on current viewport
   */
  private calculateCurrentScale(): ScaleResult {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : this.config.baseWidth;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : this.config.baseHeight;

    return calculateScale(
      this.config.baseWidth,
      this.config.baseHeight,
      viewportWidth,
      viewportHeight,
      this.config.minScale,
      this.config.maxScale
    );
  }

  /**
   * Get current scale result
   */
  public getScale(): ScaleResult {
    return { ...this.currentScale };
  }

  /**
   * Get the base aspect ratio
   */
  public getAspectRatio(): number {
    return this.config.baseWidth / this.config.baseHeight;
  }

  /**
   * Get detected input method
   */
  public getInputMethod(): InputMethod {
    return this.inputMethod;
  }

  /**
   * Check if touch input is available
   */
  public isTouchEnabled(): boolean {
    return this.inputMethod === 'touch' || this.inputMethod === 'both';
  }

  /**
   * Check if keyboard input is available
   */
  public isKeyboardEnabled(): boolean {
    return this.inputMethod === 'keyboard' || this.inputMethod === 'both';
  }

  /**
   * Add resize listener
   */
  public onResize(listener: ResizeListener): void {
    this.resizeListeners.push(listener);
  }

  /**
   * Remove resize listener
   */
  public removeResizeListener(listener: ResizeListener): void {
    const index = this.resizeListeners.indexOf(listener);
    if (index !== -1) {
      this.resizeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all resize listeners
   */
  private notifyResizeListeners(result: ScaleResult): void {
    for (const listener of this.resizeListeners) {
      listener(result);
    }
  }

  /**
   * Add input method change listener
   */
  public onInputMethodChange(listener: InputMethodListener): void {
    this.inputMethodListeners.push(listener);
  }

  /**
   * Update input method (e.g., when user switches input type)
   */
  public setInputMethod(method: InputMethod): void {
    if (method !== this.inputMethod) {
      this.inputMethod = method;
      for (const listener of this.inputMethodListeners) {
        listener(method);
      }
    }
  }

  /**
   * Enable performance mode (reduces animations on low-performance devices)
   */
  public setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;
  }

  /**
   * Check if performance mode is enabled
   */
  public isPerformanceMode(): boolean {
    return this.performanceMode;
  }

  /**
   * Detect if device is low-performance based on FPS
   */
  public detectLowPerformance(currentFps: number, targetFps: number = 30): boolean {
    return currentFps < targetFps;
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<ResponsiveConfig>): void {
    this.config = { ...this.config, ...config };
    this.handleResize();
  }

  /**
   * Get current configuration
   */
  public getConfig(): ResponsiveConfig {
    return { ...this.config };
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeListeners = [];
    this.inputMethodListeners = [];
    this.resizeHandler = null;
    this.resizeTimeout = null;
  }
}

// Singleton instance
let responsiveManagerInstance: ResponsiveManager | null = null;

/**
 * Get the singleton ResponsiveManager instance
 */
export function getResponsiveManager(config?: Partial<ResponsiveConfig>): ResponsiveManager {
  if (!responsiveManagerInstance) {
    responsiveManagerInstance = new ResponsiveManager(config);
  }
  return responsiveManagerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetResponsiveManager(): void {
  if (responsiveManagerInstance) {
    responsiveManagerInstance.destroy();
    responsiveManagerInstance = null;
  }
}
