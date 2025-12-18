# Design Document: Pac-Man Clone

## Overview

Dieser Pac-Man-Klon wird als moderne Single-Page-Application mit Phaser 3 und TypeScript entwickelt. Das Spiel nutzt eine komponentenbasierte Architektur mit klarer Trennung zwischen Game Logic, Rendering und Input-Handling. Der visuelle Stil ist ein moderner Neon-Look mit glatten Vektorgrafiken, die programmatisch via Canvas-Primitives gerendert werden.

### Technologie-Stack

- **Game Engine:** Phaser 3.70+
- **Sprache:** TypeScript 5.x
- **Build Tool:** Vite 5.x
- **Package Manager:** npm
- **Deployment:** Statisches Hosting via Caddy

### Architektur-Prinzipien

1. **Composition over Inheritance:** Spielobjekte werden durch Komposition von Behaviors erstellt
2. **State Machine Pattern:** Für Geister-KI und Spielzustände
3. **Event-Driven Communication:** Lose Kopplung zwischen Komponenten
4. **Data-Driven Design:** Level-Konfiguration und Schwierigkeitsgrad über JSON-Daten

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phaser Game Instance                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  BootScene  │→ │  MenuScene  │→ │  GameScene  │→ GameOverScene│
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                         Game Scene                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Entity Layer                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │   │
│  │  │ PacMan  │  │ Blinky  │  │ Pinky   │  │  Inky   │ Clyde│   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Maze Layer                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │   │
│  │  │  Walls  │  │ Pellets │  │ Tunnels │  │GhostHouse│     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    UI Layer                               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │   │
│  │  │  Score  │  │  Lives  │  │  Level  │                   │   │
│  │  └─────────┘  └─────────┘  └─────────┘                   │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Manager Systems                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │InputManager│ │AudioManager│ │ScoreManager│ │LevelManager│   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Scene Flow

```
BootScene → MenuScene → GameScene ↔ PauseScene
                ↑           ↓
                └── GameOverScene/WinScene
```

## Components and Interfaces

### Core Interfaces

```typescript
// Richtungen im Spiel
enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none'
}

// Geister-Zustände
enum GhostMode {
  CHASE = 'chase',
  SCATTER = 'scatter',
  FRIGHTENED = 'frightened',
  EATEN = 'eaten',
  HOUSE = 'house'
}

// Geister-Typen mit unterschiedlichen Persönlichkeiten
enum GhostType {
  BLINKY = 'blinky',  // Rot - verfolgt direkt
  PINKY = 'pinky',    // Pink - zielt vor Pac-Man
  INKY = 'inky',      // Cyan - komplexes Targeting
  CLYDE = 'clyde'     // Orange - wechselt zwischen Jagd und Flucht
}

// Spielzustände
enum GameState {
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  DYING = 'dying',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over',
  WIN = 'win'
}

// Maze-Zellen-Typen
enum CellType {
  WALL = 0,
  PATH = 1,
  PELLET = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
  GHOST_DOOR = 5,
  TUNNEL = 6,
  EMPTY = 7
}

// Position im Grid
interface GridPosition {
  x: number;
  y: number;
}

// Pixel-Position
interface PixelPosition {
  x: number;
  y: number;
}

// Level-Konfiguration
interface LevelConfig {
  level: number;
  ghostSpeed: number;
  pacmanSpeed: number;
  frightenedDuration: number;
  scatterDuration: number;
  chaseDuration: number;
  ghostReleaseInterval: number;
}

// Maze-Definition
interface MazeData {
  width: number;
  height: number;
  grid: CellType[][];
  pacmanSpawn: GridPosition;
  ghostSpawns: GridPosition[];
  ghostHouseCenter: GridPosition;
  tunnels: GridPosition[];
}

// Spielstand für Serialisierung
interface GameSaveData {
  highscore: number;
  lastPlayed: string;
  soundEnabled: boolean;
}

// Entity-Basis-Interface
interface IEntity {
  gridPosition: GridPosition;
  pixelPosition: PixelPosition;
  direction: Direction;
  speed: number;
  update(delta: number): void;
  render(): void;
}

// Bewegbare Entity
interface IMovable extends IEntity {
  nextDirection: Direction;
  canMove(direction: Direction): boolean;
  move(direction: Direction): void;
}
```

### Komponenten-Beschreibung

#### PacMan (Entity)
- Verwaltet Spieler-Position und Bewegung
- Reagiert auf Input-Events
- Führt Kollisionsprüfung mit Pellets und Geistern durch
- Animiert Mund-Bewegung basierend auf Bewegungsrichtung

