/**
 * Property-Based Tests for Input System
 * 
 * **Feature: pacman-clone, Property 1: Input-Richtungs-Mapping**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * **Feature: pacman-clone, Property 2: Input-Buffering-Konsistenz**
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { InputManager } from './InputManager';
import { Direction } from '../types';
import { PBT_CONFIG, keyboardInputArb, swipeArb, directionArb } from '../test/pbt-config';

describe('Input System Property-Based Tests', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  /**
   * **Property 1: Input-Richtungs-Mapping**
   * 
   * *Für jede* gültige Tastatureingabe (Pfeiltasten, WASD) oder Swipe-Geste, 
   * soll die resultierende Bewegungsrichtung exakt der erwarteten Richtung 
   * entsprechen (UP→UP, DOWN→DOWN, LEFT→LEFT, RIGHT→RIGHT).
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Input-Richtungs-Mapping', () => {
    // Expected mappings for keyboard inputs
    const keyToExpectedDirection: Record<string, Direction> = {
      ArrowUp: Direction.UP,
      ArrowDown: Direction.DOWN,
      ArrowLeft: Direction.LEFT,
      ArrowRight: Direction.RIGHT,
      KeyW: Direction.UP,
      KeyS: Direction.DOWN,
      KeyA: Direction.LEFT,
      KeyD: Direction.RIGHT,
    };

    it('should map all keyboard inputs to correct directions', () => {
      fc.assert(
        fc.property(keyboardInputArb, (keyCode) => {
          const result = inputManager.mapKeyToDirection(keyCode);
          const expected = keyToExpectedDirection[keyCode];
          return result === expected;
        }),
        PBT_CONFIG
      );
    });

    it('should map swipe gestures to correct directions based on dominant axis', () => {
      fc.assert(
        fc.property(swipeArb, ({ dx, dy }) => {
          const direction = inputManager.detectSwipeDirection(0, 0, dx, dy);
          
          // Calculate expected direction based on dominant axis
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If below threshold, should be NONE
          if (distance < 30) {
            return direction === Direction.NONE;
          }
          
          // Determine expected direction
          let expected: Direction;
          if (absX > absY) {
            expected = dx > 0 ? Direction.RIGHT : Direction.LEFT;
          } else {
            expected = dy > 0 ? Direction.DOWN : Direction.UP;
          }
          
          return direction === expected;
        }),
        PBT_CONFIG
      );
    });

    it('should reject swipes below minimum distance threshold', () => {
      const shortSwipeArb = fc.record({
        dx: fc.integer({ min: -29, max: 29 }),
        dy: fc.integer({ min: -29, max: 29 }),
      }).filter(({ dx, dy }) => Math.sqrt(dx * dx + dy * dy) < 30);

      fc.assert(
        fc.property(shortSwipeArb, ({ dx, dy }) => {
          const direction = inputManager.detectSwipeDirection(0, 0, dx, dy);
          return direction === Direction.NONE;
        }),
        PBT_CONFIG
      );
    });

    it('should handle diagonal swipes by selecting dominant axis', () => {
      // Generate diagonal swipes where both axes have significant movement
      const diagonalSwipeArb = fc.record({
        dx: fc.integer({ min: 30, max: 200 }).chain(v => 
          fc.constantFrom(v, -v)
        ),
        dy: fc.integer({ min: 30, max: 200 }).chain(v => 
          fc.constantFrom(v, -v)
        ),
      });

      fc.assert(
        fc.property(diagonalSwipeArb, ({ dx, dy }) => {
          const direction = inputManager.detectSwipeDirection(0, 0, dx, dy);
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          
          // Direction should be based on dominant axis
          if (absX > absY) {
            return direction === (dx > 0 ? Direction.RIGHT : Direction.LEFT);
          } else if (absY > absX) {
            return direction === (dy > 0 ? Direction.DOWN : Direction.UP);
          } else {
            // Equal - vertical wins (as per implementation)
            return direction === (dy > 0 ? Direction.DOWN : Direction.UP);
          }
        }),
        PBT_CONFIG
      );
    });
  });

  /**
   * **Property 2: Input-Buffering-Konsistenz**
   * 
   * *Für jede* gebufferte Richtungseingabe und jede Maze-Konfiguration, 
   * wenn die gebufferte Richtung später möglich wird, soll die 
   * Richtungsänderung ausgeführt werden.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 2: Input-Buffering-Konsistenz', () => {
    it('should buffer any valid direction input', () => {
      fc.assert(
        fc.property(keyboardInputArb, (keyCode) => {
          inputManager.reset();
          inputManager.simulateKeyInput(keyCode);
          
          const buffered = inputManager.getBufferedDirection();
          const expected = inputManager.mapKeyToDirection(keyCode);
          
          return buffered === expected;
        }),
        PBT_CONFIG
      );
    });

    it('should preserve buffered direction until applied or cleared', () => {
      fc.assert(
        fc.property(
          keyboardInputArb,
          fc.boolean(),
          (keyCode, shouldApply) => {
            inputManager.reset();
            inputManager.simulateKeyInput(keyCode);
            
            const bufferedBefore = inputManager.getBufferedDirection();
            
            if (shouldApply) {
              inputManager.applyBufferedDirection();
              const current = inputManager.getCurrentDirection();
              return current === bufferedBefore;
            } else {
              // Buffer should remain unchanged
              return inputManager.getBufferedDirection() === bufferedBefore;
            }
          }
        ),
        PBT_CONFIG
      );
    });

    it('should apply buffered direction correctly when called', () => {
      fc.assert(
        fc.property(directionArb, (direction) => {
          inputManager.reset();
          
          // Simulate input for the direction
          const keyMap: Record<Direction, string> = {
            [Direction.UP]: 'ArrowUp',
            [Direction.DOWN]: 'ArrowDown',
            [Direction.LEFT]: 'ArrowLeft',
            [Direction.RIGHT]: 'ArrowRight',
            [Direction.NONE]: '',
          };
          
          const keyCode = keyMap[direction];
          if (keyCode) {
            inputManager.simulateKeyInput(keyCode);
            inputManager.applyBufferedDirection();
            return inputManager.getCurrentDirection() === direction;
          }
          return true;
        }),
        PBT_CONFIG
      );
    });

    it('should clear buffer correctly', () => {
      fc.assert(
        fc.property(keyboardInputArb, (keyCode) => {
          inputManager.reset();
          inputManager.simulateKeyInput(keyCode);
          inputManager.clearBuffer();
          
          return inputManager.getBufferedDirection() === Direction.NONE;
        }),
        PBT_CONFIG
      );
    });

    it('should replace buffered direction with new input', () => {
      fc.assert(
        fc.property(
          keyboardInputArb,
          keyboardInputArb,
          (firstKey, secondKey) => {
            inputManager.reset();
            inputManager.simulateKeyInput(firstKey);
            inputManager.simulateKeyInput(secondKey);
            
            const expected = inputManager.mapKeyToDirection(secondKey);
            return inputManager.getBufferedDirection() === expected;
          }
        ),
        PBT_CONFIG
      );
    });

    it('should emit direction change events for each input', () => {
      fc.assert(
        fc.property(
          fc.array(keyboardInputArb, { minLength: 1, maxLength: 10 }),
          (inputs) => {
            inputManager.reset();
            const receivedDirections: Direction[] = [];
            
            inputManager.onDirectionChange((dir) => {
              receivedDirections.push(dir);
            });
            
            for (const keyCode of inputs) {
              inputManager.simulateKeyInput(keyCode);
            }
            
            // Should have received one event per input
            if (receivedDirections.length !== inputs.length) {
              return false;
            }
            
            // Each received direction should match the expected mapping
            for (let i = 0; i < inputs.length; i++) {
              const expected = inputManager.mapKeyToDirection(inputs[i]);
              if (receivedDirections[i] !== expected) {
                return false;
              }
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
