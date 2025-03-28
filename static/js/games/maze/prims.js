import {
  maze,
  DIRECTIONS,
  carvePassage,
  validNewPassage,
  isValidCell,
  getDelay,
  setIsGenerating,
  GRID_SIZE,
  countAdjacentPassages,
  fillWall,
  visitCell,
  delay,
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

export async function primAlgorithm(generateBtn, algorithmSelect) {
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  const walls = [];

  async function processNextWall() {
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
      await delay(getDelay());
    }
    processNextWall();
  }

  carvePassage(startX, startY);
  addWalls(startX, startY, walls);
  processNextWall();
}

async function removeDeadEnds(generateBtn, algorithmSelect) {
  generateBtn.disabled = true;
  algorithmSelect.disabled = true;
  const queue = [];
  const visited = new Set();
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);

  queue.push([startX, startY, 0]);
  visited.add(`${startX},${startY}`);

  async function processNextCell() {
    if (queue.length === 0) {
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
      return;
    }

    const [x, y, lengthSinceSplit] = queue.shift();
    visitCell(x, y);
    const count = countAdjacentPassages(x, y).count;

    if (count === 1 && lengthSinceSplit === 1) {
      fillWall(x, y);
    } else {
      const newLengthSinceSplit = count > 2 ? 1 : lengthSinceSplit + 1;

      for (const [dx, dy] of DIRECTIONS) {
        const newX = x + dx;
        const newY = y + dy;
        const key = `${newX},${newY}`;
        if (isValidCell(newX, newY) && !maze[newY][newX].isWall && !visited.has(key)) {
          queue.push([newX, newY, newLengthSinceSplit]);
          visited.add(key);
        }
      }
    }
    await delay(getDelay());
    processNextCell();
  }

  processNextCell();
}

export function primsAlgorithm2(generateBtn, algorithmSelect) {
  primAlgorithm(generateBtn, algorithmSelect);
  function waitForButtonEnabled() {
    return new Promise((resolve) => {
      const checkButton = () => {
        if (!generateBtn.disabled) {
          resolve();
        } else {
          setTimeout(checkButton, 100);
        }
      };
      checkButton();
    });
  }

  waitForButtonEnabled().then(() => {
    removeDeadEnds(generateBtn, algorithmSelect);
  });
}
