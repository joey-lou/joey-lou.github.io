import { GameCircle, GameSquare, GameTriangle } from './game-shapes.js';
import { MouseObject } from './mouse-object.js';
import { getRandomVelocity, isOverlapping } from './utils.js';
import * as config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');
  config.initConfig(canvas);

  // Set canvas size to match viewport
  function resizeCanvas() {
    const computedStyle = getComputedStyle(canvas);
    canvas.width = parseInt(computedStyle.width, 10);
    canvas.height = parseInt(computedStyle.height, 10);
    console.log('canvas size', canvas.width, canvas.height);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create Objects
  const maxInitialSpeed = 10;

  const circles = [];
  const squares = [];
  const triangles = [];

  function createObject(ObjectClass, objects) {
    let newObject;
    do {
      const x = Math.random() * (canvas.width - 2 * config.margin) + config.margin;
      const y = Math.random() * (canvas.height - 2 * config.margin) + config.margin;
      const size = canvas.width * (Math.random() * 0.03 + 0.025);
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      newObject = new ObjectClass(x, y, size, color);
    } while (objects.some((obj) => isOverlapping(newObject, obj)));

    newObject.vx = getRandomVelocity(maxInitialSpeed);
    newObject.vy = getRandomVelocity(maxInitialSpeed);
    objects.push(newObject);
  }

  for (let i = 0; i < config.numEach; i++) {
    createObject(GameCircle, circles);
    createObject(GameSquare, squares);
    createObject(GameTriangle, triangles);
  }

  const mouseObject = new MouseObject(config.mouseX, config.mouseY, canvas.width);
  const allObjects = [...circles, ...squares, ...triangles, mouseObject];

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mouseObject.mass = mouseObject.isPressed ? canvas.width * 100 : 0;

    allObjects.forEach((object) => {
      object.updateForces(allObjects);
      object.updatePosition();
      if (!(object instanceof MouseObject)) {
        object.checkCollision(allObjects);
      }
      object.draw(ctx);
      object.drawTrail(ctx);
    });

    requestAnimationFrame(update);
  }

  update();

  canvas.addEventListener('mousemove', (event) => {
    let rect = canvas.getBoundingClientRect();
    config.setMousePosition(event.clientX - rect.left, event.clientY - rect.top);
  });

  canvas.addEventListener('mousedown', () => {
    mouseObject.isPressed = true;
  });
  canvas.addEventListener('mouseup', () => {
    mouseObject.isPressed = false;
  });
  canvas.addEventListener('mouseleave', () => {
    mouseObject.isPressed = false;
  });

  const hintElement = document.getElementById('hint');
  hintElement.addEventListener('click', () => {
    config.toggleAttractMode();
    hintElement.textContent = config.isAttractMode
      ? 'Mouse Down to Attract'
      : 'Mouse Down to Repel';
  });
});
