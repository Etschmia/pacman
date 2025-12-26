import { loadHighscoreData, saveHighscoreData } from '../persistence/storage';
import { updateHighscore } from '../persistence/serialization';
import type { HighscoreData } from '../types';
import { FruitType } from '../types/enums';
import { FRUIT_POINTS } from '../entities/Fruit';

// Point values
export const PELLET_POINTS = 10;
export const POWER_PELLET_POINTS = 50;

// Ghost eating chain bonus (200, 400, 800, 1600)
export const GHOST_CHAIN_MULTIPLIERS = [200, 400, 800, 1600];

/**
 * ScoreManager handles score tracking, highscore persistence,
 * and ghost eating chain bonuses.
 */
export class ScoreManager {
  private _score: number = 0;
  private _highscore: number = 0;
  private _ghostChainIndex: number = 0;
  private _highscoreData: HighscoreData;

  constructor() {
    this._highscoreData = loadHighscoreData();
    this._highscore = this._highscoreData.highscore;
  }

  /** Current score */
  get score(): number {
    return this._score;
  }

  /** Current highscore */
  get highscore(): number {
    return this._highscore;
  }

  /** Current ghost chain index (0-3) */
  get ghostChainIndex(): number {
    return this._ghostChainIndex;
  }

  /**
   * Adds points for collecting a normal pellet
   * @returns Points added
   */
  collectPellet(): number {
    this._score += PELLET_POINTS;
    this.checkHighscore();
    return PELLET_POINTS;
  }

  /**
   * Adds points for collecting a power pellet
   * Resets ghost chain for new frightened mode
   * @returns Points added
   */
  collectPowerPellet(): number {
    this._score += POWER_PELLET_POINTS;
    this._ghostChainIndex = 0; // Reset chain for new frightened mode
    this.checkHighscore();
    return POWER_PELLET_POINTS;
  }

  /**
   * Adds points for eating a ghost
   * Uses chain multiplier (200, 400, 800, 1600)
   * @returns Points added
   */
  eatGhost(): number {
    const multiplierIndex = Math.min(this._ghostChainIndex, GHOST_CHAIN_MULTIPLIERS.length - 1);
    const points = GHOST_CHAIN_MULTIPLIERS[multiplierIndex];
    this._score += points;
    this._ghostChainIndex++;
    this.checkHighscore();
    return points;
  }

  /**
   * Resets the ghost eating chain
   * Called when frightened mode ends
   */
  resetGhostChain(): void {
    this._ghostChainIndex = 0;
  }

  /**
   * Adds points for collecting a fruit
   * @param fruitType The type of fruit collected
   * @returns Points added
   */
  collectFruit(fruitType: FruitType): number {
    const points = FRUIT_POINTS[fruitType];
    this._score += points;
    this.checkHighscore();
    return points;
  }

  /**
   * Resets score for a new game
   * Does not reset highscore
   */
  resetScore(): void {
    this._score = 0;
    this._ghostChainIndex = 0;
  }

  /**
   * Checks if current score exceeds highscore and updates if needed
   */
  private checkHighscore(): void {
    if (this._score > this._highscore) {
      this._highscore = this._score;
    }
  }

  /**
   * Persists the current highscore to storage
   */
  saveHighscore(): void {
    this._highscoreData = updateHighscore(this._highscoreData, this._highscore);
    saveHighscoreData(this._highscoreData);
  }

  /**
   * Calculates score for a given number of pellets and power pellets
   * Static utility for testing
   */
  static calculateScore(pellets: number, powerPellets: number): number {
    return pellets * PELLET_POINTS + powerPellets * POWER_PELLET_POINTS;
  }

  /**
   * Gets the next ghost chain bonus value
   * @param chainIndex Current chain index (0-based)
   * @returns Points for eating a ghost at this chain position
   */
  static getGhostChainBonus(chainIndex: number): number {
    const index = Math.min(chainIndex, GHOST_CHAIN_MULTIPLIERS.length - 1);
    return GHOST_CHAIN_MULTIPLIERS[index];
  }
}
