import {
  DIRECTIONS,
  shuffleArray,
  carvePassage,
  isValidCell,
  getDelay,
  setIsGenerating,
  validNewPassage,
} from './share.js';

export function dfsAlgorithm(generateBtn, algorithmSelect) {
  const stack = [];
  const startX = 1;
  const startY = 1;
  const visited = new Set();

  function visit(x, y) {
    const key = `${x},${y}`;
    if (visited.has(key)) return;
    visited.add(key);

    if (validNewPassage(x, y)) {
      carvePassage(x, y);
      const shuffledDirections = shuffleArray([...DIRECTIONS]);
      for (const [dx, dy] of shuffledDirections) {
        const newX = x + dx;
        const newY = y + dy;
        if (isValidCell(newX, newY) && !visited.has(`${newX},${newY}`)) {
          stack.push([newX, newY]);
        }
      }
    }
  }

  function processNextCell() {
    if (stack.length === 0) {
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
      return;
    }

    visit(...stack.pop());
    setTimeout(processNextCell, getDelay());
  }

  visit(startX, startY);
  setTimeout(processNextCell, getDelay());
}
