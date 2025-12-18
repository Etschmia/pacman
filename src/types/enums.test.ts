import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Direction, GhostMode, GhostType, GameState, CellType } from './enums';
import { PBT_CONFIG, directionArb, ghostModeArb } from '../test/pbt-config';

describe('Enums', () => {
  describe('Direction', () => {
    it('should have all expected values', () => {
      expect(Direction.UP).toBe('up');
      expect(Direction.DOWN).toBe('down');
      expect(Direction.LEFT).toBe('left');
      expect(Direction.RIGHT).toBe('right');
      expect(Direction.NONE).toBe('none');
    });
  });

  describe('GhostMode', () => {
    it('should have all expected values', () => {
      expect(GhostMode.CHASE).toBe('chase');
      expect(GhostMode.SCATTER).toBe('scatter');
      expect(GhostMode.FRIGHTENED).toBe('frightened');
      expect(GhostMode.EATEN).toBe('eaten');
      expect(GhostMode.HOUSE).toBe('house');
    });
  });

  describe('GhostType', () => {
    it('should have all four ghost types', () => {
      expect(GhostType.BLINKY).toBe('blinky');
      expect(GhostType.PINKY).toBe('pinky');
      expect(GhostType.INKY).toBe('inky');
      expect(GhostType.CLYDE).toBe('clyde');
    });
  });

  describe('GameState', () => {
    it('should have all game states', () => {
      expect(GameState.READY).toBe('ready');
      expect(GameState.PLAYING).toBe('playing');
      expect(GameState.PAUSED).toBe('paused');
      expect(GameState.DYING).toBe('dying');
      expect(GameState.LEVEL_COMPLETE).toBe('level_complete');
      expect(GameState.GAME_OVER).toBe('game_over');
      expect(GameState.WIN).toBe('win');
    });
  });

  describe('CellType', () => {
    it('should have numeric values for grid representation', () => {
      expect(CellType.WALL).toBe(0);
      expect(CellType.PATH).toBe(1);
      expect(CellType.PELLET).toBe(2);
      expect(CellType.POWER_PELLET).toBe(3);
      expect(CellType.GHOST_HOUSE).toBe(4);
      expect(CellType.GHOST_DOOR).toBe(5);
      expect(CellType.TUNNEL).toBe(6);
      expect(CellType.EMPTY).toBe(7);
    });
  });
});

describe('PBT Generators', () => {
  it('directionArb generates valid directions', () => {
    fc.assert(
      fc.property(directionArb, (direction) => {
        const validDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        return validDirections.includes(direction);
      }),
      PBT_CONFIG
    );
  });

  it('ghostModeArb generates valid ghost modes', () => {
    fc.assert(
      fc.property(ghostModeArb, (mode) => {
        const validModes = [
          GhostMode.CHASE,
          GhostMode.SCATTER,
          GhostMode.FRIGHTENED,
          GhostMode.EATEN,
          GhostMode.HOUSE,
        ];
        return validModes.includes(mode);
      }),
      PBT_CONFIG
    );
  });
});
