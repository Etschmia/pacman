import Phaser from 'phaser';
import { GameState, GhostType, CellType } from '../types';
import type { GridPosition } from '../types';
import { Maze } from '../maze';
import { PacMan } from '../entities/PacMan';
import { Ghost } from '../entities/Ghost';
import { ScoreManager, PELLET_POINTS, POWER_PELLET_POINTS } from '../game/ScoreManager';
import { LivesManager } from '../game/LivesManager';
import { LevelManager } from '../game/LevelManager';
import { InputManager } from '../input/InputManager';
import { CELL_SIZE } from '../maze/maze-utils';
import { ScoreDisplay, LivesDisplay, LevelIndicator, FrightenedTimer } from '../ui';
import { getAudioManager, SoundType } from '../audio';
import { getResponsiveManager } from '../responsive';

/**
 * GameScene is the main gameplay scene handling:
 * - Maze rendering
 * - Entity updates and rendering
 * - Collision detection
 * - Game state management
 */
export class GameScene extends Phaser.Scene {
  // Managers
  private scoreManager!: ScoreManager;
  private livesManager!: LivesManager;
  private levelManager!: LevelManager;
  private inputManager!: InputManager;

  // Game state
  private gameState: GameState = GameState.READY;
  private maze!: Maze;
  private pacman!: PacMan;
  private ghosts: Ghost[] = [];

  // Rendering
  private gameCanvas!: HTMLCanvasElement;
  private gameCtx!: CanvasRenderingContext2D;

  // UI elements
  private scoreDisplay!: ScoreDisplay;
  private livesDisplay!: LivesDisplay;
  private levelIndicator!: LevelIndicator;
  private frightenedTimer!: FrightenedTimer;
  private readyText!: Phaser.GameObjects.Text;

  // Timing
  private readyTimer: number = 0;
  private readonly READY_DURATION = 2000;
  private dyingTimer: number = 0;
  private readonly DYING_DURATION = 1500;
  private levelCompleteTimer: number = 0;
  private readonly LEVEL_COMPLETE_DURATION = 2000;

  // Pause state
  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Performance tracking
  private fpsHistory: number[] = [];
  private lastFpsCheck: number = 0;
  private readonly FPS_CHECK_INTERVAL = 1000;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.initializeManagers();
    this.initializeMaze();
    this.initializeEntities();
    this.createUI();
    this.createPauseOverlay();
    this.setupInput();
    this.createGameCanvas();

