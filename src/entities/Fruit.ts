import { FruitType } from '../types/enums';
import type { GridPosition, PixelPosition, FruitConfig } from '../types/interfaces';
import { CELL_SIZE, gridToPixel } from '../maze/maze-utils';

// Punktwerte für jede Frucht
export const FRUIT_POINTS: Record<FruitType, number> = {
  [FruitType.CHERRY]: 50,
  [FruitType.RASPBERRY]: 100,
  [FruitType.PEACH]: 150,
  [FruitType.APPLE]: 200,
  [FruitType.BANANA]: 250,
  [FruitType.GRAPES]: 350,
  [FruitType.MELON]: 450,
};

// Standard-Lebensdauer einer Frucht (8-12 Sekunden)
const DEFAULT_LIFETIME = 10000;
const BLINK_START_TIME = 2000; // Letzte 2 Sekunden blinken

/**
 * Fruit Entity - Sammelbare Bonusobjekte die zufällig erscheinen
 * und nach einer Zeit wieder verschwinden
 */
export class Fruit {
  private readonly _type: FruitType;
  private readonly _gridPosition: GridPosition;
  private readonly _pixelPosition: PixelPosition;
  private readonly _lifetime: number;
  private _elapsedTime: number = 0;
  private _isExpired: boolean = false;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config: FruitConfig) {
    this._type = config.type;
    this._gridPosition = { ...config.gridPosition };
    this._pixelPosition = gridToPixel(this._gridPosition);
    this._lifetime = config.lifetime ?? DEFAULT_LIFETIME;
    this.ctx = config.ctx ?? null;
  }

  get type(): FruitType {
    return this._type;
  }

  get gridPosition(): GridPosition {
    return { ...this._gridPosition };
  }

  get pixelPosition(): PixelPosition {
    return { ...this._pixelPosition };
  }

  get points(): number {
    return FRUIT_POINTS[this._type];
  }

  get isExpired(): boolean {
    return this._isExpired;
  }

  get remainingTime(): number {
    return Math.max(0, this._lifetime - this._elapsedTime);
  }

  setRenderContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  update(delta: number): void {
    this._elapsedTime += delta;
    if (this._elapsedTime >= this._lifetime) {
      this._isExpired = true;
    }
  }

  isAtPosition(pos: GridPosition): boolean {
    return this._gridPosition.x === pos.x && this._gridPosition.y === pos.y;
  }

  render(): void {
    if (!this.ctx || this._isExpired) return;

    // Blink-Effekt in den letzten Sekunden
    if (this.remainingTime <= BLINK_START_TIME) {
      const blinkRate = 150; // ms
      if (Math.floor(this._elapsedTime / blinkRate) % 2 === 0) {
        return; // Unsichtbar während des Blinkens
      }
    }

    const x = this._pixelPosition.x;
    const y = this._pixelPosition.y;

    switch (this._type) {
      case FruitType.CHERRY:
        this.renderCherry(x, y);
        break;
      case FruitType.RASPBERRY:
        this.renderRaspberry(x, y);
        break;
      case FruitType.PEACH:
        this.renderPeach(x, y);
        break;
      case FruitType.APPLE:
        this.renderApple(x, y);
        break;
      case FruitType.BANANA:
        this.renderBanana(x, y);
        break;
      case FruitType.GRAPES:
        this.renderGrapes(x, y);
        break;
      case FruitType.MELON:
        this.renderMelon(x, y);
        break;
    }
  }

  private renderCherry(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.7;

    // Glow-Effekt
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Zwei Kirschen
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - size * 0.35, y, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.15, y, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Stiel
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.2, y - size * 0.15);
    ctx.quadraticCurveTo(x, y - size * 0.5, x + size * 0.2, y - size * 0.15);
    ctx.stroke();
  }

  private renderRaspberry(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.6;

    // Glow
    ctx.fillStyle = 'rgba(255, 0, 128, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Beeren-Struktur (mehrere kleine Kreise)
    ctx.fillStyle = '#FF0080';
    const positions = [
      [0, -0.3], [-0.25, -0.1], [0.25, -0.1],
      [-0.15, 0.15], [0.15, 0.15], [0, 0.35]
    ];
    for (const [dx, dy] of positions) {
      ctx.beginPath();
      ctx.arc(x + dx * size, y + dy * size, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blatt
    ctx.fillStyle = '#00CC00';
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.5, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderPeach(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.65;

    // Glow
    ctx.fillStyle = 'rgba(255, 180, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Pfirsich-Körper (leicht ovale Form)
    ctx.fillStyle = '#FFAA66';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.5, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rötliche Seite
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(x + size * 0.15, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.25, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Blatt
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.ellipse(x + size * 0.1, y - size * 0.5, size * 0.2, size * 0.1, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderApple(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.65;

    // Glow
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Apfel-Körper
    ctx.fillStyle = '#00DD00';
    ctx.beginPath();
    ctx.arc(x, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Stiel
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.35);
    ctx.lineTo(x, y - size * 0.55);
    ctx.stroke();

    // Blatt
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.ellipse(x + size * 0.15, y - size * 0.5, size * 0.15, size * 0.08, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBanana(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.7;

    // Glow
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Banane (gebogene Form)
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y + size * 0.3);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.2, x - size * 0.2, y - size * 0.4);
    ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.5, x + size * 0.4, y - size * 0.2);
    ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.1, x, y + size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.2, y + size * 0.3, x - size * 0.4, y + size * 0.3);
    ctx.fill();

    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.25, y - size * 0.1);
    ctx.quadraticCurveTo(x, y - size * 0.3, x + size * 0.2, y - size * 0.2);
    ctx.stroke();

    // Braune Spitzen
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x - size * 0.35, y + size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderGrapes(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.6;

    // Glow
    ctx.fillStyle = 'rgba(128, 0, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Trauben (Pyramiden-Anordnung)
    ctx.fillStyle = '#8800FF';
    const grapePositions = [
      [0, -0.35],                    // Oben
      [-0.2, -0.1], [0.2, -0.1],    // Zweite Reihe
      [-0.3, 0.15], [0, 0.15], [0.3, 0.15], // Dritte Reihe
      [-0.15, 0.4], [0.15, 0.4]     // Unten
    ];
    for (const [dx, dy] of grapePositions) {
      ctx.beginPath();
      ctx.arc(x + dx * size, y + dy * size, size * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Mini-Highlight auf jeder Traube
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x + dx * size - size * 0.05, y + dy * size - size * 0.05, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8800FF';
    }

    // Stiel
    ctx.strokeStyle = '#00AA00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x, y - size * 0.7);
    ctx.stroke();
  }

  private renderMelon(x: number, y: number): void {
    const ctx = this.ctx!;
    const size = CELL_SIZE * 0.7;

    // Glow
    ctx.fillStyle = 'rgba(0, 200, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Melonen-Körper (oval)
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.55, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Streifen
    ctx.strokeStyle = '#006600';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * size * 0.15, y - size * 0.4);
      ctx.quadraticCurveTo(x + i * size * 0.18, y, x + i * size * 0.15, y + size * 0.4);
      ctx.stroke();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, y - size * 0.15, size * 0.15, size * 0.1, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
