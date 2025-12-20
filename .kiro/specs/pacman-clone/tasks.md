# Implementation Plan

## 1. Project Setup and Core Infrastructure

- [x] 1.1 Initialize project with Vite and TypeScript
  - Create package.json with Phaser 3, TypeScript, Vite, Vitest, and fast-check dependencies
  - Configure tsconfig.json for strict TypeScript
  - Set up Vite config for Phaser 3
  - Create basic HTML entry point
  - _Requirements: 7.1_

- [x] 1.2 Create core type definitions and enums
  - Implement Direction, GhostMode, GhostType, GameState, CellType enums
  - Define GridPosition, PixelPosition, LevelConfig, MazeData interfaces
  - Define GameSaveData and HighscoreData interfaces
  - _Requirements: 3.1, 6.1_

- [x] 1.3 Set up testing infrastructure
  - Configure Vitest for unit tests
  - Configure fast-check for property-based tests with 100 iterations minimum
  - Create test utility helpers and generators
  - _Requirements: 12.3, 12.4_

## 2. Data Serialization and Persistence

- [x] 2.1 Implement GameSaveData serialization module
  - Create serialize/deserialize functions for HighscoreData
  - Implement JSON schema validation
  - Add fallback to default values on invalid data
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x]* 2.2 Write property test for Highscore-Round-Trip
  - **Property 18: Highscore-Round-Trip**
  - **Validates: Requirements 12.1, 12.2, 12.4**

- [x]* 2.3 Write property test for Schema-Validierung-Fallback
  - **Property 19: Schema-Validierung-Fallback**
  - **Validates: Requirements 12.3**

## 3. Maze System

- [x] 3.1 Implement Maze data structures and grid utilities
  - Create Maze class with grid management
  - Implement grid-to-pixel and pixel-to-grid coordinate conversion
  - Add cell type checking methods
  - _Requirements: 6.1, 6.2_

- [x] 3.2 Implement maze layout loading and validation
  - Create at least 5 predefined maze layouts as JSON
  - Implement maze selection logic
  - Add validation for maze connectivity (BFS/DFS)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x]* 3.3 Write property test for Maze-Erreichbarkeit
  - **Property 15: Maze-Erreichbarkeit**
  - **Validates: Requirements 6.2**

- [x]* 3.4 Write property test for Ghost-House-Existenz
  - **Property 16: Ghost-House-Existenz**
  - **Validates: Requirements 6.3**

- [x]* 3.5 Write property test for Tunnel-Paar-Existenz
  - **Property 17: Tunnel-Paar-Existenz**
  - **Validates: Requirements 6.4**

- [x] 3.6 Implement Pellet management in Maze
  - Track pellet positions and states
  - Implement pellet collection logic
  - Add pellet count tracking for level completion
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x]* 3.7 Write property test for Pellet-Platzierung-Konsistenz
  - **Property 7: Pellet-Platzierung-Konsistenz**
  - **Validates: Requirements 2.4**

## 4. Input System

- [x] 4.1 Implement InputManager for keyboard input
  - Handle arrow keys and WASD
  - Implement input buffering for queued direction changes
  - Emit direction change events
  - _Requirements: 1.1, 1.3_

- [x] 4.2 Implement touch/swipe input handling
  - Detect swipe gestures with minimum distance threshold (30px)
  - Convert swipe direction to game direction
  - Handle diagonal swipes (dominant axis)
  - _Requirements: 1.2, 11.2_

- [x]* 4.3 Write property test for Input-Richtungs-Mapping
  - **Property 1: Input-Richtungs-Mapping**
  - **Validates: Requirements 1.1, 1.2**

- [x]* 4.4 Write property test for Input-Buffering-Konsistenz
  - **Property 2: Input-Buffering-Konsistenz**
  - **Validates: Requirements 1.3**

## 5. Pac-Man Entity

- [x] 5.1 Implement PacMan class with movement logic
  - Create PacMan entity with position and direction
  - Implement grid-based movement with wall collision
  - Add tunnel teleportation logic
  - _Requirements: 1.4, 1.5_

