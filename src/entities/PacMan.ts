import { Direction } from '../types';
import type { GridPosition, PixelPosition, IMovable } from '../types';
import { Maze } from '../maze';
import { CELL_SIZE, gridToPixel, positionsEqual } from '../maze/maze-utils';

/**
 * Pac-Man rendering constants
 */
const PACMAN_COLOR = '#FFFF00'; // Classic yellow
const PACMAN_GLOW_COLOR = 'rgba(255, 255, 0, 0.4)';
const PACMAN_RADIUS = CELL_SIZE * 0.45; // Slightly smaller than cell
const MOUTH_ANIMATION_SPEED = 8; // Cycles per second
const MAX_MOUTH_ANGLE = Math.PI / 4; // 45 degrees max mouth opening

/**
 * Direction to rotation angle mapping (in radians)
 */
const DIRECTION_ROTATION: Record<Direction, number> = {
  [Direction.RIGHT]: 0,
  [Direction.DOWN]: Math.PI / 2,
  [Direction.LEFT]: Math.PI,
  [Direction.UP]: -Math.PI / 2,
  [Direction.NONE]: 0,
};

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
 * Opposite directions for movement logic
 */
const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
  [Direction.NONE]: Direction.NONE,
};

export interface PacManConfig {
  maze: Maze;
  speed?: number;
  ctx?: CanvasRenderingContext2D;
}

/**
 * PacMan entity with grid-based movement, wall collision, and tunnel teleportation
 */
export class PacMan implements IMovable {
  private _gridPosition: GridPosition;
  private _pixelPosition: PixelPosition;
  private _direction: Direction = Direction.NONE;
  private _nextDirection: Direction = Direction.NONE;
  private _speed: number;
  private readonly maze: Maze;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Movement state
  private isMoving: boolean = false;
  private moveProgress: number = 0; // 0 to 1, progress through current cell
  private targetGridPosition: GridPosition;
  
  // Animation state
  private animationTime: number = 0;
  private mouthAngle: number = 0;

