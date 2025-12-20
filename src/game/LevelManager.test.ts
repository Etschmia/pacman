import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelManager, LEVEL_CONFIGS, MAX_LEVEL, MIN_LEVEL } from './LevelManager';
import { GameState } from '../types';
import { Maze } from '../maze/Maze';

describe('LevelManager', () => {
  let levelManager: LevelManager;

  beforeEach(() => {
    levelManager = new LevelManager();
  });

  describe('initialization', () => {
    it('should start at level 1 by default', () => {
      expect(levelManager.getLevel()).toBe(1);
    });

    it('should allow starting at a specific level', () => {
      const manager = new LevelManager(5);
      expect(manager.getLevel()).toBe(5);
    });

    it('should clamp start level to valid range', () => {
      const tooLow = new LevelManager(0);
      expect(tooLow.getLevel()).toBe(MIN_LEVEL);

      const tooHigh = new LevelManager(100);
      expect(tooHigh.getLevel()).toBe(MAX_LEVEL);
    });
  });

  describe('getCurrentConfig', () => {
    it('should return config for current level', () => {
      const config = levelManager.getCurrentConfig();
      expect(config.level).toBe(1);
      expect(config.ghostSpeed).toBe(75);
      expect(config.frightenedDuration).toBe(6000);
    });

    it('should return a copy of the config', () => {
      const config1 = levelManager.getCurrentConfig();
      const config2 = levelManager.getCurrentConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getConfigForLevel', () => {
    it('should return correct config for each level', () => {
      for (let level = 1; level <= MAX_LEVEL; level++) {
        const config = levelManager.getConfigForLevel(level);
        expect(config.level).toBe(level);
      }
    });

    it('should clamp invalid levels', () => {
      const tooLow = levelManager.getConfigForLevel(0);
      expect(tooLow.level).toBe(1);

      const tooHigh = levelManager.getConfigForLevel(100);
      expect(tooHigh.level).toBe(MAX_LEVEL);
    });
  });

  describe('speed getters', () => {
    it('should return ghost speed for current level', () => {
      expect(levelManager.getGhostSpeed()).toBe(75);
    });

    it('should return pacman speed for current level', () => {
      expect(levelManager.getPacmanSpeed()).toBe(80);
    });
  });

  describe('duration getters', () => {
    it('should return frightened duration for current level', () => {
      expect(levelManager.getFrightenedDuration()).toBe(6000);
    });

    it('should return scatter duration for current level', () => {
      expect(levelManager.getScatterDuration()).toBe(7000);
    });

    it('should return chase duration for current level', () => {
      expect(levelManager.getChaseDuration()).toBe(20000);
    });

    it('should return ghost release interval for current level', () => {
      expect(levelManager.getGhostReleaseInterval()).toBe(4000);
    });
  });

  describe('advanceLevel', () => {
    it('should increment level by 1', () => {
      levelManager.advanceLevel();
      expect(levelManager.getLevel()).toBe(2);
    });

    it('should return LEVEL_COMPLETE for levels 1-7', () => {
      for (let i = 1; i < MAX_LEVEL; i++) {
        const manager = new LevelManager(i);
        const state = manager.advanceLevel();
        expect(state).toBe(GameState.LEVEL_COMPLETE);
      }
    });

    it('should return WIN when completing level 8', () => {
      const manager = new LevelManager(MAX_LEVEL);
      const state = manager.advanceLevel();
      expect(state).toBe(GameState.WIN);
    });

    it('should call onLevelChange callback', () => {
      const callback = vi.fn();
      levelManager.setOnLevelChange(callback);
      levelManager.advanceLevel();
      expect(callback).toHaveBeenCalledWith(2, expect.objectContaining({ level: 2 }));
    });

    it('should call onGameStateChange callback', () => {
      const callback = vi.fn();
      levelManager.setOnGameStateChange(callback);
      levelManager.advanceLevel();
      expect(callback).toHaveBeenCalledWith(GameState.LEVEL_COMPLETE);
    });
  });

  describe('isFinalLevel', () => {
    it('should return false for levels 1-7', () => {
      for (let i = 1; i < MAX_LEVEL; i++) {
        const manager = new LevelManager(i);
        expect(manager.isFinalLevel()).toBe(false);
      }
    });

    it('should return true for level 8', () => {
      const manager = new LevelManager(MAX_LEVEL);
      expect(manager.isFinalLevel()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to level 1', () => {
      levelManager.advanceLevel();
      levelManager.advanceLevel();
      expect(levelManager.getLevel()).toBe(3);
      
      levelManager.reset();
      expect(levelManager.getLevel()).toBe(1);
    });

    it('should call onLevelChange callback on reset', () => {
      const callback = vi.fn();
      levelManager.advanceLevel();
      levelManager.setOnLevelChange(callback);
      levelManager.reset();
      expect(callback).toHaveBeenCalledWith(1, expect.objectContaining({ level: 1 }));
    });
  });

  describe('maze loading', () => {
    it('should get maze layout for current level', () => {
      const layout = levelManager.getMazeLayoutForCurrentLevel();
      expect(layout).toBeDefined();
      expect(layout.id).toBeDefined();
      expect(layout.grid).toBeDefined();
    });

    it('should load and validate maze for current level', () => {
      const result = levelManager.loadCurrentLevelMaze();
      expect(result.errors).toHaveLength(0);
      expect(result.data).not.toBeNull();
    });

    it('should create maze instance for current level', () => {
      const maze = levelManager.createMazeForCurrentLevel();
      expect(maze).toBeInstanceOf(Maze);
      expect(levelManager.getCurrentMaze()).toBe(maze);
    });

    it('should allow setting current maze externally', () => {
      const result = levelManager.loadCurrentLevelMaze();
      const maze = new Maze(result.data!);
      levelManager.setCurrentMaze(maze);
      expect(levelManager.getCurrentMaze()).toBe(maze);
    });
  });

  describe('level completion', () => {
    it('should return null when no maze is set', () => {
      const result = levelManager.checkLevelCompletion();
      expect(result).toBeNull();
    });

    it('should return null when level is not complete', () => {
      levelManager.createMazeForCurrentLevel();
      const result = levelManager.checkLevelCompletion();
      expect(result).toBeNull();
    });

    it('should return LEVEL_COMPLETE when all pellets collected (levels 1-7)', () => {
      const manager = new LevelManager(1);
      const maze = manager.createMazeForCurrentLevel();
      
      // Collect all pellets
      if (maze) {
        const grid = maze.getGrid();
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            maze.collectPellet({ x, y });
          }
        }
      }
      
      const result = manager.checkLevelCompletion();
      expect(result).toBe(GameState.LEVEL_COMPLETE);
    });

    it('should return WIN when completing level 8', () => {
      const manager = new LevelManager(MAX_LEVEL);
      const maze = manager.createMazeForCurrentLevel();
      
      // Collect all pellets
      if (maze) {
        const grid = maze.getGrid();
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            maze.collectPellet({ x, y });
          }
        }
      }
      
      const result = manager.checkLevelCompletion();
      expect(result).toBe(GameState.WIN);
    });

    it('should call onLevelComplete callback', () => {
      const callback = vi.fn();
      levelManager.setOnLevelComplete(callback);
      const maze = levelManager.createMazeForCurrentLevel();
      
      // Collect all pellets
      if (maze) {
        const grid = maze.getGrid();
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            maze.collectPellet({ x, y });
          }
        }
      }
      
      levelManager.checkLevelCompletion();
      expect(callback).toHaveBeenCalledWith(1, 2);
    });

    it('should call onLevelComplete with null nextLevel for level 8', () => {
      const manager = new LevelManager(MAX_LEVEL);
      const callback = vi.fn();
      manager.setOnLevelComplete(callback);
      const maze = manager.createMazeForCurrentLevel();
      
      // Collect all pellets
      if (maze) {
        const grid = maze.getGrid();
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            maze.collectPellet({ x, y });
          }
        }
      }
      
      manager.checkLevelCompletion();
      expect(callback).toHaveBeenCalledWith(MAX_LEVEL, null);
    });
  });

  describe('transitionToNextLevel', () => {
    it('should return null when on final level', () => {
      const manager = new LevelManager(MAX_LEVEL);
      const result = manager.transitionToNextLevel();
      expect(result).toBeNull();
    });

    it('should increment level and create new maze', () => {
      const result = levelManager.transitionToNextLevel();
      expect(result).not.toBeNull();
      expect(result?.maze).toBeInstanceOf(Maze);
      expect(result?.config.level).toBe(2);
      expect(levelManager.getLevel()).toBe(2);
    });

    it('should call onLevelChange callback', () => {
      const callback = vi.fn();
      levelManager.setOnLevelChange(callback);
      levelManager.transitionToNextLevel();
      expect(callback).toHaveBeenCalledWith(2, expect.objectContaining({ level: 2 }));
    });
  });

  describe('static methods', () => {
    it('should return all configs', () => {
      const configs = LevelManager.getAllConfigs();
      expect(configs).toHaveLength(MAX_LEVEL);
    });

    it('should return total number of levels', () => {
      expect(LevelManager.getTotalLevels()).toBe(MAX_LEVEL);
    });
  });
});

describe('LEVEL_CONFIGS', () => {
  it('should have 8 level configurations', () => {
    expect(LEVEL_CONFIGS).toHaveLength(8);
  });

  it('should have correct level numbers', () => {
    LEVEL_CONFIGS.forEach((config, index) => {
      expect(config.level).toBe(index + 1);
    });
  });

  it('should have all required properties', () => {
    LEVEL_CONFIGS.forEach((config) => {
      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('ghostSpeed');
      expect(config).toHaveProperty('pacmanSpeed');
      expect(config).toHaveProperty('frightenedDuration');
      expect(config).toHaveProperty('scatterDuration');
      expect(config).toHaveProperty('chaseDuration');
      expect(config).toHaveProperty('ghostReleaseInterval');
    });
  });
});
