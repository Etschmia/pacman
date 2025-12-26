import { FruitType, CellType } from '../types/enums';
import type { GridPosition } from '../types/interfaces';
import { Fruit } from '../entities/Fruit';
import { Maze } from '../maze/Maze';

// Spawn-Konfiguration
const MIN_FRUITS_PER_LEVEL = 2;
const MAX_FRUITS_PER_LEVEL = 7;
const MIN_SPAWN_INTERVAL = 15000; // 15 Sekunden
const MAX_SPAWN_INTERVAL = 30000; // 30 Sekunden
const MIN_FRUIT_LIFETIME = 8000;  // 8 Sekunden
const MAX_FRUIT_LIFETIME = 12000; // 12 Sekunden

// Alle verfügbaren Fruchttypen
const ALL_FRUIT_TYPES: FruitType[] = [
  FruitType.CHERRY,
  FruitType.RASPBERRY,
  FruitType.PEACH,
  FruitType.APPLE,
  FruitType.BANANA,
  FruitType.GRAPES,
  FruitType.MELON,
];

/**
 * FruitManager verwaltet das Spawnen und Verschwinden von Früchten
 * während des Spiels
 */
export class FruitManager {
  private maze: Maze;
  private fruits: Fruit[] = [];
  private ctx: CanvasRenderingContext2D | null = null;

  // Spawn-Tracking
  private fruitsToSpawn: number = 0;
  private fruitsSpawned: number = 0;
  private timeSinceLastSpawn: number = 0;
  private nextSpawnInterval: number = 0;
  private isActive: boolean = false;

  // Positionen die vermieden werden sollen (PacMan, Geister)
  private excludedPositions: GridPosition[] = [];

  constructor(maze: Maze) {
    this.maze = maze;
  }

  setRenderContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.fruits.forEach(fruit => fruit.setRenderContext(ctx));
  }

  /**
   * Startet einen neuen Level - setzt Spawn-Tracking zurück
   */
  startLevel(): void {
    this.fruits = [];
    this.fruitsSpawned = 0;
    this.fruitsToSpawn = this.randomInt(MIN_FRUITS_PER_LEVEL, MAX_FRUITS_PER_LEVEL);
    this.timeSinceLastSpawn = 0;
    this.nextSpawnInterval = this.randomInt(MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL);
    this.isActive = true;
  }

  /**
   * Stoppt das Spawnen (z.B. bei Game Over)
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Setzt die zu vermeidenden Positionen (PacMan, Geister)
   */
  setExcludedPositions(positions: GridPosition[]): void {
    this.excludedPositions = positions;
  }

  /**
   * Aktualisiert alle Früchte und spawnt neue wenn nötig
   */
  update(delta: number): void {
    if (!this.isActive) return;

    // Update existierende Früchte und entferne abgelaufene
    this.fruits = this.fruits.filter(fruit => {
      fruit.update(delta);
      return !fruit.isExpired;
    });

    // Spawn-Timer aktualisieren
    if (this.fruitsSpawned < this.fruitsToSpawn) {
      this.timeSinceLastSpawn += delta;

      if (this.timeSinceLastSpawn >= this.nextSpawnInterval) {
        this.spawnFruit();
        this.timeSinceLastSpawn = 0;
        this.nextSpawnInterval = this.randomInt(MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL);
      }
    }
  }

  /**
   * Spawnt eine zufällige Frucht an einer gültigen Position
   */
  private spawnFruit(): void {
    const position = this.findValidSpawnPosition();
    if (!position) return; // Keine gültige Position gefunden

    const fruitType = this.getRandomFruitType();
    const lifetime = this.randomInt(MIN_FRUIT_LIFETIME, MAX_FRUIT_LIFETIME);

    const fruit = new Fruit({
      type: fruitType,
      gridPosition: position,
      lifetime: lifetime,
      ctx: this.ctx ?? undefined,
    });

    this.fruits.push(fruit);
    this.fruitsSpawned++;
  }

  /**
   * Findet eine gültige Spawn-Position
   * - Muss walkable sein
   * - Darf keine Wand, Ghost House oder Ghost Door sein
   * - Sollte nicht auf PacMan oder Geistern sein
   */
  private findValidSpawnPosition(): GridPosition | null {
    const validPositions: GridPosition[] = [];
    const grid = this.maze.getGrid();

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cellType = grid[y][x];

        // Nur auf begehbaren Pfaden spawnen (keine Wände, Ghost House, etc.)
        if (
          cellType === CellType.PATH ||
          cellType === CellType.PELLET ||
          cellType === CellType.POWER_PELLET ||
          cellType === CellType.EMPTY
        ) {
          const pos = { x, y };

          // Nicht auf bereits existierenden Früchten
          if (this.fruits.some(f => f.isAtPosition(pos))) {
            continue;
          }

          // Nicht auf excluded Positionen (PacMan, Geister)
          if (this.excludedPositions.some(ep => ep.x === x && ep.y === y)) {
            continue;
          }

          validPositions.push(pos);
        }
      }
    }

    if (validPositions.length === 0) {
      return null;
    }

    // Zufällige Position wählen
    const index = Math.floor(Math.random() * validPositions.length);
    return validPositions[index];
  }

  /**
   * Wählt einen zufälligen Fruchttyp
   */
  private getRandomFruitType(): FruitType {
    const index = Math.floor(Math.random() * ALL_FRUIT_TYPES.length);
    return ALL_FRUIT_TYPES[index];
  }

  /**
   * Prüft ob eine Frucht an der gegebenen Position ist und sammelt sie ein
   * @returns Die eingesammelte Frucht oder null
   */
  collectFruitAt(pos: GridPosition): Fruit | null {
    const index = this.fruits.findIndex(fruit => fruit.isAtPosition(pos));
    if (index === -1) return null;

    const fruit = this.fruits[index];
    this.fruits.splice(index, 1);
    return fruit;
  }

  /**
   * Gibt alle aktiven Früchte zurück
   */
  getFruits(): readonly Fruit[] {
    return this.fruits;
  }

  /**
   * Rendert alle Früchte
   */
  render(): void {
    this.fruits.forEach(fruit => fruit.render());
  }

  /**
   * Setzt den Manager für einen neuen Level zurück
   */
  reset(newMaze?: Maze): void {
    if (newMaze) {
      this.maze = newMaze;
    }
    this.fruits = [];
    this.fruitsSpawned = 0;
    this.timeSinceLastSpawn = 0;
    this.isActive = false;
  }

  // === Hilfsfunktionen ===

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // === Statistiken (für Debugging/Testing) ===

  get activeFruitCount(): number {
    return this.fruits.length;
  }

  get totalFruitsToSpawn(): number {
    return this.fruitsToSpawn;
  }

  get fruitsAlreadySpawned(): number {
    return this.fruitsSpawned;
  }
}
