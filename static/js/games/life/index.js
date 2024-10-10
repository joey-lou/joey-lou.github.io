document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('game-board');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const clearBtn = document.getElementById('clear-btn');
  const randomBtn = document.getElementById('random-btn');

  const GRID_SIZE = 25;

  let grid = [];
  let newGrid = [];
  let isRunning = false;
  let intervalId = null;
  let isMouseDown = false;

  document.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  function createGrid() {
    gridElement.innerHTML = ''; // Clear existing cells
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = [];
      newGrid[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('mousedown', () => {
          isMouseDown = true;
          toggleCell(i, j);
        });

        cell.addEventListener('mouseover', () => {
          if (isMouseDown) {
            toggleCell(i, j);
          }
        });

        gridElement.appendChild(cell);
        grid[i][j] = { element: cell, alive: false };
        newGrid[i][j] = { alive: false };
      }
    }
  }

  function toggleCell(row, col) {
    if (grid[row] && grid[row][col]) {
      grid[row][col].alive = !grid[row][col].alive;
      updateCellAppearance(row, col);
    }
  }

  function updateCellAppearance(row, col) {
    if (grid[row] && grid[row][col]) {
      grid[row][col].element.classList.toggle('alive', grid[row][col].alive);
    }
  }

  function countNeighbors(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newRow = (row + i + GRID_SIZE) % GRID_SIZE;
        const newCol = (col + j + GRID_SIZE) % GRID_SIZE;
        if (grid[newRow][newCol].alive) count++;
      }
    }
    return count;
  }

  function updateGrid() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const neighbors = countNeighbors(i, j);
        if (grid[i][j].alive) {
          newGrid[i][j].alive = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[i][j].alive = neighbors === 3;
        }
      }
    }
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        grid[i][j].alive = newGrid[i][j].alive;
      }
    }
    updateGridAppearance();
  }

  function updateGridAppearance() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        updateCellAppearance(i, j);
      }
    }
  }

  function startGame() {
    if (!isRunning) {
      isRunning = true;
      intervalId = setInterval(updateGrid, 100);
    }
  }

  function stopGame() {
    if (isRunning) {
      isRunning = false;
      clearInterval(intervalId);
    }
  }

  function clearGrid() {
    stopGame();
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        grid[i][j].alive = false;
      }
    }
    updateGridAppearance();
  }

  function randomizeGrid() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        grid[i][j].alive = Math.random() < 0.3;
      }
    }
    updateGridAppearance();
  }

  createGrid();

  startBtn.addEventListener('click', startGame);
  stopBtn.addEventListener('click', stopGame);
  clearBtn.addEventListener('click', clearGrid);
  randomBtn.addEventListener('click', randomizeGrid);

  window.addEventListener('resize', createGrid); // Allow resize
});
