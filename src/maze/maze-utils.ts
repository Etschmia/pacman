import { CellType } from '../types';
import type { GridPosition, PixelPosition } from '../types';

// Standard cell size in pixels
export const CELL_SIZE = 16;

/**
 * Converts grid position to pixel position (center of cell)
 */
export function gridToPixel(gridPos: GridPosition): PixelPosition {
  return {
    x: gridPos.x * CELL_SIZE + CELL_SIZE / 2,
    y: gridPos.y * CELL_SIZE + CELL_SIZE / 2,
  };
}

/**
 * Converts pixel position to grid position
 */
export function pixelToGrid(pixelPos: PixelPosition): GridPosition {
  return {
    x: Math.floor(pixelPos.x / CELL_SIZE),
    y: Math.floor(pixelPos.y / CELL_SIZE),
  };
}

/**
 * Checks if a grid position is within maze bounds
 */
export function isInBounds(pos: GridPosition, width: number, height: number): boolean {
  return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}

/**
 * Checks if a cell type is walkable (not a wall)
 */
export function isWalkable(cellType: CellType): boolean {
  return cellType !== CellType.WALL;
}

/**
 * Checks if a cell type is a pellet
 */
export function isPellet(cellType: CellType): boolean {
  return cellType === CellType.PELLET || cellType === CellType.POWER_PELLET;
}

/**
 * Checks if a cell type is a power pellet
 */
export function isPowerPellet(cellType: CellType): boolean {
  return cellType === CellType.POWER_PELLET;
}

/**
 * Checks if a cell type is a tunnel
 */
export function isTunnel(cellType: CellType): boolean {
  return cellType === CellType.TUNNEL;
}

/**
 * Checks if a cell type is part of the ghost house
 */
export function isGhostHouse(cellType: CellType): boolean {
  return cellType === CellType.GHOST_HOUSE || cellType === CellType.GHOST_DOOR;
}

/**
 * Gets the opposite tunnel position for teleportation
 */
export function getOppositeTunnel(
  currentPos: GridPosition,
  tunnels: GridPosition[]
): GridPosition | null {
  // Find the tunnel on the opposite side
  for (const tunnel of tunnels) {
    if (tunnel.x !== currentPos.x || tunnel.y !== currentPos.y) {
      // Check if it's on the opposite side (different x for horizontal tunnels)
      if (tunnel.y === currentPos.y && Math.abs(tunnel.x - currentPos.x) > 1) {
        return tunnel;
      }
      // For vertical tunnels (different y)
      if (tunnel.x === currentPos.x && Math.abs(tunnel.y - currentPos.y) > 1) {
        return tunnel;
      }
    }
  }
  return null;
}

/**
 * Calculates Manhattan distance between two grid positions
 */
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Checks if two grid positions are equal
 */
export function positionsEqual(a: GridPosition, b: GridPosition): boolean {
  return a.x === b.x && a.y === b.y;
}
