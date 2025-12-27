# 🎮 Pac-Man Clone - Neon Edition

Ein moderner Pac-Man-Klon mit Neon-Grafik, entwickelt mit Phaser 3 und TypeScript.

![Pac-Man](https://img.shields.io/badge/Game-Pac--Man-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.70+-green)
![License](https://img.shields.io/badge/License-MIT-purple)

## 🌟 Features

- **8 Level** mit steigendem Schwierigkeitsgrad
- **5 verschiedene Maze-Layouts** für Abwechslung
- **4 Geister** mit einzigartigen KI-Persönlichkeiten:
  - 🔴 **Blinky** - Verfolgt direkt
  - 🩷 **Pinky** - Lauert voraus
  - 🩵 **Inky** - Komplexe Flankenmanöver
  - 🟠 **Clyde** - Schüchtern (wechselt zwischen Jagd und Flucht)
- **Modernes Neon-Design** mit glatten Animationen
- **Responsive Design** für Desktop und Mobile
- **Touch-Steuerung** mit Swipe-Gesten
- **Highscore-System** mit LocalStorage-Persistenz
- **Sound-Effekte** (stummschaltbar)
- **Pause-Funktion**

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd pacman-clone

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Das Spiel ist dann unter `http://localhost:5173` erreichbar.

### Build für Produktion

```bash
npm run build
```

Die Build-Dateien werden im `dist/` Ordner erstellt.

## 🎮 Steuerung

### Desktop (Tastatur)

| Taste | Aktion |
|-------|--------|
| ↑ / W | Nach oben |
| ↓ / S | Nach unten |
| ← / A | Nach links |
| → / D | Nach rechts |
| ESC | Pause |
| Q | Beenden (im Pause-Menü) |

### Mobile (Touch)

- **Swipe** in die gewünschte Richtung
- **Tap** zum Starten/Fortsetzen

## 🏗️ Projektstruktur

```
src/
├── audio/              # Audio-System
│   ├── AudioManager.ts # Sound-Verwaltung
│   └── audio-generator.ts
├── entities/           # Spielfiguren
│   ├── PacMan.ts      # Pac-Man Entity
│   └── Ghost.ts       # Geister mit KI
├── game/              # Spiellogik
│   ├── ScoreManager.ts # Punkteverwaltung
│   ├── LivesManager.ts # Leben-System
│   └── LevelManager.ts # Level-Progression
├── input/             # Eingabe-System
│   └── InputManager.ts # Tastatur & Touch
├── maze/              # Labyrinth-System
│   ├── Maze.ts        # Maze-Klasse
│   ├── maze-loader.ts # Layout-Laden
│   ├── maze-validation.ts
│   └── layouts/       # 5 Maze-Layouts
├── persistence/       # Datenpersistenz
│   ├── serialization.ts
│   └── storage.ts     # LocalStorage
├── responsive/        # Responsive Design
│   └── ResponsiveManager.ts
├── scenes/            # Phaser Scenes
│   ├── BootScene.ts   # Asset-Loading
│   ├── MenuScene.ts   # Hauptmenü
│   ├── GameScene.ts   # Hauptspiel
│   ├── GameOverScene.ts
│   └── WinScene.ts
├── types/             # TypeScript Typen
│   ├── enums.ts       # Enumerationen
│   └── interfaces.ts  # Interfaces
├── ui/                # UI-Komponenten
│   ├── ScoreDisplay.ts
│   ├── LivesDisplay.ts
│   ├── LevelIndicator.ts
│   └── FrightenedTimer.ts
└── main.ts            # Einstiegspunkt
```

## 🧪 Tests

Das Projekt verwendet **Vitest** für Unit-Tests und **fast-check** für Property-Based-Tests.

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Coverage-Report
npm run test:coverage
```

### Test-Statistiken

- **396 Tests** insgesamt
- **24 Test-Dateien**
- Unit-Tests und Property-Based-Tests

## 🎯 Spielmechanik

### Punktesystem

| Aktion | Punkte |
|--------|--------|
| Pellet sammeln | 10 |
| Power-Pellet sammeln | 50 |
| 1. Geist fressen | 200 |
| 2. Geist fressen | 400 |
| 3. Geist fressen | 800 |
| 4. Geist fressen | 1600 |

### Frucht-System

- **7 Fruchtarten:** Kirsche (50), Himbeere (100), Pfirsich (150), Apfel (200), Banane (250), Weintrauben (350), Melone (450)
- **Zufälliges Erscheinen:** Pro Level erscheinen zufällig 2-7 Früchte in Abständen von 15-30 Sekunden.
- **Lebensdauer:** Jede Frucht hat eine Lebensdauer von 8-12 Sekunden und blinkt, bevor sie verschwindet.

### Level-Progression

| Level | Geister-Geschwindigkeit | Frightened-Dauer |
|-------|------------------------|------------------|
| 1 | 75 | 6s |
| 2 | 85 | 5s |
| 3 | 95 | 4s |
| 4 | 95 | 3s |
| 5 | 100 | 2s |
| 6 | 100 | 2s |
| 7 | 105 | 1s |
| 8 | 110 | 0.5s |

### Geister-Modi

1. **Chase** - Geister verfolgen Pac-Man
2. **Scatter** - Geister ziehen sich in ihre Ecken zurück
3. **Frightened** - Geister fliehen (nach Power-Pellet)
4. **Eaten** - Geister kehren zum Ghost House zurück

## 🛠️ Technologie-Stack

- **Game Engine:** [Phaser 3](https://phaser.io/)
- **Sprache:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Testing:** [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.dev/)
- **Rendering:** Canvas 2D mit Neon-Effekten

## 📐 Architektur

Das Projekt folgt einer komponentenbasierten Architektur:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phaser Game Instance                      │
├─────────────────────────────────────────────────────────────────┤
│  BootScene → MenuScene → GameScene ↔ GameOverScene/WinScene     │
├─────────────────────────────────────────────────────────────────┤
│                         Game Scene                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Entity Layer: PacMan, Blinky, Pinky, Inky, Clyde        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Maze Layer: Walls, Pellets, Tunnels, Ghost House        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  UI Layer: Score, Lives, Level, Timer                    │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Manager Systems: Input, Audio, Score, Level, Responsive        │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Design-Prinzipien

1. **Composition over Inheritance** - Spielobjekte durch Komposition
2. **State Machine Pattern** - Für Geister-KI und Spielzustände
3. **Event-Driven Communication** - Lose Kopplung zwischen Komponenten
4. **Data-Driven Design** - Level-Konfiguration über Daten

## 📝 Entwicklung

### Neue Maze-Layouts hinzufügen

1. Erstelle eine neue Datei in `src/maze/layouts/`
2. Definiere das Grid mit `CellType`-Werten
3. Exportiere in `src/maze/layouts/index.ts`

### Neue Geister-Persönlichkeit

1. Füge neuen `GhostType` in `src/types/enums.ts` hinzu
2. Implementiere Targeting-Logik in `Ghost.ts`
3. Definiere Farbe und Scatter-Ziel

## 🐛 Bekannte Einschränkungen

- Audio-Dateien müssen manuell in `public/assets/audio/` hinzugefügt werden
- Web Audio API wird für Sound benötigt (Fallback auf stumm)

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Credits

- Inspiriert vom Original Pac-Man (1980) von Namco
- Entwickelt mit [Phaser 3](https://phaser.io/)
- Icons und Design: Eigene Kreation im Neon-Stil

---

**Viel Spaß beim Spielen! 🎮**
