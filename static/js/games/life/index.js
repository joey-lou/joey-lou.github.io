import { populatePattern } from './patterns.js';

export let GRID_SIZE = 50;
export const MIN_GRID_SIZE = 30;
export const MAX_GRID_SIZE = 80;
export let grid = [];
let isRunning = false;
let intervalId = null;
let isMouseDown = false;
let wrapEdges = false;

export function setCellAlive(x, y, alive) {
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    const cell = grid[y][x];
    if (cell.alive !== alive) {
      cell.alive = alive;
      cell.element.classList.toggle('alive', alive);
    }
  }
}

function toggleCell(row, col) {
  if (grid[row]?.[col]) {
    const cell = grid[row][col];
    cell.alive = !cell.alive;
    cell.element.classList.toggle('alive', cell.alive);
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
      const cell = grid[i][j];
      const nowAlive = cell.alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
      if (nowAlive !== cell.alive) {
        cell.alive = nowAlive;
        cell.element.classList.toggle('alive', nowAlive);
      }
    }
  }
}

function calculateGridSize() {
  const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.85;
  const cellSize = 20;
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
    gridElement.classList.remove('drawing');
  });

  gridElement.addEventListener('mousedown', (e) => {
    const cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    isMouseDown = true;
    gridElement.classList.add('drawing');
    toggleCell(+cellEl.dataset.row, +cellEl.dataset.col);
  });

  gridElement.addEventListener('mouseover', (e) => {
    if (!isMouseDown) return;
    const cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    toggleCell(+cellEl.dataset.row, +cellEl.dataset.col);
  });

  function createGrid() {
    GRID_SIZE = calculateGridSize();
    gridElement.replaceChildren();
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    grid = [];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = i;
        cell.dataset.col = j;
        fragment.appendChild(cell);
        grid[i][j] = { element: cell, alive: false };
      }
    }
    gridElement.appendChild(fragment);
  }

  function startGame() {
    if (!isRunning) {
      isRunning = true;
      gridElement.classList.add('simulating');
      intervalId = setInterval(updateGrid, 100);
    }
  }

  function stopGame() {
    if (isRunning) {
      isRunning = false;
      gridElement.classList.remove('simulating');
      clearInterval(intervalId);
    }
  }

  function clearGrid() {
    stopGame();
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = grid[i][j];
        if (cell.alive) {
          cell.alive = false;
          cell.element.classList.remove('alive');
        }
      }
    }
  }

  function randomizeGrid() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = grid[i][j];
        const alive = Math.random() < 0.3;
        cell.alive = alive;
        cell.element.classList.toggle('alive', alive);
      }
    }
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
    }
  });
  wrapToggle.addEventListener('change', (e) => {
    wrapEdges = e.target.checked;
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newGridSize = calculateGridSize();
      if (newGridSize !== GRID_SIZE) {
        stopGame();
        createGrid();
      }
    }, 200);
  });
});
