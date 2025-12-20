import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CellType } from '../types';
import type { MazeData } from '../types';
import { PBT_CONFIG } from '../test/pbt-config';
import { MAZE_LAYOUTS } from './layouts';
import { layoutToMazeData } from './maze-loader';
import { Maze } from './Maze';
import {
  validateMazeConnectivity,
  validateGhostHouse,
  validateTunnels,
} from './maze-validation';

/**
 * Maze Property-Based Tests
 * 
 * These tests validate the correctness properties of the maze system
 * using property-based testing with fast-check.
 */

// === Generators ===

/**
 * Generator for selecting one of the predefined maze layouts
 */
const mazeLayoutArb = fc.constantFrom(...MAZE_LAYOUTS);

/**
 * Generator for MazeData from predefined layouts
 */
const mazeDataArb = mazeLayoutArb.map((layout) => layoutToMazeData(layout));

/**
 * Generator for a simple valid maze with guaranteed connectivity
 * Creates a maze with walls on borders and paths inside
 */
const simpleValidMazeArb = fc
  .record({
    width: fc.integer({ min: 10, max: 28 }),
    height: fc.integer({ min: 10, max: 31 }),
  })
  .map(({ width, height }): MazeData => {
    // Create grid with walls on border, paths inside
    const grid: CellType[][] = [];
    for (let y = 0; y < height; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          // Border walls, except for tunnel positions
          if ((x === 0 || x === width - 1) && y === Math.floor(height / 2)) {
            row.push(CellType.TUNNEL);
          } else {
            row.push(CellType.WALL);
          }
        } else {
          row.push(CellType.PATH);
        }
      }
      grid.push(row);
    }

    // Add ghost house in center
    const ghCenterX = Math.floor(width / 2);
    const ghCenterY = Math.floor(height / 2);
    
    // Create 2x3 ghost house (at least 4 cells)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const y = ghCenterY + dy;
        const x = ghCenterX + dx;
        if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
          if (dy === -1 && dx === 0) {
            grid[y][x] = CellType.GHOST_DOOR;
          } else {
            grid[y][x] = CellType.GHOST_HOUSE;
          }
        }
      }
    }

    // Pac-Man spawn below ghost house
    const pacmanSpawnY = Math.min(ghCenterY + 3, height - 2);

    return {
      width,
      height,
      grid,
      pacmanSpawn: { x: ghCenterX, y: pacmanSpawnY },
      ghostSpawns: [
        { x: ghCenterX, y: ghCenterY },
        { x: ghCenterX - 1, y: ghCenterY },
        { x: ghCenterX + 1, y: ghCenterY },
        { x: ghCenterX, y: ghCenterY + 1 },
      ],
      ghostHouseCenter: { x: ghCenterX, y: ghCenterY },
      tunnels: [
        { x: 0, y: Math.floor(height / 2) },
        { x: width - 1, y: Math.floor(height / 2) },
      ],
    };
  });

// === Property Tests ===

describe('Maze Property-Based Tests', () => {
  /**
   * **Feature: pacman-clone, Property 15: Maze-Erreichbarkeit**
   * **Validates: Requirements 6.2**
   * 
   * *Für jedes* generierte oder ausgewählte Maze, sollen alle PATH-Zellen
   * von der Pac-Man-Spawn-Position aus erreichbar sein (keine isolierten Bereiche).
   */
  describe('Property 15: Maze-Erreichbarkeit', () => {
    it('all predefined mazes have full connectivity from Pac-Man spawn', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const isConnected = validateMazeConnectivity(mazeData);
          expect(isConnected).toBe(true);
        }),
        PBT_CONFIG
      );
    });

    it('generated valid mazes have full connectivity', () => {
      fc.assert(
        fc.property(simpleValidMazeArb, (mazeData: MazeData) => {
          const isConnected = validateMazeConnectivity(mazeData);
          expect(isConnected).toBe(true);
        }),
        PBT_CONFIG
      );
    });
  });


  /**
   * **Feature: pacman-clone, Property 16: Ghost-House-Existenz**
   * **Validates: Requirements 6.3**
   * 
   * *Für jedes* generierte Maze, soll ein zusammenhängender Ghost-House-Bereich
   * mit mindestens 4 Zellen existieren.
   */
  describe('Property 16: Ghost-House-Existenz', () => {
    it('all predefined mazes have valid ghost house with at least 4 cells', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const hasValidGhostHouse = validateGhostHouse(mazeData);
          expect(hasValidGhostHouse).toBe(true);
        }),
        PBT_CONFIG
      );
    });

    it('generated valid mazes have valid ghost house', () => {
      fc.assert(
        fc.property(simpleValidMazeArb, (mazeData: MazeData) => {
          const hasValidGhostHouse = validateGhostHouse(mazeData);
          expect(hasValidGhostHouse).toBe(true);
        }),
        PBT_CONFIG
      );
    });
  });

  /**
   * **Feature: pacman-clone, Property 17: Tunnel-Paar-Existenz**
   * **Validates: Requirements 6.4**
   * 
   * *Für jedes* generierte Maze, sollen mindestens zwei Tunnel-Zellen
   * an gegenüberliegenden Seiten des Mazes existieren.
   */
  describe('Property 17: Tunnel-Paar-Existenz', () => {
    it('all predefined mazes have tunnel pairs on opposite sides', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const hasValidTunnels = validateTunnels(mazeData);
          expect(hasValidTunnels).toBe(true);
        }),
        PBT_CONFIG
      );
    });

    it('generated valid mazes have tunnel pairs on opposite sides', () => {
      fc.assert(
        fc.property(simpleValidMazeArb, (mazeData: MazeData) => {
          const hasValidTunnels = validateTunnels(mazeData);
          expect(hasValidTunnels).toBe(true);
        }),
        PBT_CONFIG
      );
    });
  });
});


