# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Pac-Man clone game built with TypeScript and Phaser 3 game framework. It runs in the browser with canvas rendering and features neon-style graphics.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm test             # Run all tests
npm run test:unit    # Unit tests only (excludes property-based tests)
npm run test:pbt     # Property-based tests only
npm run test:watch   # Watch mode
npm run test:coverage # Generate coverage report
```

## Architecture

### Core Systems

**Scene Flow:** BootScene → MenuScene → GameScene → GameOverScene/WinScene

**Entity System:**
- `PacMan` - Grid-based movement with smooth pixel interpolation
- `Ghost` - State machine AI with 4 modes: Chase, Scatter, Frightened, Eaten

**Ghost AI Personalities:**
- Blinky (Red): Direct pursuit
- Pinky (Pink): Targets ahead of Pac-Man
- Inky (Cyan): Flanking maneuvers
- Clyde (Orange): Shy behavior, switches between hunt/flee based on distance

**Manager Singletons:**
- `ScoreManager` - Points, ghost chains (200→400→800→1600), highscore persistence
- `LivesManager` - Life tracking
- `LevelManager` - 8 levels with progressive difficulty
- `InputManager` - Keyboard (arrows/WASD) + touch (swipe)
- `AudioManager` - Web Audio API sound generation
- `ResponsiveManager` - Device scaling (0.5x-2.0x)

### Maze System

- Grid-based navigation with coordinate conversion utilities in `maze-utils.ts`
- 5 interchangeable maze layouts in `src/maze/layouts/` (JSON-based)
- Random layout selection at game start
- Cell types: Wall, Empty, Pellet, PowerPellet, GhostHouse

### Key Conventions

- All entities use grid positions internally, converted to pixels for rendering
- Movement interpolation smooths grid-to-grid transitions
- Anti-stuck mechanism prevents ghost oscillation in corners
- LocalStorage used for highscore persistence (`src/persistence/`)

## Testing

Tests use Vitest with fast-check for property-based testing:
- Unit tests: `*.test.ts`
- Property-based tests: `*.pbt.test.ts`
- Test utilities in `src/test/`

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Type System

Strict TypeScript with key types in `src/types/`:
- `Direction`, `GhostMode`, `GhostType`, `GameState`, `CellType` (enums)
- `GridPosition`, `PixelPosition`, `LevelConfig`, `MazeData` (interfaces)
