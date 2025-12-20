import { describe, it, expect, beforeEach } from 'vitest';
import { Maze } from './Maze';
import { CellType } from '../types';
import type { MazeData } from '../types';

function createTestMazeData(): MazeData {
  // Simple 10x10 maze with pellets
  const grid: CellType[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // walls
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 0], // pellets
    [0, 2, 0, 0, 2, 2, 0, 0, 2, 0],
    [0, 2, 0, 4, 4, 4, 4, 0, 2, 0], // ghost house
    [6, 1, 0, 4, 4, 5, 4, 0, 1, 6], // tunnel + ghost door
    [0, 2, 0, 4, 4, 4, 4, 0, 2, 0], // ghost house
    [0, 2, 0, 0, 2, 2, 0, 0, 2, 0],
    [0, 3, 2, 2, 2, 2, 2, 2, 3, 0], // power pellets at corners
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // walls
  ];

  return {
    width: 10,
    height: 10,
    grid,
    pacmanSpawn: { x: 5, y: 8 },
    ghostSpawns: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ],
    ghostHouseCenter: { x: 5, y: 4 },
    tunnels: [
      { x: 0, y: 4 },
      { x: 9, y: 4 },
    ],
  };
}

describe('Maze', () => {
  let maze: Maze;
  let mazeData: MazeData;

  beforeEach(() => {
    mazeData = createTestMazeData();
    maze = new Maze(mazeData);
  });

  describe('dimensions', () => {
    it('should return correct width and height', () => {
      expect(maze.width).toBe(10);
      expect(maze.height).toBe(10);
    });

    it('should return correct pixel dimensions', () => {
      expect(maze.pixelWidth).toBe(160); // 10 * 16
      expect(maze.pixelHeight).toBe(160);
    });
  });

  describe('spawn points', () => {
    it('should return pacman spawn position', () => {
      expect(maze.pacmanSpawn).toEqual({ x: 5, y: 8 });
    });

    it('should return ghost spawn positions', () => {
      expect(maze.ghostSpawns).toHaveLength(4);
    });

    it('should return ghost house center', () => {
      expect(maze.ghostHouseCenter).toEqual({ x: 5, y: 4 });
    });
  });

  describe('coordinate conversion', () => {
    it('should convert grid to pixel position', () => {
      const pixel = maze.gridToPixel({ x: 0, y: 0 });
      expect(pixel).toEqual({ x: 8, y: 8 }); // center of cell
    });

    it('should convert pixel to grid position', () => {
      const grid = maze.pixelToGrid({ x: 24, y: 24 });
      expect(grid).toEqual({ x: 1, y: 1 });
    });
  });

  describe('cell access', () => {
    it('should return correct cell type', () => {
      expect(maze.getCell({ x: 0, y: 0 })).toBe(CellType.WALL);
      expect(maze.getCell({ x: 1, y: 1 })).toBe(CellType.PELLET);
      expect(maze.getCell({ x: 1, y: 7 })).toBe(CellType.POWER_PELLET);
    });

    it('should return WALL for out of bounds', () => {
      expect(maze.getCell({ x: -1, y: 0 })).toBe(CellType.WALL);
      expect(maze.getCell({ x: 100, y: 0 })).toBe(CellType.WALL);
    });

    it('should check if position is walkable', () => {
      expect(maze.isWalkable({ x: 1, y: 1 })).toBe(true);
      expect(maze.isWalkable({ x: 0, y: 0 })).toBe(false);
    });

    it('should check if position is tunnel', () => {
      expect(maze.isTunnel({ x: 0, y: 4 })).toBe(true);
      expect(maze.isTunnel({ x: 1, y: 1 })).toBe(false);
    });
  });

  describe('pellet management', () => {
    it('should count initial pellets', () => {
      expect(maze.pelletsRemaining).toBeGreaterThan(0);
      expect(maze.powerPelletsRemaining).toBe(2);
    });

    it('should detect pellet at position', () => {
      expect(maze.hasPellet({ x: 1, y: 1 })).toBe(true);
      expect(maze.hasPellet({ x: 0, y: 0 })).toBe(false);
    });

    it('should detect power pellet', () => {
      expect(maze.isPowerPellet({ x: 1, y: 7 })).toBe(true);
      expect(maze.isPowerPellet({ x: 1, y: 1 })).toBe(false);
    });

    it('should collect pellet and update count', () => {
      const initialCount = maze.pelletsRemaining;
      const collected = maze.collectPellet({ x: 1, y: 1 });
      
      expect(collected).toBe(CellType.PELLET);
      expect(maze.pelletsRemaining).toBe(initialCount - 1);
      expect(maze.hasPellet({ x: 1, y: 1 })).toBe(false);
    });

    it('should collect power pellet and update count', () => {
      const initialCount = maze.powerPelletsRemaining;
      const collected = maze.collectPellet({ x: 1, y: 7 });
      
      expect(collected).toBe(CellType.POWER_PELLET);
      expect(maze.powerPelletsRemaining).toBe(initialCount - 1);
    });

    it('should return null when collecting from empty position', () => {
      maze.collectPellet({ x: 1, y: 1 });
      const secondCollect = maze.collectPellet({ x: 1, y: 1 });
      expect(secondCollect).toBeNull();
    });

    it('should detect level complete when all pellets collected', () => {
      expect(maze.isLevelComplete()).toBe(false);
      
      // Collect all pellets
      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          maze.collectPellet({ x, y });
        }
      }
      
      expect(maze.isLevelComplete()).toBe(true);
    });

    it('should reset pellets', () => {
      maze.collectPellet({ x: 1, y: 1 });
      expect(maze.hasPellet({ x: 1, y: 1 })).toBe(false);
      
      maze.resetPellets();
      expect(maze.hasPellet({ x: 1, y: 1 })).toBe(true);
    });
  });

  describe('tunnel teleportation', () => {
    it('should find opposite tunnel', () => {
      const opposite = maze.getOppositeTunnel({ x: 0, y: 4 });
      expect(opposite).toEqual({ x: 9, y: 4 });
    });

    it('should return null for non-tunnel position', () => {
      const opposite = maze.getOppositeTunnel({ x: 5, y: 5 });
      expect(opposite).toBeNull();
    });
  });
});
