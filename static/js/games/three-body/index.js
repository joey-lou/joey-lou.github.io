import { Body } from './body.js';
import { NBodySolver } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');

  // UI elements
  const solverSelect = document.getElementById('solver-select');
  const dtInput = document.getElementById('dt-input');
  const gInput = document.getElementById('g-input');
  const massInput = document.getElementById('mass-input');
  const speedInput = document.getElementById('speed-input');
  const trailInput = document.getElementById('trail-input');
  const resetBtn = document.getElementById('reset-btn');
  const pauseBtn = document.getElementById('pause-btn');

  // Simulation state
  let isPaused = true; // Start paused
  let selectedBody = null;
  let G = parseFloat(gInput.value);
  let DT = parseFloat(dtInput.value);
  let MASS = parseFloat(massInput.value);
  let speed = parseFloat(speedInput.value);
  let trailLength = parseFloat(trailInput.value);
  let t = 0;

  function createBodies() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width * 0.03;

    const bodies = [
      new Body(centerX + radius, centerY, MASS, '#ff0000'), // Red
      new Body(centerX - radius / 2, centerY + radius, MASS, '#ffff00'), // Yellow
      new Body(centerX - radius / 2, centerY - radius, MASS, '#0000ff'), // Blue
    ];

    // Set initial trail length
    bodies.forEach((body) => body.updateTrailLength(trailLength));
    return bodies;
  }

  function setInitialVelocities(bodies) {
    bodies[0].vx = 0;
    bodies[0].vy = -speed;
    bodies[1].vx = speed;
    bodies[1].vy = speed / 2;
    bodies[2].vx = -speed;
    bodies[2].vy = speed / 2;
  }

  // Initialize simulation
  let bodies = createBodies();
  setInitialVelocities(bodies);
  let solver = new NBodySolver(G);

  // Mouse handling for dragging
  let isDragging = false;

  function resizeCanvas() {
    const computedStyle = getComputedStyle(canvas);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Reset simulation on resize
    bodies = createBodies();
    setInitialVelocities(bodies);
    t = 0;
    if (!isPaused) {
      isPaused = true;
      pauseBtn.textContent = 'Run';
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    bodies.forEach((body) => {
      if (body.containsPoint(x, y)) {
        selectedBody = body;
        selectedBody.isDragging = true;
        isDragging = true;
        if (!isPaused) {
          pauseBtn.click(); // Pause when dragging
        }
      }
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedBody) {
      const rect = canvas.getBoundingClientRect();
      selectedBody.x = e.clientX - rect.left;
      selectedBody.y = e.clientY - rect.top;
      selectedBody.clearTrail(); // Clear trail when dragging
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (selectedBody) {
      selectedBody.isDragging = false;
      selectedBody = null;
    }
    isDragging = false;
  });

  // UI event handlers
  solverSelect.addEventListener('change', () => {
    // Solver method will be selected in the update loop
  });

  dtInput.addEventListener('change', () => {
    DT = parseFloat(dtInput.value);
  });

  gInput.addEventListener('change', () => {
    G = parseFloat(gInput.value);
    solver = new NBodySolver(G);
  });

  massInput.addEventListener('change', () => {
    MASS = parseFloat(massInput.value);
    bodies.forEach((body) => body.updateMass(MASS));
  });

  speedInput.addEventListener('change', () => {
    speed = parseFloat(speedInput.value);
    setInitialVelocities(bodies);
  });

  trailInput.addEventListener('change', () => {
    trailLength = parseFloat(trailInput.value);
    bodies.forEach((body) => body.updateTrailLength(trailLength));
  });

  resetBtn.addEventListener('click', () => {
    bodies = createBodies();
    setInitialVelocities(bodies);
    bodies.forEach((body) => body.updateTrailLength(trailLength));
    t = 0;
    if (!isPaused) {
      pauseBtn.click(); // Pause on reset
    }
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Run' : 'Stop';
  });

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
      // Create current state
      const state = {
        bodies: bodies.map((body) => ({
          x: body.x,
          y: body.y,
          vx: body.vx,
          vy: body.vy,
          mass: body.mass,
        })),
      };

      // Solve one step using selected method
      let newState;
      switch (solverSelect.value) {
        case 'euler':
          newState = solver.euler(state, DT, t);
          break;
        case 'midpoint':
          newState = solver.midpoint(state, DT, t);
          break;
        default:
          newState = solver.rk4(state, DT, t);
      }
      t += DT;

      // Update bodies with new state
      bodies.forEach((body, i) => {
        if (!body.isDragging) {
          // Only update if not being dragged
          body.x = newState.bodies[i].x;
          body.y = newState.bodies[i].y;
          body.vx = newState.bodies[i].vx;
          body.vy = newState.bodies[i].vy;
          body.updateTrail();
        }
      });
    }

    // Draw all bodies
    bodies.forEach((body) => body.draw(ctx));

    requestAnimationFrame(update);
  }

  update();
});
