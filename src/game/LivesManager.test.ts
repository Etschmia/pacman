import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivesManager, DEFAULT_LIVES } from './LivesManager';
import { GameState } from '../types/enums';
import type { GridPosition } from '../types';

describe('LivesManager', () => {
  let livesManager: LivesManager;
  const pacmanSpawn: GridPosition = { x: 14, y: 23 };
  const ghostSpawns: GridPosition[] = [
    { x: 14, y: 11 },
    { x: 12, y: 14 },
    { x: 14, y: 14 },
    { x: 16, y: 14 },
  ];

  beforeEach(() => {
    livesManager = new LivesManager(pacmanSpawn, ghostSpawns);
  });

  describe('initialization', () => {
    it('should start with default 3 lives', () => {
      expect(livesManager.lives).toBe(DEFAULT_LIVES);
      expect(livesManager.lives).toBe(3);
    });

    it('should accept custom initial lives', () => {
      const customManager = new LivesManager(pacmanSpawn, ghostSpawns, 5);
      expect(customManager.lives).toBe(5);
    });

    it('should store pacman spawn position', () => {
      expect(livesManager.pacmanSpawn).toEqual(pacmanSpawn);
    });

    it('should store ghost spawn positions', () => {
      expect(livesManager.ghostSpawns).toEqual(ghostSpawns);
    });

    it('should not be game over initially', () => {
      expect(livesManager.isGameOver).toBe(false);
    });
  });

  describe('handleDeath', () => {
    it('should decrement lives by 1', () => {
      expect(livesManager.lives).toBe(3);
      livesManager.handleDeath();
      expect(livesManager.lives).toBe(2);
    });

    it('should return DYING state when lives remain', () => {
      const state = livesManager.handleDeath();
      expect(state).toBe(GameState.DYING);
    });

    it('should return GAME_OVER when no lives remain', () => {
      livesManager.handleDeath(); // 3 -> 2
      livesManager.handleDeath(); // 2 -> 1
      const state = livesManager.handleDeath(); // 1 -> 0
      expect(state).toBe(GameState.GAME_OVER);
      expect(livesManager.isGameOver).toBe(true);
    });

    it('should return GAME_OVER if already at 0 lives', () => {
      livesManager.handleDeath();
      livesManager.handleDeath();
      livesManager.handleDeath();
      const state = livesManager.handleDeath();
      expect(state).toBe(GameState.GAME_OVER);
    });

    it('should call position reset callback when lives remain', () => {
      const callback = vi.fn();
      livesManager.setPositionResetCallback(callback);
      livesManager.handleDeath();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call position reset callback on game over', () => {
      const callback = vi.fn();
      livesManager.setPositionResetCallback(callback);
      livesManager.handleDeath(); // 3 -> 2, callback called
      livesManager.handleDeath(); // 2 -> 1, callback called
      livesManager.handleDeath(); // 1 -> 0, game over, no callback
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetLives', () => {
    it('should reset lives to default', () => {
      livesManager.handleDeath();
      livesManager.handleDeath();
      expect(livesManager.lives).toBe(1);
      livesManager.resetLives();
      expect(livesManager.lives).toBe(3);
    });

    it('should reset lives to custom value', () => {
      livesManager.resetLives(5);
      expect(livesManager.lives).toBe(5);
    });
  });

  describe('addLife', () => {
    it('should add one life', () => {
      livesManager.addLife();
      expect(livesManager.lives).toBe(4);
    });

    it('should respect max limit', () => {
      livesManager.addLife(3);
      expect(livesManager.lives).toBe(3);
    });

    it('should add life when below max', () => {
      livesManager.handleDeath(); // 3 -> 2
      livesManager.addLife(3);
      expect(livesManager.lives).toBe(3);
    });
  });

  describe('updateSpawnPositions', () => {
    it('should update pacman spawn', () => {
      const newPacmanSpawn = { x: 10, y: 20 };
      livesManager.updateSpawnPositions(newPacmanSpawn, ghostSpawns);
      expect(livesManager.pacmanSpawn).toEqual(newPacmanSpawn);
    });

    it('should update ghost spawns', () => {
      const newGhostSpawns = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
      livesManager.updateSpawnPositions(pacmanSpawn, newGhostSpawns);
      expect(livesManager.ghostSpawns).toEqual(newGhostSpawns);
    });
  });

  describe('getGhostSpawn', () => {
    it('should return correct ghost spawn by index', () => {
      expect(livesManager.getGhostSpawn(0)).toEqual(ghostSpawns[0]);
      expect(livesManager.getGhostSpawn(1)).toEqual(ghostSpawns[1]);
      expect(livesManager.getGhostSpawn(2)).toEqual(ghostSpawns[2]);
      expect(livesManager.getGhostSpawn(3)).toEqual(ghostSpawns[3]);
    });

    it('should clamp negative index to 0', () => {
      expect(livesManager.getGhostSpawn(-1)).toEqual(ghostSpawns[0]);
    });

    it('should clamp index exceeding array length', () => {
      expect(livesManager.getGhostSpawn(10)).toEqual(ghostSpawns[3]);
    });
  });

  describe('immutability', () => {
    it('should return copies of spawn positions', () => {
      const spawn = livesManager.pacmanSpawn;
      spawn.x = 999;
      expect(livesManager.pacmanSpawn.x).toBe(14);
    });

    it('should return copies of ghost spawns', () => {
      const spawns = livesManager.ghostSpawns;
      spawns[0].x = 999;
      expect(livesManager.ghostSpawns[0].x).toBe(14);
    });
  });
});
