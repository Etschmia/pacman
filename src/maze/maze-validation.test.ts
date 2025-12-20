import { describe, it, expect } from 'vitest';
import {
  validateMazeConnectivity,
  validateGhostHouse,
  validateTunnels,
  validateMaze,
} from './maze-validation';
import { CellType } from '../types';
import type { MazeData } from '../types';

function createValidMazeData(): MazeData {
  const grid: CellType[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 2, 0, 0, 2, 2, 0, 0, 2, 0],
    [0, 2, 0, 4, 4, 4, 4, 0, 2, 0],
    [6, 1, 0, 4, 4, 5, 4, 0, 1, 6],
    [0, 2, 0, 4, 4, 4, 4, 0, 2, 0],
    [0, 2, 0, 0, 2, 2, 0, 0, 2, 0],
    [0, 3, 2, 2, 2, 2, 2, 2, 3, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return {
    width: 10,
    height: 10,
    grid,
    pacmanSpawn: { x: 5, y: 8 },
    ghostSpawns: [{ x: 5, y: 4 }],
    ghostHouseCenter: { x: 5, y: 4 },
    tunnels: [
      { x: 0, y: 4 },
      { x: 9, y: 4 },
    ],
  };
}

describe('maze-validation', () => {
  describe('validateMazeConnectivity', () => {
    it('should return true for connected maze', () => {
      const data = createValidMazeData();
      expect(validateMazeConnectivity(data)).toBe(true);
    });

    it('should return false for maze with isolated area', () => {
      const data = createValidMazeData();
      // Create an isolated pellet
      data.grid[1][1] = CellType.WALL;
      data.grid[1][2] = CellType.WALL;
      data.grid[2][1] = CellType.WALL;
      // Now (1,1) area is isolated if we had a pellet there
      // Let's create a truly isolated cell
      data.grid[8][8] = CellType.PELLET;
      data.grid[7][8] = CellType.WALL;
      data.grid[8][7] = CellType.WALL;
      
      expect(validateMazeConnectivity(data)).toBe(false);
    });

    it('should return false for invalid spawn position', () => {
      const data = createValidMazeData();
      data.pacmanSpawn = { x: 0, y: 0 }; // Wall position
      expect(validateMazeConnectivity(data)).toBe(false);
    });

    it('should return false for out of bounds spawn', () => {
      const data = createValidMazeData();
      data.pacmanSpawn = { x: -1, y: 0 };
      expect(validateMazeConnectivity(data)).toBe(false);
    });
  });

  describe('validateGhostHouse', () => {
    it('should return true for valid ghost house', () => {
      const data = createValidMazeData();
      expect(validateGhostHouse(data)).toBe(true);
    });

    it('should return false for ghost house with less than 4 cells', () => {
      const data = createValidMazeData();
      // Replace most ghost house cells with walls
      data.grid[3][3] = CellType.WALL;
      data.grid[3][4] = CellType.WALL;
      data.grid[3][5] = CellType.WALL;
      data.grid[3][6] = CellType.WALL;
      data.grid[4][3] = CellType.WALL;
      data.grid[4][6] = CellType.WALL;
      data.grid[5][3] = CellType.WALL;
      data.grid[5][4] = CellType.WALL;
      data.grid[5][5] = CellType.WALL;
      data.grid[5][6] = CellType.WALL;
      
      expect(validateGhostHouse(data)).toBe(false);
    });

    it('should return false for invalid ghost house center', () => {
      const data = createValidMazeData();
      data.ghostHouseCenter = { x: 1, y: 1 }; // Not a ghost house cell
      expect(validateGhostHouse(data)).toBe(false);
    });
  });

  describe('validateTunnels', () => {
    it('should return true for valid tunnel pair', () => {
      const data = createValidMazeData();
      expect(validateTunnels(data)).toBe(true);
    });

    it('should return false for less than 2 tunnels', () => {
      const data = createValidMazeData();
      data.tunnels = [{ x: 0, y: 4 }];
      expect(validateTunnels(data)).toBe(false);
    });

    it('should return false for tunnels not on opposite sides', () => {
      const data = createValidMazeData();
      data.tunnels = [
        { x: 0, y: 4 },
        { x: 0, y: 5 }, // Same side
      ];
      expect(validateTunnels(data)).toBe(false);
    });

    it('should accept vertical tunnel pairs', () => {
      const data = createValidMazeData();
      data.tunnels = [
        { x: 5, y: 0 },
        { x: 5, y: 9 },
      ];
      expect(validateTunnels(data)).toBe(true);
    });
  });

  describe('validateMaze', () => {
    it('should return valid for correct maze', () => {
      const data = createValidMazeData();
      const result = validateMaze(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return all errors for invalid maze', () => {
      const data = createValidMazeData();
      data.pacmanSpawn = { x: 0, y: 0 }; // Invalid spawn
      data.ghostHouseCenter = { x: 1, y: 1 }; // Invalid ghost house
      data.tunnels = []; // No tunnels
      
      const result = validateMaze(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