describe('Pellet Property-Based Tests', () => {
  /**
   * **Feature: pacman-clone, Property 7: Pellet-Platzierung-Konsistenz**
   * **Validates: Requirements 2.4**
   * 
   * *Für jedes* Maze-Layout, wenn ein Level startet, soll die Anzahl der 
   * platzierten Pellets exakt der Anzahl der PELLET- und POWER_PELLET-Zellen 
   * im Maze-Grid entsprechen.
   */
  describe('Property 7: Pellet-Platzierung-Konsistenz', () => {
    it('initial pellet count matches grid pellet cells for predefined mazes', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const maze = new Maze(mazeData);
          
          // Count pellets in grid
          let gridPelletCount = 0;
          let gridPowerPelletCount = 0;
          
          for (const row of mazeData.grid) {
            for (const cell of row) {
              if (cell === CellType.PELLET) {
                gridPelletCount++;
              } else if (cell === CellType.POWER_PELLET) {
                gridPowerPelletCount++;
              }
            }
          }
          
          // Verify maze pellet counts match grid
          expect(maze.pelletsRemaining).toBe(gridPelletCount);
          expect(maze.powerPelletsRemaining).toBe(gridPowerPelletCount);
          expect(maze.totalPellets).toBe(gridPelletCount + gridPowerPelletCount);
        }),
        PBT_CONFIG
      );
    });

    it('pellet states match grid for all positions', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const maze = new Maze(mazeData);
          
          // Check every position
          for (let y = 0; y < mazeData.height; y++) {
            for (let x = 0; x < mazeData.width; x++) {
              const cell = mazeData.grid[y][x];
              const hasPellet = maze.hasPellet({ x, y });
              const isPower = maze.isPowerPellet({ x, y });
              
              if (cell === CellType.PELLET) {
                expect(hasPellet).toBe(true);
                expect(isPower).toBe(false);
              } else if (cell === CellType.POWER_PELLET) {
                expect(hasPellet).toBe(true);
                expect(isPower).toBe(true);
              } else {
                expect(hasPellet).toBe(false);
              }
            }
          }
        }),
        PBT_CONFIG
      );
    });

    it('collecting all pellets results in level complete', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const maze = new Maze(mazeData);
          
          // Initially not complete (assuming there are pellets)
          if (maze.totalPellets > 0) {
            expect(maze.isLevelComplete()).toBe(false);
          }
          
          // Collect all pellets
          for (let y = 0; y < mazeData.height; y++) {
            for (let x = 0; x < mazeData.width; x++) {
              maze.collectPellet({ x, y });
            }
          }
          
          // Now should be complete
          expect(maze.isLevelComplete()).toBe(true);
          expect(maze.pelletsRemaining).toBe(0);
          expect(maze.powerPelletsRemaining).toBe(0);
        }),
        PBT_CONFIG
      );
    });

    it('reset restores all pellets to initial state', () => {
      fc.assert(
        fc.property(mazeDataArb, (mazeData: MazeData) => {
          const { Maze } = require('./Maze');
          const maze = new Maze(mazeData);
          
          const initialPellets = maze.pelletsRemaining;
          const initialPowerPellets = maze.powerPelletsRemaining;
          
          // Collect some pellets
          for (let y = 0; y < Math.min(5, mazeData.height); y++) {
            for (let x = 0; x < Math.min(5, mazeData.width); x++) {
              maze.collectPellet({ x, y });
            }
          }
          
          // Reset
          maze.resetPellets();
          
          // Should be back to initial state
          expect(maze.pelletsRemaining).toBe(initialPellets);
          expect(maze.powerPelletsRemaining).toBe(initialPowerPellets);
        }),
        PBT_CONFIG
      );
    });
  });
});
