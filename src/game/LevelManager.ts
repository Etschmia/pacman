import type { LevelConfig, MazeData, MazeLayout } from '../types';
import { GameState } from '../types';
import { getMazeLayout } from '../maze/layouts';
import { loadMazeLayout } from '../maze/maze-loader';
import { Maze } from '../maze/Maze';

/**
 * Level configurations with increasing difficulty
 * - Ghost speed increases with level
 * - Frightened duration decreases with level
 * - Ghost release interval decreases with level
 */
export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, ghostSpeed: 75, pacmanSpeed: 80, frightenedDuration: 6000, scatterDuration: 7000, chaseDuration: 20000, ghostReleaseInterval: 4000 },
  { level: 2, ghostSpeed: 85, pacmanSpeed: 90, frightenedDuration: 5000, scatterDuration: 7000, chaseDuration: 20000, ghostReleaseInterval: 3500 },
  { level: 3, ghostSpeed: 95, pacmanSpeed: 100, frightenedDuration: 4000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 3000 },
  { level: 4, ghostSpeed: 95, pacmanSpeed: 100, frightenedDuration: 3000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 2500 },
  { level: 5, ghostSpeed: 100, pacmanSpeed: 100, frightenedDuration: 2000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 2000 },
  { level: 6, ghostSpeed: 100, pacmanSpeed: 100, frightenedDuration: 2000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 1500 },
  { level: 7, ghostSpeed: 105, pacmanSpeed: 100, frightenedDuration: 1000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 1000 },
  { level: 8, ghostSpeed: 110, pacmanSpeed: 100, frightenedDuration: 500, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 500 },
];

export const MAX_LEVEL = 8;
export const MIN_LEVEL = 1;

export type LevelChangeCallback = (level: number, config: LevelConfig) => void;
export type GameStateChangeCallback = (state: GameState) => void;
export type LevelCompleteCallback = (level: number, nextLevel: number | null) => void;

/**
 * LevelManager handles level progression, configuration, and maze selection
 */
export class LevelManager {
  private currentLevel: number;
  private currentMaze: Maze | null = null;
  private onLevelChange: LevelChangeCallback | null = null;
  private onGameStateChange: GameStateChangeCallback | null = null;
  private onLevelComplete: LevelCompleteCallback | null = null;

