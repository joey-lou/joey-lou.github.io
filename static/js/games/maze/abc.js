import {
  GRID_SIZE,
  carvePassage,
  fillWall,
  setIsGenerating,
  getDelay,
  delay,
  isValidCell,
  isPassage,
  isWall,
  shuffleArray,
  countAdjacentPassages,
} from './share.js';

export async function fractalAlgorithm(generateBtn, algorithmSelect) {
  setIsGenerating(true);
  generateBtn.disabled = true;
  algorithmSelect.disabled = true;

  // Initialize the grid with walls
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      fillWall(x, y);
    }
  }

  await delay(getDelay());

  // Generate the fractal maze
  await generateFractalMaze(0, 0, GRID_SIZE, GRID_SIZE);

  setIsGenerating(false);
  generateBtn.disabled = false;
  algorithmSelect.disabled = false;
}

async function generateFractalMaze(startX, startY, width, height) {
  if (width <= 2 || height <= 2) {
    return;
  }

  // Find the largest power of two that fits in the current grid
  const size = Math.pow(2, Math.floor(Math.log2(Math.min(width, height))));

  // Generate the fractal maze in the top-left corner
  await generateFractalQuadrant(startX, startY, size);

  // Recursively generate mazes in the remaining areas
  if (width > size) {
    await generateFractalMaze(startX + size, startY, width - size, size);
  }
  if (height > size) {
    await generateFractalMaze(startX, startY + size, width, height - size);
  }

  // Connect the quadrants
  await connectQuadrants(startX, startY, width, height, size);
}

async function generateFractalQuadrant(startX, startY, size) {
  if (size <= 2) {
    carvePassage(startX, startY);
    return;
  }

  const halfSize = size / 2;

  // Recursively generate four smaller mazes
  await generateFractalQuadrant(startX, startY, halfSize);
  await generateFractalQuadrant(startX + halfSize, startY, halfSize);
  await generateFractalQuadrant(startX, startY + halfSize, halfSize);
  await generateFractalQuadrant(startX + halfSize, startY + halfSize, halfSize);

  // Connect the quadrants
  let jointEnds = [
    [startX, startY + halfSize, startX + halfSize, startY + halfSize],
    [startX + halfSize, startY, startX + halfSize, startY + halfSize],
    [startX, startY + halfSize, startX + halfSize, startY],
    [startX + halfSize, startY + halfSize, startX + halfSize, startY],
  ];
  jointEnds = shuffleArray(jointEnds);
  for (let i = 0; i < 3; i++) {
    let [x1, y1, x2, y2] = jointEnds[i];
    for (let j = 0; j < 10; j++) {
      let x = Math.floor(Math.random() * (x2 - x1) + x1);
      let y = Math.floor(Math.random() * (y2 - y1) + y1);
      if (countAdjacentPassages(x, y).count === 2) {
        carvePassage(x, y);
        break;
      }
    }
    await delay(getDelay());
  }
}

async function connectQuadrants(startX, startY, width, height, size) {
  if (width > size) {
    const y = startY + Math.floor(Math.random() * (Math.min(height, size) - 2)) + 1;
    carvePassage(startX + size - 1, y);
    carvePassage(startX + size, y);
  }

  if (height > size) {
    const x = startX + Math.floor(Math.random() * (Math.min(width, size) - 2)) + 1;
    carvePassage(x, startY + size - 1);
    carvePassage(x, startY + size);
  }

  await delay(getDelay());
}
