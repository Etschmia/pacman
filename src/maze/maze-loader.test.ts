import { describe, it, expect } from 'vitest';
import { layoutToMazeData, loadMazeLayout } from './maze-loader';
import { MAZE_LAYOUTS, getMazeLayout, getRandomMazeLayout } from './layouts';
import { validateMaze } from './maze-validation';

describe('maze-loader', () => {
  describe('layoutToMazeData', () => {
    it('should convert layout to maze data', () => {
      const layout = MAZE_LAYOUTS[0];
      const data = layoutToMazeData(layout);

      expect(data.width).toBe(layout.width);
      expect(data.height).toBe(layout.height);
      expect(data.grid.length).toBe(layout.height);
      expect(data.grid[0].length).toBe(layout.width);
      expect(data.pacmanSpawn.x).toBe(layout.metadata.pacmanSpawn[0]);
      expect(data.pacmanSpawn.y).toBe(layout.metadata.pacmanSpawn[1]);
      expect(data.ghostSpawns.length).toBe(4);
      expect(data.tunnels.length).toBe(layout.metadata.tunnelPositions.length);
    });
  });

  describe('loadMazeLayout', () => {
    it('should load and validate all predefined layouts', () => {
      for (const layout of MAZE_LAYOUTS) {
        const result = loadMazeLayout(layout);
        expect(result.errors).toHaveLength(0);
        expect(result.data).not.toBeNull();
      }
    });
  });

  describe('getMazeLayout', () => {
    it('should return layout by index', () => {
      expect(getMazeLayout(0)).toBe(MAZE_LAYOUTS[0]);
      expect(getMazeLayout(1)).toBe(MAZE_LAYOUTS[1]);
    });

    it('should wrap around for large indices', () => {
      expect(getMazeLayout(5)).toBe(MAZE_LAYOUTS[0]);
      expect(getMazeLayout(6)).toBe(MAZE_LAYOUTS[1]);
    });
  });

  describe('getRandomMazeLayout', () => {
    it('should return a valid layout', () => {
      const layout = getRandomMazeLayout();
      expect(MAZE_LAYOUTS).toContain(layout);
    });
  });

  describe('all layouts validation', () => {
    MAZE_LAYOUTS.forEach((layout, index) => {
      it(`layout ${index + 1} (${layout.name}) should be valid`, () => {
        const data = layoutToMazeData(layout);
        const result = validateMaze(data);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
