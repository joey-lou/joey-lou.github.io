// Fixed physics parameters for consistent, reasonable behavior
const RESPONSIVENESS = 0.05; // Good balance between smooth and responsive
const MOMENTUM = 0.98; // Natural momentum without being sluggish

class Boid {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = (Math.random() - 0.5) * 200;
    this.maxSpeed = 110;
    this.minSpeed = 90;
    this.separationRadius = 30; // Fixed separation distance
  }

  update(neighbors, attractionPoint, params, canvasWidth, canvasHeight, dt = 1) {
    const desired = this.calculateDesiredVelocity(neighbors, attractionPoint, params);

    // Use fixed physics parameters for consistent, reasonable behavior
    this.vx += (desired.x - this.vx) * RESPONSIVENESS;
    this.vy += (desired.y - this.vy) * RESPONSIVENESS;

    this.vx *= MOMENTUM;
    this.vy *= MOMENTUM;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    } else if (speed < this.minSpeed && speed > 0) {
      this.vx = (this.vx / speed) * this.minSpeed;
      this.vy = (this.vy / speed) * this.minSpeed;
    }

    // Apply time-scaled movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.wrap(canvasWidth, canvasHeight);
  }

  calculateDesiredVelocity(neighbors, attractionPoint, params) {
    const separation = this.separate(neighbors, params.separation);
    const alignment = this.align(neighbors, params.alignment);
    const cohesion = this.cohere(neighbors, params.cohesion);
    const attraction = this.attract(attractionPoint, params.attraction);

    return {
      x: separation.x + alignment.x + cohesion.x + attraction.x,
      y: separation.y + alignment.y + cohesion.y + attraction.y,
    };
  }

  separate(neighbors, weight) {
    const steer = { x: 0, y: 0 };
    let count = 0;

    for (const other of neighbors) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0 && dist < this.separationRadius) {
        const force = (this.separationRadius - dist) / this.separationRadius;
        steer.x += (dx / dist) * force;
        steer.y += (dy / dist) * force;
        count++;
      }
    }

    if (count > 0) {
      steer.x /= count;
      steer.y /= count;
      const mag = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
      if (mag > 0) {
        steer.x = (steer.x / mag) * this.maxSpeed * weight;
        steer.y = (steer.y / mag) * this.maxSpeed * weight;
      }
    }

    return steer;
  }

  align(neighbors, weight) {
    const steer = { x: 0, y: 0 };
    let count = 0;

    for (const other of neighbors) {
      steer.x += other.vx;
      steer.y += other.vy;
      count++;
    }

    if (count > 0) {
      steer.x /= count;
      steer.y /= count;
      const mag = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
      if (mag > 0) {
        steer.x = (steer.x / mag) * this.maxSpeed * weight;
        steer.y = (steer.y / mag) * this.maxSpeed * weight;
      }
    }

    return steer;
  }

  cohere(neighbors, weight) {
    const steer = { x: 0, y: 0 };
    let count = 0;

    for (const other of neighbors) {
      steer.x += other.x;
      steer.y += other.y;
      count++;
    }

    if (count > 0) {
      steer.x /= count;
      steer.y /= count;
      return this.seek(steer, weight);
    }

    return steer;
  }

  attract(point, weight) {
    if (!point) return { x: 0, y: 0 };
    return this.seek(point, weight);
  }

  seek(target, weight) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      return {
        x: (dx / dist) * this.maxSpeed * weight,
        y: (dy / dist) * this.maxSpeed * weight,
      };
    }

    return { x: 0, y: 0 };
  }

  wrap(canvasWidth, canvasHeight) {
    if (this.x < 0) this.x = canvasWidth;
    if (this.x > canvasWidth) this.x = 0;
    if (this.y < 0) this.y = canvasHeight;
    if (this.y > canvasHeight) this.y = 0;
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const angle = Math.atan2(this.vy, this.vx);
    const size = Math.min(canvasWidth, canvasHeight) * 0.01;

    // Theme-aware color
    const isDark = document.body.getAttribute('data-bs-theme') === 'dark';
    const color = isDark ? '#6ba6e8' : '#4a90e2';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size / 2, size / 3);
    ctx.lineTo(-size / 2, -size / 3);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  getCell(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  add(boid) {
    const cell = this.getCell(boid.x, boid.y);
    if (!this.grid.has(cell)) {
      this.grid.set(cell, []);
    }
    this.grid.get(cell).push(boid);
  }

  getNeighbors(boid, radius) {
    const neighbors = [];
    const cellX = Math.floor(boid.x / this.cellSize);
    const cellY = Math.floor(boid.y / this.cellSize);
    const range = Math.ceil(radius / this.cellSize);

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const cell = `${cellX + dx},${cellY + dy}`;
        const cellBoids = this.grid.get(cell);
        if (cellBoids) {
          for (const other of cellBoids) {
            if (other !== boid) {
              const dx = boid.x - other.x;
              const dy = boid.y - other.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= radius) {
                neighbors.push(other);
              }
            }
          }
        }
      }
    }

    return neighbors;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');

  const boidCountInput = document.getElementById('boid-count');
  const boidCountValue = document.getElementById('boid-count-value');
  const speedInput = document.getElementById('speed-input');
  const speedValue = document.getElementById('speed-value');
  const visionRadiusInput = document.getElementById('vision-radius');
  const visionValue = document.getElementById('vision-value');
  const separationInput = document.getElementById('separation');
  const separationValue = document.getElementById('separation-value');
  const alignmentInput = document.getElementById('alignment');
  const alignmentValue = document.getElementById('alignment-value');
  const cohesionInput = document.getElementById('cohesion');
  const cohesionValue = document.getElementById('cohesion-value');
  const attractionInput = document.getElementById('attraction');
  const attractionValue = document.getElementById('attraction-value');
  const resetBtn = document.getElementById('reset-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const gridBtn = document.getElementById('grid-btn');

  let boids = [];
  let grid = new SpatialGrid(50);
  let isPaused = false;
  let attractionPoint = null;
  let isMousePressed = false;
  let lastFrameTime = 0;
  let showGrid = true;
  let params = {
    boidCount: parseInt(boidCountInput.value),
    simStep: parseFloat(speedInput.value),
    visionRadius: parseFloat(visionRadiusInput.value),
    separation: parseFloat(separationInput.value),
    alignment: parseFloat(alignmentInput.value),
    cohesion: parseFloat(cohesionInput.value),
    attraction: parseFloat(attractionInput.value),
  };

  function createBoids() {
    boids = [];
    const minDistance = 35;
    const maxAttempts = 50;

    for (let i = 0; i < params.boidCount; i++) {
      let position = findNonOverlappingPosition(minDistance, maxAttempts);
      boids.push(new Boid(position.x, position.y));
    }
  }

  function findNonOverlappingPosition(minDistance, maxAttempts) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;

      if (isPositionValid(x, y, minDistance)) {
        return { x, y };
      }
    }
    return { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
  }

  function isPositionValid(x, y, minDistance) {
    for (const boid of boids) {
      const dx = x - boid.x;
      const dy = y - boid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    createBoids();
  }

  function updateGrid() {
    grid.clear();
    for (const boid of boids) {
      grid.add(boid);
    }
  }

  function update() {
    if (isPaused) return;

    updateGrid();

    for (const boid of boids) {
      const neighbors = grid.getNeighbors(boid, params.visionRadius);
      boid.update(
        neighbors,
        isMousePressed ? attractionPoint : null,
        params,
        canvas.width,
        canvas.height
      );
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid();
    }

    for (const boid of boids) {
      boid.draw(ctx, canvas.width, canvas.height);
    }

    if (isMousePressed && attractionPoint) {
      ctx.beginPath();
      ctx.arc(attractionPoint.x, attractionPoint.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawGrid() {
    // Scale grid size with canvas - aim for roughly 10-15 cells across the screen
    const targetCells = 25;
    const cellSize = Math.max(
      10,
      Math.min(80, Math.floor(Math.min(canvas.width, canvas.height) / targetCells))
    );

    const isDark = document.body.getAttribute('data-bs-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1.5;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function gameLoop(currentTime) {
    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }

    // Calculate real time delta
    const dt = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
      // Apply sim step as time multiplier
      const simulationTime = dt * params.simStep;

      // Update boids with time-scaled physics
      updateGrid();
      for (const boid of boids) {
        const neighbors = grid.getNeighbors(boid, params.visionRadius);
        boid.update(
          neighbors,
          isMousePressed ? attractionPoint : null,
          params,
          canvas.width,
          canvas.height,
          simulationTime
        );
      }
    }

    draw();
    requestAnimationFrame(gameLoop);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    attractionPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isMousePressed = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isMousePressed) {
      const rect = canvas.getBoundingClientRect();
      attractionPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  });

  canvas.addEventListener('mouseup', () => {
    isMousePressed = false;
    attractionPoint = null;
  });

  canvas.addEventListener('mouseleave', () => {
    isMousePressed = false;
    attractionPoint = null;
  });

  boidCountInput.addEventListener('input', () => {
    params.boidCount = parseInt(boidCountInput.value);
    boidCountValue.textContent = params.boidCount;
    createBoids();
  });

  speedInput.addEventListener('input', () => {
    params.simStep = parseFloat(speedInput.value);
    speedValue.textContent = params.simStep.toFixed(1);
  });

  visionRadiusInput.addEventListener('input', () => {
    params.visionRadius = parseFloat(visionRadiusInput.value);
    visionValue.textContent = params.visionRadius;
  });

  separationInput.addEventListener('input', () => {
    params.separation = parseFloat(separationInput.value);
    separationValue.textContent = params.separation.toFixed(1);
  });

  alignmentInput.addEventListener('input', () => {
    params.alignment = parseFloat(alignmentInput.value);
    alignmentValue.textContent = params.alignment.toFixed(1);
  });

  cohesionInput.addEventListener('input', () => {
    params.cohesion = parseFloat(cohesionInput.value);
    cohesionValue.textContent = params.cohesion.toFixed(1);
  });

  attractionInput.addEventListener('input', () => {
    params.attraction = parseFloat(attractionInput.value);
    attractionValue.textContent = params.attraction.toFixed(1);
  });

  resetBtn.addEventListener('click', () => {
    attractionPoint = null;
    isMousePressed = false;
    createBoids();
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Run' : 'Stop';
  });

  gridBtn.addEventListener('click', () => {
    showGrid = !showGrid;
    gridBtn.textContent = showGrid ? 'Hide Grid' : 'Show Grid';
  });

  gameLoop(performance.now());
});
