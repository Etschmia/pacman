import { CellType, Direction, FruitType } from './enums';

// Position im Grid
export interface GridPosition {
  x: number;
  y: number;
}

// Pixel-Position
export interface PixelPosition {
  x: number;
  y: number;
}

// Level-Konfiguration
export interface LevelConfig {
  level: number;
  ghostSpeed: number;
  pacmanSpeed: number;
  frightenedDuration: number;
  scatterDuration: number;
  chaseDuration: number;
  ghostReleaseInterval: number;
}

// Maze-Definition
export interface MazeData {
  width: number;
  height: number;
  grid: CellType[][];
  pacmanSpawn: GridPosition;
  ghostSpawns: GridPosition[];
  ghostHouseCenter: GridPosition;
  tunnels: GridPosition[];
}

// Maze-Layout Format (JSON)
export interface MazeLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: number[][];
  metadata: {
    pacmanSpawn: [number, number];
    ghostHouseTopLeft: [number, number];
    ghostHouseSize: [number, number];
    tunnelPositions: [number, number][];
  };
}

// Spielstand für Serialisierung
export interface GameSaveData {
  highscore: number;
  lastPlayed: string;
  soundEnabled: boolean;
}

// Highscore-Daten (LocalStorage)
export interface HighscoreData {
  version: number;
  highscore: number;
  lastPlayed: string;
  settings: {
    soundEnabled: boolean;
  };
}

// Entity-Basis-Interface
export interface IEntity {
  gridPosition: GridPosition;
  pixelPosition: PixelPosition;
  direction: Direction;
  speed: number;
  update(delta: number): void;
  render(): void;
}

// Bewegbare Entity
export interface IMovable extends IEntity {
  nextDirection: Direction;
  canMove(direction: Direction): boolean;
  move(direction: Direction): void;
}

// Frucht-Konfiguration
export interface FruitConfig {
  type: FruitType;
  gridPosition: GridPosition;
  lifetime?: number; // Millisekunden bis zum Verschwinden
  ctx?: CanvasRenderingContext2D;
}
