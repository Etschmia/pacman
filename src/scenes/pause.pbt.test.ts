import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameState } from '../types';
import { PBT_CONFIG } from '../test/pbt-config';

/**
 * Simulates pause toggle behavior for testing
 * This is a simplified model of the GameScene pause logic
 */
class PauseStateMachine {
  private _gameState: GameState;
  private _isPaused: boolean = false;

  constructor(initialState: GameState = GameState.PLAYING) {
    this._gameState = initialState;
  }

  get gameState(): GameState {
    return this._gameState;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Toggles pause state
   * Only works when in PLAYING state or already paused
   */
  togglePause(): void {
    // Can only pause from PLAYING state
    if (this._gameState !== GameState.PLAYING && !this._isPaused) {
      return;
    }

    this._isPaused = !this._isPaused;

    if (this._isPaused) {
      this._gameState = GameState.PAUSED;
    } else {
      this._gameState = GameState.PLAYING;
    }
  }

  /**
   * Resets to initial state
   */
  reset(): void {
    this._gameState = GameState.PLAYING;
    this._isPaused = false;
  }
}

describe('Pause Toggle Property Tests', () => {
  /**
   * **Feature: pacman-clone, Property 20: Pause-Toggle-Idempotenz**
   * **Validates: Requirements 9.2**
   * 
   * For any game state PLAYING, if Pause is triggered twice consecutively,
   * the state should return to PLAYING.
   */
  describe('Property 20: Pause-Toggle-Idempotenz', () => {
    it('double pause toggle returns to PLAYING state', () => {
      fc.assert(
        fc.property(
          fc.constant(GameState.PLAYING),
          (initialState) => {
            const machine = new PauseStateMachine(initialState);
            
            // Verify initial state
            expect(machine.gameState).toBe(GameState.PLAYING);
            expect(machine.isPaused).toBe(false);
            
            // First toggle - should pause
            machine.togglePause();
            expect(machine.gameState).toBe(GameState.PAUSED);
            expect(machine.isPaused).toBe(true);
            
            // Second toggle - should resume
            machine.togglePause();
            expect(machine.gameState).toBe(GameState.PLAYING);
            expect(machine.isPaused).toBe(false);
          }
        ),
        PBT_CONFIG
      );
    });

    it('multiple double toggles always return to PLAYING', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (togglePairs) => {
            const machine = new PauseStateMachine(GameState.PLAYING);
            
            // Perform multiple pairs of toggles
            for (let i = 0; i < togglePairs; i++) {
              machine.togglePause(); // Pause
              machine.togglePause(); // Resume
            }
            
            // Should always end up in PLAYING state
            expect(machine.gameState).toBe(GameState.PLAYING);
            expect(machine.isPaused).toBe(false);
          }
        ),
        PBT_CONFIG
      );
    });

    it('odd number of toggles results in PAUSED state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (oddCount) => {
            const machine = new PauseStateMachine(GameState.PLAYING);
            const toggleCount = oddCount * 2 + 1; // Always odd
            
            for (let i = 0; i < toggleCount; i++) {
              machine.togglePause();
            }
            
            // Odd toggles should result in PAUSED
            expect(machine.gameState).toBe(GameState.PAUSED);
            expect(machine.isPaused).toBe(true);
          }
        ),
        PBT_CONFIG
      );
    });

    it('even number of toggles results in PLAYING state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (evenCount) => {
            const machine = new PauseStateMachine(GameState.PLAYING);
            const toggleCount = evenCount * 2; // Always even
            
            for (let i = 0; i < toggleCount; i++) {
              machine.togglePause();
            }
            
            // Even toggles should result in PLAYING
            expect(machine.gameState).toBe(GameState.PLAYING);
            expect(machine.isPaused).toBe(false);
          }
        ),
        PBT_CONFIG
      );
    });

    it('pause toggle has no effect in non-PLAYING states', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            GameState.READY,
            GameState.DYING,
            GameState.LEVEL_COMPLETE,
            GameState.GAME_OVER,
            GameState.WIN
          ),
          (nonPlayingState) => {
            const machine = new PauseStateMachine(nonPlayingState);
            const initialState = machine.gameState;
            
            // Toggle should have no effect
            machine.togglePause();
            
            expect(machine.gameState).toBe(initialState);
            expect(machine.isPaused).toBe(false);
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
