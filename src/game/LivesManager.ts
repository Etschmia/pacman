import { GameState } from '../types/enums';
import type { GridPosition } from '../types';

// Default starting lives
export const DEFAULT_LIVES = 3;

/**
 * Callback type for position reset
 */
export type PositionResetCallback = () => void;

/**
 * LivesManager handles player lives, death handling,
 * and position resets.
 */
export class LivesManager {
  private _lives: number;
  private _pacmanSpawn: GridPosition;
  private _ghostSpawns: GridPosition[];
  private _onPositionReset?: PositionResetCallback;

  constructor(
    pacmanSpawn: GridPosition,
    ghostSpawns: GridPosition[],
    initialLives: number = DEFAULT_LIVES
  ) {
    this._lives = initialLives;
    this._pacmanSpawn = { ...pacmanSpawn };
    this._ghostSpawns = ghostSpawns.map(pos => ({ ...pos }));
  }

  /** Current number of lives */
  get lives(): number {
    return this._lives;
  }

  /** Pac-Man spawn position */
  get pacmanSpawn(): GridPosition {
    return { ...this._pacmanSpawn };
  }

  /** Ghost spawn positions */
  get ghostSpawns(): GridPosition[] {
    return this._ghostSpawns.map(pos => ({ ...pos }));
  }

  /** Whether the game is over (no lives remaining) */
  get isGameOver(): boolean {
    return this._lives <= 0;
  }

  /**
   * Sets callback for position reset events
   */
  setPositionResetCallback(callback: PositionResetCallback): void {
    this._onPositionReset = callback;
  }

  /**
   * Handles Pac-Man death
   * Decrements lives and triggers position reset if lives remain
   * @returns The new game state (DYING, GAME_OVER, or PLAYING)
   */
  handleDeath(): GameState {
    if (this._lives <= 0) {
      return GameState.GAME_OVER;
    }

    this._lives--;

    if (this._lives <= 0) {
      return GameState.GAME_OVER;
    }

    // Trigger position reset callback
    this._onPositionReset?.();

    return GameState.DYING;
  }

  /**
   * Resets lives to initial value
   * Used when starting a new game
   */
  resetLives(lives: number = DEFAULT_LIVES): void {
    this._lives = lives;
  }

  /**
   * Adds an extra life
   * @param max Maximum lives allowed (default: no limit)
   */
  addLife(max?: number): void {
    if (max === undefined || this._lives < max) {
      this._lives++;
    }
  }

  /**
   * Updates spawn positions
   * Used when loading a new level/maze
   */
  updateSpawnPositions(pacmanSpawn: GridPosition, ghostSpawns: GridPosition[]): void {
    this._pacmanSpawn = { ...pacmanSpawn };
    this._ghostSpawns = ghostSpawns.map(pos => ({ ...pos }));
  }

  /**
   * Gets the spawn position for a specific ghost index
   * @param index Ghost index (0-3 for Blinky, Pinky, Inky, Clyde)
   * @returns Ghost spawn position or first spawn if index out of bounds
   */
  getGhostSpawn(index: number): GridPosition {
    const safeIndex = Math.min(Math.max(0, index), this._ghostSpawns.length - 1);
    return { ...this._ghostSpawns[safeIndex] };
  }
}
