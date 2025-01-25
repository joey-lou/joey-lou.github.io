import { Oscillator, OscillatorSolver } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');

  const solverSelect = document.getElementById('solver-select');
  const hInput = document.getElementById('h-input');
  const speedInput = document.getElementById('speed-input');
  const kInput = document.getElementById('k-input');
  const massInput = document.getElementById('mass-input');
  const dampingInput = document.getElementById('damping-input');
  const resetBtn = document.getElementById('reset-btn');
  const pauseBtn = document.getElementById('pause-btn');

  let isPaused = true;
  let isDragging = false;
  let H = parseFloat(hInput.value);
  let SPEED = parseFloat(speedInput.value);
  let K = parseFloat(kInput.value);
  let MASS = parseFloat(massInput.value);
  let DAMPING = parseFloat(dampingInput.value);
  let t = 0;
  let lastFrameTime = 0;

  function createOscillator() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    return new Oscillator(centerX, centerY);
  }

  let oscillator = createOscillator();
  let solver = new OscillatorSolver(K, MASS, DAMPING);

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    oscillator = createOscillator();
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

        let newState;
        switch (solverSelect.value) {
          case 'euler':
            newState = solver.euler(state, stepSize, t);
            break;
          case 'midpoint':
            newState = solver.midpoint(state, stepSize, t);
            break;
          case 'backward-euler':
            newState = solver.backwardEuler(state, stepSize, t);
            break;
          default:
            newState = solver.rk4(state, stepSize, t);
        }
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
