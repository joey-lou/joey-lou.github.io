import { GameObject } from './game-object.js';
import { mouseX, mouseY } from './config.js';

export class MouseObject extends GameObject {
  constructor(x, y, mass, color = 'red') {
    super(x, y, mass, color);
    this.isPressed = false;
  }

  updateForces(objects) {
    // Mouse object doesn't apply forces
  }

  updatePosition() {
    this.x = mouseX;
    this.y = mouseY;
  }

  draw(ctx) {
    if (this.isPressed) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  getBoundaries() {
    return [this.x - 5, this.x + 5, this.y - 5, this.y + 5];
  }

  isMouseObject() {
    return true;
  }
}
