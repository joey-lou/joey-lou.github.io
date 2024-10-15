import { GRID_SIZE, PACMAN_SPEED, GHOST_SPEED } from './config.js';

class Sprite {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  drawSprite() {
    const element = document.createElement('div');
    element.style.gridRowStart = this.y + 1;
    element.style.gridColumnStart = this.x + 1;
    return element;
  }

  draw(gameBoard) {
    const element = this.drawSprite();
    gameBoard.appendChild(element);
  }
}

export class Ghost extends Sprite {
  constructor(x, y, color) {
    super(x, y);
    this.color = color;
  }

  move(pacman, walls) {
    // Simple AI: move towards Pacman
    const dx = pacman.x - this.x;
    const dy = pacman.y - this.y;

    let newX = this.x;
    let newY = this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX += Math.sign(dx) * GHOST_SPEED;
    } else {
      newY += Math.sign(dy) * GHOST_SPEED;
    }

    // Check for wall collision
    if (!walls.some((wall) => Math.abs(wall.x - newX) < 0.9 && Math.abs(wall.y - newY) < 0.9)) {
      this.x = newX;
      this.y = newY;
    }

    // Wrap around the grid
    this.x = (this.x + GRID_SIZE) % GRID_SIZE;
    this.y = (this.y + GRID_SIZE) % GRID_SIZE;
  }

  drawSprite() {
    const ghostElement = super.drawSprite();
    ghostElement.classList.add('ghost');
    ghostElement.style.backgroundColor = this.color;
    return ghostElement;
  }
}

export class Pacman extends Sprite {
  constructor(x, y) {
    super(x, y);
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
  }

  move(walls) {
    if (this.canMove(this.nextDirection, walls)) {
      this.direction = this.nextDirection;
    }

    if (this.canMove(this.direction, walls)) {
      this.x += this.direction.x * PACMAN_SPEED;
      this.y += this.direction.y * PACMAN_SPEED;
    }

    // Wrap around the grid
    this.x = (this.x + GRID_SIZE) % GRID_SIZE;
    this.y = (this.y + GRID_SIZE) % GRID_SIZE;
    console.log('moving pacman, x:', this.x, 'y:', this.y);
  }

  canMove(direction, walls) {
    const nextX = this.x + direction.x * PACMAN_SPEED;
    const nextY = this.y + direction.y * PACMAN_SPEED;
    return !walls.some((wall) => Math.abs(wall.x - nextX) < 0.9 && Math.abs(wall.y - nextY) < 0.9);
  }

  drawSprite() {
    const pacmanElement = super.drawSprite();
    pacmanElement.classList.add('pacman');
    return pacmanElement;
  }
}

export class Food extends Sprite {
  drawSprite() {
    const foodElement = super.drawSprite();
    foodElement.classList.add('pacman-food');
    return foodElement;
  }
}

export class Wall extends Sprite {
  drawSprite() {
    const wallElement = super.drawSprite();
    wallElement.classList.add('wall');
    return wallElement;
  }
}