#### Ghost (Entity)
- Implementiert State Machine für verschiedene Modi
- Jeder Geist-Typ hat eigene Targeting-Logik
- Pathfinding via A* oder einfache Richtungswahl an Kreuzungen
- Visuelle Darstellung ändert sich je nach Modus

#### Maze (System)
- Lädt und verwaltet Maze-Daten
- Konvertiert zwischen Grid- und Pixel-Koordinaten
- Prüft Kollisionen mit Wänden
- Verwaltet Pellet-Zustände

#### InputManager (System)
- Abstrahiert Tastatur- und Touch-Input
- Emittiert Richtungs-Events
- Implementiert Input-Buffering für flüssige Steuerung

#### AudioManager (System)
- Verwaltet Sound-Effekte und Musik
- Implementiert Sound-Pool für häufige Sounds
- Unterstützt Mute-Toggle

#### ScoreManager (System)
- Verwaltet aktuellen Score und Highscore
- Persistiert Highscore in LocalStorage
- Berechnet Bonus-Punkte für Geister-Ketten

#### LevelManager (System)
- Verwaltet Level-Progression
- Lädt Level-Konfigurationen
- Wählt Maze-Layouts aus

## Data Models

### Maze-Layout Format (JSON)

```typescript
interface MazeLayout {
  id: string;
  name: string;
  width: number;   // Anzahl Zellen horizontal (typisch 28)
  height: number;  // Anzahl Zellen vertikal (typisch 31)
  grid: number[][]; // 2D-Array mit CellType-Werten
  metadata: {
    pacmanSpawn: [number, number];
    ghostHouseTopLeft: [number, number];
    ghostHouseSize: [number, number];
    tunnelPositions: [number, number][];
  };
}
```

### Level-Konfiguration

```typescript
const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, ghostSpeed: 75, pacmanSpeed: 80, frightenedDuration: 6000, scatterDuration: 7000, chaseDuration: 20000, ghostReleaseInterval: 4000 },
  { level: 2, ghostSpeed: 85, pacmanSpeed: 90, frightenedDuration: 5000, scatterDuration: 7000, chaseDuration: 20000, ghostReleaseInterval: 3500 },
  { level: 3, ghostSpeed: 95, pacmanSpeed: 100, frightenedDuration: 4000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 3000 },
  { level: 4, ghostSpeed: 95, pacmanSpeed: 100, frightenedDuration: 3000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 2500 },
  { level: 5, ghostSpeed: 100, pacmanSpeed: 100, frightenedDuration: 2000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 2000 },
  { level: 6, ghostSpeed: 100, pacmanSpeed: 100, frightenedDuration: 2000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 1500 },
  { level: 7, ghostSpeed: 105, pacmanSpeed: 100, frightenedDuration: 1000, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 1000 },
  { level: 8, ghostSpeed: 110, pacmanSpeed: 100, frightenedDuration: 500, scatterDuration: 5000, chaseDuration: 20000, ghostReleaseInterval: 500 },
];
```

### Highscore-Daten (LocalStorage)

