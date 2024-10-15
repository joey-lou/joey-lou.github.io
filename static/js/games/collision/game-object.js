import { canvas, friction, wallDamping, trailSize, isAttractMode } from './config.js';

export class GameObject {
  constructor(x, y, mass, color = 'green') {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.trail = [];
  }

  draw(ctx) {
    throw new Error("Method 'draw()' must be implemented.");
  }

  updateForces(objects) {
    for (let other of objects) {
      if (this !== other) {
        const [fx, fy] = this.calculateForce(other);
        this.applyForce(fx, fy);
      }
    }
  }

  updatePosition() {
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx;
    this.y += this.vy;
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > trailSize) this.trail.pop();
  }

  checkCollision(objects) {
    const [left, right, top, bottom] = this.getBoundaries();

    // Handle collision with canvas borders
    if (left < 0) {
      this.x = this.getWidth() / 2;
      this.vx = Math.abs(this.vx) * wallDamping;
    } else if (right > canvas.width) {
      this.x = canvas.width - this.getWidth() / 2;
      this.vx = -Math.abs(this.vx) * wallDamping;
    }

    if (top < 0) {
      this.y = this.getHeight() / 2;
      this.vy = Math.abs(this.vy) * wallDamping;
    } else if (bottom > canvas.height) {
      this.y = canvas.height - this.getHeight() / 2;
      this.vy = -Math.abs(this.vy) * wallDamping;
    }

    // Handle collision with other objects
    for (let other of objects) {
      if (this !== other && !other.isMouseObject()) {
        if (this.isColliding(other)) {
          // Separate objects
          const overlap = this.getOverlap(other);
          const separationVector = this.getSeparationVector(other, overlap);
          this.x += separationVector.x / 2;
          this.y += separationVector.y / 2;
          other.x -= separationVector.x / 2;
          other.y -= separationVector.y / 2;

          // Calculate new velocities
          const totalMass = this.mass + other.mass;
          const newVx1 =
            ((this.mass - other.mass) * this.vx + 2 * other.mass * other.vx) / totalMass;
          const newVy1 =
            ((this.mass - other.mass) * this.vy + 2 * other.mass * other.vy) / totalMass;
          const newVx2 =
            ((other.mass - this.mass) * other.vx + 2 * this.mass * this.vx) / totalMass;
          const newVy2 =
            ((other.mass - this.mass) * other.vy + 2 * this.mass * this.vy) / totalMass;

          this.vx = newVx1;
          this.vy = newVy1;
          other.vx = newVx2;
          other.vy = newVy2;
        }
      }
    }
  }

  isColliding(other) {
    const [left1, right1, top1, bottom1] = this.getBoundaries();
    const [left2, right2, top2, bottom2] = other.getBoundaries();
    return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
  }

  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  calculateForce(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const sameType = this.constructor === other.constructor;

    let force;
    if (other.isMouseObject()) {
      force = ((isAttractMode ? 0.01 : -0.01) * other.mass * this.mass) / (distance * distance);
    } else {
      force = ((sameType ? -0.01 : 0.01) * other.mass * this.mass) / (distance * distance);
    }
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;
    return [fx, fy];
  }

  getBoundaries() {
    throw new Error("Method 'getBoundaries()' must be implemented.");
  }

  draw(ctx) {
    ctx.translate(this.x, this.y);
    this.drawShape(ctx);
    ctx.translate(-this.x, -this.y);
  }

  drawTrail(ctx) {
    ctx.save();
    const baseAlpha = 0.2;
    const massScale = Math.sqrt(this.mass) / 10;
    for (let i = 0; i < this.trail.length; i++) {
      const scale = 1 - i / this.trail.length;
      const alpha = baseAlpha * scale * (1 + massScale);
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.translate(this.trail[i].x, this.trail[i].y);
      ctx.scale(scale, scale);
      this.drawShape(ctx);
      ctx.scale(1 / scale, 1 / scale);
      ctx.translate(-this.trail[i].x, -this.trail[i].y);
    }
    ctx.restore();
  }

  drawShape(ctx) {
    throw new Error("Method 'drawShape()' must be implemented.");
  }

  isMouseObject() {
    return false;
  }

  getWidth() {
    return this.width || this.size || this.radius * 2;
  }

  getHeight() {
    return this.height || this.size || this.radius * 2;
  }

  getOverlap(other) {
    const [left1, right1, top1, bottom1] = this.getBoundaries();
    const [left2, right2, top2, bottom2] = other.getBoundaries();

    const overlapX = Math.min(right1, right2) - Math.max(left1, left2);
    const overlapY = Math.min(bottom1, bottom2) - Math.max(top1, top2);

    return { x: overlapX, y: overlapY };
  }

  getSeparationVector(other, overlap) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: Math.sign(dx) * overlap.x, y: 0 };
    } else {
      return { x: 0, y: Math.sign(dy) * overlap.y };
    }
  }
}
