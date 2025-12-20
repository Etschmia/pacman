import { describe, it } from 'vitest';
import fc from 'fast-check';
import { Ghost } from './Ghost';
import { PacMan } from './PacMan';
import { Maze } from '../maze';
import { GhostMode, GhostType, CellType } from '../types';
import type { MazeData, GridPosition } from '../types';
import { PBT_CONFIG, ghostTypeArb, directionArb } from '../test/pbt-config';
import { manhattanDistance } from '../maze/maze-utils';

/**
 * Creates a large test maze for ghost targeting tests
 * 20x20 maze with ghost house in center
 */
function createTargetingTestMaze(): Maze {
  const width = 20;
  const height = 20;
  
  const grid: CellType[][] = Array(height).fill(null).map((_, y) =>
    Array(width).fill(null).map((_, x) => {
      // Walls on edges
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return CellType.WALL;
      }
      // Ghost house in center (8-11, 8-11)
      if (x >= 8 && x <= 11 && y >= 8 && y <= 11) {
        if (y === 8 && x === 9) return CellType.GHOST_DOOR;
        return CellType.GHOST_HOUSE;
      }
      return CellType.PATH;
    })
  );

  const mazeData: MazeData = {
    width,
    height,
    grid,
    pacmanSpawn: { x: 10, y: 15 },
    ghostSpawns: [
      { x: 9, y: 9 },   // Blinky
      { x: 10, y: 9 },  // Pinky
      { x: 9, y: 10 },  // Inky
      { x: 10, y: 10 }, // Clyde
    ],
    ghostHouseCenter: { x: 9, y: 9 },
    tunnels: [],
  };
  
  return new Maze(mazeData);
}

/**
 * Generator for valid PacMan positions (within maze bounds, on PATH cells)
 */
const pacmanPositionArb = fc.record({
  x: fc.integer({ min: 1, max: 18 }),
  y: fc.integer({ min: 1, max: 18 }),
}).filter(pos => {
  // Exclude ghost house area
  if (pos.x >= 8 && pos.x <= 11 && pos.y >= 8 && pos.y <= 11) {
    return false;
  }
  return true;
});

/**
 * Generator for valid ghost positions (within maze bounds, on PATH cells)
 */
const ghostPositionArb = fc.record({
  x: fc.integer({ min: 1, max: 18 }),
  y: fc.integer({ min: 1, max: 18 }),
}).filter(pos => {
  // Exclude ghost house area for non-house mode tests
  if (pos.x >= 8 && pos.x <= 11 && pos.y >= 8 && pos.y <= 11) {
    return false;
  }
  return true;
});

/**
 * Clyde's shy distance threshold
 */
const CLYDE_SHY_DISTANCE = 8;

