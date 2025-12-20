import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { LivesManager } from './LivesManager';
import { GameState } from '../types/enums';
import { PBT_CONFIG } from '../test/pbt-config';

// Generator for grid positions
const gridPositionArb = fc.record({
  x: fc.nat({ max: 27 }),
  y: fc.nat({ max: 30 }),
});

// Generator for ghost spawn arrays (4 ghosts)
const ghostSpawnsArb = fc.array(gridPositionArb, { minLength: 4, maxLength: 4 });

/**
 * **Feature: pacman-clone, Property 11: Pac-Man-Tod-Lebensabzug**
 * **Validates: Requirements 4.1**
 * 
 * *Für jeden* Spielzustand mit Leben > 0, wenn Pac-Man einen Geist im normalen Zustand berührt,
 * soll die Anzahl der Leben um genau 1 reduziert werden.
 */
describe('Property 11: Pac-Man-Tod-Lebensabzug', () => {
  it('should decrement lives by exactly 1 on death when lives > 0', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 1, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          const livesBefore = livesManager.lives;
          
          livesManager.handleDeath();
          
          expect(livesManager.lives).toBe(livesBefore - 1);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should not go below 0 lives', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives, deathCount) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          
          for (let i = 0; i < deathCount; i++) {
            livesManager.handleDeath();
          }
          
          expect(livesManager.lives).toBeGreaterThanOrEqual(0);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * **Feature: pacman-clone, Property 12: Position-Reset-Nach-Tod**
 * **Validates: Requirements 4.3**
 * 
 * *Für jeden* Tod mit verbleibenden Leben, sollen Pac-Man und alle Geister
 * an ihre definierten Spawn-Positionen zurückgesetzt werden.
 */
describe('Property 12: Position-Reset-Nach-Tod', () => {
  it('should trigger position reset callback when lives remain after death', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 2, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          const resetCallback = vi.fn();
          livesManager.setPositionResetCallback(resetCallback);
          
          livesManager.handleDeath();
          
          // Should call reset callback since lives remain
          expect(resetCallback).toHaveBeenCalledTimes(1);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should provide correct spawn positions for reset', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        (pacmanSpawn, ghostSpawns) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns);
          
          // Verify spawn positions are available for reset
          expect(livesManager.pacmanSpawn).toEqual(pacmanSpawn);
          expect(livesManager.ghostSpawns).toEqual(ghostSpawns);
          
          // Verify each ghost spawn is accessible
          for (let i = 0; i < ghostSpawns.length; i++) {
            expect(livesManager.getGhostSpawn(i)).toEqual(ghostSpawns[i]);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should not trigger reset callback on game over', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        (pacmanSpawn, ghostSpawns) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, 1);
          const resetCallback = vi.fn();
          livesManager.setPositionResetCallback(resetCallback);
          
          // This death should cause game over
          livesManager.handleDeath();
          
          // Should NOT call reset callback on game over
          expect(resetCallback).not.toHaveBeenCalled();
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * **Feature: pacman-clone, Property 13: Game-Over-Bedingung**
 * **Validates: Requirements 4.2**
 * 
 * *Für jeden* Spielzustand, wenn die Anzahl der Leben 0 erreicht,
 * soll der Spielzustand auf GAME_OVER wechseln.
 */
describe('Property 13: Game-Over-Bedingung', () => {
  it('should return GAME_OVER when lives reach 0', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 1, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          
          // Die exactly initialLives times
          let lastState: GameState = GameState.PLAYING;
          for (let i = 0; i < initialLives; i++) {
            lastState = livesManager.handleDeath();
          }
          
          // Last death should return GAME_OVER
          expect(lastState).toBe(GameState.GAME_OVER);
          expect(livesManager.isGameOver).toBe(true);
          expect(livesManager.lives).toBe(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should return DYING when lives remain after death', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 2, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          
          // First death should return DYING (not GAME_OVER)
          const state = livesManager.handleDeath();
          
          expect(state).toBe(GameState.DYING);
          expect(livesManager.isGameOver).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should consistently report game over state', () => {
    fc.assert(
      fc.property(
        gridPositionArb,
        ghostSpawnsArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 10 }),
        (pacmanSpawn, ghostSpawns, initialLives, extraDeaths) => {
          const livesManager = new LivesManager(pacmanSpawn, ghostSpawns, initialLives);
          
          // Die until game over
          for (let i = 0; i < initialLives; i++) {
            livesManager.handleDeath();
          }
          
          // Additional deaths should still return GAME_OVER
          for (let i = 0; i < extraDeaths; i++) {
            const state = livesManager.handleDeath();
            expect(state).toBe(GameState.GAME_OVER);
          }
          
          expect(livesManager.isGameOver).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});