  constructor(startLevel: number = 1) {
    this.currentLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, startLevel));
  }

  /**
   * Gets the current level number (1-8)
   */
  getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Gets the configuration for the current level
   */
  getCurrentConfig(): LevelConfig {
    return this.getConfigForLevel(this.currentLevel);
  }

  /**
   * Gets the configuration for a specific level
   */
  getConfigForLevel(level: number): LevelConfig {
    const clampedLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
    return { ...LEVEL_CONFIGS[clampedLevel - 1] };
  }

  /**
   * Gets the ghost speed for the current level
   */
  getGhostSpeed(): number {
    return this.getCurrentConfig().ghostSpeed;
  }

  /**
   * Gets the Pac-Man speed for the current level
   */
  getPacmanSpeed(): number {
    return this.getCurrentConfig().pacmanSpeed;
  }

  /**
   * Gets the frightened mode duration for the current level (in ms)
   */
  getFrightenedDuration(): number {
    return this.getCurrentConfig().frightenedDuration;
  }

  /**
   * Gets the scatter mode duration for the current level (in ms)
   */
  getScatterDuration(): number {
    return this.getCurrentConfig().scatterDuration;
  }

  /**
   * Gets the chase mode duration for the current level (in ms)
   */
  getChaseDuration(): number {
    return this.getCurrentConfig().chaseDuration;
  }

  /**
   * Gets the ghost release interval for the current level (in ms)
   */
  getGhostReleaseInterval(): number {
    return this.getCurrentConfig().ghostReleaseInterval;
  }

  /**
   * Advances to the next level
   * Returns the new game state (LEVEL_COMPLETE or WIN if level 8 completed)
   */
  advanceLevel(): GameState {
    if (this.currentLevel >= MAX_LEVEL) {
      this.onGameStateChange?.(GameState.WIN);
      return GameState.WIN;
    }

    this.currentLevel++;
    const config = this.getCurrentConfig();
    this.onLevelChange?.(this.currentLevel, config);
    this.onGameStateChange?.(GameState.LEVEL_COMPLETE);
    
    return GameState.LEVEL_COMPLETE;
  }

  /**
   * Checks if the current level is the final level
   */
  isFinalLevel(): boolean {
    return this.currentLevel >= MAX_LEVEL;
  }

  /**
   * Checks if the game is won (completed level 8)
   */
  isGameWon(): boolean {
    return this.currentLevel > MAX_LEVEL;
  }

  /**
   * Gets a maze layout for the current level
   * Uses different layouts for variety
   */
  getMazeLayoutForCurrentLevel(): MazeLayout {
    return getMazeLayout(this.currentLevel - 1);
  }

  /**
   * Loads and validates the maze for the current level
   */
  loadCurrentLevelMaze(): { data: MazeData | null; errors: string[] } {
    const layout = this.getMazeLayoutForCurrentLevel();
    return loadMazeLayout(layout);
  }

  /**
   * Creates and stores a Maze instance for the current level
   */
  createMazeForCurrentLevel(): Maze | null {
    const result = this.loadCurrentLevelMaze();
    if (result.data) {
      this.currentMaze = new Maze(result.data);
      return this.currentMaze;
    }
    return null;
  }

  /**
   * Gets the current maze instance
   */
  getCurrentMaze(): Maze | null {
    return this.currentMaze;
  }

  /**
   * Sets the current maze instance (for external maze management)
   */
  setCurrentMaze(maze: Maze | null): void {
    this.currentMaze = maze;
  }

  /**
   * Checks if the current level is complete (all pellets collected)
   * Returns the appropriate game state
   */
  checkLevelCompletion(): GameState | null {
    if (!this.currentMaze) {
      return null;
    }

    if (this.currentMaze.isLevelComplete()) {
      return this.handleLevelComplete();
    }

    return null;
  }

  /**
   * Handles level completion logic
   * Returns WIN if level 8 completed, LEVEL_COMPLETE otherwise
   */
  handleLevelComplete(): GameState {
    const completedLevel = this.currentLevel;
    
    if (this.isFinalLevel()) {
      this.onLevelComplete?.(completedLevel, null);
      this.onGameStateChange?.(GameState.WIN);
      return GameState.WIN;
    }

    const nextLevel = this.currentLevel + 1;
    this.onLevelComplete?.(completedLevel, nextLevel);
    this.onGameStateChange?.(GameState.LEVEL_COMPLETE);
    return GameState.LEVEL_COMPLETE;
  }

  /**
   * Transitions to the next level after level completion
   * Creates a new maze for the next level
   */
  transitionToNextLevel(): { maze: Maze | null; config: LevelConfig } | null {
    if (this.isFinalLevel()) {
      return null;
    }

    this.currentLevel++;
    const config = this.getCurrentConfig();
    const maze = this.createMazeForCurrentLevel();
    
    this.onLevelChange?.(this.currentLevel, config);
    
    return { maze, config };
  }

  /**
   * Resets to level 1
   */
  reset(): void {
    this.currentLevel = MIN_LEVEL;
    const config = this.getCurrentConfig();
    this.onLevelChange?.(this.currentLevel, config);
  }

  /**
   * Sets the level change callback
   */
  setOnLevelChange(callback: LevelChangeCallback | null): void {
    this.onLevelChange = callback;
  }

  /**
   * Sets the game state change callback
   */
  setOnGameStateChange(callback: GameStateChangeCallback | null): void {
    this.onGameStateChange = callback;
  }

  /**
   * Sets the level complete callback
   */
  setOnLevelComplete(callback: LevelCompleteCallback | null): void {
    this.onLevelComplete = callback;
  }

  /**
   * Gets all level configurations (for testing/debugging)
   */
  static getAllConfigs(): readonly LevelConfig[] {
    return LEVEL_CONFIGS;
  }

  /**
   * Gets the total number of levels
   */
  static getTotalLevels(): number {
    return MAX_LEVEL;
  }
}