```typescript
interface HighscoreData {
  version: number;
  highscore: number;
  lastPlayed: string; // ISO 8601 Datum
  settings: {
    soundEnabled: boolean;
  };
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Basierend auf der Prework-Analyse wurden die folgenden testbaren Properties identifiziert:

### Property 1: Input-Richtungs-Mapping

*Für jede* gültige Tastatureingabe (Pfeiltasten, WASD) oder Swipe-Geste, soll die resultierende Bewegungsrichtung exakt der erwarteten Richtung entsprechen (UP→UP, DOWN→DOWN, LEFT→LEFT, RIGHT→RIGHT).

**Validates: Requirements 1.1, 1.2**

### Property 2: Input-Buffering-Konsistenz

*Für jede* gebufferte Richtungseingabe und jede Maze-Konfiguration, wenn die gebufferte Richtung später möglich wird, soll die Richtungsänderung ausgeführt werden.

**Validates: Requirements 1.3**

### Property 3: Wand-Kollisions-Integrität

*Für jede* Position von Pac-Man und jede Bewegungsrichtung, wenn eine Wand in dieser Richtung existiert, soll Pac-Man niemals in die Wand eindringen oder sie durchqueren.

**Validates: Requirements 1.4**

### Property 4: Tunnel-Teleportation-Symmetrie

*Für jeden* Tunnel-Eingang, wenn Pac-Man ihn betritt, soll er zur korrekten gegenüberliegenden Position teleportiert werden, und ein erneutes Betreten soll zur ursprünglichen Seite zurückführen (Round-Trip).

**Validates: Requirements 1.5**

### Property 5: Score-Berechnung-Korrektheit

*Für jede* Sequenz von gesammelten Pellets (n normale Pellets, m Power-Pellets), soll der resultierende Score exakt (n × 10 + m × 50) plus eventuelle Ghost-Eating-Boni betragen.

**Validates: Requirements 2.1, 2.2**

### Property 6: Level-Completion-Invariante

*Für jedes* Maze-Layout, wenn die Anzahl der verbleibenden Pellets 0 erreicht, soll der Spielzustand auf LEVEL_COMPLETE wechseln.

**Validates: Requirements 2.3**

### Property 7: Pellet-Platzierung-Konsistenz

*Für jedes* Maze-Layout, wenn ein Level startet, soll die Anzahl der platzierten Pellets exakt der Anzahl der PELLET- und POWER_PELLET-Zellen im Maze-Grid entsprechen.

**Validates: Requirements 2.4**

### Property 8: Ghost-Targeting-Determinismus

*Für jeden* Geist-Typ und jeden Spielzustand (Pac-Man-Position, Pac-Man-Richtung, Geist-Position), soll das berechnete Ziel deterministisch und entsprechend der Geist-Persönlichkeit sein.

**Validates: Requirements 3.2, 3.3**

### Property 9: Frightened-Mode-Broadcast

*Für jeden* Spielzustand mit aktiven Geistern, wenn ein Power-Pellet gesammelt wird, sollen alle Geister (außer bereits gefressene) in den FRIGHTENED-Modus wechseln.

**Validates: Requirements 3.4**

### Property 10: Ghost-Eating-Zustandsübergang

*Für jeden* Geist im FRIGHTENED-Zustand, wenn Pac-Man ihn berührt, soll der Geist in den EATEN-Zustand wechseln und zum Ghost House navigieren.

**Validates: Requirements 3.5, 3.6**

### Property 11: Pac-Man-Tod-Lebensabzug

*Für jeden* Spielzustand mit Leben > 0, wenn Pac-Man einen Geist im normalen Zustand berührt, soll die Anzahl der Leben um genau 1 reduziert werden.

**Validates: Requirements 4.1**

### Property 12: Position-Reset-Nach-Tod

*Für jeden* Tod mit verbleibenden Leben, sollen Pac-Man und alle Geister an ihre definierten Spawn-Positionen zurückgesetzt werden.

**Validates: Requirements 4.3**

### Property 13: Game-Over-Bedingung

*Für jeden* Spielzustand, wenn die Anzahl der Leben 0 erreicht, soll der Spielzustand auf GAME_OVER wechseln.

**Validates: Requirements 4.2**

### Property 14: Schwierigkeits-Monotonie

*Für alle* Level-Paare (n, n+1) mit n < 8, soll gelten: ghostSpeed(n+1) ≥ ghostSpeed(n) UND frightenedDuration(n+1) ≤ frightenedDuration(n).

**Validates: Requirements 5.2, 5.3**

### Property 15: Maze-Erreichbarkeit

*Für jedes* generierte oder ausgewählte Maze, sollen alle PATH-Zellen von der Pac-Man-Spawn-Position aus erreichbar sein (keine isolierten Bereiche).

**Validates: Requirements 6.2**

### Property 16: Ghost-House-Existenz

*Für jedes* generierte Maze, soll ein zusammenhängender Ghost-House-Bereich mit mindestens 4 Zellen existieren.

**Validates: Requirements 6.3**

### Property 17: Tunnel-Paar-Existenz

*Für jedes* generierte Maze, sollen mindestens zwei Tunnel-Zellen an gegenüberliegenden Seiten des Mazes existieren.

**Validates: Requirements 6.4**

### Property 18: Highscore-Round-Trip

*Für jeden* gültigen Highscore-Wert, wenn er serialisiert und dann deserialisiert wird, soll der resultierende Wert identisch zum ursprünglichen sein.

**Validates: Requirements 12.1, 12.2, 12.4**

### Property 19: Schema-Validierung-Fallback

*Für jede* ungültige oder korrupte Eingabe beim Laden von Spielstand-Daten, soll das System Standardwerte verwenden, ohne einen Fehler zu werfen.

**Validates: Requirements 12.3**

### Property 20: Pause-Toggle-Idempotenz

*Für jeden* Spielzustand PLAYING, wenn Pause zweimal hintereinander ausgelöst wird, soll der Zustand wieder PLAYING sein.

**Validates: Requirements 9.2**

### Property 21: Sound-Toggle-Persistenz

*Für jede* Sound-Einstellung (enabled/disabled), wenn sie geändert und das Spiel neu gestartet wird, soll die Einstellung erhalten bleiben.

**Validates: Requirements 10.6**

### Property 22: Responsive-Skalierung-Seitenverhältnis

*Für jede* Fenstergrößenänderung, soll das Seitenverhältnis des Spielfelds konstant bleiben.

**Validates: Requirements 11.1**

## Error Handling

### Input-Fehler

| Fehlerfall | Behandlung |
|------------|------------|
| Ungültige Taste | Ignorieren, keine Zustandsänderung |
| Gleichzeitige Tasten | Letzte Taste gewinnt |
| Swipe zu kurz | Ignorieren (Mindestdistanz: 30px) |
| Swipe diagonal | Dominante Achse bestimmt Richtung |

### Daten-Fehler

| Fehlerfall | Behandlung |
|------------|------------|
| LocalStorage nicht verfügbar | In-Memory-Fallback, Warnung in Konsole |
| Korrupte Highscore-Daten | Standardwerte verwenden, alte Daten überschreiben |
| Ungültiges Maze-Layout | Fallback auf Standard-Layout |
| JSON-Parse-Fehler | Standardwerte verwenden |

### Laufzeit-Fehler

| Fehlerfall | Behandlung |
|------------|------------|
| Asset-Ladefehler | Retry mit Fallback-Assets |
| Audio-Kontext blockiert | Stummer Modus, UI-Hinweis |
| WebGL nicht verfügbar | Canvas-Fallback |
| Niedrige Framerate | Reduzierte Animationen |

## Testing Strategy

### Dual Testing Approach

Das Projekt verwendet sowohl Unit-Tests als auch Property-Based-Tests für umfassende Abdeckung:

- **Unit-Tests:** Verifizieren spezifische Beispiele, Edge-Cases und Fehlerbedingungen
- **Property-Based-Tests:** Verifizieren universelle Eigenschaften über alle gültigen Eingaben

### Testing Framework

- **Unit Testing:** Vitest (schnell, TypeScript-nativ, Vite-Integration)
- **Property-Based Testing:** fast-check (TypeScript-native PBT-Library)

### Property-Based Testing Konfiguration

```typescript
import fc from 'fast-check';

