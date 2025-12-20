/**
 * Unit Tests for ResponsiveManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ResponsiveManager,
  calculateScale,
  detectInputMethod,
  getResponsiveManager,
  resetResponsiveManager,
} from './ResponsiveManager';

describe('ResponsiveManager', () => {
  beforeEach(() => {
    resetResponsiveManager();
  });

  afterEach(() => {
    resetResponsiveManager();
  });

  describe('calculateScale', () => {
    const BASE_WIDTH = 448;
    const BASE_HEIGHT = 496;

    it('should calculate correct scale for matching viewport', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
      
      expect(result.scale).toBe(1);
      expect(result.width).toBe(BASE_WIDTH);
      expect(result.height).toBe(BASE_HEIGHT);
    });

    it('should scale down for smaller viewport', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 224, 248);
      
      expect(result.scale).toBe(0.5);
      expect(result.width).toBe(224);
      expect(result.height).toBe(248);
    });

    it('should scale up for larger viewport', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 896, 992);
      
      expect(result.scale).toBe(2);
      expect(result.width).toBe(896);
      expect(result.height).toBe(992);
    });

    it('should fit to height when viewport is wider', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 1000, 496);
      
      expect(result.scale).toBe(1);
      expect(result.height).toBe(496);
      expect(result.width).toBe(448);
    });

    it('should fit to width when viewport is taller', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 448, 1000);
      
      expect(result.scale).toBe(1);
      expect(result.width).toBe(448);
      expect(result.height).toBe(496);
    });

    it('should respect minimum scale', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 100, 100, 0.5, 2.0);
      
      expect(result.scale).toBeGreaterThanOrEqual(0.5);
    });

    it('should respect maximum scale', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 5000, 5000, 0.5, 2.0);
      
      expect(result.scale).toBeLessThanOrEqual(2.0);
    });

    it('should maintain aspect ratio', () => {
      const result = calculateScale(BASE_WIDTH, BASE_HEIGHT, 800, 600);
      const expectedAspectRatio = BASE_WIDTH / BASE_HEIGHT;
      const actualAspectRatio = result.width / result.height;
      
      expect(actualAspectRatio).toBeCloseTo(expectedAspectRatio, 2);
    });
  });

  describe('ResponsiveManager class', () => {
    it('should create with default config', () => {
      const manager = new ResponsiveManager();
      const config = manager.getConfig();
      
      expect(config.baseWidth).toBe(448);
      expect(config.baseHeight).toBe(496);
      expect(config.minScale).toBe(0.5);
      expect(config.maxScale).toBe(2.0);
    });

    it('should create with custom config', () => {
      const manager = new ResponsiveManager({
        baseWidth: 800,
        baseHeight: 600,
        minScale: 0.25,
        maxScale: 4.0,
      });
      const config = manager.getConfig();
      
      expect(config.baseWidth).toBe(800);
      expect(config.baseHeight).toBe(600);
      expect(config.minScale).toBe(0.25);
      expect(config.maxScale).toBe(4.0);
    });

    it('should return correct aspect ratio', () => {
      const manager = new ResponsiveManager({
        baseWidth: 448,
        baseHeight: 496,
      });
      
      expect(manager.getAspectRatio()).toBeCloseTo(448 / 496, 5);
    });

    it('should detect input method', () => {
      const manager = new ResponsiveManager();
      const method = manager.getInputMethod();
      
      expect(['keyboard', 'touch', 'both']).toContain(method);
    });

    it('should update config', () => {
      const manager = new ResponsiveManager();
      manager.setConfig({ baseWidth: 800 });
      
      expect(manager.getConfig().baseWidth).toBe(800);
      expect(manager.getConfig().baseHeight).toBe(496); // unchanged
    });

    it('should handle performance mode', () => {
      const manager = new ResponsiveManager();
      
      expect(manager.isPerformanceMode()).toBe(false);
      
      manager.setPerformanceMode(true);
      expect(manager.isPerformanceMode()).toBe(true);
      
      manager.setPerformanceMode(false);
      expect(manager.isPerformanceMode()).toBe(false);
    });

    it('should detect low performance', () => {
      const manager = new ResponsiveManager();
      
      expect(manager.detectLowPerformance(60, 30)).toBe(false);
      expect(manager.detectLowPerformance(30, 30)).toBe(false);
      expect(manager.detectLowPerformance(25, 30)).toBe(true);
      expect(manager.detectLowPerformance(15, 30)).toBe(true);
    });

    it('should add and remove resize listeners', () => {
      const manager = new ResponsiveManager();
      const listener = vi.fn();
      
      manager.onResize(listener);
      manager.removeResizeListener(listener);
      
      // No error should occur
      expect(true).toBe(true);
    });

    it('should set input method', () => {
      const manager = new ResponsiveManager();
      const listener = vi.fn();
      
      manager.onInputMethodChange(listener);
      manager.setInputMethod('touch');
      
      expect(manager.getInputMethod()).toBe('touch');
      expect(listener).toHaveBeenCalledWith('touch');
    });

    it('should not notify if input method unchanged', () => {
      const manager = new ResponsiveManager();
      const listener = vi.fn();
      
      manager.setInputMethod('keyboard');
      manager.onInputMethodChange(listener);
      manager.setInputMethod('keyboard');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      const manager = new ResponsiveManager();
      manager.initialize();
      manager.destroy();
      
      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const manager1 = getResponsiveManager();
      const manager2 = getResponsiveManager();
      
      expect(manager1).toBe(manager2);
    });

    it('should reset singleton', () => {
      const manager1 = getResponsiveManager();
      resetResponsiveManager();
      const manager2 = getResponsiveManager();
      
      expect(manager1).not.toBe(manager2);
    });
  });

  describe('Input detection', () => {
    it('should return valid input method', () => {
      const method = detectInputMethod();
      expect(['keyboard', 'touch', 'both']).toContain(method);
    });
  });
});
