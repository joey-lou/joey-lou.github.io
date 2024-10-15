import { GameObject } from './game-object.js';

export class GameRectangle extends GameObject {
  constructor(x, y, width, height, color = 'green') {
    super(x, y, width * height, color);
    this.width = width;
    this.height = height;
  }

  drawShape(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
  }

  getBoundaries() {
    return [
      this.x - this.width / 2,
      this.x + this.width / 2,
      this.y - this.height / 2,
      this.y + this.height / 2,
    ];
  }
}

export class GameSquare extends GameRectangle {
  constructor(x, y, size, color = 'green') {
    super(x, y, size, size, color);
  }
}

export class GameTriangle extends GameObject {
  constructor(x, y, size, color = 'green') {
    super(x, y, (size * size) / 2, color);
    this.size = size;
  }

  drawShape(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-this.size / 2, this.size / 2);
    ctx.lineTo(this.size / 2, this.size / 2);
    ctx.lineTo(0, -this.size / 2);
    ctx.closePath();
    ctx.fill();
  }

  getBoundaries() {
    return [
      this.x - this.size / 2,
      this.x + this.size / 2,
      this.y - this.size / 2,
      this.y + this.size / 2,
    ];
  }
}

export class GameCircle extends GameObject {
  constructor(x, y, radius, color = 'green') {
    super(x, y, Math.PI * radius * radius, color);
    this.radius = radius;
  }

  drawShape(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  getBoundaries() {
    return [this.x - this.radius, this.x + this.radius, this.y - this.radius, this.y + this.radius];
  }
}
