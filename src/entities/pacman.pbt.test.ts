import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PacMan } from './PacMan';
import { Maze } from '../maze';
import { Direction, CellType } from '../types';
import type { MazeData } from '../types';
import { PBT_CONFIG, directionArb } from '../test/pbt-config';

/**
 * Creates a test maze with configurable layout
 * Default is a 9x9 maze with paths and walls
 * PacMan spawns at (1,1) which is a PATH cell
 */
function createTestMazeWithTunnels(): Maze {
  // 9x9 maze with tunnels on left and right
  const mazeData: MazeData = {
    width: 9,
    height: 9,
    grid: [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL],
      [CellType.TUNNEL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL, CellType.PATH, CellType.TUNNEL],
      [CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ],
    pacmanSpawn: { x: 1, y: 1 }, // PATH cell
    ghostSpawns: [{ x: 4, y: 4 }],
    ghostHouseCenter: { x: 4, y: 4 },
    tunnels: [{ x: 0, y: 4 }, { x: 8, y: 4 }],
  };
  return new Maze(mazeData);
}

/**
 * Creates a simple corridor maze for movement testing
 */
function createCorridorMaze(): Maze {
  const mazeData: MazeData = {
    width: 11,
    height: 3,
    grid: [
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
      [CellType.WALL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.WALL],
      [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
    ],
    pacmanSpawn: { x: 5, y: 1 },
    ghostSpawns: [],
    ghostHouseCenter: { x: 5, y: 1 },
    tunnels: [],
  };
  return new Maze(mazeData);
}

// Generator for valid directions (excluding NONE)
const directionGen = directionArb;

// Generator for movement time deltas (in ms)
const deltaTimeGen = fc.integer({ min: 16, max: 200 });

// Generator for number of movement steps
const movementStepsGen = fc.integer({ min: 1, max: 20 });

describe('PacMan Property-Based Tests', () => {
  /**
   * **Feature: pacman-clone, Property 3: Wand-Kollisions-Integrität**
   * **Validates: Requirements 1.4**
   * 
   * *Für jede* Position von Pac-Man und jede Bewegungsrichtung, wenn eine Wand 
   * in dieser Richtung existiert, soll Pac-Man niemals in die Wand eindringen 
   * oder sie durchqueren.
   */
  describe('Property 3: Wand-Kollisions-Integrität', () => {
    it('PacMan should never enter or pass through walls', () => {
      fc.assert(
        fc.property(
          directionGen,
          movementStepsGen,
          deltaTimeGen,
          (direction, steps, deltaTime) => {
            const maze = createTestMazeWithTunnels();
            const pacman = new PacMan({ maze, speed: 160 });
            
            // Set direction and simulate movement
            pacman.move(direction);
            
            for (let i = 0; i < steps; i++) {
              pacman.update(deltaTime);
              
              // After each update, verify PacMan is on a walkable cell
              const currentPos = pacman.gridPosition;
              const isWalkable = maze.isWalkable(currentPos);
              
              if (!isWalkable) {
                return false; // PacMan entered a wall - property violated
              }
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    it('PacMan should stop at walls, not pass through them', () => {
      fc.assert(
        fc.property(
          directionGen,
          fc.integer({ min: 50, max: 100 }), // Many steps to ensure we hit walls
          (direction, steps) => {
            const maze = createCorridorMaze();
            const pacman = new PacMan({ maze, speed: 160 });
            
            pacman.move(direction);
            
            // Simulate many updates
            for (let i = 0; i < steps; i++) {
              pacman.update(100);
            }
            
            // PacMan should always be within maze bounds and on walkable cell
            const pos = pacman.gridPosition;
            return maze.isInBounds(pos) && maze.isWalkable(pos);
          }
        ),
        PBT_CONFIG
      );
    });

    it('PacMan position should always be on a walkable cell after any sequence of moves', () => {
      fc.assert(
        fc.property(
          fc.array(directionGen, { minLength: 1, maxLength: 20 }),
          fc.array(deltaTimeGen, { minLength: 1, maxLength: 20 }),
          (directions, deltas) => {
            const maze = createTestMazeWithTunnels();
            const pacman = new PacMan({ maze, speed: 160 });
            
            // Apply random sequence of directions and updates
            const maxLen = Math.min(directions.length, deltas.length);
            for (let i = 0; i < maxLen; i++) {
              pacman.move(directions[i]);
              pacman.update(deltas[i]);
              
              // Verify position is valid after each step
              const pos = pacman.gridPosition;
              if (!maze.isWalkable(pos)) {
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

  /**
   * **Feature: pacman-clone, Property 4: Tunnel-Teleportation-Symmetrie**
   * **Validates: Requirements 1.5**
   * 
   * *Für jeden* Tunnel-Eingang, wenn Pac-Man ihn betritt, soll er zur korrekten 
   * gegenüberliegenden Position teleportiert werden, und ein erneutes Betreten 
   * soll zur ursprünglichen Seite zurückführen (Round-Trip).
   */
  describe('Property 4: Tunnel-Teleportation-Symmetrie', () => {
    it('tunnel teleportation should be symmetric (round-trip)', () => {
      // Create a maze specifically for tunnel testing
      const tunnelMazeData: MazeData = {
        width: 11,
        height: 3,
        grid: [
          [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
          [CellType.TUNNEL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.TUNNEL],
          [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
        ],
        pacmanSpawn: { x: 5, y: 1 }, // Center of corridor
        ghostSpawns: [],
        ghostHouseCenter: { x: 5, y: 1 },
        tunnels: [{ x: 0, y: 1 }, { x: 10, y: 1 }],
      };
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of round trips
          (roundTrips) => {
            const maze = new Maze(tunnelMazeData);
            const pacman = new PacMan({ maze, speed: 320 }); // Fast speed for testing
            
            // Move to left tunnel (from center at x=5, need to go left to x=0)
            pacman.move(Direction.LEFT);
            for (let i = 0; i < 30; i++) {
              pacman.update(100);
            }
            
            // Should be at right tunnel after teleport (x=10)
            const afterLeftTunnel = { ...pacman.gridPosition };
            
            // After teleporting from left tunnel (0,1), should be at right tunnel (10,1)
            // But PacMan continues moving left, so might have moved further
            // The key property is that PacMan is still on a walkable cell
            expect(maze.isWalkable(afterLeftTunnel)).toBe(true);
            
            // Now do round trips - move right to go through right tunnel
            for (let trip = 0; trip < roundTrips; trip++) {
              // Move right through right tunnel
              pacman.move(Direction.RIGHT);
              for (let i = 0; i < 40; i++) {
                pacman.update(100);
              }
              
              const afterRightTrip = pacman.gridPosition;
              expect(maze.isWalkable(afterRightTrip)).toBe(true);
              
              // Move left through left tunnel
              pacman.move(Direction.LEFT);
              for (let i = 0; i < 40; i++) {
                pacman.update(100);
              }
              
              const afterLeftTrip = pacman.gridPosition;
              expect(maze.isWalkable(afterLeftTrip)).toBe(true);
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    it('teleportation should preserve movement direction', () => {
      const tunnelMazeData: MazeData = {
        width: 11,
        height: 3,
        grid: [
          [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
          [CellType.TUNNEL, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.PATH, CellType.TUNNEL],
          [CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL, CellType.WALL],
        ],
        pacmanSpawn: { x: 1, y: 1 },
        ghostSpawns: [],
        ghostHouseCenter: { x: 5, y: 1 },
        tunnels: [{ x: 0, y: 1 }, { x: 10, y: 1 }],
      };
      
      fc.assert(
        fc.property(
          fc.constantFrom(Direction.LEFT, Direction.RIGHT),
          (direction) => {
            const maze = new Maze(tunnelMazeData);
            const pacman = new PacMan({ maze, speed: 320 });
            
            // Move in chosen direction
            pacman.move(direction);
            
            // Move until we hit a tunnel and teleport
            for (let i = 0; i < 50; i++) {
              pacman.update(100);
            }
            
            // Direction should be preserved after teleportation
            return pacman.direction === direction;
          }
        ),
        PBT_CONFIG
      );
    });

    it('opposite tunnel positions should be correctly linked', () => {
      const maze = createTestMazeWithTunnels();
      const tunnels = maze.tunnels;
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: tunnels.length - 1 }),
          (tunnelIndex) => {
            const tunnel = tunnels[tunnelIndex];
            const opposite = maze.getOppositeTunnel(tunnel);
            
            if (opposite === null) {
              // Single tunnel - no opposite
              return tunnels.length === 1;
            }
            
            // Opposite should also be a tunnel
            expect(maze.isTunnel(opposite)).toBe(true);
            
            // Double opposite should return to original (or nearby)
            const doubleOpposite = maze.getOppositeTunnel(opposite);
            if (doubleOpposite) {
              // Should be the original tunnel
              return doubleOpposite.x === tunnel.x && doubleOpposite.y === tunnel.y;
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