- [x]* 5.2 Write property test for Wand-Kollisions-Integrität
  - **Property 3: Wand-Kollisions-Integrität**
  - **Validates: Requirements 1.4**

- [x]* 5.3 Write property test for Tunnel-Teleportation-Symmetrie
  - **Property 4: Tunnel-Teleportation-Symmetrie**
  - **Validates: Requirements 1.5**

- [x] 5.4 Implement PacMan rendering with mouth animation
  - Create smooth mouth animation (open/close cycle)
  - Rotate sprite based on movement direction
  - Use Canvas primitives for neon-style rendering
  - _Requirements: 7.2, 7.5_

## 6. Ghost System

- [x] 6.1 Implement Ghost base class with state machine
  - Create Ghost entity with GhostMode state machine
  - Implement mode transitions (CHASE, SCATTER, FRIGHTENED, EATEN, HOUSE)
  - Add ghost house respawn logic
  - _Requirements: 3.1, 3.4, 3.5, 3.6_

- [x] 6.2 Implement ghost targeting algorithms
  - Blinky: Direct chase (target = Pac-Man position)
  - Pinky: Ambush (target = 4 tiles ahead of Pac-Man)
  - Inky: Complex (uses Blinky position + Pac-Man)
  - Clyde: Shy (chase when far, scatter when close)
  - _Requirements: 3.2, 3.3_

- [x]* 6.3 Write property test for Ghost-Targeting-Determinismus
  - **Property 8: Ghost-Targeting-Determinismus**
  - **Validates: Requirements 3.2, 3.3**

- [x] 6.4 Implement ghost movement and pathfinding
  - Simple direction selection at intersections
  - Reverse direction on mode change
  - Speed adjustments based on mode and level
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 6.5 Implement ghost rendering with mode-based visuals
  - Normal mode: Colored ghost with eyes
  - Frightened mode: Blue ghost, blinking near end
  - Eaten mode: Eyes only returning to ghost house
  - _Requirements: 7.3, 7.4, 7.5_

- [x]* 6.6 Write property test for Frightened-Mode-Broadcast
  - **Property 9: Frightened-Mode-Broadcast**
  - **Validates: Requirements 3.4**

- [x]* 6.7 Write property test for Ghost-Eating-Zustandsübergang
  - **Property 10: Ghost-Eating-Zustandsübergang**
  - **Validates: Requirements 3.5, 3.6**

- [x] 6.8 Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 7. Score and Lives System

- [x] 7.1 Implement ScoreManager
  - Track current score and highscore
  - Calculate pellet points (10 for normal, 50 for power)
  - Calculate ghost eating bonus (200, 400, 800, 1600 chain)
  - Persist highscore to LocalStorage
  - _Requirements: 2.1, 2.2, 8.1, 8.3, 8.4_

- [x]* 7.2 Write property test for Score-Berechnung-Korrektheit
  - **Property 5: Score-Berechnung-Korrektheit**
  - **Validates: Requirements 2.1, 2.2**

- [x] 7.3 Implement lives system
  - Initialize with 3 lives
  - Decrement on ghost collision (normal mode)
  - Reset positions on death with remaining lives
  - _Requirements: 4.1, 4.3, 4.4_

- [x]* 7.4 Write property test for Pac-Man-Tod-Lebensabzug
  - **Property 11: Pac-Man-Tod-Lebensabzug**
  - **Validates: Requirements 4.1**

- [x]* 7.5 Write property test for Position-Reset-Nach-Tod
  - **Property 12: Position-Reset-Nach-Tod**
  - **Validates: Requirements 4.3**

- [x]* 7.6 Write property test for Game-Over-Bedingung
  - **Property 13: Game-Over-Bedingung**
  - **Validates: Requirements 4.2**

## 8. Level System

- [x] 8.1 Implement LevelManager with level configurations
  - Define 8 level configurations with increasing difficulty
  - Implement ghost speed scaling per level
  - Implement frightened duration reduction per level
  - _Requirements: 5.1, 5.2, 5.3_

- [x]* 8.2 Write property test for Schwierigkeits-Monotonie
  - **Property 14: Schwierigkeits-Monotonie**
  - **Validates: Requirements 5.2, 5.3**

