export class MazeGenerator {
  constructor(mazeSize) {
    this.mazeSize = mazeSize;
  }

  generateDFS() {
    const maze = this.initializeMazeForGeneration();
    const visited = new Set();
    const stack = [];

    const startX = Math.floor(this.mazeSize / 2);
    const startY = Math.floor(this.mazeSize / 2);

    stack.push([startX, startY]);

    while (stack.length > 0) {
      const [x, y] = stack.pop();

      if (this.visit(maze, visited, x, y)) {
        const neighbors = this.getShuffledNeighbors(x, y, visited);
        for (const [nx, ny] of neighbors) {
          if (this.isValidCell(nx, ny) && !visited.has(`${nx},${ny}`)) {
            stack.push([nx, ny]);
          }
        }
      }
    }

    return maze;
  }

  initializeMazeForGeneration() {
    const maze = [];
    for (let y = 0; y < this.mazeSize; y++) {
      maze[y] = [];
      for (let x = 0; x < this.mazeSize; x++) {
        if (x === 0 || x === this.mazeSize - 1 || y === 0 || y === this.mazeSize - 1) {
          maze[y][x] = 5; // Border walls
        } else {
          const wallTypes = [1, 2, 3, 4];
          maze[y][x] = wallTypes[Math.floor(Math.random() * wallTypes.length)];
        }
      }
    }
    return maze;
  }

  visit(maze, visited, x, y) {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);

    if (!this.validNewPassage(maze, x, y)) return false;

    maze[y][x] = 0;
    return true;
  }

  validNewPassage(maze, x, y) {
    const adjacentCount = this.countAdjacentPassages(maze, x, y);
    const diagonalCount = this.countDiagonalPassages(maze, x, y);

    if (diagonalCount.count > 1 || adjacentCount.count > 1) {
      return false;
    }

    if (diagonalCount.count === 1 && adjacentCount.count === 1) {
      return (
        diagonalCount.xSum + adjacentCount.xSum !== 0 &&
        diagonalCount.ySum + adjacentCount.ySum !== 0
      );
    }

    return true;
  }

  countAdjacentPassages(maze, x, y) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    let count = 0;
    let xSum = 0;
    let ySum = 0;

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (this.isInBounds(nx, ny) && maze[ny][nx] === 0) {
        count++;
        xSum += dx;
        ySum += dy;
      }
    }

    return { count, xSum, ySum };
  }

  countDiagonalPassages(maze, x, y) {
    const diagonals = [
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
    ];
    let count = 0;
    let xSum = 0;
    let ySum = 0;

    for (const [dx, dy] of diagonals) {
      const nx = x + dx;
      const ny = y + dy;

      if (this.isInBounds(nx, ny) && maze[ny][nx] === 0) {
        count++;
        xSum += dx;
        ySum += dy;
      }
    }

    return { count, xSum, ySum };
  }

  getShuffledNeighbors(x, y, visited) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const neighbors = [];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      neighbors.push([nx, ny]);
    }

    return this.shuffleArray(neighbors);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  isValidCell(x, y) {
    return x > 0 && x < this.mazeSize - 1 && y > 0 && y < this.mazeSize - 1;
  }

  isInBounds(x, y) {
    return x >= 0 && x < this.mazeSize && y >= 0 && y < this.mazeSize;
  }

  generateEmpty() {
    const maze = [];
    for (let y = 0; y < this.mazeSize; y++) {
      maze[y] = [];
      for (let x = 0; x < this.mazeSize; x++) {
        if (x === 0 || x === this.mazeSize - 1 || y === 0 || y === this.mazeSize - 1) {
          maze[y][x] = 5; // Border walls
        } else {
          maze[y][x] = 0;
        }
      }
    }
    maze[1][1] = 0;
    maze[this.mazeSize - 2][this.mazeSize - 2] = -1;
    return maze;
  }

  setSize(newSize) {
    this.mazeSize = newSize;
    return this;
  }
}
