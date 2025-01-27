import { Body } from './body.js';
import { NBodySolver } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');

  // UI elements
  const solverSelect = document.getElementById('solver-select');
  const hInput = document.getElementById('h-input');
  const speedInput = document.getElementById('speed-input');
  const gInput = document.getElementById('g-input');
  const massInput = document.getElementById('mass-input');
  const initialSpeedInput = document.getElementById('initial-speed-input');
  const trailInput = document.getElementById('trail-input');
  const resetBtn = document.getElementById('reset-btn');
  const pauseBtn = document.getElementById('pause-btn');

  // Simulation state
  let isPaused = true; // Start paused
  let selectedBody = null;
  let isDragging = false;
  let H = parseFloat(hInput.value); // Integration step size
  let SPEED = parseFloat(speedInput.value); // Animation speed multiplier
  let G = parseFloat(gInput.value);
  let MASS = parseFloat(massInput.value);
  let INITIAL_SPEED = parseFloat(initialSpeedInput.value);
  let trailLength = parseFloat(trailInput.value);
  let t = 0; // Simulation time
  let lastFrameTime = 0; // For real-time animation

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
    bodies[0].vy = -INITIAL_SPEED;
    bodies[1].vx = INITIAL_SPEED;
    bodies[1].vy = INITIAL_SPEED / 2;
    bodies[2].vx = -INITIAL_SPEED;
    bodies[2].vy = INITIAL_SPEED / 2;
  }

  // Initialize simulation
  let bodies = createBodies();
  setInitialVelocities(bodies);
  let solver = new NBodySolver(
    G,
    bodies.map((body) => body.mass)
  );

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Reset simulation on resize
    bodies = createBodies();
    setInitialVelocities(bodies);
    t = 0;
    lastFrameTime = 0;
    if (!isPaused) {
      isPaused = true;
      pauseBtn.textContent = 'Run';
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Mouse handling for dragging
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
      // clear velocity and trail
      selectedBody.vx = 0;
      selectedBody.vy = 0;
      selectedBody.clearTrail();
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
  hInput.addEventListener('change', () => {
    H = parseFloat(hInput.value);
  });

  speedInput.addEventListener('change', () => {
    SPEED = parseFloat(speedInput.value);
  });

  gInput.addEventListener('change', () => {
    G = parseFloat(gInput.value);
    solver = new NBodySolver(
      G,
      bodies.map((body) => body.mass)
    );
  });

  massInput.addEventListener('change', () => {
    MASS = parseFloat(massInput.value);
    bodies.forEach((body) => body.updateMass(MASS));
    solver = new NBodySolver(
      G,
      bodies.map((body) => body.mass)
    );
  });

  initialSpeedInput.addEventListener('change', () => {
    INITIAL_SPEED = parseFloat(initialSpeedInput.value);
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
    lastFrameTime = 0;
    if (!isPaused) {
      pauseBtn.click(); // Pause on reset
    }
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Run' : 'Stop';
  });

  function update(currentTime) {
    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }

    // Calculate real time delta
    const dt = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
      // Advance simulation by dt * SPEED using multiple steps of size H
      const targetTime = t + dt * SPEED;
      while (t < targetTime) {
        const stepSize = Math.min(H, targetTime - t);

        // Solve one step and update bodies directly
        solver.step(bodies, stepSize, t, solverSelect.value, {
          maxIterations: 10,
          tolerance: 1e-8,
        });
        t += stepSize;
      }

      // Update trails once per frame
      bodies.forEach((body) => {
        if (!body.isDragging) {
          body.updateTrail();
        }
      });
    }

    // Draw all bodies
    bodies.forEach((body) => body.draw(ctx));

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
});
