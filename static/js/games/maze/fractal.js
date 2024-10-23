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

async function generateSquareFractal(startX, startY, size) {
  if (size <= 2) {
    return;
  }

  for (let i = startX; i < startX + 3; i++) {
    for (let j = startY; j < startY + 3; j++) {
      if (i === startX + 1 && j === startY + 1) carvePassage(i, j);
      else fillWall(i, j);
      await delay(getDelay());
    }
  }

  let endIdx = 2;
  while (endIdx < size) {
    let xoffsets = [startX, startX + endIdx];
    let yoffsets = [startY, startY + endIdx];

    for (let xoffset of xoffsets) {
      for (let yoffset of yoffsets) {
        if (xoffset === startX && yoffset === startY) continue;
        // Randomly choose rotation (0, 90, 180, or 270 degrees)
        const rotation = Math.floor(Math.random() * 4) * 90;

        for (let i = 0; i < endIdx + 1; i++) {
          for (let j = 0; j < endIdx + 1; j++) {
            let x, y;

            // Apply rotation
            switch (rotation) {
              case 0:
                x = i + xoffset;
                y = j + yoffset;
                break;
              case 90:
                x = endIdx - j + xoffset;
                y = i + yoffset;
                break;
              case 180:
                x = endIdx - i + xoffset;
                y = endIdx - j + yoffset;
                break;
              case 270:
                x = j + xoffset;
                y = endIdx - i + yoffset;
                break;
            }

            if (x < GRID_SIZE && y < GRID_SIZE) {
              if (isPassage(i + startX, j + startY)) {
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
      [startX + 1, startY + endIdx, startX + endIdx - 1, startY + endIdx],
      [startX + endIdx, startY + 1, startX + endIdx, startY + endIdx - 1],
      [startX + endIdx, startY + endIdx * 2, startX + endIdx, startY + endIdx + 1],
      [startX + endIdx * 2, startY + endIdx, startX + endIdx + 1, startY + endIdx],
    ];

    jointEnds = shuffleArray(jointEnds);
    for (let i = 0; i < 3; i++) {
      let [x1, y1, x2, y2] = jointEnds[i];
      if (!(await carveBoarder(x1, y1, x2, y2)))
        console.log('no boarder carved between', x1, y1, x2, y2);
      await delay(getDelay());
    }
    endIdx *= 2;
  }
}

async function carveBoarder(x1, y1, x2, y2) {
  for (let j = 0; j < 10; j++) {
    let x = Math.floor(Math.random() * (x2 - x1) + x1);
    let y = Math.floor(Math.random() * (y2 - y1) + y1);
    if (countAdjacentPassages(x, y).count === 2) {
      carvePassage(x, y);
      return true;
    }
  }
  return false;
}

async function generateFractalMaze(startX, startY, width, height) {
  if (width <= 2 || height <= 2) {
    return;
  }

  const size = Math.pow(2, Math.floor(Math.log2(Math.min(width, height))));
  await generateSquareFractal(startX, startY, size);

  const nextStartX = startX + size;
  const nextStartY = startY + size;
  const remainingWidth = width - size;
  const remainingHeight = height - size;

  if (remainingWidth > 0) {
    await generateFractalMaze(nextStartX, startY, remainingWidth, size);
    await carveBoarder(nextStartX, startY, nextStartX, nextStartY);
    await delay(getDelay());
  }
  if (remainingHeight > 0) {
    await generateFractalMaze(startX, nextStartY, size, remainingHeight);
    await carveBoarder(startX, nextStartY, nextStartX, nextStartY);
    await delay(getDelay());
  }
  if (remainingWidth > 0 && remainingHeight > 0) {
    await generateFractalMaze(nextStartX, nextStartY, remainingWidth, remainingHeight);
    await carveBoarder(nextStartX, nextStartY, width, nextStartY);
    await delay(getDelay());
    await carveBoarder(nextStartX, nextStartY, nextStartX, height);
    await delay(getDelay());
  }
}

export async function fractalAlgorithm(generateBtn, algorithmSelect) {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      carvePassage(i, j);
    }
  }

  await delay(getDelay());
  await generateFractalMaze(0, 0, GRID_SIZE, GRID_SIZE);

  setIsGenerating(false);
  generateBtn.disabled = false;
  algorithmSelect.disabled = false;
}