  constructor(config: PacManConfig) {
    this.maze = config.maze;
    this._speed = config.speed ?? 80; // pixels per second
    this.ctx = config.ctx ?? null;
    
    // Initialize at spawn position
    this._gridPosition = { ...this.maze.pacmanSpawn };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.targetGridPosition = { ...this._gridPosition };
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

  // === IMovable Implementation ===

  get nextDirection(): Direction {
    return this._nextDirection;
  }

  /**
   * Checks if PacMan can move in the given direction from current grid position
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

    return this.maze.isWalkable(targetPos);
  }

  /**
   * Sets the desired movement direction
   * If the direction is immediately possible, it's applied
   * Otherwise, it's buffered as nextDirection
   */
  move(direction: Direction): void {
    if (direction === Direction.NONE) {
      return;
    }

    // Always allow reversing direction while moving
    if (this.isMoving && direction === OPPOSITE_DIRECTION[this._direction]) {
      this._nextDirection = direction;
      this.applyDirection(direction);
      return;
    }

    // If we can move in this direction immediately, do it
    if (this.canMove(direction)) {
      this._nextDirection = direction;
      
      // If not currently moving or can turn immediately, apply direction
      if (!this.isMoving || this.canTurnImmediately(direction)) {
        this.applyDirection(direction);
      }
    } else {
      // Buffer the direction for later
      this._nextDirection = direction;
    }
  }

  /**
   * Checks if PacMan can turn immediately (at cell center or reversing)
   */
  private canTurnImmediately(direction: Direction): boolean {
    // Can always reverse direction
    if (direction === OPPOSITE_DIRECTION[this._direction]) {
      return true;
    }
    
    // Can turn at cell center (within threshold of center)
    return this.moveProgress < 0.15;
  }

  /**
   * Checks if a turn is possible at the current grid position
   */
  private canTurnAtCurrentPosition(direction: Direction): boolean {
    if (direction === Direction.NONE) {
      return false;
    }
    const vector = DIRECTION_VECTORS[direction];
    const targetPos: GridPosition = {
      x: this._gridPosition.x + vector.x,
      y: this._gridPosition.y + vector.y,
    };
    return this.maze.isWalkable(targetPos);
  }

  /**
   * Applies a direction change
   */
  private applyDirection(direction: Direction): void {
    // If reversing, swap positions
    if (direction === OPPOSITE_DIRECTION[this._direction] && this.isMoving) {
      const temp = { ...this._gridPosition };
      this._gridPosition = { ...this.targetGridPosition };
      this.targetGridPosition = temp;
      this.moveProgress = 1 - this.moveProgress;
    }
    
    this._direction = direction;
  }

  /**
   * Updates PacMan position based on delta time
   */
  update(delta: number): void {
    // Try to apply buffered direction at cell center
    if (this._nextDirection !== Direction.NONE && this._nextDirection !== this._direction) {
      // Check if we can turn now (near cell center or reversing)
      if (this.canTurnImmediately(this._nextDirection) && this.canTurnAtCurrentPosition(this._nextDirection)) {
        // Snap to grid position for clean turn
        if (this.moveProgress < 0.5) {
          this._pixelPosition = gridToPixel(this._gridPosition);
          this.moveProgress = 0;
          this.isMoving = false;
        }
        this._direction = this._nextDirection;
      }
    }

    // If no direction, stop
    if (this._direction === Direction.NONE) {
      this.isMoving = false;
      return;
    }

    // Start new movement if at cell center
    if (!this.isMoving) {
      if (this.canMove(this._direction)) {
        this.startMovement();
      } else {
        // Can't move, try buffered direction
        if (this._nextDirection !== Direction.NONE && this.canMove(this._nextDirection)) {
          this._direction = this._nextDirection;
          this.startMovement();
        }
        return;
      }
    }

    // Calculate movement
    const moveAmount = (this._speed * delta) / 1000 / CELL_SIZE;
    this.moveProgress += moveAmount;

    // Check if reached target cell
    if (this.moveProgress >= 1) {
      this.completeMovement();
    } else {
      // Interpolate pixel position
      this.updatePixelPosition();
    }
  }

  /**
   * Starts movement to the next cell
   */
  private startMovement(): void {
    const vector = DIRECTION_VECTORS[this._direction];
    this.targetGridPosition = {
      x: this._gridPosition.x + vector.x,
      y: this._gridPosition.y + vector.y,
    };
    this.isMoving = true;
    this.moveProgress = 0;
  }

  /**
   * Completes movement to target cell
   */
  private completeMovement(): void {
    this._gridPosition = { ...this.targetGridPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.moveProgress = 0;
    this.isMoving = false;

    // Handle tunnel teleportation
    if (this.maze.isTunnel(this._gridPosition)) {
      this.handleTunnelTeleport();
    }

    // First priority: try buffered direction (allows turning at intersections)
    if (this._nextDirection !== Direction.NONE && this._nextDirection !== this._direction && this.canMove(this._nextDirection)) {
      this._direction = this._nextDirection;
      this.startMovement();
    }
    // Second priority: continue in current direction
    else if (this.canMove(this._direction)) {
      this.startMovement();
    }
    // Third priority: try buffered direction even if same (in case we were blocked)
    else if (this._nextDirection !== Direction.NONE && this.canMove(this._nextDirection)) {
      this._direction = this._nextDirection;
      this.startMovement();
    }
  }

  /**
   * Updates pixel position based on movement progress
   */
  private updatePixelPosition(): void {
    const startPixel = gridToPixel(this._gridPosition);
    const endPixel = gridToPixel(this.targetGridPosition);
    
    this._pixelPosition = {
      x: startPixel.x + (endPixel.x - startPixel.x) * this.moveProgress,
      y: startPixel.y + (endPixel.y - startPixel.y) * this.moveProgress,
    };
  }

  /**
   * Handles tunnel teleportation
   */
  private handleTunnelTeleport(): void {
    const oppositeTunnel = this.maze.getOppositeTunnel(this._gridPosition);
    if (oppositeTunnel) {
      this._gridPosition = { ...oppositeTunnel };
      this._pixelPosition = gridToPixel(this._gridPosition);
      this.targetGridPosition = { ...this._gridPosition };
    }
  }

  // === Rendering ===

  /**
   * Sets the canvas rendering context
   */
  setRenderContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  /**
   * Updates animation state based on delta time
   */
  updateAnimation(delta: number): void {
    if (this.isMoving || this._direction !== Direction.NONE) {
      this.animationTime += delta / 1000;
      // Smooth sine wave for mouth animation
      this.mouthAngle = Math.abs(Math.sin(this.animationTime * MOUTH_ANIMATION_SPEED * Math.PI)) * MAX_MOUTH_ANGLE;
    } else {
      // Mouth slightly open when idle
      this.mouthAngle = MAX_MOUTH_ANGLE * 0.3;
    }
  }

  /**
   * Gets the current mouth angle (for testing)
   */
  getMouthAngle(): number {
    return this.mouthAngle;
  }

  /**
   * Gets the rotation angle based on current direction
   */
  getRotation(): number {
    return DIRECTION_ROTATION[this._direction];
  }

  /**
   * Renders Pac-Man with neon-style graphics and mouth animation
   */
  render(): void {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;
    const x = this._pixelPosition.x;
    const y = this._pixelPosition.y;
    const rotation = this.getRotation();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw glow effect (neon style)
    ctx.beginPath();
    ctx.arc(0, 0, PACMAN_RADIUS + 3, 0, Math.PI * 2);
    ctx.fillStyle = PACMAN_GLOW_COLOR;
    ctx.fill();

    // Draw Pac-Man body with mouth
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, PACMAN_RADIUS, this.mouthAngle, Math.PI * 2 - this.mouthAngle);
    ctx.closePath();
    ctx.fillStyle = PACMAN_COLOR;
    ctx.fill();

    // Add subtle inner glow for depth
    const gradient = ctx.createRadialGradient(
      -PACMAN_RADIUS * 0.3, -PACMAN_RADIUS * 0.3, 0,
      0, 0, PACMAN_RADIUS
    );
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, PACMAN_RADIUS * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders Pac-Man to a specific context (for off-screen rendering)
   */
  renderTo(ctx: CanvasRenderingContext2D, x?: number, y?: number): void {
    const prevCtx = this.ctx;
    this.ctx = ctx;
    
    if (x !== undefined && y !== undefined) {
      const prevPos = { ...this._pixelPosition };
      this._pixelPosition = { x, y };
      this.render();
      this._pixelPosition = prevPos;
    } else {
      this.render();
    }
    
    this.ctx = prevCtx;
  }

  // === Public Methods ===

  /**
   * Resets PacMan to spawn position
   */
  reset(): void {
    this._gridPosition = { ...this.maze.pacmanSpawn };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this.targetGridPosition = { ...this._gridPosition };
    this._direction = Direction.NONE;
    this._nextDirection = Direction.NONE;
    this.isMoving = false;
    this.moveProgress = 0;
    this.animationTime = 0;
    this.mouthAngle = MAX_MOUTH_ANGLE * 0.3;
  }

  /**
   * Gets the position PacMan is moving towards (for ghost targeting)
   */
  getTargetPosition(): GridPosition {
    if (this.isMoving) {
      return { ...this.targetGridPosition };
    }
    return { ...this._gridPosition };
  }

  /**
   * Gets the position N tiles ahead of PacMan (for ghost targeting)
   */
  getPositionAhead(tiles: number): GridPosition {
    const vector = DIRECTION_VECTORS[this._direction];
    return {
      x: this._gridPosition.x + vector.x * tiles,
      y: this._gridPosition.y + vector.y * tiles,
    };
  }

  /**
   * Checks if PacMan is at a specific grid position
   */
  isAtPosition(pos: GridPosition): boolean {
    return positionsEqual(this._gridPosition, pos);
  }

  /**
   * Checks if PacMan is currently moving
   */
  get moving(): boolean {
    return this.isMoving;
  }
}
