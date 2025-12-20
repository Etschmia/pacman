import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { AudioManager, resetAudioManager } from './AudioManager';
import { PBT_NUM_RUNS } from '../test/pbt-config';

/**
 * **Feature: pacman-clone, Property 21: Sound-Toggle-Persistenz**
 * **Validates: Requirements 10.6**
 * 
 * *Für jede* Sound-Einstellung (enabled/disabled), wenn sie geändert und 
 * das Spiel neu gestartet wird, soll die Einstellung erhalten bleiben.
 */

// Mock localStorage with actual storage behavior
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    getStore: () => store,
  };
};

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

describe('Audio Property-Based Tests', () => {
  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(global, 'localStorage', { 
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    resetAudioManager();
  });

  afterEach(() => {
    resetAudioManager();
  });

  /**
   * Property 21: Sound-Toggle-Persistenz
   * 
   * For any sequence of toggle operations, the final state should be
   * persisted and restored correctly when creating a new AudioManager.
   */
  it('Property 21: Sound setting persists across AudioManager instances', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of toggle operations (true = toggle, false = no-op)
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (toggleSequence) => {
          // Clear storage for fresh start
          localStorageMock.clear();
          
          // Create first manager
          let manager = new AudioManager();
          const initialState = manager.soundEnabled;
          
          // Apply toggle sequence
          let expectedState = initialState;
          for (const shouldToggle of toggleSequence) {
            if (shouldToggle) {
              manager.toggleMute();
              expectedState = !expectedState;
            }
          }
          
          // Verify current state matches expected
          expect(manager.soundEnabled).toBe(expectedState);
          
          // Create new manager (simulates game restart)
          const newManager = new AudioManager();
          
          // New manager should have the persisted state
          expect(newManager.soundEnabled).toBe(expectedState);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  /**
   * Property 21 (variant): Direct set operations persist correctly
   */
  it('Property 21: setSoundEnabled persists across instances', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (targetState) => {
          // Clear storage for fresh start
          localStorageMock.clear();
          
          // Create manager and set state
          const manager = new AudioManager();
          manager.setSoundEnabled(targetState);
          
          // Verify state was set
          expect(manager.soundEnabled).toBe(targetState);
          
          // Create new manager
          const newManager = new AudioManager();
          
          // Should have persisted state
          expect(newManager.soundEnabled).toBe(targetState);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  /**
   * Property 21 (idempotence): Setting same value twice doesn't change state
   */
  it('Property 21: setSoundEnabled is idempotent', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.nat({ max: 10 }),
        (targetState, repeatCount) => {
          localStorageMock.clear();
          
          const manager = new AudioManager();
          
          // Set the same value multiple times
          for (let i = 0; i <= repeatCount; i++) {
            manager.setSoundEnabled(targetState);
          }
          
          // State should be the target state
          expect(manager.soundEnabled).toBe(targetState);
          
          // Verify persistence
          const newManager = new AudioManager();
          expect(newManager.soundEnabled).toBe(targetState);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  /**
   * Property 21 (round-trip): Toggle twice returns to original state
   */
  it('Property 21: Double toggle returns to original state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialState) => {
          localStorageMock.clear();
          
          // Set initial state
          const manager = new AudioManager();
          manager.setSoundEnabled(initialState);
          
          // Toggle twice
          manager.toggleMute();
          manager.toggleMute();
          
          // Should be back to initial state
          expect(manager.soundEnabled).toBe(initialState);
          
          // Verify persistence
          const newManager = new AudioManager();
          expect(newManager.soundEnabled).toBe(initialState);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});
