import { Pacman, Ghost, Food, Wall } from './sprites.js';
import {
  GRID_SIZE,
  PACMAN_SPEED,
  GHOST_SPEED,
  GAME_SPEED,
  WALL_DENSITY,
  MIN_PATH_WIDTH,
} from './config.js';

export function generateRandomWalls() {
  const wallLayout = Array(GRID_SIZE)
    .fill()
    .map(() => Array(GRID_SIZE).fill(false));

  // Generate initial random walls
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (Math.random() < WALL_DENSITY) {
        wallLayout[y][x] = true;
      }
    }
  }

  // Ensure there are paths
  for (let y = MIN_PATH_WIDTH; y < GRID_SIZE - MIN_PATH_WIDTH; y += MIN_PATH_WIDTH) {
    for (let x = 0; x < GRID_SIZE; x++) {
      wallLayout[y][x] = false;
    }
  }
  for (let x = MIN_PATH_WIDTH; x < GRID_SIZE - MIN_PATH_WIDTH; x += MIN_PATH_WIDTH) {
    for (let y = 0; y < GRID_SIZE; y++) {
      wallLayout[y][x] = false;
    }
  }

  // Clear walls around Pacman and ghost starting positions
  const clearPositions = [
    [1, GRID_SIZE - 2], // Pacman
    [1, 1],
    [GRID_SIZE - 2, 1],
    [1, GRID_SIZE - 2],
    [GRID_SIZE - 2, GRID_SIZE - 2], // Ghosts
  ];
  clearPositions.forEach(([x, y]) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx >= 0 && x + dx < GRID_SIZE && y + dy >= 0 && y + dy < GRID_SIZE) {
          wallLayout[y + dy][x + dx] = false;
        }
      }
    }
  });

  return wallLayout;
}
