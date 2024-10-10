import { getInputDirection } from './input.js';
import { gridSize } from './index.js';

export const SNAKE_SPEED = 10;

let snakeBody = [];

export function initialize() {
  snakeBody = [{ x: Math.floor(gridSize.x / 2), y: Math.floor(gridSize.y / 2) }];
}

export function update(onGameOver) {
  const direction = getInputDirection();
  for (let i = snakeBody.length - 2; i >= 0; i--) {
    snakeBody[i + 1] = { ...snakeBody[i] };
  }
  snakeBody[0].x += direction.x;
  snakeBody[0].y += direction.y;
  wrapSnakePosition();
  if (!isSnakeSafe()) onGameOver();
}

export function draw(gameBoard) {
  snakeBody.forEach((grid, idx) => {
    const snakeElement = document.createElement('div');
    snakeElement.style.gridRowStart = `${grid.y}`;
    snakeElement.style.gridColumnStart = `${grid.x}`;
    snakeElement.classList.add('snake');
    if (idx == 0) {
      snakeElement.classList.add('head');
    }
    gameBoard?.appendChild(snakeElement);
  });
}

export function onSnake(grid, excludeHead = false) {
  for (let i = excludeHead ? 1 : 0; i < snakeBody.length; i++) {
    if (snakeBody[i].x === grid.x && snakeBody[i].y === grid.y) return true;
  }
  return false;
}

function isSnakeSafe() {
  const head = snakeBody[0];
  if (onSnake(head, true)) return false;
  return true;
}

function wrapSnakePosition() {
  const head = snakeBody[0];
  if (head.x < 1) head.x = gridSize.x;
  if (head.x > gridSize.x) head.x = 1;
  if (head.y < 1) head.y = gridSize.y;
  if (head.y > gridSize.y) head.y = 1;
}

export function expandSnake(length) {
  for (let i = 0; i < length; i++) snakeBody.push({ ...snakeBody[snakeBody.length - 1] });
}
