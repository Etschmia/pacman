import { describe, it, expect, beforeEach } from 'vitest';
import { Ghost, GhostConfig } from './Ghost';
import { Maze } from '../maze';
import { Direction, GhostMode, GhostType, CellType } from '../types';
import type { MazeData, GridPosition } from '../types';

// Simple test maze with ghost house
const createTestMazeData = (): MazeData => ({
  width: 10,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 4, 5, 4, 0, 0, 1, 0], // Ghost house with door
    [0, 1, 0, 4, 4, 4, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  pacmanSpawn: { x: 1, y: 8 },
  ghostSpawns: [
    { x: 4, y: 4 }, // Blinky
    { x: 3, y: 4 }, // Pinky
    { x: 5, y: 4 }, // Inky
    { x: 4, y: 3 }, // Clyde
  ],
  ghostHouseCenter: { x: 4, y: 4 },
  tunnels: [],
});

describe('Ghost', () => {
  let maze: Maze;
  let ghost: Ghost;

  beforeEach(() => {
    maze = new Maze(createTestMazeData());
    ghost = new Ghost({
      type: GhostType.BLINKY,
      maze,
      spawnPosition: { x: 4, y: 4 },
      speed: 75,
    });
  });

  describe('initialization', () => {
    it('should initialize at spawn position', () => {
      expect(ghost.gridPosition).toEqual({ x: 4, y: 4 });
    });

    it('should start in HOUSE mode', () => {
      expect(ghost.mode).toBe(GhostMode.HOUSE);
    });

    it('should have correct ghost type', () => {
      expect(ghost.type).toBe(GhostType.BLINKY);
    });

    it('should have correct initial speed', () => {
      expect(ghost.speed).toBe(75);
    });

    it('should start with no direction', () => {
      expect(ghost.direction).toBe(Direction.NONE);
    });
  });

  describe('state machine', () => {
    describe('setMode', () => {
      it('should change mode from HOUSE to SCATTER', () => {
        ghost.setMode(GhostMode.SCATTER);
        expect(ghost.mode).toBe(GhostMode.SCATTER);
      });

      it('should change mode from HOUSE to CHASE', () => {
        ghost.setMode(GhostMode.CHASE);
        expect(ghost.mode).toBe(GhostMode.CHASE);
      });

      it('should not change to FRIGHTENED from HOUSE', () => {
        ghost.setMode(GhostMode.FRIGHTENED);
        expect(ghost.mode).toBe(GhostMode.HOUSE);
      });

      it('should not change mode when EATEN (except to HOUSE)', () => {
        // First get ghost out of house and into frightened mode
        ghost.setMode(GhostMode.SCATTER);
        ghost.enterFrightenedMode(5000);
        ghost.onEaten();
        expect(ghost.mode).toBe(GhostMode.EATEN);
        
        // Try to change to other modes
        ghost.setMode(GhostMode.CHASE);
        expect(ghost.mode).toBe(GhostMode.EATEN);
        
        ghost.setMode(GhostMode.SCATTER);
        expect(ghost.mode).toBe(GhostMode.EATEN);
      });
    });

    describe('enterFrightenedMode', () => {
      it('should enter frightened mode with duration', () => {
        ghost.setMode(GhostMode.SCATTER);
        ghost.enterFrightenedMode(5000);
        expect(ghost.mode).toBe(GhostMode.FRIGHTENED);
        expect(ghost.getFrightenedTimeRemaining()).toBe(5000);
      });

      it('should not enter frightened mode from HOUSE', () => {
        ghost.enterFrightenedMode(5000);
        expect(ghost.mode).toBe(GhostMode.HOUSE);
      });

      it('should not enter frightened mode when EATEN', () => {
        ghost.setMode(GhostMode.SCATTER);
        ghost.enterFrightenedMode(5000);
        ghost.onEaten();
        ghost.enterFrightenedMode(5000);
        expect(ghost.mode).toBe(GhostMode.EATEN);
      });
    });

    describe('onEaten', () => {
      it('should transition to EATEN mode when frightened', () => {
        ghost.setMode(GhostMode.SCATTER);
        ghost.enterFrightenedMode(5000);
        ghost.onEaten();
        expect(ghost.mode).toBe(GhostMode.EATEN);
      });

      it('should not transition to EATEN when not frightened', () => {
        ghost.setMode(GhostMode.CHASE);
        ghost.onEaten();
        expect(ghost.mode).toBe(GhostMode.CHASE);
      });

      it('should clear frightened time when eaten', () => {
        ghost.setMode(GhostMode.SCATTER);
        ghost.enterFrightenedMode(5000);
        ghost.onEaten();
        expect(ghost.getFrightenedTimeRemaining()).toBe(0);
      });
    });
  });

  describe('helper methods', () => {
    it('isFrightened should return true when in FRIGHTENED mode', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.enterFrightenedMode(5000);
      expect(ghost.isFrightened()).toBe(true);
    });

    it('isEaten should return true when in EATEN mode', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.enterFrightenedMode(5000);
      ghost.onEaten();
      expect(ghost.isEaten()).toBe(true);
    });

    it('isInHouse should return true when in HOUSE mode', () => {
      expect(ghost.isInHouse()).toBe(true);
    });

    it('isAtPosition should correctly check position', () => {
      expect(ghost.isAtPosition({ x: 4, y: 4 })).toBe(true);
      expect(ghost.isAtPosition({ x: 0, y: 0 })).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to spawn position', () => {
      ghost.setMode(GhostMode.SCATTER);
      // Simulate some movement
      ghost.update(100);
      ghost.reset();
      expect(ghost.gridPosition).toEqual({ x: 4, y: 4 });
    });

    it('should reset to HOUSE mode', () => {
      ghost.setMode(GhostMode.CHASE);
      ghost.reset();
      expect(ghost.mode).toBe(GhostMode.HOUSE);
    });

    it('should reset direction to NONE', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.update(100);
      ghost.reset();
      expect(ghost.direction).toBe(Direction.NONE);
    });

    it('should reset frightened state', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.enterFrightenedMode(5000);
      ghost.reset();
      expect(ghost.isFrightened()).toBe(false);
      expect(ghost.getFrightenedTimeRemaining()).toBe(0);
    });
  });

  describe('ghost types', () => {
    it('should create Blinky ghost', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 4, y: 4 },
      });
      expect(blinky.type).toBe(GhostType.BLINKY);
    });

    it('should create Pinky ghost', () => {
      const pinky = new Ghost({
        type: GhostType.PINKY,
        maze,
        spawnPosition: { x: 3, y: 4 },
      });
      expect(pinky.type).toBe(GhostType.PINKY);
    });

    it('should create Inky ghost', () => {
      const inky = new Ghost({
        type: GhostType.INKY,
        maze,
        spawnPosition: { x: 5, y: 4 },
      });
      expect(inky.type).toBe(GhostType.INKY);
    });

    it('should create Clyde ghost', () => {
      const clyde = new Ghost({
        type: GhostType.CLYDE,
        maze,
        spawnPosition: { x: 4, y: 3 },
      });
      expect(clyde.type).toBe(GhostType.CLYDE);
    });
  });

  describe('frightened mode timing', () => {
    it('should start blinking when 2 seconds remain', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.enterFrightenedMode(3000);
      
      // Update to reduce time to below 2 seconds
      ghost.update(1500);
      expect(ghost.isBlinking()).toBe(true);
    });

    it('should exit frightened mode when time expires', () => {
      ghost.setMode(GhostMode.SCATTER);
      ghost.enterFrightenedMode(1000);
      
      // Update past the duration
      ghost.update(1500);
      expect(ghost.mode).toBe(GhostMode.CHASE);
    });
  });

  describe('speed modifiers', () => {
    it('should have normal speed in CHASE mode', () => {
      ghost.setMode(GhostMode.CHASE);
      expect(ghost.speed).toBe(75);
    });

    it('should have normal speed in SCATTER mode', () => {
      ghost.setMode(GhostMode.SCATTER);
      expect(ghost.speed).toBe(75);
    });

    it('should allow speed to be set', () => {
      ghost.speed = 100;
      expect(ghost.speed).toBe(100);
    });

    it('should not allow negative speed', () => {
      ghost.speed = -50;
      expect(ghost.speed).toBe(0);
    });
  });

  describe('release delay', () => {
    it('Blinky should have immediate release', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 4, y: 4 },
      });
      // Blinky should exit house immediately
      blinky.update(100);
      expect(blinky.mode).not.toBe(GhostMode.HOUSE);
    });

    it('Pinky should have 2 second release delay', () => {
      const pinky = new Ghost({
        type: GhostType.PINKY,
        maze,
        spawnPosition: { x: 3, y: 4 },
      });
      // After 1 second, still in house
      pinky.update(1000);
      expect(pinky.mode).toBe(GhostMode.HOUSE);
      
      // After 2+ seconds, should be released
      pinky.update(1500);
      expect(pinky.mode).not.toBe(GhostMode.HOUSE);
    });

    it('should allow custom release delay', () => {
      ghost.setReleaseDelay(500);
      ghost.reset();
      ghost.setReleaseDelay(500);
      
      ghost.update(400);
      expect(ghost.mode).toBe(GhostMode.HOUSE);
      
      ghost.update(200);
      expect(ghost.mode).not.toBe(GhostMode.HOUSE);
    });
  });
});

