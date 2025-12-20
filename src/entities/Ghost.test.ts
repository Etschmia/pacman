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
