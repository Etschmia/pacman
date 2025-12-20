import { CellType } from '../types';
import type { GridPosition, MazeData } from '../types';
import { isInBounds } from './maze-utils';

/**
 * Checks if a cell type is walkable for connectivity validation
 * (includes ghost house and ghost door for connectivity check)
 */
function isWalkableForConnectivity(cellType: CellType): boolean {
  return cellType !== CellType.WALL;
}

/**
 * Validates that all walkable cells are reachable from the Pac-Man spawn point
 * Uses BFS to check connectivity
 */
export function validateMazeConnectivity(data: MazeData): boolean {
  const { width, height, grid, pacmanSpawn } = data;
  
  // Check if spawn is valid
  if (!isInBounds(pacmanSpawn, width, height)) {
    return false;
  }
  
  if (!isWalkableForConnectivity(grid[pacmanSpawn.y][pacmanSpawn.x])) {
    return false;
  }

  // BFS to find all reachable cells
  const visited = new Set<string>();
  const queue: GridPosition[] = [pacmanSpawn];
  const key = (pos: GridPosition) => `${pos.x},${pos.y}`;
  
  visited.add(key(pacmanSpawn));

  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const dir of directions) {
      const next: GridPosition = {
        x: current.x + dir.x,
        y: current.y + dir.y,
      };

      if (!isInBounds(next, width, height)) {
        continue;
      }

      const nextKey = key(next);
      if (visited.has(nextKey)) {
        continue;
      }

      if (isWalkableForConnectivity(grid[next.y][next.x])) {
        visited.add(nextKey);
        queue.push(next);
      }
    }
  }

  // Check if all walkable cells (excluding ghost house interior) are reachable
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellType = grid[y][x];
      // Only check PATH, PELLET, POWER_PELLET, TUNNEL, EMPTY cells
      // Ghost house cells don't need to be reachable from Pac-Man spawn
      if (
        (cellType === CellType.PATH ||
          cellType === CellType.PELLET ||
          cellType === CellType.POWER_PELLET ||
          cellType === CellType.TUNNEL ||
          cellType === CellType.EMPTY) &&
        !visited.has(key({ x, y }))
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates that a ghost house exists with at least 4 cells
 */
export function validateGhostHouse(data: MazeData): boolean {
  const { width, height, grid, ghostHouseCenter } = data;
  
  if (!isInBounds(ghostHouseCenter, width, height)) {
    return false;
  }

  // Count ghost house cells using BFS from center
  const visited = new Set<string>();
  const queue: GridPosition[] = [ghostHouseCenter];
  const key = (pos: GridPosition) => `${pos.x},${pos.y}`;
  
  let ghostHouseCells = 0;

  // Check if center is ghost house
  const centerCell = grid[ghostHouseCenter.y][ghostHouseCenter.x];
  if (centerCell !== CellType.GHOST_HOUSE && centerCell !== CellType.GHOST_DOOR) {
    return false;
  }

  visited.add(key(ghostHouseCenter));

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentCell = grid[current.y][current.x];
    
    if (currentCell === CellType.GHOST_HOUSE || currentCell === CellType.GHOST_DOOR) {
      ghostHouseCells++;
    }

    for (const dir of directions) {
      const next: GridPosition = {
        x: current.x + dir.x,
        y: current.y + dir.y,
      };

      if (!isInBounds(next, width, height)) {
        continue;
      }

      const nextKey = key(next);
      if (visited.has(nextKey)) {
        continue;
      }

      const nextCell = grid[next.y][next.x];
      if (nextCell === CellType.GHOST_HOUSE || nextCell === CellType.GHOST_DOOR) {
        visited.add(nextKey);
        queue.push(next);
      }
    }
  }

  return ghostHouseCells >= 4;
}

/**
 * Validates that at least two tunnels exist on opposite sides
 */
export function validateTunnels(data: MazeData): boolean {
  const { tunnels, width, height } = data;
  
  if (tunnels.length < 2) {
    return false;
  }

  // Check for tunnels on opposite sides
  let hasLeftTunnel = false;
  let hasRightTunnel = false;
  let hasTopTunnel = false;
  let hasBottomTunnel = false;

  for (const tunnel of tunnels) {
    if (!isInBounds(tunnel, width, height)) {
      continue;
    }
    
    if (tunnel.x === 0) hasLeftTunnel = true;
    if (tunnel.x === width - 1) hasRightTunnel = true;
    if (tunnel.y === 0) hasTopTunnel = true;
    if (tunnel.y === height - 1) hasBottomTunnel = true;
  }

  // Must have tunnels on opposite sides (left-right or top-bottom)
  return (hasLeftTunnel && hasRightTunnel) || (hasTopTunnel && hasBottomTunnel);
}

/**
 * Validates a complete maze
 */
export function validateMaze(data: MazeData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateMazeConnectivity(data)) {
    errors.push('Maze has unreachable areas');
  }

  if (!validateGhostHouse(data)) {
    errors.push('Ghost house is invalid or too small (needs at least 4 cells)');
  }

  if (!validateTunnels(data)) {
    errors.push('Maze needs at least two tunnels on opposite sides');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
