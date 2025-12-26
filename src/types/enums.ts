// Richtungen im Spiel
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none',
}

// Geister-Zustände
export enum GhostMode {
  CHASE = 'chase',
  SCATTER = 'scatter',
  FRIGHTENED = 'frightened',
  EATEN = 'eaten',
  HOUSE = 'house',
}

// Geister-Typen mit unterschiedlichen Persönlichkeiten
export enum GhostType {
  BLINKY = 'blinky',  // Rot - verfolgt direkt
  PINKY = 'pinky',    // Pink - zielt vor Pac-Man
  INKY = 'inky',      // Cyan - komplexes Targeting
  CLYDE = 'clyde',    // Orange - wechselt zwischen Jagd und Flucht
}

// Spielzustände
export enum GameState {
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  DYING = 'dying',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over',
  WIN = 'win',
}

// Maze-Zellen-Typen
export enum CellType {
  WALL = 0,
  PATH = 1,
  PELLET = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
  GHOST_DOOR = 5,
  TUNNEL = 6,
  EMPTY = 7,
}

// Frucht-Typen mit unterschiedlichen Punktwerten
export enum FruitType {
  CHERRY = 'cherry',       // 50 Punkte
  RASPBERRY = 'raspberry', // 100 Punkte
  PEACH = 'peach',         // 150 Punkte
  APPLE = 'apple',         // 200 Punkte
  BANANA = 'banana',       // 250 Punkte
  GRAPES = 'grapes',       // 350 Punkte
  MELON = 'melon',         // 450 Punkte
}
