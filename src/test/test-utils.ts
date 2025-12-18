import { Direction, CellType } from '../types';
import type { GridPosition, MazeData } from '../types';

/**
 * Erstellt ein einfaches Test-Maze mit gegebenen Dimensionen
 */
export function createTestMaze(
  width: number = 28,
  height: number = 31,
  fillType: CellType = CellType.PATH
): CellType[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => fillType)
  );
}

/**
 * Erstellt ein Maze mit Wänden am Rand
 */
export function createBorderedMaze(
  width: number = 28,
  height: number = 31
): CellType[][] {
  const grid = createTestMaze(width, height, CellType.PATH);
  
  // Top and bottom walls
  for (let x = 0; x < width; x++) {
    grid[0][x] = CellType.WALL;
    grid[height - 1][x] = CellType.WALL;
  }
  
  // Left and right walls
  for (let y = 0; y < height; y++) {
    grid[y][0] = CellType.WALL;
    grid[y][width - 1] = CellType.WALL;
  }
  
  return grid;
}

/**
 * Erstellt MazeData für Tests
 */
export function createTestMazeData(
  width: number = 28,
  height: number = 31
): MazeData {
  return {
    width,
    height,
    grid: createBorderedMaze(width, height),
    pacmanSpawn: { x: 14, y: 23 },
    ghostSpawns: [
      { x: 14, y: 11 },
      { x: 12, y: 14 },
      { x: 14, y: 14 },
      { x: 16, y: 14 },
    ],
    ghostHouseCenter: { x: 14, y: 14 },
    tunnels: [
      { x: 0, y: 14 },
      { x: 27, y: 14 },
    ],
  };
}

/**
 * Konvertiert Keyboard-Key zu Direction
 */
export function keyToDirection(key: string): Direction {
  switch (key) {
    case 'ArrowUp':
    case 'KeyW':
      return Direction.UP;
    case 'ArrowDown':
    case 'KeyS':
      return Direction.DOWN;
    case 'ArrowLeft':
    case 'KeyA':
      return Direction.LEFT;
    case 'ArrowRight':
    case 'KeyD':
      return Direction.RIGHT;
    default:
      return Direction.NONE;
  }
}

/**
 * Konvertiert Swipe-Delta zu Direction
 */
export function swipeToDirection(dx: number, dy: number): Direction {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  // Mindestdistanz für Swipe
  if (absDx < 30 && absDy < 30) {
    return Direction.NONE;
  }
  
  // Dominante Achse bestimmt Richtung
  if (absDx > absDy) {
    return dx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    return dy > 0 ? Direction.DOWN : Direction.UP;
  }
}

/**
 * Berechnet Manhattan-Distanz zwischen zwei Grid-Positionen
 */
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Prüft ob zwei Grid-Positionen gleich sind
 */
export function positionsEqual(a: GridPosition, b: GridPosition): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Gibt die nächste Position in einer Richtung zurück
 */
export function getNextPosition(
  pos: GridPosition,
  direction: Direction
): GridPosition {
  switch (direction) {
    case Direction.UP:
      return { x: pos.x, y: pos.y - 1 };
    case Direction.DOWN:
      return { x: pos.x, y: pos.y + 1 };
    case Direction.LEFT:
      return { x: pos.x - 1, y: pos.y };
    case Direction.RIGHT:
      return { x: pos.x + 1, y: pos.y };
    default:
      return { ...pos };
  }
}

/**
 * Gibt die entgegengesetzte Richtung zurück
 */
export function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.UP:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.LEFT;
    default:
      return Direction.NONE;
  }
}
