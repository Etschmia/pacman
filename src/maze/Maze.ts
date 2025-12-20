import { CellType } from '../types';
import type { GridPosition, PixelPosition, MazeData } from '../types';
import {
  CELL_SIZE,
  gridToPixel,
  pixelToGrid,
  isInBounds,
  isWalkable,
  isPellet,
  isPowerPellet,
  isTunnel,
  getOppositeTunnel,
} from './maze-utils';

/**
 * Maze class manages the game grid, pellets, and coordinate conversions
 */
export class Maze {
  private readonly data: MazeData;
  private readonly pelletStates: boolean[][]; // true = pellet exists
  private remainingPellets: number;
  private remainingPowerPellets: number;

  constructor(data: MazeData) {
    this.data = data;
    this.pelletStates = this.initializePelletStates();
    this.remainingPellets = this.countPellets(CellType.PELLET);
    this.remainingPowerPellets = this.countPellets(CellType.POWER_PELLET);
  }

  private initializePelletStates(): boolean[][] {
    return this.data.grid.map((row) =>
      row.map((cell) => isPellet(cell))
    );
  }

  private countPellets(type: CellType): number {
    let count = 0;
    for (const row of this.data.grid) {
      for (const cell of row) {
        if (cell === type) {
          count++;
        }
      }
    }
    return count;
  }

  // === Getters ===

  get width(): number {
    return this.data.width;
  }

  get height(): number {
    return this.data.height;
  }

  get pixelWidth(): number {
    return this.data.width * CELL_SIZE;
  }

  get pixelHeight(): number {
    return this.data.height * CELL_SIZE;
  }

  get pacmanSpawn(): GridPosition {
    return { ...this.data.pacmanSpawn };
  }

  get ghostSpawns(): GridPosition[] {
    return this.data.ghostSpawns.map((pos) => ({ ...pos }));
  }

  get ghostHouseCenter(): GridPosition {
    return { ...this.data.ghostHouseCenter };
  }

  get tunnels(): GridPosition[] {
    return this.data.tunnels.map((pos) => ({ ...pos }));
  }

  get totalPellets(): number {
    return this.remainingPellets + this.remainingPowerPellets;
  }

  get pelletsRemaining(): number {
    return this.remainingPellets;
  }

  get powerPelletsRemaining(): number {
    return this.remainingPowerPellets;
  }

  // === Coordinate Conversion ===

  gridToPixel(gridPos: GridPosition): PixelPosition {
    return gridToPixel(gridPos);
  }

  pixelToGrid(pixelPos: PixelPosition): GridPosition {
    return pixelToGrid(pixelPos);
  }

  // === Cell Access ===

  getCell(pos: GridPosition): CellType {
    if (!this.isInBounds(pos)) {
      return CellType.WALL;
    }
    return this.data.grid[pos.y][pos.x];
  }

  isInBounds(pos: GridPosition): boolean {
    return isInBounds(pos, this.data.width, this.data.height);
  }

  isWalkable(pos: GridPosition): boolean {
    if (!this.isInBounds(pos)) {
      return false;
    }
    return isWalkable(this.data.grid[pos.y][pos.x]);
  }

  isTunnel(pos: GridPosition): boolean {
    if (!this.isInBounds(pos)) {
      return false;
    }
    return isTunnel(this.data.grid[pos.y][pos.x]);
  }

  // === Pellet Management ===

  hasPellet(pos: GridPosition): boolean {
    if (!this.isInBounds(pos)) {
      return false;
    }
    return this.pelletStates[pos.y][pos.x];
  }

  isPowerPellet(pos: GridPosition): boolean {
    if (!this.isInBounds(pos)) {
      return false;
    }
    return this.hasPellet(pos) && isPowerPellet(this.data.grid[pos.y][pos.x]);
  }

  /**
   * Collects a pellet at the given position
   * Returns the type of pellet collected, or null if no pellet
   */
  collectPellet(pos: GridPosition): CellType | null {
    if (!this.hasPellet(pos)) {
      return null;
    }

    const cellType = this.data.grid[pos.y][pos.x];
    this.pelletStates[pos.y][pos.x] = false;

    if (cellType === CellType.POWER_PELLET) {
      this.remainingPowerPellets--;
    } else if (cellType === CellType.PELLET) {
      this.remainingPellets--;
    }

    return cellType;
  }

  /**
   * Checks if all pellets have been collected
   */
  isLevelComplete(): boolean {
    return this.remainingPellets === 0 && this.remainingPowerPellets === 0;
  }

  // === Tunnel Teleportation ===

  /**
   * Gets the opposite tunnel position for teleportation
   */
  getOppositeTunnel(currentPos: GridPosition): GridPosition | null {
    return getOppositeTunnel(currentPos, this.data.tunnels);
  }

  // === Reset ===

  /**
   * Resets all pellets to their initial state
   */
  resetPellets(): void {
    for (let y = 0; y < this.data.height; y++) {
      for (let x = 0; x < this.data.width; x++) {
        this.pelletStates[y][x] = isPellet(this.data.grid[y][x]);
      }
    }
    this.remainingPellets = this.countPellets(CellType.PELLET);
    this.remainingPowerPellets = this.countPellets(CellType.POWER_PELLET);
  }

  // === Grid Access for Rendering ===

  /**
   * Returns the raw grid data for rendering
   */
  getGrid(): readonly CellType[][] {
    return this.data.grid;
  }

  /**
   * Returns pellet states for rendering
   */
  getPelletStates(): readonly boolean[][] {
    return this.pelletStates;
  }
}
