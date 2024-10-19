import {
  maze,
  DIRECTIONS,
  carvePassage,
  validNewPassage,
  isValidCell,
  getDelay,
  setIsGenerating,
} from './share.js';

function addWalls(x, y, walls) {
  for (const [dx, dy] of DIRECTIONS) {
    const newX = x + dx;
    const newY = y + dy;
    if (isValidCell(newX, newY) && maze[newY][newX].isWall) {
      walls.push([newX, newY]);
    }
  }
}

export function primAlgorithm(generateBtn, algorithmSelect) {
  const startX = 1;
  const startY = 1;
  const walls = [];

  carvePassage(startX, startY);
  addWalls(startX, startY, walls);

  function processNextWall() {
    if (walls.length === 0) {
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
      return;
    }

    const randomIndex = Math.floor(Math.random() * walls.length);
    const [x, y] = walls[randomIndex];
    walls.splice(randomIndex, 1);

    if (validNewPassage(x, y)) {
      carvePassage(x, y);
      addWalls(x, y, walls);
    }

    setTimeout(processNextWall, getDelay());
  }

  setTimeout(processNextWall, getDelay());
}
