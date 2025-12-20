import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { LEVEL_CONFIGS, MAX_LEVEL, MIN_LEVEL, LevelManager } from './LevelManager';
import { PBT_NUM_RUNS } from '../test/pbt-config';
import { GameState } from '../types';
import { Maze } from '../maze/Maze';

/**
 * Property-Based Tests for LevelManager
 * 
 * **Feature: pacman-clone, Property 14: Schwierigkeits-Monotonie**
 * **Validates: Requirements 5.2, 5.3**
 * 
 * For all level pairs (n, n+1) with n < 8:
 * - ghostSpeed(n+1) >= ghostSpeed(n) (ghost speed increases or stays same)
 * - frightenedDuration(n+1) <= frightenedDuration(n) (frightened duration decreases or stays same)
 */
describe('LevelManager Property-Based Tests', () => {
  describe('Property 14: Schwierigkeits-Monotonie', () => {
    /**
     * **Feature: pacman-clone, Property 14: Schwierigkeits-Monotonie**
     * **Validates: Requirements 5.2, 5.3**
     * 
     * For any consecutive level pair (n, n+1), ghost speed should be non-decreasing
     * and frightened duration should be non-increasing.
     */
    it('ghost speed should be monotonically non-decreasing across levels', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const currentConfig = LEVEL_CONFIGS[level - 1];
            const nextConfig = LEVEL_CONFIGS[level];
            
            // Ghost speed should increase or stay the same
            expect(nextConfig.ghostSpeed).toBeGreaterThanOrEqual(currentConfig.ghostSpeed);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('frightened duration should be monotonically non-increasing across levels', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const currentConfig = LEVEL_CONFIGS[level - 1];
            const nextConfig = LEVEL_CONFIGS[level];
            
            // Frightened duration should decrease or stay the same
            expect(nextConfig.frightenedDuration).toBeLessThanOrEqual(currentConfig.frightenedDuration);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('difficulty should increase monotonically (combined property)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const currentConfig = LEVEL_CONFIGS[level - 1];
            const nextConfig = LEVEL_CONFIGS[level];
            
            // Both conditions must hold for difficulty to increase
            const ghostSpeedIncreases = nextConfig.ghostSpeed >= currentConfig.ghostSpeed;
            const frightenedDurationDecreases = nextConfig.frightenedDuration <= currentConfig.frightenedDuration;
            
            expect(ghostSpeedIncreases && frightenedDurationDecreases).toBe(true);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('LevelManager.getConfigForLevel should return configs with monotonic difficulty', () => {
      const manager = new LevelManager();
      
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const currentConfig = manager.getConfigForLevel(level);
            const nextConfig = manager.getConfigForLevel(level + 1);
            
            // Ghost speed non-decreasing
            expect(nextConfig.ghostSpeed).toBeGreaterThanOrEqual(currentConfig.ghostSpeed);
            // Frightened duration non-increasing
            expect(nextConfig.frightenedDuration).toBeLessThanOrEqual(currentConfig.frightenedDuration);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });
  });

  describe('Property 6: Level-Completion-Invariante', () => {
    /**
     * **Feature: pacman-clone, Property 6: Level-Completion-Invariante**
     * **Validates: Requirements 2.3**
     * 
     * For any maze layout, when the number of remaining pellets reaches 0,
     * the game state should change to LEVEL_COMPLETE.
     */
    it('should transition to LEVEL_COMPLETE when all pellets are collected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const manager = new LevelManager(level);
            const maze = manager.createMazeForCurrentLevel();
            
            expect(maze).not.toBeNull();
            if (!maze) return;
            
            // Initially level should not be complete
            expect(maze.isLevelComplete()).toBe(false);
            expect(manager.checkLevelCompletion()).toBeNull();
            
            // Collect all pellets
            const grid = maze.getGrid();
            for (let y = 0; y < grid.length; y++) {
              for (let x = 0; x < grid[y].length; x++) {
                maze.collectPellet({ x, y });
              }
            }
            
            // Now level should be complete
            expect(maze.isLevelComplete()).toBe(true);
            expect(maze.pelletsRemaining).toBe(0);
            expect(maze.powerPelletsRemaining).toBe(0);
            
            // Check that game state changes to LEVEL_COMPLETE
            const result = manager.checkLevelCompletion();
            expect(result).toBe(GameState.LEVEL_COMPLETE);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('should transition to WIN when completing level 8', () => {
      const manager = new LevelManager(MAX_LEVEL);
      const maze = manager.createMazeForCurrentLevel();
      
      expect(maze).not.toBeNull();
      if (!maze) return;
      
      // Collect all pellets
      const grid = maze.getGrid();
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          maze.collectPellet({ x, y });
        }
      }
      
      // Check that game state changes to WIN
      const result = manager.checkLevelCompletion();
      expect(result).toBe(GameState.WIN);
    });

    it('pellet count should be zero when level is complete', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
          (level) => {
            const manager = new LevelManager(level);
            const maze = manager.createMazeForCurrentLevel();
            
            expect(maze).not.toBeNull();
            if (!maze) return;
            
            // Collect all pellets
            const grid = maze.getGrid();
            for (let y = 0; y < grid.length; y++) {
              for (let x = 0; x < grid[y].length; x++) {
                maze.collectPellet({ x, y });
              }
            }
            
            // Verify invariant: level complete implies zero pellets
            if (maze.isLevelComplete()) {
              expect(maze.pelletsRemaining + maze.powerPelletsRemaining).toBe(0);
            }
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('level should not be complete while pellets remain', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
          (level) => {
            const manager = new LevelManager(level);
            const maze = manager.createMazeForCurrentLevel();
            
            expect(maze).not.toBeNull();
            if (!maze) return;
            
            const totalPellets = maze.totalPellets;
            
            // If there are pellets, level should not be complete
            if (totalPellets > 0) {
              expect(maze.isLevelComplete()).toBe(false);
              expect(manager.checkLevelCompletion()).toBeNull();
            }
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });
  });

  describe('Additional Level Properties', () => {
    it('all level configs should have positive values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
          (level) => {
            const config = LEVEL_CONFIGS[level - 1];
            
            expect(config.ghostSpeed).toBeGreaterThan(0);
            expect(config.pacmanSpeed).toBeGreaterThan(0);
            expect(config.frightenedDuration).toBeGreaterThan(0);
            expect(config.scatterDuration).toBeGreaterThan(0);
            expect(config.chaseDuration).toBeGreaterThan(0);
            expect(config.ghostReleaseInterval).toBeGreaterThan(0);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('level number should match array index + 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_LEVEL - 1 }),
          (index) => {
            const config = LEVEL_CONFIGS[index];
            expect(config.level).toBe(index + 1);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });

    it('ghost release interval should be non-increasing (faster ghost release at higher levels)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL - 1 }),
          (level) => {
            const currentConfig = LEVEL_CONFIGS[level - 1];
            const nextConfig = LEVEL_CONFIGS[level];
            
            expect(nextConfig.ghostReleaseInterval).toBeLessThanOrEqual(currentConfig.ghostReleaseInterval);
          }
        ),
        { numRuns: PBT_NUM_RUNS }
      );
    });
  });
});
