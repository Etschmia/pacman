import { CellType } from '../types';
import type { MazeData, MazeLayout, GridPosition } from '../types';
import { validateMaze } from './maze-validation';

/**
 * Converts a MazeLayout to MazeData
 */
export function layoutToMazeData(layout: MazeLayout): MazeData {
  const grid = layout.grid.map((row) =>
    row.map((cell) => cell as CellType)
  );

  // Find ghost spawns within the ghost house
  const ghostSpawns = findGhostSpawns(grid, layout.metadata.ghostHouseTopLeft, layout.metadata.ghostHouseSize);

  // Calculate ghost house center
  const ghostHouseCenter: GridPosition = {
    x: layout.metadata.ghostHouseTopLeft[0] + Math.floor(layout.metadata.ghostHouseSize[0] / 2),
    y: layout.metadata.ghostHouseTopLeft[1] + Math.floor(layout.metadata.ghostHouseSize[1] / 2),
  };

  // Convert tunnel positions
  const tunnels: GridPosition[] = layout.metadata.tunnelPositions.map(([x, y]) => ({ x, y }));

  return {
    width: layout.width,
    height: layout.height,
    grid,
    pacmanSpawn: {
      x: layout.metadata.pacmanSpawn[0],
      y: layout.metadata.pacmanSpawn[1],
    },
    ghostSpawns,
    ghostHouseCenter,
    tunnels,
  };
}

/**
 * Finds valid ghost spawn positions within the ghost house
 */
function findGhostSpawns(
  grid: CellType[][],
  topLeft: [number, number],
  size: [number, number]
): GridPosition[] {
  const spawns: GridPosition[] = [];
  const [startX, startY] = topLeft;
  const [width, height] = size;

  for (let y = startY; y < startY + height && spawns.length < 4; y++) {
    for (let x = startX; x < startX + width && spawns.length < 4; x++) {
      if (grid[y]?.[x] === CellType.GHOST_HOUSE) {
        spawns.push({ x, y });
      }
    }
  }

  // If we didn't find 4 spawns, add the center positions
  while (spawns.length < 4) {
    const centerX = startX + Math.floor(width / 2);
    const centerY = startY + Math.floor(height / 2);
    spawns.push({ x: centerX + (spawns.length % 2), y: centerY });
  }

  return spawns;
}

/**
 * Loads and validates a maze layout
 */
export function loadMazeLayout(layout: MazeLayout): {
  data: MazeData | null;
  errors: string[];
} {
  const data = layoutToMazeData(layout);
  const validation = validateMaze(data);

  if (!validation.valid) {
    return {
      data: null,
      errors: validation.errors,
    };
  }

  return {
    data,
    errors: [],
  };
}
