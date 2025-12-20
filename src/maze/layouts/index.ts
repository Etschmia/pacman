import type { MazeLayout } from '../../types';
import { layout1 } from './layout1';
import { layout2 } from './layout2';
import { layout3 } from './layout3';
import { layout4 } from './layout4';
import { layout5 } from './layout5';

export const MAZE_LAYOUTS: MazeLayout[] = [
  layout1,
  layout2,
  layout3,
  layout4,
  layout5,
];

/**
 * Gets a maze layout by index (wraps around if index > layouts.length)
 */
export function getMazeLayout(index: number): MazeLayout {
  return MAZE_LAYOUTS[index % MAZE_LAYOUTS.length];
}

/**
 * Gets a random maze layout
 */
export function getRandomMazeLayout(): MazeLayout {
  const index = Math.floor(Math.random() * MAZE_LAYOUTS.length);
  return MAZE_LAYOUTS[index];
}

export { layout1, layout2, layout3, layout4, layout5 };
