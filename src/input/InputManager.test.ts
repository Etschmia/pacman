import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from './InputManager';
import { Direction } from '../types';

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  describe('mapKeyToDirection', () => {
    it('should map arrow keys to correct directions', () => {
      expect(inputManager.mapKeyToDirection('ArrowUp')).toBe(Direction.UP);
      expect(inputManager.mapKeyToDirection('ArrowDown')).toBe(Direction.DOWN);
      expect(inputManager.mapKeyToDirection('ArrowLeft')).toBe(Direction.LEFT);
      expect(inputManager.mapKeyToDirection('ArrowRight')).toBe(Direction.RIGHT);
    });

    it('should map WASD keys to correct directions', () => {
      expect(inputManager.mapKeyToDirection('KeyW')).toBe(Direction.UP);
      expect(inputManager.mapKeyToDirection('KeyS')).toBe(Direction.DOWN);
      expect(inputManager.mapKeyToDirection('KeyA')).toBe(Direction.LEFT);
      expect(inputManager.mapKeyToDirection('KeyD')).toBe(Direction.RIGHT);
    });

    it('should map lowercase wasd to correct directions', () => {
      expect(inputManager.mapKeyToDirection('w')).toBe(Direction.UP);
      expect(inputManager.mapKeyToDirection('s')).toBe(Direction.DOWN);
      expect(inputManager.mapKeyToDirection('a')).toBe(Direction.LEFT);
      expect(inputManager.mapKeyToDirection('d')).toBe(Direction.RIGHT);
    });

    it('should return NONE for unmapped keys', () => {
      expect(inputManager.mapKeyToDirection('Space')).toBe(Direction.NONE);
      expect(inputManager.mapKeyToDirection('Enter')).toBe(Direction.NONE);
      expect(inputManager.mapKeyToDirection('KeyX')).toBe(Direction.NONE);
    });
  });

  describe('detectSwipeDirection', () => {
    it('should detect right swipe', () => {
      const direction = inputManager.detectSwipeDirection(0, 0, 50, 0);
      expect(direction).toBe(Direction.RIGHT);
    });

    it('should detect left swipe', () => {
      const direction = inputManager.detectSwipeDirection(50, 0, 0, 0);
      expect(direction).toBe(Direction.LEFT);
    });

    it('should detect down swipe', () => {
      const direction = inputManager.detectSwipeDirection(0, 0, 0, 50);
      expect(direction).toBe(Direction.DOWN);
    });

    it('should detect up swipe', () => {
      const direction = inputManager.detectSwipeDirection(0, 50, 0, 0);
      expect(direction).toBe(Direction.UP);
    });

    it('should return NONE for swipes below minimum distance', () => {
      const direction = inputManager.detectSwipeDirection(0, 0, 10, 10);
      expect(direction).toBe(Direction.NONE);
    });

    it('should handle diagonal swipes by dominant axis (horizontal)', () => {
      const direction = inputManager.detectSwipeDirection(0, 0, 50, 20);
      expect(direction).toBe(Direction.RIGHT);
    });

    it('should handle diagonal swipes by dominant axis (vertical)', () => {
      const direction = inputManager.detectSwipeDirection(0, 0, 20, 50);
      expect(direction).toBe(Direction.DOWN);
    });

    it('should respect custom swipe config', () => {
      inputManager.setSwipeConfig({ minDistance: 100 });
      const direction = inputManager.detectSwipeDirection(0, 0, 50, 0);
      expect(direction).toBe(Direction.NONE);
    });
  });

  describe('input buffering', () => {
    it('should start with NONE direction', () => {
      expect(inputManager.getCurrentDirection()).toBe(Direction.NONE);
      expect(inputManager.getBufferedDirection()).toBe(Direction.NONE);
    });

    it('should buffer direction via simulateKeyInput', () => {
      inputManager.simulateKeyInput('ArrowUp');
      expect(inputManager.getBufferedDirection()).toBe(Direction.UP);
    });

    it('should apply buffered direction', () => {
      inputManager.simulateKeyInput('ArrowRight');
      inputManager.applyBufferedDirection();
      expect(inputManager.getCurrentDirection()).toBe(Direction.RIGHT);
    });

    it('should clear buffer', () => {
      inputManager.simulateKeyInput('ArrowLeft');
      inputManager.clearBuffer();
      expect(inputManager.getBufferedDirection()).toBe(Direction.NONE);
    });

    it('should report hasBufferedDirection correctly', () => {
      expect(inputManager.hasBufferedDirection()).toBe(false);
      inputManager.simulateKeyInput('ArrowDown');
      expect(inputManager.hasBufferedDirection()).toBe(true);
    });

    it('should not apply NONE direction', () => {
      inputManager.simulateKeyInput('ArrowUp');
      inputManager.applyBufferedDirection();
      inputManager.clearBuffer();
      inputManager.applyBufferedDirection();
      expect(inputManager.getCurrentDirection()).toBe(Direction.UP);
    });
  });

  describe('direction change events', () => {
    it('should emit direction change events', () => {
      const listener = vi.fn();
      inputManager.onDirectionChange(listener);
      inputManager.simulateKeyInput('ArrowUp');
      expect(listener).toHaveBeenCalledWith(Direction.UP);
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      inputManager.onDirectionChange(listener1);
      inputManager.onDirectionChange(listener2);
      inputManager.simulateKeyInput('ArrowDown');
      expect(listener1).toHaveBeenCalledWith(Direction.DOWN);
      expect(listener2).toHaveBeenCalledWith(Direction.DOWN);
    });

    it('should remove listeners', () => {
      const listener = vi.fn();
      inputManager.onDirectionChange(listener);
      inputManager.removeDirectionChangeListener(listener);
      inputManager.simulateKeyInput('ArrowLeft');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all input state', () => {
      inputManager.simulateKeyInput('ArrowUp');
      inputManager.applyBufferedDirection();
      inputManager.reset();
      expect(inputManager.getCurrentDirection()).toBe(Direction.NONE);
      expect(inputManager.getBufferedDirection()).toBe(Direction.NONE);
    });
  });

  describe('swipe config', () => {
    it('should return swipe config', () => {
      const config = inputManager.getSwipeConfig();
      expect(config.minDistance).toBe(30);
    });

    it('should update swipe config', () => {
      inputManager.setSwipeConfig({ minDistance: 50 });
      const config = inputManager.getSwipeConfig();
      expect(config.minDistance).toBe(50);
    });
  });

  describe('swipe simulation', () => {
    it('should handle swipe input', () => {
      const listener = vi.fn();
      inputManager.onDirectionChange(listener);
      inputManager.simulateSwipe(0, 0, 50, 0);
      expect(listener).toHaveBeenCalledWith(Direction.RIGHT);
    });

    it('should not emit for invalid swipes', () => {
      const listener = vi.fn();
      inputManager.onDirectionChange(listener);
      inputManager.simulateSwipe(0, 0, 5, 5);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
