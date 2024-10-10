import { gridSize } from './index.js';
import { getRandomIntInclusive } from './utils.js';
import { onSnake, expandSnake } from './snake.js';

let food;
const EXPANSION_RATE = 2;

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
  }
}

export function draw(gameBoard) {
  const foodElement = document.createElement('div');
  foodElement.style.gridRowStart = `${food.y}`;
  foodElement.style.gridColumnStart = `${food.x}`;
  foodElement.classList.add('food');
  gameBoard?.appendChild(foodElement);
}