// Mindestens 100 Iterationen pro Property
const PBT_CONFIG = {
  numRuns: 100,
  verbose: true,
  seed: Date.now()
};
```

### Test-Kategorien

#### 1. Core Logic Tests (Property-Based)

| Property | Generator | Assertion |
|----------|-----------|-----------|
| Input-Mapping | `fc.constantFrom('up', 'down', 'left', 'right')` | Richtung entspricht Eingabe |
| Score-Berechnung | `fc.tuple(fc.nat(244), fc.nat(4))` | Score = pellets×10 + power×50 |
| Wand-Kollision | `fc.tuple(gridPosGen, directionGen)` | Keine Wanddurchdringung |
| Maze-Erreichbarkeit | `mazeGen` | BFS findet alle PATH-Zellen |
| Highscore-Round-Trip | `fc.nat(999999)` | serialize(deserialize(x)) === x |

#### 2. Unit Tests

| Komponente | Test-Fokus |
|------------|------------|
| PacMan | Bewegung, Animation-State, Kollision |
| Ghost | State-Machine-Übergänge, Targeting |
| Maze | Grid-Konvertierung, Pellet-Verwaltung |
| InputManager | Tastatur-Events, Touch-Events |
| ScoreManager | Punkteberechnung, Highscore-Update |
| LevelManager | Level-Progression, Config-Loading |

#### 3. Integration Tests

| Szenario | Beschreibung |
|----------|--------------|
| Level-Durchlauf | Komplettes Level mit allen Pellets |
| Ghost-Interaktion | Frightened-Mode-Zyklus |
| Game-Over-Flow | Leben verlieren bis Game Over |
| Pause-Resume | Spiel pausieren und fortsetzen |

### Test-Annotationen

Jeder Property-Based-Test wird mit folgendem Format annotiert:

```typescript
/**
 * **Feature: pacman-clone, Property 5: Score-Berechnung-Korrektheit**
 * **Validates: Requirements 2.1, 2.2**
 */
it.prop([fc.nat(244), fc.nat(4)])('score calculation is correct', (pellets, powerPellets) => {
  // Test implementation
});
```

### Test-Ausführung

```bash
# Alle Tests
npm test

# Nur Unit-Tests
npm run test:unit

# Nur Property-Tests
npm run test:pbt

# Coverage-Report
npm run test:coverage
```
