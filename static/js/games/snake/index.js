import {
  update as updateSnake,
  draw as drawSnake,
  initialize as initializeSnake,
  SNAKE_SPEED,
} from './snake.js';
import { initialize as initializeInput } from './input.js';
import { update as updateFood, draw as drawFood, initialize as initializeFood } from './food.js';
import { changeDirection } from './input.js';

class Status {
  IDLE = 0;
  RUNNING = 1;
}

let status = Status.IDLE;
let intervalId;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gridSize = { x: 21, y: 21 };

function toggleVisibilityByName(name, to_visible) {
  var elements = document.getElementsByClassName(name);
  for (var i = 0; i < elements.length; i++) {
    if (to_visible) {
      elements[i].classList.remove('hidden');
    } else {
      elements[i].classList.add('hidden');
    }
  }
}

function calculateGridSize() {
  const gameBoard = document.getElementById('game-board');
  const minCells = 10;
  const maxCells = 50;
  const aspectRatio = gameBoard.clientWidth / gameBoard.clientHeight;

  let xCells = Math.floor(aspectRatio * 21);
  let yCells = 21;

  // Adjust if outside the min/max range
  if (xCells < minCells) {
    xCells = minCells;
    yCells = Math.floor(minCells / aspectRatio);
  } else if (xCells > maxCells) {
    xCells = maxCells;
    yCells = Math.floor(maxCells / aspectRatio);
  }

  return { x: xCells, y: yCells };
}

function setGridTemplate() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.style.gridTemplateColumns = `repeat(${gridSize.x}, 1fr)`;
  gameBoard.style.gridTemplateRows = `repeat(${gridSize.y}, 1fr)`;
}

function startGame() {
  console.log('starting game');
  if (status === Status.IDLE) {
    initialize();
    window.addEventListener('keydown', changeDirection);
    intervalId = setInterval(function () {
      draw();
      update(onGameOver);
    }, 1000 / SNAKE_SPEED);
    status = Status.RUNNING;
    toggleVisibilityByName('game-over', false);
    score = 0;
    updateScores();
  } else {
    console.warn('Tried to start game while game already started');
  }
}

function endGame() {
  console.log('ending game');
  if (status === Status.RUNNING) {
    window.removeEventListener('keydown', changeDirection);
    clearInterval(intervalId);

    updateScores(); // Add this line to update the high score

    status = Status.IDLE;
    window.addEventListener('keydown', onPressSpaceBar);
    toggleVisibilityByName('game-over', true);
  } else {
    console.warn('Tried to end game while game is idle');
  }
}

const onPressSpaceBar = (ev) => {
  if (ev.code === 'Space' && status === Status.IDLE) {
    endGame();
    startGame();
    window.removeEventListener('keydown', onPressSpaceBar);
  }
};

const onGameOver = () => {
  endGame();
  window.addEventListener('keydown', onPressSpaceBar);
};

function initialize() {
  initializeSnake();
  initializeFood();
  initializeInput();
}

function update(onGameOver) {
  updateSnake(onGameOver);
  if (updateFood()) {
    score += 1;
    updateScores();
  }
}

function updateScores() {
  document.getElementById('score').textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
  }
  document.getElementById('high-score').textContent = highScore;
}

function draw() {
  const gameBoard = document.getElementById('game-board');
  if (gameBoard) {
    // reset gameboard
    gameBoard.innerHTML = '';
    drawSnake(gameBoard);
    drawFood(gameBoard);
  } else {
    console.warn('uninitialized gameboard!');
  }
}

function onResize() {
  endGame();
  initialize();
  toggleVisibilityByName('game-over', false);
  gridSize = calculateGridSize();
  setGridTemplate();
}

window.addEventListener('keydown', onPressSpaceBar);
window.addEventListener('resize', () => {
  console.log('resizing');
  onResize();
});

onResize();
updateScores();

export { gridSize };
