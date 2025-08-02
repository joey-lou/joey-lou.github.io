import { Oscillator, OscillatorSolver } from './utils.js';
import { setupHighDPICanvas, resizeHighDPICanvas } from '../utils/canvas-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = setupHighDPICanvas(canvas);

  const solverSelect = document.getElementById('solver-select');
  const hInput = document.getElementById('h-input');
  const speedInput = document.getElementById('speed-input');
  const kInput = document.getElementById('k-input');
  const massInput = document.getElementById('mass-input');
  const dampingInput = document.getElementById('damping-input');
  const resetBtn = document.getElementById('reset-btn');
  const pauseBtn = document.getElementById('pause-btn');

  let isPaused = false;
  let isDragging = false;
  let H = parseFloat(hInput.value);
  let SPEED = parseFloat(speedInput.value);
  let K = parseFloat(kInput.value);
  let MASS = parseFloat(massInput.value);
  let DAMPING = parseFloat(dampingInput.value);
  let t = 0;
  let lastFrameTime = 0;

  function createOscillator() {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    return new Oscillator(centerX, centerY);
  }

  let oscillator = createOscillator();
  let solver = new OscillatorSolver(K, MASS, DAMPING);

  function resizeCanvas() {
    resizeHighDPICanvas(canvas, ctx);

    oscillator = createOscillator();
    t = 0;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = oscillator.getPoint();

    const dx = x - point.x;
    const dy = y - point.y;
    if (dx * dx + dy * dy <= 400) {
      isDragging = true;
      if (!isPaused) {
        pauseBtn.click();
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      oscillator.x = x - oscillator.x0;
      oscillator.v = 0;
      oscillator.resetInitialConditions();
      t = 0;
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (isDragging) {
      oscillator.resetInitialConditions();
      t = 0;
    }
    isDragging = false;
  });

  hInput.addEventListener('change', () => {
    H = parseFloat(hInput.value);
  });

  speedInput.addEventListener('change', () => {
    SPEED = parseFloat(speedInput.value);
  });

  kInput.addEventListener('change', () => {
    K = parseFloat(kInput.value);
    solver = new OscillatorSolver(K, MASS, DAMPING);
  });

  massInput.addEventListener('change', () => {
    MASS = parseFloat(massInput.value);
    solver = new OscillatorSolver(K, MASS, DAMPING);
  });

  dampingInput.addEventListener('change', () => {
    DAMPING = parseFloat(dampingInput.value);
    solver = new OscillatorSolver(K, MASS, DAMPING);
  });

  resetBtn.addEventListener('click', () => {
    oscillator = createOscillator();
    t = 0;
    lastFrameTime = 0;
    if (!isPaused) {
      pauseBtn.click();
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

    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
      const targetTime = t + dt * SPEED;
      while (t < targetTime) {
        const stepSize = Math.min(H, targetTime - t);

        const state = {
          x: oscillator.x,
          v: oscillator.v,
        };

        let newState = solver.step(state, stepSize, t, solverSelect.value, {
          maxIterations: 10,
          tolerance: 1e-8,
        });
        t += stepSize;

        oscillator.x = newState.x;
        oscillator.v = newState.v;
      }
    }

    oscillator.draw(ctx, t, solver.omega);

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
});
