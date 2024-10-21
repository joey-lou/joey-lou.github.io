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
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      carvePassage(i, j);
    }
  }

  await delay(getDelay());

  // base case
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) carvePassage(i, j);
      else fillWall(i, j);
    }
  }

  // size is the same for x and y
  // also this marks the boundary of current recursive grid
  let currentSize = 2;
  while (currentSize < GRID_SIZE) {
    let xoffsets = [0, currentSize];
    let yoffsets = [0, currentSize];

    for (let xoffset of xoffsets) {
      for (let yoffset of yoffsets) {
        if (xoffset === 0 && yoffset === 0) continue;
        // Randomly choose rotation (0, 90, 180, or 270 degrees)
        const rotation = Math.floor(Math.random() * 4) * 90;

        for (let i = 0; i < currentSize + 1; i++) {
          for (let j = 0; j < currentSize + 1; j++) {
            let x, y;

            // Apply rotation
            switch (rotation) {
              case 0:
                x = i + xoffset;
                y = j + yoffset;
                break;
              case 90:
                x = currentSize - j + xoffset;
                y = i + yoffset;
                break;
              case 180:
                x = currentSize - i + xoffset;
                y = currentSize - j + yoffset;
                break;
              case 270:
                x = j + xoffset;
                y = currentSize - i + yoffset;
                break;
            }

            if (x < GRID_SIZE && y < GRID_SIZE) {
              if (isPassage(i, j)) {
                carvePassage(x, y);
              } else {
                fillWall(x, y);
              }
            }
          }
        }
        await delay(getDelay());
      }
      await delay(getDelay());
    }

    // randomly clear three junctions
    let jointEnds = [
      [1, currentSize, currentSize - 1, currentSize],
      [currentSize, 1, currentSize, currentSize - 1],
      [currentSize, currentSize * 2, currentSize, currentSize + 1],
      [currentSize * 2, currentSize, currentSize + 1, currentSize],
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
    currentSize *= 2;
  }

  // Seal border with walls and open passages one cell inner if needed
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    if (!isWall(0, i)) carvePassage(0, i);
    if (!isWall(GRID_SIZE - 1, i)) carvePassage(GRID_SIZE - 2, i);
    if (!isWall(i, 0)) carvePassage(i, 0);
    if (!isWall(i, GRID_SIZE - 1)) carvePassage(i, GRID_SIZE - 2);

    fillWall(0, i);
    fillWall(GRID_SIZE - 1, i);
    fillWall(i, 0);
    fillWall(i, GRID_SIZE - 1);
    await delay(getDelay());
  }
  fillWall(GRID_SIZE - 1, GRID_SIZE - 1);

  setIsGenerating(false);
  generateBtn.disabled = false;
  algorithmSelect.disabled = false;
}
