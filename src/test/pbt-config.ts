import fc from 'fast-check';
import { Direction, GhostMode, GhostType, CellType, GameState } from '../types';
import type { GridPosition, PixelPosition } from '../types';

// Property-Based Testing Konfiguration
// Mindestens 100 Iterationen pro Property
export const PBT_CONFIG: fc.Parameters<unknown> = {
  numRuns: 100,
  verbose: false,
};

// === Generators ===

// Direction Generator
export const directionArb = fc.constantFrom(
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT
);

export const directionWithNoneArb = fc.constantFrom(
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
  Direction.NONE
);

// Ghost Mode Generator
export const ghostModeArb = fc.constantFrom(
  GhostMode.CHASE,
  GhostMode.SCATTER,
  GhostMode.FRIGHTENED,
  GhostMode.EATEN,
  GhostMode.HOUSE
);

// Ghost Type Generator
export const ghostTypeArb = fc.constantFrom(
  GhostType.BLINKY,
  GhostType.PINKY,
  GhostType.INKY,
  GhostType.CLYDE
);

// Game State Generator
export const gameStateArb = fc.constantFrom(
  GameState.READY,
  GameState.PLAYING,
  GameState.PAUSED,
  GameState.DYING,
  GameState.LEVEL_COMPLETE,
  GameState.GAME_OVER,
  GameState.WIN
);

// Cell Type Generator
export const cellTypeArb = fc.constantFrom(
  CellType.WALL,
  CellType.PATH,
  CellType.PELLET,
  CellType.POWER_PELLET,
  CellType.GHOST_HOUSE,
  CellType.GHOST_DOOR,
  CellType.TUNNEL,
  CellType.EMPTY
);

// Grid Position Generator (standard maze size: 28x31)
export const gridPositionArb = (
  maxX: number = 28,
  maxY: number = 31
): fc.Arbitrary<GridPosition> =>
  fc.record({
    x: fc.integer({ min: 0, max: maxX - 1 }),
    y: fc.integer({ min: 0, max: maxY - 1 }),
  });

// Pixel Position Generator
export const pixelPositionArb = (
  maxX: number = 448,
  maxY: number = 496
): fc.Arbitrary<PixelPosition> =>
  fc.record({
    x: fc.integer({ min: 0, max: maxX - 1 }),
    y: fc.integer({ min: 0, max: maxY - 1 }),
  });

// Score Generator (max reasonable score)
export const scoreArb = fc.integer({ min: 0, max: 999999 });

// Lives Generator (0-3)
export const livesArb = fc.integer({ min: 0, max: 3 });

// Level Generator (1-8)
export const levelArb = fc.integer({ min: 1, max: 8 });

// Pellet counts (max 244 normal pellets, 4 power pellets in classic Pac-Man)
export const pelletCountArb = fc.integer({ min: 0, max: 244 });
export const powerPelletCountArb = fc.integer({ min: 0, max: 4 });

// Highscore Data Generator
export const highscoreDataArb = fc.record({
  version: fc.constant(1),
  highscore: scoreArb,
  lastPlayed: fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
  settings: fc.record({
    soundEnabled: fc.boolean(),
  }),
});

// Keyboard input keys
export const keyboardInputArb = fc.constantFrom(
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD'
);

// Swipe direction (dx, dy deltas)
export const swipeArb = fc.record({
  dx: fc.integer({ min: -200, max: 200 }),
  dy: fc.integer({ min: -200, max: 200 }),
}).filter(({ dx, dy }) => Math.abs(dx) >= 30 || Math.abs(dy) >= 30);
