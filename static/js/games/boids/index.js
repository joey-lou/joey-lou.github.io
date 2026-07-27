import { setupHighDPICanvas, resizeHighDPICanvas } from '../utils/canvas-utils.js';

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const RESPONSIVENESS = 0.05;
const MOMENTUM = 0.98;

class Boid {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = (Math.random() - 0.5) * 200;
    this.maxSpeed = 110;
    this.minSpeed = 90;
    this.separationRadius = 30;
    this.separationRadiusSq = 30 * 30;
  }

  update(neighbors, attractionPoint, params, canvasWidth, canvasHeight, dt = 1) {
    const desired = this.calculateDesiredVelocity(neighbors, attractionPoint, params);

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

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.wrap(canvasWidth, canvasHeight);
  }

  calculateDesiredVelocity(neighbors, attractionPoint, params) {
    let sepX = 0;
    let sepY = 0;
    let sepCount = 0;
    let alignX = 0;
    let alignY = 0;
    let cohX = 0;
    let cohY = 0;
    const count = neighbors.length;

    for (let i = 0; i < count; i++) {
      const other = neighbors[i];
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 0 && distSq < this.separationRadiusSq) {
        const dist = Math.sqrt(distSq);
        const force = (this.separationRadius - dist) / this.separationRadius;
        sepX += (dx / dist) * force;
        sepY += (dy / dist) * force;
        sepCount++;
      }

      alignX += other.vx;
      alignY += other.vy;
      cohX += other.x;
      cohY += other.y;
    }

    let x = 0;
    let y = 0;

    if (sepCount > 0) {
      sepX /= sepCount;
      sepY /= sepCount;
      const mag = Math.sqrt(sepX * sepX + sepY * sepY);
      if (mag > 0) {
        const scale = (this.maxSpeed * params.separation) / mag;
        x += sepX * scale;
        y += sepY * scale;
      }
    }

    if (count > 0) {
      alignX /= count;
      alignY /= count;
      const alignMag = Math.sqrt(alignX * alignX + alignY * alignY);
      if (alignMag > 0) {
        const scale = (this.maxSpeed * params.alignment) / alignMag;
        x += alignX * scale;
        y += alignY * scale;
      }

      cohX = cohX / count - this.x;
      cohY = cohY / count - this.y;
      const cohDist = Math.sqrt(cohX * cohX + cohY * cohY);
      if (cohDist > 0) {
        const scale = (this.maxSpeed * params.cohesion) / cohDist;
        x += cohX * scale;
        y += cohY * scale;
      }
    }

    if (attractionPoint) {
      const dx = attractionPoint.x - this.x;
      const dy = attractionPoint.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const scale = (this.maxSpeed * params.attraction) / dist;
        x += dx * scale;
        y += dy * scale;
      }
    }

    return { x, y };
  }

  wrap(canvasWidth, canvasHeight) {
    if (this.x < 0) this.x = canvasWidth;
    if (this.x > canvasWidth) this.x = 0;
    if (this.y < 0) this.y = canvasHeight;
    if (this.y > canvasHeight) this.y = 0;
  }

  draw(ctx, size) {
    const angle = Math.atan2(this.vy, this.vx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const half = size / 2;
    const third = size / 3;

    // Tip, rear-left, rear-right in local space, rotated into world space
    const x0 = this.x + size * cos;
    const y0 = this.y + size * sin;
    const x1 = this.x + (-half * cos - third * sin);
    const y1 = this.y + (-half * sin + third * cos);
    const x2 = this.x + (-half * cos + third * sin);
    const y2 = this.y + (-half * sin - third * cos);

    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
  }
}

