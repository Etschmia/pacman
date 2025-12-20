import { Direction, GhostMode, GhostType, CellType } from '../types';
import type { GridPosition, PixelPosition, IEntity } from '../types';
import { Maze } from '../maze';
import { CELL_SIZE, gridToPixel, positionsEqual, manhattanDistance } from '../maze/maze-utils';
import { PacMan } from './PacMan';

/**
 * Ghost rendering constants
 */
const GHOST_RADIUS = CELL_SIZE * 0.45;
const GHOST_COLORS: Record<GhostType, string> = {
  [GhostType.BLINKY]: '#FF0000', // Red
  [GhostType.PINKY]: '#FFB8FF',  // Pink
  [GhostType.INKY]: '#00FFFF',   // Cyan
  [GhostType.CLYDE]: '#FFB852',  // Orange
};
const FRIGHTENED_COLOR = '#2121FF'; // Blue
const FRIGHTENED_BLINK_COLOR = '#FFFFFF'; // White

/**
 * Direction vectors for movement calculations
 */
const DIRECTION_VECTORS: Record<Direction, GridPosition> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.NONE]: { x: 0, y: 0 },
};

/**
 * Opposite directions
 */
const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
  [Direction.NONE]: Direction.NONE,
};

/**
 * Scatter corner targets for each ghost type
 */
const SCATTER_TARGETS: Record<GhostType, GridPosition> = {
  [GhostType.BLINKY]: { x: 25, y: -3 },  // Top-right
  [GhostType.PINKY]: { x: 2, y: -3 },    // Top-left
  [GhostType.INKY]: { x: 27, y: 31 },    // Bottom-right
  [GhostType.CLYDE]: { x: 0, y: 31 },    // Bottom-left
};

export interface GhostConfig {
  type: GhostType;
  maze: Maze;
  spawnPosition: GridPosition;
  speed?: number;
  ctx?: CanvasRenderingContext2D;
}

/**
 * Ghost entity with state machine for different behavior modes
 */
export class Ghost implements IEntity {
  private _gridPosition: GridPosition;
  private _pixelPosition: PixelPosition;
  private _direction: Direction = Direction.NONE;
  private _speed: number;
  private _mode: GhostMode = GhostMode.HOUSE;
  
  readonly type: GhostType;
  private readonly maze: Maze;
  private readonly spawnPosition: GridPosition;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Movement state
  private isMoving: boolean = false;
  private moveProgress: number = 0;
  private targetGridPosition: GridPosition;
  
  // Mode timing
  private frightenedTimeRemaining: number = 0;
  private frightenedBlinking: boolean = false;
  
  // House release
  private houseReleaseTimer: number = 0;
  private releaseDelay: number = 0;

