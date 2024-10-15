import { Pacman, Ghost, Food, Wall } from './sprites.js';
import {
  GRID_SIZE,
  PACMAN_SPEED,
  GHOST_SPEED,
  GAME_SPEED,
  WALL_DENSITY,
  MIN_PATH_WIDTH,
} from './config.js';
import { generateRandomWalls } from './walls.js';

let gameStatus = 'idle';
let intervalId;

let pacman, ghosts, foods, walls;
let score = 0;

function initializeGame() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  gameBoard.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;

  pacman = new Pacman(GRID_SIZE / 2, GRID_SIZE / 2);
  ghosts = [
    new Ghost(1, 1, 'red'),
    new Ghost(GRID_SIZE - 2, 1, 'pink'),
    new Ghost(1, GRID_SIZE - 2, 'cyan'),
    new Ghost(GRID_SIZE - 2, GRID_SIZE - 2, 'orange'),
  ];
  foods = [];
  walls = [];

  // Generate random walls
  const wallLayout = generateRandomWalls();

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (wallLayout[y][x]) {
        walls.push(new Wall(x, y));
      } else if (Math.random() < 0.3) {
        // 30% chance for food
        foods.push(new Food(x, y));
      }
    }
  }

  score = 0;
  draw();
}

function endGame() {
  document.querySelector('.game-over').classList.remove('hidden');
}

function runSingleGameLoop() {
  updatePacman();
  updateGhosts();
  checkCollisions();
  draw();
  return checkGameOver();
}

function updatePacman() {
  pacman.move(walls);
}

function updateGhosts() {
  ghosts.forEach((ghost) => ghost.move(pacman, walls));
}

function checkCollisions() {
  // Check for collisions with food
  foods = foods.filter((food) => {
    if (food.x === pacman.x && food.y === pacman.y) {
      score += 10;
      return false;
    }
    return true;
  });

  // Check for collisions with ghosts
  ghosts.forEach((ghost) => {
    if (ghost.x === pacman.x && ghost.y === pacman.y) {
      endGame();
    }
  });
}

function draw() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.innerHTML = '';

  walls.forEach((wall) => wall.draw(gameBoard));
  foods.forEach((food) => food.draw(gameBoard));
  ghosts.forEach((ghost) => ghost.draw(gameBoard));
  pacman.draw(gameBoard);

  // Update score
  document.getElementById('score').textContent = score;
}

function checkGameOver() {
  return foods.length === 0 || ghosts.some((ghost) => ghost.x === pacman.x && ghost.y === pacman.y);
}

function changeDirection(event) {
  switch (event.key) {
    case 'ArrowUp':
      pacman.nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      pacman.nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      pacman.nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      pacman.nextDirection = { x: 1, y: 0 };
      break;
  }
}

function onPressSpaceBar(ev) {
  if (ev.code === 'Space' && gameStatus === 'idle') {
    gameStatus = 'running';
    window.removeEventListener('keydown', onPressSpaceBar);
    window.addEventListener('keydown', changeDirection);
    intervalId = setInterval(updateGame, 1000 / GAME_SPEED);
  }
}

function updateGame() {
  const isGameOver = runSingleGameLoop();
  if (isGameOver) {
    endGame();
    clearInterval(intervalId);
    gameStatus = 'idle';
    window.removeEventListener('keydown', changeDirection);
    window.addEventListener('keydown', onPressSpaceBar);
  }
}

function onResize() {
  initializeGame();
}

window.addEventListener('keydown', onPressSpaceBar);
window.addEventListener('resize', onResize);

initializeGame();