class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this._activeCells = [];
  }

  clear() {
    for (let i = 0; i < this._activeCells.length; i++) {
      this._activeCells[i].length = 0;
    }
    this._activeCells.length = 0;
  }

  cellKey(x, y) {
    return (
      ((Math.floor(x / this.cellSize) & 0xffff) << 16) | (Math.floor(y / this.cellSize) & 0xffff)
    );
  }

  add(boid) {
    const key = this.cellKey(boid.x, boid.y);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    if (cell.length === 0) {
      this._activeCells.push(cell);
    }
    cell.push(boid);
  }

  getNeighbors(boid, radius, out) {
    out.length = 0;
    const cellX = Math.floor(boid.x / this.cellSize);
    const cellY = Math.floor(boid.y / this.cellSize);
    const range = Math.ceil(radius / this.cellSize);
    const radiusSq = radius * radius;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const key = (((cellX + dx) & 0xffff) << 16) | ((cellY + dy) & 0xffff);
        const cellBoids = this.grid.get(key);
        if (!cellBoids) continue;

        for (let i = 0; i < cellBoids.length; i++) {
          const other = cellBoids[i];
          if (other === boid) continue;
          const ox = boid.x - other.x;
          const oy = boid.y - other.y;
          if (ox * ox + oy * oy <= radiusSq) {
            out.push(other);
          }
        }
      }
    }

    return out;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = setupHighDPICanvas(canvas);

  let canvasLogicalDimensions = {
    width: canvas.getBoundingClientRect().width,
    height: canvas.getBoundingClientRect().height,
  };

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
  let showGrid = false;
  let boidSize = 0;
  let accentColor = getCssVar('--accent-primary');
  let borderColor = getCssVar('--border-color');
  const neighborBuffer = [];
  let params = {
    boidCount: parseInt(boidCountInput.value),
    simStep: parseFloat(speedInput.value),
    visionRadius: parseFloat(visionRadiusInput.value),
    separation: parseFloat(separationInput.value),
    alignment: parseFloat(alignmentInput.value),
    cohesion: parseFloat(cohesionInput.value),
    attraction: parseFloat(attractionInput.value),
  };

  function refreshThemeColors() {
    accentColor = getCssVar('--accent-primary');
    borderColor = getCssVar('--border-color');
  }

  new MutationObserver(refreshThemeColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });
  new MutationObserver(refreshThemeColors).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });

  function updateBoidSize() {
    boidSize = Math.min(canvasLogicalDimensions.width, canvasLogicalDimensions.height) * 0.01;
  }

  function createBoids() {
    boids = [];
    const minDistance = 35;
    const maxAttempts = 50;

    for (let i = 0; i < params.boidCount; i++) {
      const position = findNonOverlappingPosition(minDistance, maxAttempts);
      boids.push(new Boid(position.x, position.y));
    }
  }

  function findNonOverlappingPosition(minDistance, maxAttempts) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * canvasLogicalDimensions.width;
      const y = Math.random() * canvasLogicalDimensions.height;

      if (isPositionValid(x, y, minDistance)) {
        return { x, y };
      }
    }
    return {
      x: Math.random() * canvasLogicalDimensions.width,
      y: Math.random() * canvasLogicalDimensions.height,
    };
  }

  function isPositionValid(x, y, minDistance) {
    const minDistanceSq = minDistance * minDistance;
    for (const boid of boids) {
      const dx = x - boid.x;
      const dy = y - boid.y;
      if (dx * dx + dy * dy < minDistanceSq) {
        return false;
      }
    }
    return true;
  }

  function resizeCanvas() {
    const dimensions = resizeHighDPICanvas(canvas, ctx);
    canvasLogicalDimensions = dimensions;
    updateBoidSize();
    createBoids();
  }

  function updateGrid() {
    grid.clear();
    for (const boid of boids) {
      grid.add(boid);
    }
  }

  function draw() {
    if (showGrid) {
      drawGrid();
    }

    ctx.beginPath();
    ctx.fillStyle = accentColor;
    for (const boid of boids) {
      boid.draw(ctx, boidSize);
    }
    ctx.fill();

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
    const targetCells = 25;
    const cellSize = Math.max(
      10,
      Math.min(
        80,
        Math.floor(
          Math.min(canvasLogicalDimensions.width, canvasLogicalDimensions.height) / targetCells
        )
      )
    );

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let x = 0; x <= canvasLogicalDimensions.width; x += cellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasLogicalDimensions.height);
    }
    for (let y = 0; y <= canvasLogicalDimensions.height; y += cellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasLogicalDimensions.width, y);
    }
    ctx.stroke();
  }

  function gameLoop(currentTime) {
    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }

    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvasLogicalDimensions.width, canvasLogicalDimensions.height);

    if (!isPaused) {
      const simulationTime = dt * params.simStep;

      updateGrid();
      for (const boid of boids) {
        grid.getNeighbors(boid, params.visionRadius, neighborBuffer);
        boid.update(
          neighborBuffer,
          isMousePressed ? attractionPoint : null,
          params,
          canvasLogicalDimensions.width,
          canvasLogicalDimensions.height,
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