// Import PacMan for targeting tests
import { PacMan } from './PacMan';

describe('Ghost Targeting Algorithms', () => {
  let maze: Maze;
  let pacman: PacMan;

  // Larger maze for targeting tests
  const createTargetingMazeData = (): MazeData => ({
    width: 20,
    height: 20,
    grid: Array(20).fill(null).map((_, y) =>
      Array(20).fill(null).map((_, x) => {
        // Walls on edges
        if (x === 0 || x === 19 || y === 0 || y === 19) return CellType.WALL;
        // Ghost house in center
        if (x >= 8 && x <= 11 && y >= 8 && y <= 11) {
          if (y === 8 && x === 9) return CellType.GHOST_DOOR;
          return CellType.GHOST_HOUSE;
        }
        return CellType.PATH;
      })
    ),
    pacmanSpawn: { x: 10, y: 15 },
    ghostSpawns: [
      { x: 9, y: 9 },   // Blinky
      { x: 10, y: 9 },  // Pinky
      { x: 9, y: 10 },  // Inky
      { x: 10, y: 10 }, // Clyde
    ],
    ghostHouseCenter: { x: 9, y: 9 },
    tunnels: [],
  });

  beforeEach(() => {
    maze = new Maze(createTargetingMazeData());
    pacman = new PacMan({ maze, speed: 80 });
  });

  describe('Blinky targeting (direct chase)', () => {
    it('should target Pac-Man directly in CHASE mode', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 9, y: 9 },
      });
      blinky.setMode(GhostMode.CHASE);
      
      const target = blinky.getTarget(pacman);
      expect(target).toEqual(pacman.gridPosition);
    });

    it('should target scatter corner in SCATTER mode', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 9, y: 9 },
      });
      blinky.setMode(GhostMode.SCATTER);
      
      const target = blinky.getTarget(pacman);
      expect(target).toEqual(blinky.getScatterTarget());
    });
  });

  describe('Pinky targeting (ambush)', () => {
    it('should target 4 tiles ahead of Pac-Man in CHASE mode', () => {
      const pinky = new Ghost({
        type: GhostType.PINKY,
        maze,
        spawnPosition: { x: 10, y: 9 },
      });
      pinky.setMode(GhostMode.CHASE);
      
      // Move Pac-Man right
      pacman.move(Direction.RIGHT);
      
      const target = pinky.getTarget(pacman);
      const expectedTarget = pacman.getPositionAhead(4);
      expect(target).toEqual(expectedTarget);
    });

    it('should target scatter corner in SCATTER mode', () => {
      const pinky = new Ghost({
        type: GhostType.PINKY,
        maze,
        spawnPosition: { x: 10, y: 9 },
      });
      pinky.setMode(GhostMode.SCATTER);
      
      const target = pinky.getTarget(pacman);
      expect(target).toEqual(pinky.getScatterTarget());
    });
  });

  describe('Inky targeting (complex flanking)', () => {
    it('should use Blinky position for targeting in CHASE mode', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 5, y: 5 },
      });
      
      const inky = new Ghost({
        type: GhostType.INKY,
        maze,
        spawnPosition: { x: 9, y: 10 },
        blinkyRef: blinky,
      });
      inky.setMode(GhostMode.CHASE);
      
      // Move Pac-Man right
      pacman.move(Direction.RIGHT);
      
      const target = inky.getTarget(pacman);
      
      // Calculate expected target:
      // 1. Get position 2 tiles ahead of Pac-Man
      const pivotPoint = pacman.getPositionAhead(2);
      // 2. Vector from Blinky to pivot point, doubled
      const blinkyPos = blinky.gridPosition;
      const expectedTarget = {
        x: pivotPoint.x + (pivotPoint.x - blinkyPos.x),
        y: pivotPoint.y + (pivotPoint.y - blinkyPos.y),
      };
      
      expect(target).toEqual(expectedTarget);
    });

    it('should fall back to direct chase without Blinky reference', () => {
      const inky = new Ghost({
        type: GhostType.INKY,
        maze,
        spawnPosition: { x: 9, y: 10 },
        // No blinkyRef
      });
      inky.setMode(GhostMode.CHASE);
      
      const target = inky.getTarget(pacman);
      expect(target).toEqual(pacman.gridPosition);
    });

    it('should allow setting Blinky reference after creation', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 5, y: 5 },
      });
      
      const inky = new Ghost({
        type: GhostType.INKY,
        maze,
        spawnPosition: { x: 9, y: 10 },
      });
      
      // Initially falls back to direct chase
      inky.setMode(GhostMode.CHASE);
      expect(inky.getTarget(pacman)).toEqual(pacman.gridPosition);
      
      // Set Blinky reference
      inky.setBlinkyRef(blinky);
      
      // Now uses complex targeting
      pacman.move(Direction.RIGHT);
      const target = inky.getTarget(pacman);
      const pivotPoint = pacman.getPositionAhead(2);
      const blinkyPos = blinky.gridPosition;
      const expectedTarget = {
        x: pivotPoint.x + (pivotPoint.x - blinkyPos.x),
        y: pivotPoint.y + (pivotPoint.y - blinkyPos.y),
      };
      expect(target).toEqual(expectedTarget);
    });
  });

  describe('Clyde targeting (shy behavior)', () => {
    it('should chase directly when far from Pac-Man (>= 8 tiles)', () => {
      const clyde = new Ghost({
        type: GhostType.CLYDE,
        maze,
        spawnPosition: { x: 1, y: 1 }, // Far from Pac-Man at (10, 15)
      });
      clyde.setMode(GhostMode.CHASE);
      
      const target = clyde.getTarget(pacman);
      expect(target).toEqual(pacman.gridPosition);
    });

    it('should retreat to scatter corner when close to Pac-Man (< 8 tiles)', () => {
      const clyde = new Ghost({
        type: GhostType.CLYDE,
        maze,
        spawnPosition: { x: 10, y: 12 }, // Close to Pac-Man at (10, 15)
      });
      clyde.setMode(GhostMode.CHASE);
      
      const target = clyde.getTarget(pacman);
      expect(target).toEqual(clyde.getScatterTarget());
    });

    it('should switch behavior at exactly 8 tiles distance', () => {
      // Position Clyde exactly 8 tiles away (Manhattan distance)
      const clyde = new Ghost({
        type: GhostType.CLYDE,
        maze,
        spawnPosition: { x: 10, y: 7 }, // 8 tiles from (10, 15)
      });
      clyde.setMode(GhostMode.CHASE);
      
      // At exactly 8 tiles, should chase
      const target = clyde.getTarget(pacman);
      expect(target).toEqual(pacman.gridPosition);
    });
  });

  describe('scatter targets', () => {
    it('Blinky should have top-right scatter target', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 9, y: 9 },
      });
      const scatterTarget = blinky.getScatterTarget();
      expect(scatterTarget.x).toBeGreaterThan(10); // Right side
      expect(scatterTarget.y).toBeLessThan(0); // Top (outside maze)
    });

    it('Pinky should have top-left scatter target', () => {
      const pinky = new Ghost({
        type: GhostType.PINKY,
        maze,
        spawnPosition: { x: 10, y: 9 },
      });
      const scatterTarget = pinky.getScatterTarget();
      expect(scatterTarget.x).toBeLessThan(10); // Left side
      expect(scatterTarget.y).toBeLessThan(0); // Top (outside maze)
    });

    it('Inky should have bottom-right scatter target', () => {
      const inky = new Ghost({
        type: GhostType.INKY,
        maze,
        spawnPosition: { x: 9, y: 10 },
      });
      const scatterTarget = inky.getScatterTarget();
      expect(scatterTarget.x).toBeGreaterThan(10); // Right side
      expect(scatterTarget.y).toBeGreaterThan(10); // Bottom
    });

    it('Clyde should have bottom-left scatter target', () => {
      const clyde = new Ghost({
        type: GhostType.CLYDE,
        maze,
        spawnPosition: { x: 10, y: 10 },
      });
      const scatterTarget = clyde.getScatterTarget();
      expect(scatterTarget.x).toBeLessThan(10); // Left side
      expect(scatterTarget.y).toBeGreaterThan(10); // Bottom
    });
  });

  describe('targeting with null pacman', () => {
    it('should return scatter target when pacman is null', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 9, y: 9 },
      });
      blinky.setMode(GhostMode.CHASE);
      
      const target = blinky.getTarget(null);
      expect(target).toEqual(blinky.getScatterTarget());
    });
  });

  describe('EATEN mode targeting', () => {
    it('should target ghost house center when eaten', () => {
      const blinky = new Ghost({
        type: GhostType.BLINKY,
        maze,
        spawnPosition: { x: 9, y: 9 },
      });
      blinky.setMode(GhostMode.SCATTER);
      blinky.enterFrightenedMode(5000);
      blinky.onEaten();
      
      const target = blinky.getTarget(pacman);
      expect(target).toEqual(maze.ghostHouseCenter);
    });
  });
});
