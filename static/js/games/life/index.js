import { populatePattern } from './patterns.js';

export let GRID_SIZE = 50;
export const MIN_GRID_SIZE = 50;
export const MAX_GRID_SIZE = 80;
export let grid = [];
let newGrid = [];
let isRunning = false;
let intervalId = null;
let isMouseDown = false;
let wrapEdges = true;

export function setCellAlive(x, y, alive) {
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    grid[y][x].alive = alive;
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
      let newRow = row + i;
      let newCol = col + j;
      if (wrapEdges) {
        newRow = (newRow + GRID_SIZE) % GRID_SIZE;
        newCol = (newCol + GRID_SIZE) % GRID_SIZE;
      }
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        if (grid[newRow][newCol].alive) count++;
      }
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

function calculateGridSize() {
  const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.85;
  const cellSize = 20; // Adjust this value to change the cell size
  let size = Math.floor(containerSize / cellSize);
  size = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, size));
  return size;
}

document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('game-board');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const clearBtn = document.getElementById('clear-btn');
  const randomBtn = document.getElementById('random-btn');
  const patternSelect = document.getElementById('pattern-select');
  const wrapToggle = document.getElementById('wrap-toggle');

  document.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  function createGrid() {
    GRID_SIZE = calculateGridSize();
    gridElement.innerHTML = ''; // Clear existing cells
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    grid = [];
    newGrid = [];
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
  patternSelect.addEventListener('change', (e) => {
    const selectedPattern = e.target.value;
    if (selectedPattern) {
      clearGrid();
      populatePattern(selectedPattern);
      updateGridAppearance();
    }
  });
  wrapToggle.addEventListener('change', (e) => {
    wrapEdges = e.target.checked;
  });

  window.addEventListener('resize', () => {
    const oldGridSize = GRID_SIZE;
    const newGridSize = calculateGridSize();
    if (newGridSize !== oldGridSize) {
      clearGrid();
      createGrid();
    }
  });
});