  constructor(config: GhostConfig) {
    this.type = config.type;
    this.maze = config.maze;
    this.spawnPosition = { ...config.spawnPosition };
    this._speed = config.speed ?? 75;
    this.ctx = config.ctx ?? null;
    
    this._gridPosition = { ...this.spawnPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.targetGridPosition = { ...this._gridPosition };
    
    // Set release delay based on ghost type
    this.releaseDelay = this.getInitialReleaseDelay();
  }

  private getInitialReleaseDelay(): number {
    switch (this.type) {
      case GhostType.BLINKY: return 0;      // Immediate
      case GhostType.PINKY: return 2000;    // 2 seconds
      case GhostType.INKY: return 4000;     // 4 seconds
      case GhostType.CLYDE: return 6000;    // 6 seconds
      default: return 0;
    }
  }

  // === IEntity Implementation ===

  get gridPosition(): GridPosition {
    return { ...this._gridPosition };
  }

  get pixelPosition(): PixelPosition {
    return { ...this._pixelPosition };
  }

  get direction(): Direction {
    return this._direction;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this._speed = Math.max(0, value);
  }

  get mode(): GhostMode {
    return this._mode;
  }

  // === State Machine ===

  /**
   * Sets the ghost mode and handles transitions
   */
  setMode(newMode: GhostMode): void {
    const previousMode = this._mode;
    
    // Don't change mode if eaten (must return to house first)
    if (this._mode === GhostMode.EATEN && newMode !== GhostMode.HOUSE) {
      return;
    }
    
    // Don't change mode if in house (must be released first)
    if (this._mode === GhostMode.HOUSE && newMode !== GhostMode.SCATTER && newMode !== GhostMode.CHASE) {
      return;
    }
    
    this._mode = newMode;
    
    // Reverse direction on mode change (except when eaten or in house)
    if (previousMode !== GhostMode.EATEN && 
        previousMode !== GhostMode.HOUSE && 
        newMode !== GhostMode.EATEN) {
      this.reverseDirection();
    }
  }

  /**
   * Enters frightened mode
   */
  enterFrightenedMode(duration: number): void {
    if (this._mode === GhostMode.EATEN || this._mode === GhostMode.HOUSE) {
      return;
    }
    
    this._mode = GhostMode.FRIGHTENED;
    this.frightenedTimeRemaining = duration;
    this.frightenedBlinking = false;
    this.reverseDirection();
  }

  /**
   * Called when this ghost is eaten by Pac-Man
   */
  onEaten(): void {
    if (this._mode !== GhostMode.FRIGHTENED) {
      return;
    }
    
    this._mode = GhostMode.EATEN;
    this.frightenedTimeRemaining = 0;
    this.frightenedBlinking = false;
  }

  /**
   * Reverses the ghost's direction
   */
  private reverseDirection(): void {
    if (this._direction !== Direction.NONE) {
      this._direction = OPPOSITE_DIRECTION[this._direction];
      
      // If moving, swap positions
      if (this.isMoving) {
        const temp = { ...this._gridPosition };
        this._gridPosition = { ...this.targetGridPosition };
        this.targetGridPosition = temp;
        this.moveProgress = 1 - this.moveProgress;
      }
    }
  }

  // === Movement ===

  /**
   * Checks if ghost can move in the given direction
   */
  canMove(direction: Direction): boolean {
    if (direction === Direction.NONE) {
      return false;
    }

    const vector = DIRECTION_VECTORS[direction];
    const targetPos: GridPosition = {
      x: this._gridPosition.x + vector.x,
      y: this._gridPosition.y + vector.y,
    };

    // Ghosts can walk through ghost house door when leaving or eaten
    const cell = this.maze.getCell(targetPos);
    if (cell === CellType.GHOST_DOOR) {
      return this._mode === GhostMode.HOUSE || this._mode === GhostMode.EATEN;
    }

    return this.maze.isWalkable(targetPos);
  }

  /**
   * Gets available directions from current position
   */
  private getAvailableDirections(): Direction[] {
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    return directions.filter(dir => {
      // Can't reverse direction (except when frightened)
      if (dir === OPPOSITE_DIRECTION[this._direction] && this._mode !== GhostMode.FRIGHTENED) {
        return false;
      }
      return this.canMove(dir);
    });
  }

  /**
   * Updates ghost position and state
   */
  update(delta: number): void {
    // Update mode timers
    this.updateModeTimers(delta);
    
    // Handle house release
    if (this._mode === GhostMode.HOUSE) {
      this.houseReleaseTimer += delta;
      if (this.houseReleaseTimer >= this.releaseDelay) {
        this._mode = GhostMode.SCATTER;
        this._direction = Direction.UP; // Exit upward
      }
      return;
    }

    // If no direction, choose one
    if (this._direction === Direction.NONE) {
      this.chooseDirection(null);
    }

    // Start new movement if at cell center
    if (!this.isMoving) {
      if (this.canMove(this._direction)) {
        this.startMovement();
      } else {
        this.chooseDirection(null);
        if (this.canMove(this._direction)) {
          this.startMovement();
        }
        return;
      }
    }

    // Calculate movement with speed modifier
    const speedModifier = this.getSpeedModifier();
    const moveAmount = (this._speed * speedModifier * delta) / 1000 / CELL_SIZE;
    this.moveProgress += moveAmount;

    // Check if reached target cell
    if (this.moveProgress >= 1) {
      this.completeMovement();
    } else {
      this.updatePixelPosition();
    }
  }

  private updateModeTimers(delta: number): void {
    if (this._mode === GhostMode.FRIGHTENED) {
      this.frightenedTimeRemaining -= delta;
      
      // Start blinking when 2 seconds remain
      if (this.frightenedTimeRemaining <= 2000 && !this.frightenedBlinking) {
        this.frightenedBlinking = true;
      }
      
      // End frightened mode
      if (this.frightenedTimeRemaining <= 0) {
        this._mode = GhostMode.CHASE;
        this.frightenedTimeRemaining = 0;
        this.frightenedBlinking = false;
      }
    }
  }

  private getSpeedModifier(): number {
    switch (this._mode) {
      case GhostMode.FRIGHTENED:
        return 0.5; // Half speed when frightened
      case GhostMode.EATEN:
        return 2.0; // Double speed when returning to house
      default:
        return 1.0;
    }
  }

  private startMovement(): void {
    const vector = DIRECTION_VECTORS[this._direction];
    this.targetGridPosition = {
      x: this._gridPosition.x + vector.x,
      y: this._gridPosition.y + vector.y,
    };
    this.isMoving = true;
    this.moveProgress = 0;
  }

  private completeMovement(): void {
    this._gridPosition = { ...this.targetGridPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.moveProgress = 0;
    this.isMoving = false;

    // Handle tunnel teleportation
    if (this.maze.isTunnel(this._gridPosition)) {
      this.handleTunnelTeleport();
    }

    // Check if reached ghost house (when eaten)
    if (this._mode === GhostMode.EATEN && this.isAtGhostHouse()) {
      this.respawnInHouse();
      return;
    }

    // Choose next direction at intersection
    this.chooseDirection(null);

    // Continue moving
    if (this.canMove(this._direction)) {
      this.startMovement();
    }
  }

  private updatePixelPosition(): void {
    const startPixel = gridToPixel(this._gridPosition);
    const endPixel = gridToPixel(this.targetGridPosition);
    
    this._pixelPosition = {
      x: startPixel.x + (endPixel.x - startPixel.x) * this.moveProgress,
      y: startPixel.y + (endPixel.y - startPixel.y) * this.moveProgress,
    };
  }

  private handleTunnelTeleport(): void {
    const oppositeTunnel = this.maze.getOppositeTunnel(this._gridPosition);
    if (oppositeTunnel) {
      this._gridPosition = { ...oppositeTunnel };
      this._pixelPosition = gridToPixel(this._gridPosition);
      this.targetGridPosition = { ...this._gridPosition };
    }
  }

  private isAtGhostHouse(): boolean {
    return positionsEqual(this._gridPosition, this.maze.ghostHouseCenter);
  }

  private respawnInHouse(): void {
    this._mode = GhostMode.HOUSE;
    this._gridPosition = { ...this.spawnPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.targetGridPosition = { ...this._gridPosition };
    this._direction = Direction.NONE;
    this.isMoving = false;
    this.houseReleaseTimer = 0;
    this.releaseDelay = 1000; // Quick release after respawn
  }

  // === Targeting ===

  /**
   * Chooses the next direction based on current mode and target
   */
  chooseDirection(pacman: PacMan | null): void {
    const availableDirections = this.getAvailableDirections();
    
    if (availableDirections.length === 0) {
      // No available directions, allow reverse
      if (this.canMove(OPPOSITE_DIRECTION[this._direction])) {
        this._direction = OPPOSITE_DIRECTION[this._direction];
      }
      return;
    }
    
    if (availableDirections.length === 1) {
      this._direction = availableDirections[0];
      return;
    }

    // Get target based on mode
    const target = this.getTarget(pacman);
    
    // Choose direction that minimizes distance to target
    // In frightened mode, choose randomly
    if (this._mode === GhostMode.FRIGHTENED) {
      const randomIndex = Math.floor(Math.random() * availableDirections.length);
      this._direction = availableDirections[randomIndex];
    } else {
      this._direction = this.chooseDirectionTowardsTarget(availableDirections, target);
    }
  }

  /**
   * Gets the target position based on current mode
   */
  getTarget(pacman: PacMan | null): GridPosition {
    switch (this._mode) {
      case GhostMode.CHASE:
        return this.getChaseTarget(pacman);
      case GhostMode.SCATTER:
        return SCATTER_TARGETS[this.type];
      case GhostMode.EATEN:
        return this.maze.ghostHouseCenter;
      case GhostMode.FRIGHTENED:
        // Random target (handled in chooseDirection)
        return this._gridPosition;
      case GhostMode.HOUSE:
        return this.maze.ghostHouseCenter;
      default:
        return this._gridPosition;
    }
  }

  /**
   * Gets chase target based on ghost personality
   * This is a placeholder - actual targeting will be implemented in task 6.2
   */
  private getChaseTarget(pacman: PacMan | null): GridPosition {
    if (!pacman) {
      return SCATTER_TARGETS[this.type];
    }
    
    // Default: direct chase (Blinky behavior)
    return pacman.gridPosition;
  }

  private chooseDirectionTowardsTarget(directions: Direction[], target: GridPosition): Direction {
    let bestDirection = directions[0];
    let bestDistance = Infinity;
    
    for (const dir of directions) {
      const vector = DIRECTION_VECTORS[dir];
      const nextPos: GridPosition = {
        x: this._gridPosition.x + vector.x,
        y: this._gridPosition.y + vector.y,
      };
      
      const distance = manhattanDistance(nextPos, target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDirection = dir;
      }
    }
    
    return bestDirection;
  }

  // === Rendering ===

  setRenderContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  render(): void {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;
    const x = this._pixelPosition.x;
    const y = this._pixelPosition.y;

    ctx.save();
    ctx.translate(x, y);

    if (this._mode === GhostMode.EATEN) {
      this.renderEyes(ctx);
    } else {
      this.renderBody(ctx);
      this.renderEyes(ctx);
    }

    ctx.restore();
  }

  private renderBody(ctx: CanvasRenderingContext2D): void {
    const color = this.getBodyColor();
    
    // Draw glow effect
    ctx.beginPath();
    ctx.arc(0, -GHOST_RADIUS * 0.2, GHOST_RADIUS + 2, Math.PI, 0);
    ctx.fillStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
    ctx.fill();

    // Draw ghost body (semicircle top + wavy bottom)
    ctx.beginPath();
    ctx.arc(0, -GHOST_RADIUS * 0.2, GHOST_RADIUS, Math.PI, 0);
    
    // Wavy bottom
    const waveCount = 3;
    const waveWidth = (GHOST_RADIUS * 2) / waveCount;
    const waveHeight = GHOST_RADIUS * 0.3;
    
    for (let i = 0; i < waveCount; i++) {
      const startX = GHOST_RADIUS - i * waveWidth;
      const endX = startX - waveWidth;
      const midX = (startX + endX) / 2;
      
      ctx.quadraticCurveTo(
        midX, GHOST_RADIUS * 0.8 - GHOST_RADIUS * 0.2 + waveHeight,
        endX, GHOST_RADIUS * 0.8 - GHOST_RADIUS * 0.2
      );
    }
    
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private renderEyes(ctx: CanvasRenderingContext2D): void {
    const eyeRadius = GHOST_RADIUS * 0.25;
    const pupilRadius = eyeRadius * 0.5;
    const eyeOffsetX = GHOST_RADIUS * 0.35;
    const eyeOffsetY = -GHOST_RADIUS * 0.3;
    
    // Get pupil offset based on direction
    const pupilOffset = this.getPupilOffset(pupilRadius);
    
    // Left eye
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(-eyeOffsetX + pupilOffset.x, eyeOffsetY + pupilOffset.y, pupilRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0000FF';
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(eyeOffsetX + pupilOffset.x, eyeOffsetY + pupilOffset.y, pupilRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0000FF';
    ctx.fill();
  }

  private getPupilOffset(maxOffset: number): { x: number; y: number } {
    switch (this._direction) {
      case Direction.UP:
        return { x: 0, y: -maxOffset };
      case Direction.DOWN:
        return { x: 0, y: maxOffset };
      case Direction.LEFT:
        return { x: -maxOffset, y: 0 };
      case Direction.RIGHT:
        return { x: maxOffset, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }

  private getBodyColor(): string {
    if (this._mode === GhostMode.FRIGHTENED) {
      if (this.frightenedBlinking) {
        // Blink between blue and white
        const blinkRate = 4; // Hz
        const shouldBlink = Math.floor(Date.now() / (1000 / blinkRate / 2)) % 2 === 0;
        return shouldBlink ? FRIGHTENED_BLINK_COLOR : FRIGHTENED_COLOR;
      }
      return FRIGHTENED_COLOR;
    }
    return GHOST_COLORS[this.type];
  }

  // === Public Methods ===

  /**
   * Resets ghost to spawn position
   */
  reset(): void {
    this._gridPosition = { ...this.spawnPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.targetGridPosition = { ...this._gridPosition };
    this._direction = Direction.NONE;
    this._mode = GhostMode.HOUSE;
    this.isMoving = false;
    this.moveProgress = 0;
    this.frightenedTimeRemaining = 0;
    this.frightenedBlinking = false;
    this.houseReleaseTimer = 0;
    this.releaseDelay = this.getInitialReleaseDelay();
  }

  /**
   * Checks if ghost is at a specific grid position
   */
  isAtPosition(pos: GridPosition): boolean {
    return positionsEqual(this._gridPosition, pos);
  }

  /**
   * Checks if ghost is currently frightened
   */
  isFrightened(): boolean {
    return this._mode === GhostMode.FRIGHTENED;
  }

  /**
   * Checks if ghost is currently eaten (returning to house)
   */
  isEaten(): boolean {
    return this._mode === GhostMode.EATEN;
  }

  /**
   * Checks if ghost is in the house
   */
  isInHouse(): boolean {
    return this._mode === GhostMode.HOUSE;
  }

  /**
   * Gets remaining frightened time in milliseconds
   */
  getFrightenedTimeRemaining(): number {
    return this.frightenedTimeRemaining;
  }

  /**
   * Checks if ghost is blinking (near end of frightened mode)
   */
  isBlinking(): boolean {
    return this.frightenedBlinking;
  }

  /**
   * Sets the release delay for ghost house
   */
  setReleaseDelay(delay: number): void {
    this.releaseDelay = delay;
  }
}