describe('Ghost Property-Based Tests', () => {
  /**
   * **Feature: pacman-clone, Property 8: Ghost-Targeting-Determinismus**
   * **Validates: Requirements 3.2, 3.3**
   * 
   * *Für jeden* Geist-Typ und jeden Spielzustand (Pac-Man-Position, Pac-Man-Richtung, 
   * Geist-Position), soll das berechnete Ziel deterministisch und entsprechend der 
   * Geist-Persönlichkeit sein.
   */
  describe('Property 8: Ghost-Targeting-Determinismus', () => {
    it('ghost targeting should be deterministic - same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (ghostType, pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            // Create PacMan at specified position
            const pacman = new PacMan({ maze, speed: 80 });
            // Move PacMan to position by setting spawn and resetting
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            // Create ghost at specified position
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            ghost.setMode(GhostMode.CHASE);
            
            // Get target twice - should be identical
            const target1 = ghost.getTarget(pacman);
            const target2 = ghost.getTarget(pacman);
            
            return target1.x === target2.x && target1.y === target2.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('Blinky should always target PacMan directly in CHASE mode', () => {
      fc.assert(
        fc.property(
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const blinky = new Ghost({
              type: GhostType.BLINKY,
              maze,
              spawnPosition: ghostPos,
            });
            (blinky as any)._gridPosition = { ...ghostPos };
            blinky.setMode(GhostMode.CHASE);
            
            const target = blinky.getTarget(pacman);
            const pacmanGridPos = pacman.gridPosition;
            
            // Blinky's target should be exactly PacMan's position
            return target.x === pacmanGridPos.x && target.y === pacmanGridPos.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('Pinky should target 4 tiles ahead of PacMan in CHASE mode', () => {
      fc.assert(
        fc.property(
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const pinky = new Ghost({
              type: GhostType.PINKY,
              maze,
              spawnPosition: ghostPos,
            });
            (pinky as any)._gridPosition = { ...ghostPos };
            pinky.setMode(GhostMode.CHASE);
            
            const target = pinky.getTarget(pacman);
            const expectedTarget = pacman.getPositionAhead(4);
            
            // Pinky's target should be 4 tiles ahead of PacMan
            return target.x === expectedTarget.x && target.y === expectedTarget.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('Inky should use Blinky position for complex targeting in CHASE mode', () => {
      fc.assert(
        fc.property(
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          ghostPositionArb,
          (pacmanPos, pacmanDirection, inkyPos, blinkyPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const blinky = new Ghost({
              type: GhostType.BLINKY,
              maze,
              spawnPosition: blinkyPos,
            });
            (blinky as any)._gridPosition = { ...blinkyPos };
            
            const inky = new Ghost({
              type: GhostType.INKY,
              maze,
              spawnPosition: inkyPos,
              blinkyRef: blinky,
            });
            (inky as any)._gridPosition = { ...inkyPos };
            inky.setMode(GhostMode.CHASE);
            
            const target = inky.getTarget(pacman);
            
            // Calculate expected target:
            // 1. Get position 2 tiles ahead of PacMan
            const pivotPoint = pacman.getPositionAhead(2);
            // 2. Vector from Blinky to pivot point, doubled
            const blinkyGridPos = blinky.gridPosition;
            const expectedTarget = {
              x: pivotPoint.x + (pivotPoint.x - blinkyGridPos.x),
              y: pivotPoint.y + (pivotPoint.y - blinkyGridPos.y),
            };
            
            return target.x === expectedTarget.x && target.y === expectedTarget.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('Clyde should chase when far (>= 8 tiles) and scatter when close (< 8 tiles)', () => {
      fc.assert(
        fc.property(
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const clyde = new Ghost({
              type: GhostType.CLYDE,
              maze,
              spawnPosition: ghostPos,
            });
            (clyde as any)._gridPosition = { ...ghostPos };
            clyde.setMode(GhostMode.CHASE);
            
            const target = clyde.getTarget(pacman);
            const distance = manhattanDistance(ghostPos, pacmanPos);
            const scatterTarget = clyde.getScatterTarget();
            const pacmanGridPos = pacman.gridPosition;
            
            if (distance >= CLYDE_SHY_DISTANCE) {
              // Far away: should chase directly like Blinky
              return target.x === pacmanGridPos.x && target.y === pacmanGridPos.y;
            } else {
              // Close: should retreat to scatter corner
              return target.x === scatterTarget.x && target.y === scatterTarget.y;
            }
          }
        ),
        PBT_CONFIG
      );
    });

    it('all ghosts should target scatter corners in SCATTER mode', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (ghostType, pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            ghost.setMode(GhostMode.SCATTER);
            
            const target = ghost.getTarget(pacman);
            const scatterTarget = ghost.getScatterTarget();
            
            // In SCATTER mode, all ghosts should target their scatter corner
            return target.x === scatterTarget.x && target.y === scatterTarget.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('all ghosts should target ghost house center when EATEN', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (ghostType, pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Get ghost into EATEN state
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(5000);
            ghost.onEaten();
            
            const target = ghost.getTarget(pacman);
            const ghostHouseCenter = maze.ghostHouseCenter;
            
            // When EATEN, all ghosts should target ghost house center
            return target.x === ghostHouseCenter.x && target.y === ghostHouseCenter.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('ghost targeting should be consistent across multiple calls', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          fc.integer({ min: 2, max: 10 }),
          (ghostType, pacmanPos, pacmanDirection, ghostPos, numCalls) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            ghost.setMode(GhostMode.CHASE);
            
            // Get target multiple times
            const targets: GridPosition[] = [];
            for (let i = 0; i < numCalls; i++) {
              targets.push(ghost.getTarget(pacman));
            }
            
            // All targets should be identical
            const firstTarget = targets[0];
            return targets.every(t => t.x === firstTarget.x && t.y === firstTarget.y);
          }
        ),
        PBT_CONFIG
      );
    });

    it('Inky should fall back to direct chase without Blinky reference', () => {
      fc.assert(
        fc.property(
          pacmanPositionArb,
          directionArb,
          ghostPositionArb,
          (pacmanPos, pacmanDirection, ghostPos) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            // Create Inky without Blinky reference
            const inky = new Ghost({
              type: GhostType.INKY,
              maze,
              spawnPosition: ghostPos,
              // No blinkyRef
            });
            (inky as any)._gridPosition = { ...ghostPos };
            inky.setMode(GhostMode.CHASE);
            
            const target = inky.getTarget(pacman);
            const pacmanGridPos = pacman.gridPosition;
            
            // Without Blinky reference, Inky should fall back to direct chase
            return target.x === pacmanGridPos.x && target.y === pacmanGridPos.y;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  /**
   * **Feature: pacman-clone, Property 9: Frightened-Mode-Broadcast**
   * **Validates: Requirements 3.4**
   * 
   * *Für jeden* Spielzustand mit aktiven Geistern, wenn ein Power-Pellet gesammelt wird, 
   * sollen alle Geister (außer bereits gefressene) in den FRIGHTENED-Modus wechseln.
   */
  describe('Property 9: Frightened-Mode-Broadcast', () => {
    /**
     * Generator for ghost initial modes (excluding EATEN since eaten ghosts don't get frightened)
     */
    const nonEatenModeArb = fc.constantFrom(
      GhostMode.CHASE,
      GhostMode.SCATTER
    );

    /**
     * Generator for frightened duration (realistic game values)
     */
    const frightenedDurationArb = fc.integer({ min: 1000, max: 10000 });

    it('all non-eaten ghosts should enter FRIGHTENED mode when power pellet is collected', () => {
      fc.assert(
        fc.property(
          fc.array(nonEatenModeArb, { minLength: 4, maxLength: 4 }),
          frightenedDurationArb,
          (initialModes, duration) => {
            const maze = createTargetingTestMaze();
            
            // Create all four ghosts with different initial modes
            const ghosts = [
              new Ghost({ type: GhostType.BLINKY, maze, spawnPosition: { x: 1, y: 1 } }),
              new Ghost({ type: GhostType.PINKY, maze, spawnPosition: { x: 2, y: 1 } }),
              new Ghost({ type: GhostType.INKY, maze, spawnPosition: { x: 1, y: 2 } }),
              new Ghost({ type: GhostType.CLYDE, maze, spawnPosition: { x: 2, y: 2 } }),
            ];
            
            // Set initial modes (move out of HOUSE first)
            ghosts.forEach((ghost, i) => {
              ghost.setMode(initialModes[i]);
            });
            
            // Simulate power pellet collection - broadcast frightened mode to all ghosts
            ghosts.forEach(ghost => {
              ghost.enterFrightenedMode(duration);
            });
            
            // All ghosts should now be in FRIGHTENED mode
            return ghosts.every(ghost => ghost.mode === GhostMode.FRIGHTENED);
          }
        ),
        PBT_CONFIG
      );
    });

    it('eaten ghosts should NOT enter FRIGHTENED mode when power pellet is collected', () => {
      fc.assert(
        fc.property(
          frightenedDurationArb,
          fc.integer({ min: 0, max: 3 }), // Index of ghost to be eaten
          (duration, eatenGhostIndex) => {
            const maze = createTargetingTestMaze();
            
            // Create all four ghosts
            const ghosts = [
              new Ghost({ type: GhostType.BLINKY, maze, spawnPosition: { x: 1, y: 1 } }),
              new Ghost({ type: GhostType.PINKY, maze, spawnPosition: { x: 2, y: 1 } }),
              new Ghost({ type: GhostType.INKY, maze, spawnPosition: { x: 1, y: 2 } }),
              new Ghost({ type: GhostType.CLYDE, maze, spawnPosition: { x: 2, y: 2 } }),
            ];
            
            // Set all ghosts to SCATTER mode first
            ghosts.forEach(ghost => ghost.setMode(GhostMode.SCATTER));
            
            // Make one ghost eaten (first frighten it, then eat it)
            ghosts[eatenGhostIndex].enterFrightenedMode(5000);
            ghosts[eatenGhostIndex].onEaten();
            
            // Now simulate another power pellet collection
            ghosts.forEach(ghost => {
              ghost.enterFrightenedMode(duration);
            });
            
            // The eaten ghost should still be EATEN, others should be FRIGHTENED
            return ghosts.every((ghost, i) => {
              if (i === eatenGhostIndex) {
                return ghost.mode === GhostMode.EATEN;
              }
              return ghost.mode === GhostMode.FRIGHTENED;
            });
          }
        ),
        PBT_CONFIG
      );
    });

    it('ghosts in HOUSE mode should NOT enter FRIGHTENED mode', () => {
      fc.assert(
        fc.property(
          frightenedDurationArb,
          fc.integer({ min: 0, max: 3 }), // Index of ghost to keep in house
          (duration, houseGhostIndex) => {
            const maze = createTargetingTestMaze();
            
            // Create all four ghosts
            const ghosts = [
              new Ghost({ type: GhostType.BLINKY, maze, spawnPosition: { x: 9, y: 9 } }),
              new Ghost({ type: GhostType.PINKY, maze, spawnPosition: { x: 10, y: 9 } }),
              new Ghost({ type: GhostType.INKY, maze, spawnPosition: { x: 9, y: 10 } }),
              new Ghost({ type: GhostType.CLYDE, maze, spawnPosition: { x: 10, y: 10 } }),
            ];
            
            // Release all ghosts except one
            ghosts.forEach((ghost, i) => {
              if (i !== houseGhostIndex) {
                ghost.setMode(GhostMode.SCATTER);
              }
              // Ghost at houseGhostIndex stays in HOUSE mode (default)
            });
            
            // Simulate power pellet collection
            ghosts.forEach(ghost => {
              ghost.enterFrightenedMode(duration);
            });
            
            // The house ghost should still be in HOUSE, others should be FRIGHTENED
            return ghosts.every((ghost, i) => {
              if (i === houseGhostIndex) {
                return ghost.mode === GhostMode.HOUSE;
              }
              return ghost.mode === GhostMode.FRIGHTENED;
            });
          }
        ),
        PBT_CONFIG
      );
    });

    it('frightened mode duration should be set correctly for all affected ghosts', () => {
      fc.assert(
        fc.property(
          frightenedDurationArb,
          (duration) => {
            const maze = createTargetingTestMaze();
            
            // Create all four ghosts
            const ghosts = [
              new Ghost({ type: GhostType.BLINKY, maze, spawnPosition: { x: 1, y: 1 } }),
              new Ghost({ type: GhostType.PINKY, maze, spawnPosition: { x: 2, y: 1 } }),
              new Ghost({ type: GhostType.INKY, maze, spawnPosition: { x: 1, y: 2 } }),
              new Ghost({ type: GhostType.CLYDE, maze, spawnPosition: { x: 2, y: 2 } }),
            ];
            
            // Set all ghosts to SCATTER mode
            ghosts.forEach(ghost => ghost.setMode(GhostMode.SCATTER));
            
            // Simulate power pellet collection
            ghosts.forEach(ghost => {
              ghost.enterFrightenedMode(duration);
            });
            
            // All ghosts should have the same frightened duration
            return ghosts.every(ghost => ghost.getFrightenedTimeRemaining() === duration);
          }
        ),
        PBT_CONFIG
      );
    });

    it('multiple power pellet collections should reset frightened duration', () => {
      fc.assert(
        fc.property(
          frightenedDurationArb,
          frightenedDurationArb,
          fc.integer({ min: 100, max: 1000 }), // Time elapsed between collections
          (duration1, duration2, elapsedTime) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: GhostType.BLINKY,
              maze,
              spawnPosition: { x: 1, y: 1 },
            });
            ghost.setMode(GhostMode.SCATTER);
            
            // First power pellet
            ghost.enterFrightenedMode(duration1);
            
            // Simulate some time passing
            ghost.update(elapsedTime);
            
            // Second power pellet should reset duration
            ghost.enterFrightenedMode(duration2);
            
            // Duration should be the new duration (not accumulated)
            return ghost.getFrightenedTimeRemaining() === duration2;
          }
        ),
        PBT_CONFIG
      );
    });

    it('frightened mode broadcast should be idempotent for already frightened ghosts', () => {
      fc.assert(
        fc.property(
          frightenedDurationArb,
          fc.integer({ min: 2, max: 5 }), // Number of broadcasts
          (duration, numBroadcasts) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: GhostType.BLINKY,
              maze,
              spawnPosition: { x: 1, y: 1 },
            });
            ghost.setMode(GhostMode.SCATTER);
            
            // Multiple broadcasts with same duration
            for (let i = 0; i < numBroadcasts; i++) {
              ghost.enterFrightenedMode(duration);
            }
            
            // Ghost should still be frightened with correct duration
            return ghost.mode === GhostMode.FRIGHTENED && 
                   ghost.getFrightenedTimeRemaining() === duration;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  /**
   * **Feature: pacman-clone, Property 10: Ghost-Eating-Zustandsübergang**
   * **Validates: Requirements 3.5, 3.6**
   * 
   * *Für jeden* Geist im FRIGHTENED-Zustand, wenn Pac-Man ihn berührt, soll der Geist 
   * in den EATEN-Zustand wechseln und zum Ghost House navigieren.
   */
  describe('Property 10: Ghost-Eating-Zustandsübergang', () => {
    /**
     * Generator for frightened duration (realistic game values)
     */
    const frightenedDurationArb = fc.integer({ min: 1000, max: 10000 });

    it('frightened ghost should transition to EATEN when onEaten is called', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          frightenedDurationArb,
          (ghostType, ghostPos, duration) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration);
            
            // Verify ghost is frightened
            if (ghost.mode !== GhostMode.FRIGHTENED) {
              return false;
            }
            
            // Simulate Pac-Man eating the ghost
            ghost.onEaten();
            
            // Ghost should now be in EATEN mode
            return ghost.mode === GhostMode.EATEN;
          }
        ),
        PBT_CONFIG
      );
    });

    it('eaten ghost should target ghost house center', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          pacmanPositionArb,
          directionArb,
          frightenedDurationArb,
          (ghostType, ghostPos, pacmanPos, pacmanDirection, duration) => {
            const maze = createTargetingTestMaze();
            
            const pacman = new PacMan({ maze, speed: 80 });
            (pacman as any)._gridPosition = { ...pacmanPos };
            pacman.move(pacmanDirection);
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode and then eat it
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration);
            ghost.onEaten();
            
            // Get target - should be ghost house center
            const target = ghost.getTarget(pacman);
            const ghostHouseCenter = maze.ghostHouseCenter;
            
            return target.x === ghostHouseCenter.x && target.y === ghostHouseCenter.y;
          }
        ),
        PBT_CONFIG
      );
    });

    it('non-frightened ghost should NOT transition to EATEN when onEaten is called', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          fc.constantFrom(GhostMode.CHASE, GhostMode.SCATTER),
          (ghostType, ghostPos, initialMode) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in non-frightened mode
            ghost.setMode(initialMode);
            
            // Try to eat the ghost (should have no effect)
            ghost.onEaten();
            
            // Ghost should still be in original mode
            return ghost.mode === initialMode;
          }
        ),
        PBT_CONFIG
      );
    });

    it('eaten ghost should clear frightened timer', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          frightenedDurationArb,
          (ghostType, ghostPos, duration) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration);
            
            // Verify frightened timer is set
            if (ghost.getFrightenedTimeRemaining() !== duration) {
              return false;
            }
            
            // Eat the ghost
            ghost.onEaten();
            
            // Frightened timer should be cleared
            return ghost.getFrightenedTimeRemaining() === 0;
          }
        ),
        PBT_CONFIG
      );
    });

    it('eaten ghost should NOT be affected by new frightened mode broadcasts', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          frightenedDurationArb,
          frightenedDurationArb,
          (ghostType, ghostPos, duration1, duration2) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode and eat it
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration1);
            ghost.onEaten();
            
            // Try to frighten the eaten ghost again
            ghost.enterFrightenedMode(duration2);
            
            // Ghost should still be EATEN
            return ghost.mode === GhostMode.EATEN;
          }
        ),
        PBT_CONFIG
      );
    });

    it('eaten ghost should have double speed modifier', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          frightenedDurationArb,
          (ghostType, ghostPos, duration) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode and eat it
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration);
            ghost.onEaten();
            
            // Access private method via any cast to verify speed modifier
            const speedModifier = (ghost as any).getSpeedModifier();
            
            // Eaten ghosts should have 2x speed
            return speedModifier === 2.0;
          }
        ),
        PBT_CONFIG
      );
    });

    it('all ghost types should follow same eating state transition', () => {
      fc.assert(
        fc.property(
          ghostPositionArb,
          frightenedDurationArb,
          (ghostPos, duration) => {
            const maze = createTargetingTestMaze();
            const ghostTypes = [GhostType.BLINKY, GhostType.PINKY, GhostType.INKY, GhostType.CLYDE];
            
            const results = ghostTypes.map(ghostType => {
              const ghost = new Ghost({
                type: ghostType,
                maze,
                spawnPosition: ghostPos,
              });
              (ghost as any)._gridPosition = { ...ghostPos };
              
              // Put ghost in FRIGHTENED mode
              ghost.setMode(GhostMode.SCATTER);
              ghost.enterFrightenedMode(duration);
              
              // Eat the ghost
              ghost.onEaten();
              
              return {
                mode: ghost.mode,
                frightenedTime: ghost.getFrightenedTimeRemaining(),
                isEaten: ghost.isEaten(),
              };
            });
            
            // All ghosts should have same state after being eaten
            return results.every(r => 
              r.mode === GhostMode.EATEN && 
              r.frightenedTime === 0 && 
              r.isEaten === true
            );
          }
        ),
        PBT_CONFIG
      );
    });

    it('eating ghost should be idempotent - multiple onEaten calls have same effect', () => {
      fc.assert(
        fc.property(
          ghostTypeArb,
          ghostPositionArb,
          frightenedDurationArb,
          fc.integer({ min: 2, max: 5 }),
          (ghostType, ghostPos, duration, numCalls) => {
            const maze = createTargetingTestMaze();
            
            const ghost = new Ghost({
              type: ghostType,
              maze,
              spawnPosition: ghostPos,
            });
            (ghost as any)._gridPosition = { ...ghostPos };
            
            // Put ghost in FRIGHTENED mode
            ghost.setMode(GhostMode.SCATTER);
            ghost.enterFrightenedMode(duration);
            
            // Call onEaten multiple times
            for (let i = 0; i < numCalls; i++) {
              ghost.onEaten();
            }
            
            // Ghost should be in EATEN mode with cleared timer
            return ghost.mode === GhostMode.EATEN && 
                   ghost.getFrightenedTimeRemaining() === 0;
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