    // Start in ready state
    this.gameState = GameState.READY;
    this.readyTimer = 0;
    this.showReadyText();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Initialize FPS tracking
    this.fpsHistory = [];
    this.lastFpsCheck = 0;
  }

  update(time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }

    // Track FPS for performance optimization
    this.trackFps(time);

    switch (this.gameState) {
      case GameState.READY:
        this.updateReady(delta);
        break;
      case GameState.PLAYING:
        this.updatePlaying(delta);
        break;
      case GameState.DYING:
        this.updateDying(delta);
        break;
      case GameState.LEVEL_COMPLETE:
        this.updateLevelComplete(delta);
        break;
      case GameState.GAME_OVER:
        this.scene.start('GameOverScene', { score: this.scoreManager.score });
        break;
      case GameState.WIN:
        this.scene.start('WinScene', { score: this.scoreManager.score });
        break;
    }

    this.renderGame();
  }

  /**
   * Track FPS and enable performance mode if needed
   */
  private trackFps(time: number): void {
    if (time - this.lastFpsCheck >= this.FPS_CHECK_INTERVAL) {
      const currentFps = this.game.loop.actualFps;
      this.fpsHistory.push(currentFps);
      
      // Keep only last 5 samples
      if (this.fpsHistory.length > 5) {
        this.fpsHistory.shift();
      }

      // Calculate average FPS
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      
      // Enable performance mode if FPS drops below 30
      const responsiveManager = getResponsiveManager();
      if (responsiveManager.detectLowPerformance(avgFps, 30)) {
        responsiveManager.setPerformanceMode(true);
      }

      this.lastFpsCheck = time;
    }
  }

  private initializeManagers(): void {
    this.scoreManager = new ScoreManager();
    this.levelManager = new LevelManager(1);
    this.inputManager = new InputManager();
  }

  private initializeMaze(): void {
    const mazeResult = this.levelManager.loadCurrentLevelMaze();
    if (!mazeResult.data) {
      console.error('Failed to load maze:', mazeResult.errors);
      return;
    }
    this.maze = new Maze(mazeResult.data);
    this.levelManager.setCurrentMaze(this.maze);

    // Initialize lives manager with spawn positions
    this.livesManager = new LivesManager(
      this.maze.pacmanSpawn,
      this.maze.ghostSpawns
    );
    this.livesManager.setPositionResetCallback(() => this.resetPositions());
  }

  private initializeEntities(): void {
    // Create Pac-Man
    this.pacman = new PacMan({
      maze: this.maze,
      speed: this.levelManager.getPacmanSpeed(),
    });

    // Create ghosts
    this.ghosts = [];
    const ghostTypes = [GhostType.BLINKY, GhostType.PINKY, GhostType.INKY, GhostType.CLYDE];
    const ghostSpawns = this.maze.ghostSpawns;

    for (let i = 0; i < ghostTypes.length; i++) {
      const ghost = new Ghost({
        type: ghostTypes[i],
        maze: this.maze,
        spawnPosition: ghostSpawns[i] || this.maze.ghostHouseCenter,
        speed: this.levelManager.getGhostSpeed(),
      });
      this.ghosts.push(ghost);
    }

    // Set Blinky reference for Inky's targeting
    const blinky = this.ghosts.find(g => g.type === GhostType.BLINKY);
    const inky = this.ghosts.find(g => g.type === GhostType.INKY);
    if (blinky && inky) {
      inky.setBlinkyRef(blinky);
    }
  }


  private createGameCanvas(): void {
    // Create off-screen canvas for game rendering
    this.gameCanvas = document.createElement('canvas');
    this.gameCanvas.width = this.maze.pixelWidth;
    this.gameCanvas.height = this.maze.pixelHeight;
    this.gameCtx = this.gameCanvas.getContext('2d')!;

    // Set render contexts for entities
    this.pacman.setRenderContext(this.gameCtx);
    this.ghosts.forEach(ghost => ghost.setRenderContext(this.gameCtx));
  }

  private createUI(): void {
    const { width, height } = this.cameras.main;

    // Score display (top left and right)
    this.scoreDisplay = new ScoreDisplay(this);
    this.scoreDisplay.updateHighscore(this.scoreManager.highscore);

    // Level indicator (top center)
    this.levelIndicator = new LevelIndicator(this, width / 2, 8);
    this.levelIndicator.updateLevel(this.levelManager.getLevel());

    // Lives display (bottom left)
    this.livesDisplay = new LivesDisplay(this, 10, height - 25);
    this.livesDisplay.updateLives(this.livesManager.lives);

    // Frightened mode timer (top center, below level)
    this.frightenedTimer = new FrightenedTimer(this, width / 2, 50);

    // Ready text (hidden initially)
    this.readyText = this.add.text(width / 2, height / 2, 'READY!', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#FFFF00',
    });
    this.readyText.setOrigin(0.5);
    this.readyText.setVisible(false);
  }

  private createPauseOverlay(): void {
    const { width, height } = this.cameras.main;

    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setVisible(false);
    this.pauseOverlay.setDepth(100);

    // Semi-transparent background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, width, height);
    this.pauseOverlay.add(bg);

    // Pause text
    const pauseText = this.add.text(width / 2, height / 2 - 50, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#FFFF00',
    });
    pauseText.setOrigin(0.5);
    this.pauseOverlay.add(pauseText);

    // Resume instruction
    const resumeText = this.add.text(width / 2, height / 2 + 20, 'Press ESC to Resume', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#00FFFF',
    });
    resumeText.setOrigin(0.5);
    this.pauseOverlay.add(resumeText);

    // Quit instruction
    const quitText = this.add.text(width / 2, height / 2 + 60, 'Press Q to Quit', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FF6666',
    });
    quitText.setOrigin(0.5);
    this.pauseOverlay.add(quitText);
  }

  private setupInput(): void {
    // Direction input
    this.inputManager.onDirectionChange((direction) => {
      if (this.gameState === GameState.PLAYING && !this.isPaused) {
        this.pacman.move(direction);
      }
    });

    // Set up touch input if available
    const responsiveManager = getResponsiveManager();
    if (responsiveManager.isTouchEnabled()) {
      this.inputManager.setupTouchInput();
    }

    // Pause input
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);

    // Quit from pause
    this.input.keyboard?.on('keydown-Q', () => {
      if (this.isPaused) {
        this.quitToMenu();
      }
    });
  }

  private updateLivesDisplay(): void {
    this.livesDisplay.updateLives(this.livesManager.lives);
  }

  private showReadyText(): void {
    this.readyText.setVisible(true);
    this.readyText.setText('READY!');
  }

  private hideReadyText(): void {
    this.readyText.setVisible(false);
  }

  // === State Updates ===

  private updateReady(delta: number): void {
    this.readyTimer += delta;
    if (this.readyTimer >= this.READY_DURATION) {
      this.gameState = GameState.PLAYING;
      this.hideReadyText();
    }
  }

  private updatePlaying(delta: number): void {
    // Update Pac-Man
    this.pacman.update(delta);
    this.pacman.updateAnimation(delta);

    // Update ghosts
    this.ghosts.forEach(ghost => {
      ghost.update(delta);
      ghost.chooseDirection(this.pacman);
    });

    // Check pellet collection
    this.checkPelletCollection();

    // Check ghost collisions
    this.checkGhostCollisions();

    // Check level completion
    this.checkLevelCompletion();

    // Update UI
    this.updateUI();
    this.scoreDisplay.update(delta);
    this.frightenedTimer.update(delta);
  }

  private updateDying(delta: number): void {
    this.dyingTimer += delta;
    if (this.dyingTimer >= this.DYING_DURATION) {
      this.dyingTimer = 0;
      
      if (this.livesManager.isGameOver) {
        this.gameState = GameState.GAME_OVER;
      } else {
        // Reset and continue
        this.gameState = GameState.READY;
        this.readyTimer = 0;
        this.showReadyText();
      }
    }
  }

  private updateLevelComplete(delta: number): void {
    this.levelCompleteTimer += delta;
    if (this.levelCompleteTimer >= this.LEVEL_COMPLETE_DURATION) {
      this.levelCompleteTimer = 0;
      this.advanceToNextLevel();
    }
  }


  // === Game Logic ===

  private checkPelletCollection(): void {
    const pacmanPos = this.pacman.gridPosition;

    if (this.maze.hasPellet(pacmanPos)) {
      const pelletType = this.maze.collectPellet(pacmanPos);
      const pixelPos = this.pacman.pixelPosition;
      const audioManager = getAudioManager();

      if (pelletType === CellType.POWER_PELLET) {
        this.scoreManager.collectPowerPellet();
        this.scoreDisplay.showPointPopup(pixelPos.x, pixelPos.y, POWER_PELLET_POINTS);
        this.activateFrightenedMode();
        audioManager.play(SoundType.POWER_PELLET);
      } else if (pelletType === CellType.PELLET) {
        this.scoreManager.collectPellet();
        this.scoreDisplay.showPointPopup(pixelPos.x, pixelPos.y, PELLET_POINTS);
        audioManager.play(SoundType.PELLET);
      }
    }
  }

  private activateFrightenedMode(): void {
    const duration = this.levelManager.getFrightenedDuration();
    this.ghosts.forEach(ghost => {
      ghost.enterFrightenedMode(duration);
    });
    this.frightenedTimer.start(duration);
  }

  private checkGhostCollisions(): void {
    const pacmanPos = this.pacman.gridPosition;
    const audioManager = getAudioManager();

    for (const ghost of this.ghosts) {
      if (this.isColliding(pacmanPos, ghost.gridPosition)) {
        if (ghost.isFrightened()) {
          // Eat the ghost
          ghost.onEaten();
          const points = this.scoreManager.eatGhost();
          const pixelPos = ghost.pixelPosition;
          this.scoreDisplay.showPointPopup(pixelPos.x, pixelPos.y, points);
          audioManager.play(SoundType.GHOST_EAT);
        } else if (!ghost.isEaten() && !ghost.isInHouse()) {
          // Pac-Man dies
          this.handlePacManDeath();
          return;
        }
      }
    }
  }

  private isColliding(pos1: GridPosition, pos2: GridPosition): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  private handlePacManDeath(): void {
    const newState = this.livesManager.handleDeath();
    this.gameState = newState;
    this.dyingTimer = 0;
    this.livesDisplay.animateLifeLoss();
    this.updateLivesDisplay();
    this.frightenedTimer.stop();
    getAudioManager().play(SoundType.DEATH);
  }

  private resetPositions(): void {
    this.pacman.reset();
    this.ghosts.forEach(ghost => ghost.reset());
    this.scoreManager.resetGhostChain();
  }

  private checkLevelCompletion(): void {
    if (this.maze.isLevelComplete()) {
      this.gameState = GameState.LEVEL_COMPLETE;
      this.levelCompleteTimer = 0;
      this.readyText.setText('LEVEL COMPLETE!');
      this.readyText.setVisible(true);
      getAudioManager().play(SoundType.LEVEL_COMPLETE);
    }
  }

  private advanceToNextLevel(): void {
    const result = this.levelManager.transitionToNextLevel();

    if (!result) {
      // Won the game
      this.gameState = GameState.WIN;
      return;
    }

    // Update maze and entities
    this.maze = result.maze!;
    this.levelManager.setCurrentMaze(this.maze);

    // Reinitialize entities with new maze
    this.pacman = new PacMan({
      maze: this.maze,
      speed: result.config.pacmanSpeed,
    });
    this.pacman.setRenderContext(this.gameCtx);

    // Recreate ghosts
    this.ghosts = [];
    const ghostTypes = [GhostType.BLINKY, GhostType.PINKY, GhostType.INKY, GhostType.CLYDE];
    const ghostSpawns = this.maze.ghostSpawns;

    for (let i = 0; i < ghostTypes.length; i++) {
      const ghost = new Ghost({
        type: ghostTypes[i],
        maze: this.maze,
        spawnPosition: ghostSpawns[i] || this.maze.ghostHouseCenter,
        speed: result.config.ghostSpeed,
      });
      ghost.setRenderContext(this.gameCtx);
      this.ghosts.push(ghost);
    }

    // Set Blinky reference for Inky
    const blinky = this.ghosts.find(g => g.type === GhostType.BLINKY);
    const inky = this.ghosts.find(g => g.type === GhostType.INKY);
    if (blinky && inky) {
      inky.setBlinkyRef(blinky);
    }

    // Update lives manager spawn positions
    this.livesManager.updateSpawnPositions(this.maze.pacmanSpawn, this.maze.ghostSpawns);

    // Update UI
    this.levelIndicator.updateLevel(this.levelManager.getLevel());

    // Resize canvas if needed
    this.gameCanvas.width = this.maze.pixelWidth;
    this.gameCanvas.height = this.maze.pixelHeight;

    // Start ready state
    this.gameState = GameState.READY;
    this.readyTimer = 0;
    this.showReadyText();
  }

  private updateUI(): void {
    this.scoreDisplay.updateScore(this.scoreManager.score);
    if (this.scoreManager.score > this.scoreManager.highscore) {
      this.scoreDisplay.updateHighscore(this.scoreManager.score);
    }
  }

  // === Pause ===

  togglePause(): void {
    if (this.gameState !== GameState.PLAYING && !this.isPaused) {
      return;
    }

    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);

    if (this.isPaused) {
      this.gameState = GameState.PAUSED;
    } else {
      this.gameState = GameState.PLAYING;
    }
  }

  private quitToMenu(): void {
    this.scoreManager.saveHighscore();
    this.scene.start('MenuScene');
  }

  // === Rendering ===

  private renderGame(): void {
    // Clear canvas
    this.gameCtx.fillStyle = '#000000';
    this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

    // Render maze
    this.renderMaze();

    // Render pellets
    this.renderPellets();

    // Render entities (only if not in certain states)
    if (this.gameState !== GameState.DYING || this.dyingTimer < this.DYING_DURATION * 0.7) {
      this.pacman.render();
    }

    this.ghosts.forEach(ghost => ghost.render());

    // Draw canvas to Phaser
    this.textures.remove('gameCanvas');
    this.textures.addCanvas('gameCanvas', this.gameCanvas);

    // Position the game canvas in the scene
    const existingImage = this.children.getByName('gameImage');
    if (existingImage) {
      existingImage.destroy();
    }

    const gameImage = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 20,
      'gameCanvas'
    );
    gameImage.setName('gameImage');
    gameImage.setDepth(-1);
  }

  private renderMaze(): void {
    const grid = this.maze.getGrid();

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = grid[y][x];
        const px = x * CELL_SIZE + CELL_SIZE / 2;
        const py = y * CELL_SIZE + CELL_SIZE / 2;

        if (cell === CellType.WALL) {
          this.renderWall(px, py);
        } else if (cell === CellType.GHOST_DOOR) {
          this.renderGhostDoor(px, py);
        }
      }
    }
  }

  private renderWall(x: number, y: number): void {
    const ctx = this.gameCtx;
    const size = CELL_SIZE;

    // Neon blue wall
    ctx.fillStyle = '#0033AA';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    // Glow effect
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2 + 1, y - size / 2 + 1, size - 2, size - 2);
  }

  private renderGhostDoor(x: number, y: number): void {
    const ctx = this.gameCtx;

    ctx.fillStyle = '#FF88FF';
    ctx.fillRect(x - CELL_SIZE / 2, y - 2, CELL_SIZE, 4);
  }

  private renderPellets(): void {
    const pelletStates = this.maze.getPelletStates();
    const grid = this.maze.getGrid();

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        if (pelletStates[y][x]) {
          const px = x * CELL_SIZE + CELL_SIZE / 2;
          const py = y * CELL_SIZE + CELL_SIZE / 2;
          const isPower = grid[y][x] === CellType.POWER_PELLET;

          this.renderPellet(px, py, isPower);
        }
      }
    }
  }

  private renderPellet(x: number, y: number, isPower: boolean): void {
    const ctx = this.gameCtx;

    if (isPower) {
      // Power pellet - larger with pulsing effect
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      const radius = 6 * pulse;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal pellet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === Cleanup ===

  shutdown(): void {
    this.inputManager.destroy();
    this.scoreManager.saveHighscore();
    this.scoreDisplay.destroy();
    this.livesDisplay.destroy();
    this.levelIndicator.destroy();
    this.frightenedTimer.destroy();
  }
}