- [x] 8.3 Implement level completion and progression
  - Detect when all pellets collected
  - Transition to next level with new maze
  - Handle win condition at level 8
  - _Requirements: 2.3, 5.1, 5.4_

- [x]* 8.4 Write property test for Level-Completion-Invariante
  - **Property 6: Level-Completion-Invariante**
  - **Validates: Requirements 2.3**

## 9. Game Scenes

- [x] 9.1 Implement BootScene for asset loading
  - Load audio assets
  - Generate programmatic graphics
  - Show loading progress
  - _Requirements: 7.1_

- [x] 9.2 Implement MenuScene with start screen
  - Display game title with neon styling
  - Show start button and highscore
  - Handle start game input
  - _Requirements: 9.1, 8.4_

- [x] 9.3 Implement GameScene as main gameplay scene
  - Initialize maze, Pac-Man, and ghosts
  - Handle game loop and collision detection
  - Manage game state transitions
  - _Requirements: 3.1, 4.1, 4.2, 4.3_

- [x] 9.4 Implement pause functionality
  - Handle Escape key and pause button
  - Show pause overlay with resume/quit options
  - Freeze game state while paused
  - _Requirements: 9.2, 9.3_

- [x]* 9.5 Write property test for Pause-Toggle-Idempotenz
  - **Property 20: Pause-Toggle-Idempotenz**
  - **Validates: Requirements 9.2**

- [x] 9.6 Implement GameOverScene
  - Display final score
  - Show restart and menu options
  - Update highscore if applicable
  - _Requirements: 4.2, 9.4_

- [x] 9.7 Implement WinScene for level 8 completion
  - Display congratulations message
  - Show final score
  - Offer restart option
  - _Requirements: 5.4, 9.5_

- [x] 9.8 Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 10. UI Components

- [x] 10.1 Implement score display UI
  - Show current score prominently
  - Display highscore
  - Add point popup animations
  - _Requirements: 8.1, 8.5_

- [x] 10.2 Implement lives display UI
  - Show remaining lives as Pac-Man icons
  - Update on life loss
  - _Requirements: 8.2_

- [x] 10.3 Implement level indicator UI
  - Display current level number
  - _Requirements: 5.5_

- [x] 10.4 Implement frightened mode timer UI
  - Show remaining frightened time
  - Visual warning when time is running out
  - _Requirements: 3.7_

## 11. Audio System

- [ ] 11.1 Implement AudioManager
  - Load and manage sound effects
  - Implement sound pool for frequent sounds
  - Handle mute toggle with persistence
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ]* 11.2 Write property test for Sound-Toggle-Persistenz
  - **Property 21: Sound-Toggle-Persistenz**
  - **Validates: Requirements 10.6**

- [ ] 11.3 Integrate audio triggers
  - Pellet collection sound
  - Power pellet sound
  - Ghost eating sound
  - Death sound
  - Level complete melody
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## 12. Responsive Design

- [ ] 12.1 Implement responsive canvas scaling
  - Scale game to fit viewport while maintaining aspect ratio
  - Handle window resize events
  - _Requirements: 11.1_

- [ ]* 12.2 Write property test for Responsive-Skalierung-Seitenverhältnis
  - **Property 22: Responsive-Skalierung-Seitenverhältnis**
  - **Validates: Requirements 11.1**

- [ ] 12.3 Implement input method detection
  - Auto-detect touch vs keyboard device
  - Enable appropriate input handlers
  - _Requirements: 11.2, 11.3_

- [ ] 12.4 Implement performance optimization
  - Target 30 FPS minimum
  - Reduce animations on low-performance devices
  - _Requirements: 11.4_

## 13. Final Integration and Polish

- [ ] 13.1 Integrate all systems in GameScene
  - Wire up all managers and entities
  - Implement complete game loop
  - Handle all state transitions
  - _Requirements: All_

- [ ] 13.2 Visual polish and neon styling
  - Apply consistent neon/flat design
  - Add glow effects and smooth animations
  - Ensure visual consistency across all elements
  - _Requirements: 7.1, 7.5_

- [ ] 13.3 Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
