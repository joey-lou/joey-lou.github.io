import { gridSize } from './index.js';
import { onSnake, expandSnake } from './snake.js';

let food;
const EXPANSION_RATE = 2;

export function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

export function initialize() {
  console.log('init food');
  food = randomLocation();
}

const randomLocation = () => ({
  x: getRandomIntInclusive(1, gridSize.x),
  y: getRandomIntInclusive(1, gridSize.y),
});

export function update() {
  if (onSnake(food)) {
    expandSnake(EXPANSION_RATE);
    while (onSnake(food)) {
      food = randomLocation();
    }
    return true;
  }
  return false;
}

export function draw(gameBoard) {
  const foodElement = document.createElement('div');
  foodElement.style.gridRowStart = `${food.y}`;
  foodElement.style.gridColumnStart = `${food.x}`;
  foodElement.classList.add('snake-food');
  gameBoard?.appendChild(foodElement);
}
