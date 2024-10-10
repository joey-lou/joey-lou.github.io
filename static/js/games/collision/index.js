// Constants
const friction = 0.9;
const wallDamping = 0.5; // Add a damping factor for wall collisions
const numEach = 50;
const margin = 20; // Margin to keep objects off the wall
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

class GameObject {
  constructor(x, y, mass, color = 'green') {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
  }

  draw(ctx) {
    throw new Error("Method 'draw()' must be implemented.");
  }

  updateVelocity(objects) {
    for (let other of objects) {
      if (this !== other) {
        // Check for collision and update velocity using momentum (elastic collision)
        const [left, right, top, bottom] = this.getBoundaries();
        const [oLeft, oRight, oTop, oBottom] = other.getBoundaries();
        if (right > oLeft && left < oRight && bottom > oTop && top < oBottom) {
          const m1 = this.mass;
          const m2 = other.mass;
          const u1x = this.vx;
          const u1y = this.vy;
          const u2x = other.vx;
          const u2y = other.vy;

          this.vx = (u1x * (m1 - m2) + 2 * m2 * u2x) / (m1 + m2);
          this.vy = (u1y * (m1 - m2) + 2 * m2 * u2y) / (m1 + m2);
          other.vx = (u2x * (m2 - m1) + 2 * m1 * u1x) / (m1 + m2);
          other.vy = (u2y * (m2 - m1) + 2 * m1 * u1y) / (m1 + m2);
        } else {
          const [fx, fy] = this.calculateForce(other);
          this.applyForce(fx, fy);
        }
      }
    }
  }

  updatePosition() {
    // Add some friction
    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx;
    this.y += this.vy;

    // Keep objects within canvas
    const [left, right, top, bottom] = this.getBoundaries();
    if (left < 0 || right > canvas.width) {
      this.x -= this.vx;
      this.vx *= -wallDamping; // Apply damping factor
    }
    if (top < 0 || bottom > canvas.height) {
      this.y -= this.vy;
      this.vy *= -wallDamping; // Apply damping factor
    }
  }

  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  calculateForce(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const sameType = this.constructor === other.constructor;

    const force = ((sameType ? 0.1 : -0.001) * other.mass * this.mass) / (distance * distance);
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;
    return [fx, fy];
  }

  getBoundaries() {
    return [this.x, this.x, this.y, this.y];
  }
}
class GameRectangle extends GameObject {
  constructor(x, y, width, height, color = 'green') {
    super(x, y, width * height, color);
    this.width = width;
    this.height = height;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBoundaries() {
    return [this.x, this.x + this.width, this.y, this.y + this.height];
  }
}
class GameSquare extends GameRectangle {
  constructor(x, y, size, color = 'green') {
    super(x, y, size, size, color);
  }
}
class GameTriangle extends GameObject {
  constructor(x, y, size, color = 'green') {
    super(x, y, (size * size) / 2, color);
    this.size = size;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.size, this.y);
    ctx.lineTo(this.x + this.size / 2, this.y + (Math.sqrt(3) / 2) * this.size);
    ctx.closePath();
    ctx.fill();
  }

  getBoundaries() {
    return [this.x, this.x + this.size, this.y, this.y + (Math.sqrt(3) / 2) * this.size];
  }
}
class GameCircle extends GameObject {
  constructor(x, y, radius, color = 'green') {
    super(x, y, Math.PI * radius * radius, color);
    this.radius = radius;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  getBoundaries() {
    return [this.x - this.radius, this.x + this.radius, this.y - this.radius, this.y + this.radius];
  }
}
class MouseObject extends GameObject {
  constructor(x, y, mass, color = 'red') {
    super(x, y, mass, color);
    this.pressed = false;
  }

  updateVelocity(objects) {
    this.vx = 0;
    this.vy = 0;
  }

  updatePosition() {
    this.x = mouseX;
    this.y = mouseY;
  }

  setPressed(pressed) {
    this.pressed = pressed;
    this.mass = pressed ? 1000000 : 0;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI); // Draw a very shallow circle with radius 5
    ctx.fill();
  }

  getBoundaries() {
    return [this.x - 5, this.x + 5, this.y - 5, this.y + 5];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Set canvas size to match viewport
  function resizeCanvas() {
    const computedStyle = getComputedStyle(canvas);
    canvas.width = parseInt(computedStyle.width, 10);
    canvas.height = parseInt(computedStyle.height, 10);
    console.log('canvas size', canvas.width, canvas.height);
  }

  // Call resizeCanvas initially
  resizeCanvas();

  // Add event listener to resize canvas when window is resized
  window.addEventListener('resize', resizeCanvas);

  // Create Objects
  const circles = [];
  for (let i = 0; i < numEach; i++) {
    const x = Math.random() * (canvas.width - 2 * margin) + margin;
    const y = Math.random() * (canvas.height - 2 * margin) + margin;
    const radius = Math.random() * 15 + 5;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    circles.push(new GameCircle(x, y, radius, color));
  }
  const squares = [];
  for (let i = 0; i < numEach; i++) {
    const x = Math.random() * (canvas.width - 2 * margin) + margin;
    const y = Math.random() * (canvas.height - 2 * margin) + margin;
    const size = Math.random() * 15 + 5;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    squares.push(new GameSquare(x, y, size, color));
  }
  const triangles = [];
  for (let i = 0; i < numEach; i++) {
    const x = Math.random() * (canvas.width - 2 * margin) + margin;
    const y = Math.random() * (canvas.height - 2 * margin) + margin;
    const size = Math.random() * 15 + 5;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    triangles.push(new GameTriangle(x, y, size, color));
  }

  const mouseObject = new MouseObject(mouseX, mouseY, 0);

  const allObjects = [...circles, ...squares, ...triangles, mouseObject];

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate forces for all objects
    allObjects.forEach((object) => {
      object.updateVelocity(allObjects);
    });

    // Update positions for all objects
    allObjects.forEach((object) => {
      object.updatePosition();
    });

    // Draw all objects
    allObjects.forEach((object) => {
      object.draw(ctx);
    });

    // setTimeout(() => {
    requestAnimationFrame(update);
    // }, 500); // Slow down the update rate to 500ms for debugging
  }

  update();

  canvas.addEventListener('mousemove', (event) => {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    mouseObject.x = mouseX;
    mouseObject.y = mouseY;
  });

  canvas.addEventListener('mousedown', () => {
    mouseObject.setPressed(true);
  });

  canvas.addEventListener('mouseup', () => {
    mouseObject.setPressed(false);
  });
});
