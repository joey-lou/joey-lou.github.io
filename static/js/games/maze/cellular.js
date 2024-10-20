import {
  GRID_SIZE,
  maze,
  carvePassage,
  fillWall,
  getDelay,
  setIsGenerating,
  isPassage,
  countAdjacentPassages,
  countDiagonalPassages,
  addTimeout,
} from './share.js';

export async function generateCellularMaze(generateBtn, algorithmSelect) {
  setIsGenerating(true);
  generateBtn.disabled = true;
  algorithmSelect.disabled = true;

  // Step 1: Randomly populate the grid
  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      if (Math.random() < 0.6) {
        // Adjust this probability to change initial density
        fillWall(x, y);
      } else {
        carvePassage(x, y);
      }
    }
  }

  // Step 2: Apply cellular automaton rules
  for (let iteration = 0; iteration < 10; iteration++) {
    // Adjust number of iterations as needed
    const newMaze = JSON.parse(JSON.stringify(maze));

    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        const diagonalNeighbors = countDiagonalPassages(x, y).count;
        const neighbors = countAdjacentPassages(x, y).count + diagonalNeighbors;
        if (isPassage(x, y)) {
          if (neighbors < 1 || neighbors > 5 || diagonalNeighbors > 2) {
            newMaze[y][x].isWall = true;
          }
        } else {
          if (neighbors === 3) {
            newMaze[y][x].isWall = false;
          }
        }
      }
    }

    // Update the maze and visualize changes
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (newMaze[y][x].isWall !== maze[y][x].isWall) {
          if (newMaze[y][x].isWall) {
            fillWall(x, y);
          } else {
            carvePassage(x, y);
          }
        }
      }
      await new Promise((resolve) => addTimeout(setTimeout(resolve, getDelay())));
    }
  }

  setIsGenerating(false);
  generateBtn.disabled = false;
  algorithmSelect.disabled = false;
}
