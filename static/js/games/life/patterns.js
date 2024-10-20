import { GRID_SIZE, setCellAlive } from './index.js';

export function populatePattern(pattern) {
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);

  switch (pattern) {
    case 'glider':
      setCellAlive(centerX, centerY, true);
      setCellAlive(centerX + 1, centerY + 1, true);
      setCellAlive(centerX + 1, centerY + 2, true);
      setCellAlive(centerX, centerY + 2, true);
      setCellAlive(centerX - 1, centerY + 2, true);
      break;
    case 'spaceship':
      setCellAlive(centerX - 1, centerY, true);
      setCellAlive(centerX, centerY, true);
      setCellAlive(centerX + 1, centerY, true);
      setCellAlive(centerX + 2, centerY, true);
      setCellAlive(centerX - 2, centerY + 1, true);
      setCellAlive(centerX + 2, centerY + 1, true);
      setCellAlive(centerX + 2, centerY + 2, true);
      setCellAlive(centerX - 1, centerY + 3, true);
      setCellAlive(centerX + 1, centerY + 3, true);
      break;
    case 'glider-gun':
      // Gosper Glider Gun pattern
      const gunPattern = [
        [0, 4],
        [0, 5],
        [1, 4],
        [1, 5],
        [10, 4],
        [10, 5],
        [10, 6],
        [11, 3],
        [11, 7],
        [12, 2],
        [12, 8],
        [13, 2],
        [13, 8],
        [14, 5],
        [15, 3],
        [15, 7],
        [16, 4],
        [16, 5],
        [16, 6],
        [17, 5],
        [20, 2],
        [20, 3],
        [20, 4],
        [21, 2],
        [21, 3],
        [21, 4],
        [22, 1],
        [22, 5],
        [24, 0],
        [24, 1],
        [24, 5],
        [24, 6],
        [34, 2],
        [34, 3],
        [35, 2],
        [35, 3],
      ];
      gunPattern.forEach(([x, y]) =>
        setCellAlive(
          centerX - Math.floor(GRID_SIZE / 3) + x,
          centerY - Math.floor(GRID_SIZE / 3) + y,
          true
        )
      );
      break;
    case 'pulsar':
      const pulsarPattern = [
        [-6, -4],
        [-6, -3],
        [-6, -2],
        [-4, -6],
        [-3, -6],
        [-2, -6],
        [-1, -4],
        [-1, -3],
        [-1, -2],
        [-4, -1],
        [-3, -1],
        [-2, -1],
        [6, 4],
        [6, 3],
        [6, 2],
        [4, 6],
        [3, 6],
        [2, 6],
        [1, 4],
        [1, 3],
        [1, 2],
        [4, 1],
        [3, 1],
        [2, 1],
        [-6, 4],
        [-6, 3],
        [-6, 2],
        [-4, 6],
        [-3, 6],
        [-2, 6],
        [-1, 4],
        [-1, 3],
        [-1, 2],
        [-4, 1],
        [-3, 1],
        [-2, 1],
        [6, -4],
        [6, -3],
        [6, -2],
        [4, -6],
        [3, -6],
        [2, -6],
        [1, -4],
        [1, -3],
        [1, -2],
        [4, -1],
        [3, -1],
        [2, -1],
      ];
      pulsarPattern.forEach(([x, y]) => setCellAlive(centerX + x, centerY + y, true));
      break;
  }
}
