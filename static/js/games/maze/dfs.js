import {
  DIRECTIONS,
  shuffleArray,
  carvePassage,
  isValidCell,
  getDelay,
  setIsGenerating,
  validNewPassage,
  countAdjacentPassages,
  isPassage,
  visitCell,
  GRID_SIZE,
  fillWall,
  delay,
} from './share.js';

export async function dfsAlgorithm(generateBtn, algorithmSelect) {
  const stack = [];
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  const visited = new Set();

  stack.push([startX, startY]);
  processNextCell();

  function visit(x, y) {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);

    if (!validNewPassage(x, y)) return false;

    carvePassage(x, y);
    const shuffledDirections = shuffleArray([...DIRECTIONS]);
    for (const [dx, dy] of shuffledDirections) {
      const newX = x + dx;
      const newY = y + dy;
      if (isValidCell(newX, newY) && !visited.has(`${newX},${newY}`)) {
        stack.push([newX, newY]);
      }
    }
    return true;
  }

  async function processNextCell() {
    if (stack.length === 0) {
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
      return;
    }

    const [x, y] = stack.pop();
    if (visit(x, y)) {
      await delay(getDelay());
    }
    processNextCell();
  }
}

async function removeDeadEnds(generateBtn, algorithmSelect) {
  generateBtn.disabled = true;
  algorithmSelect.disabled = true;
  const stack = [];
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  const visited = new Set();

  stack.push([startX, startY, 0]);
  processNextCell();

  function visit(x, y, lengthSinceSplit) {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);
    visitCell(x, y);
    const count = countAdjacentPassages(x, y).count;
    console.log('visit', key, lengthSinceSplit, count);
    if (count === 1 && lengthSinceSplit === 1) {
      fillWall(x, y);
      return true;
    }

    let newLengthSinceSplit = count > 2 ? 1 : lengthSinceSplit + 1;

    for (const [dx, dy] of DIRECTIONS) {
      const newX = x + dx;
      const newY = y + dy;
      if (isValidCell(newX, newY) && !visited.has(`${newX},${newY}`) && isPassage(newX, newY)) {
        stack.push([newX, newY, newLengthSinceSplit]);
      }
    }
    return true;
  }

  async function processNextCell() {
    if (stack.length === 0) {
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
      return;
    }

    const [x, y, lengthSinceSplit] = stack.pop();
    if (visit(x, y, lengthSinceSplit)) {
      await delay(getDelay());
    }
    processNextCell();
  }
}

export function dfsAlgorithm2(generateBtn, algorithmSelect) {
  dfsAlgorithm(generateBtn, algorithmSelect);
  waitForButtonEnabled(generateBtn).then(() => removeDeadEnds(generateBtn, algorithmSelect));
}

function waitForButtonEnabled(generateBtn) {
  return new Promise((resolve) => {
    function checkButton() {
      if (!generateBtn.disabled) {
        resolve();
      } else {
        setTimeout(checkButton, 100);
      }
    }
    checkButton();
  });
}
