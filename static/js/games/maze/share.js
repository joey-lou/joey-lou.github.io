export const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
export const DIAGONALS = [
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
];
export let GRID_SIZE = 30;
export const maze = [];
export let isGenerating = false;
export let generationSpeed = 50;
export let timeouts = [];
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function carvePassage(x, y) {
  maze[y][x].isWall = false;
  maze[y][x].element.classList.add('highlight');
  maze[y][x].element.classList.remove('wall');
  setTimeout(() => {
    maze[y][x].element.classList.remove('highlight');
  }, 300);
}

export function fillWall(x, y) {
  maze[y][x].isWall = true;
  maze[y][x].element.classList.add('wall');
  maze[y][x].element.classList.add('remove');
  setTimeout(() => {
    maze[y][x].element.classList.remove('remove');
  }, 500);
}

export function visitCell(x, y) {
  maze[y][x].element.classList.add('visit');
  setTimeout(() => {
    maze[y][x].element.classList.remove('visit');
  }, 300);
}

export function countDiagonalPassages(x, y) {
  let count = 0;
  let xSum = 0;
  let ySum = 0;
  for (const [dx, dy] of DIAGONALS) {
    const newX = x + dx;
    const newY = y + dy;
    if (isValidCell(newX, newY) && !maze[newY][newX].isWall) {
      count++;
      xSum += dx;
      ySum += dy;
    }
  }
  return { count, xSum, ySum };
}

export function countAdjacentPassages(x, y) {
  let count = 0;
  let xSum = 0;
  let ySum = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const newX = x + dx;
    const newY = y + dy;
    if (isValidCell(newX, newY) && !maze[newY][newX].isWall) {
      count++;
      xSum += dx;
      ySum += dy;
    }
  }
  return { count, xSum, ySum };
}

export function validNewPassage(x, y) {
  const {
    count: diagonalCount,
    xSum: diagonalXSum,
    ySum: diagonalYSum,
  } = countDiagonalPassages(x, y);
  const {
    count: adjacentCount,
    xSum: adjacentXSum,
    ySum: adjacentYSum,
  } = countAdjacentPassages(x, y);
  if (diagonalCount > 1 || adjacentCount > 1) {
    return false;
  }
  if (diagonalCount === 1 && adjacentCount === 1) {
    return diagonalXSum + adjacentXSum !== 0 && diagonalYSum + adjacentYSum !== 0;
  }
  return true;
}

export function isValidCell(x, y) {
  return x > 0 && x < GRID_SIZE - 1 && y > 0 && y < GRID_SIZE - 1;
}

export function isPassage(x, y) {
  return !maze[y][x].isWall;
}

export function getDelay() {
  return 101 - generationSpeed;
}

export function setIsGenerating(value) {
  isGenerating = value;
}

export function setGenerationSpeed(value) {
  generationSpeed = value;
}

// Add this new function
export function setGridSize(size) {
  GRID_SIZE = Math.min(Math.max(30, size), 60);
}

export function clearTimeouts() {
  timeouts.forEach((timeout) => clearTimeout(timeout));
  timeouts = [];
}

export function addTimeout(timeout) {
  timeouts.push(timeout);
}
