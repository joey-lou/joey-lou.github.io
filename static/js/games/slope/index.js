const GRAVITY = 200;
const BEZIER_SEGMENTS = 20000;
const GAME_SPEED = 1000 / 120; // 120 FPS
const DT = GAME_SPEED / 1000; // time delta between frames
const BALL_MASS = 1;
const GameState = {
  FREE: 'free', // Initial state, can modify control points
  RUNNING: 'running', // Simulation is running
  PAUSED: 'paused', // Simulation is paused
  FINISHED: 'finished', // Ball reached the end
};

class Node {
  constructor(x, y, isMovable = true) {
    this.x = x;
    this.y = y;
    this.isMovable = isMovable;
    this.radius = 8;
    this.isDragging = false;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.isMovable ? '#4CAF50' : '#FF5722';
    ctx.fill();
    ctx.closePath();
  }

  isPointInside(x, y) {
    // Used for dragging the node
    const dx = this.x - x;
    const dy = this.y - y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#2196F3';
    ctx.fill();
    ctx.closePath();
  }
}

function calculateBezierPoint(t, points) {
  // De Casteljau's algorithm for N control points
  let currentPoints = [...points];

  for (let i = points.length - 1; i > 0; i--) {
    const newPoints = [];
    for (let j = 0; j < i; j++) {
      newPoints.push({
        x: (1 - t) * currentPoints[j].x + t * currentPoints[j + 1].x,
        y: (1 - t) * currentPoints[j].y + t * currentPoints[j + 1].y,
      });
    }
    currentPoints = newPoints;
  }

  return currentPoints[0];
}

function getAllBezierPoints(nodes, numPoints) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = calculateBezierPoint(t, nodes);
    points.push(point);
  }
  return points;
}

function drawControlPoints(ctx, nodes) {
  // Draw dotted lines between control points
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(nodes[0].x, nodes[0].y);

  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function integratePath(splinePoints) {
  // given pre-defined travel, we can use conservation of energy to find the velocity at each point
  // and therefore, the time it takes to reach each point.
  const totalEnergy = -splinePoints[0].y * BALL_MASS * GRAVITY;
  let lastV = 0;
  let times = [0];
  let lastX = splinePoints[0].x;
  let lastY = splinePoints[0].y;
  for (let i = 1; i < splinePoints.length; i++) {
    const x = splinePoints[i].x;
    const y = splinePoints[i].y;
    const energy = -y * BALL_MASS * GRAVITY;
    const v = Math.sqrt((2 * (totalEnergy - energy)) / BALL_MASS);
    const segmentDistance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
    const dt = segmentDistance / ((v + lastV) / 2);
    times.push(times[i - 1] + dt);
    lastX = x;
    lastY = y;
    lastV = v;
  }
  return times;
}

function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}

function drawSpline(ctx, points) {
  // Reset line dash and draw the spline
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    ctx.lineTo(point.x, point.y);
  }

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTime(ctx, canvas, T) {
  ctx.font = '20px Oxanium';
  const theme = localStorage.getItem('theme') || 'light';
  ctx.fillStyle = theme === 'light' ? '#000' : '#fff';
  ctx.textAlign = 'right';
  const timeText = `Time: ${T.toFixed(2)}s`;
  ctx.fillText(timeText, canvas.width - 20, 30);
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const pointsSlider = document.getElementById('points-slider');
  const pointsValue = document.getElementById('points-value');

  function initializeNodes() {
    const numControlPoints = parseInt(pointsSlider.value);

    // Fixed end points
    const fixedNodes = [
      new Node(50, 50, false), // Start node (fixed)
      new Node(canvas.width - 50, canvas.height - 50, false), // End node (fixed)
    ];

    const controlNodes = Array.from({ length: numControlPoints }, (_, i) => {
      const t = (i + 1) / (numControlPoints + 1);
      return new Node(
        fixedNodes[0].x + t * (fixedNodes[1].x - fixedNodes[0].x),
        fixedNodes[0].y + t * (fixedNodes[1].y - fixedNodes[0].y),
        true
      );
    });

    return [fixedNodes[0], ...controlNodes, fixedNodes[1]];
  }

  // Initialize nodes and ball
  let gameState = GameState.FREE;
  let nodes = initializeNodes();
  const ball = new Ball(nodes[0].x, nodes[0].y);
  let selectedNode = null;
  let splinePoints = getAllBezierPoints(nodes, BEZIER_SEGMENTS);
  let T = 0;
  let times = integratePath(splinePoints);

  function update() {
    if (gameState === GameState.RUNNING) {
      T += DT;
      const i = binarySearch(times, T);
      if (i >= times.length - 1) {
        gameState = GameState.FINISHED;
        ball.x = splinePoints[splinePoints.length - 1].x;
        ball.y = splinePoints[splinePoints.length - 1].y;
        startBtn.textContent = 'Finished';
      } else {
        const point = splinePoints[i];
        ball.x = point.x;
        ball.y = point.y;
      }
    } else if (gameState === GameState.FREE) {
      splinePoints = getAllBezierPoints(nodes, BEZIER_SEGMENTS);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw control points and dotted lines in FREE state
    if (gameState === GameState.FREE) {
      drawControlPoints(ctx, nodes);
      nodes.forEach((node) => node.draw(ctx));
    }

    // Always draw the spline and ball
    drawSpline(ctx, splinePoints);
    ball.draw(ctx);
    drawTime(ctx, canvas, T);
  }

  function reset() {
    gameState = GameState.FREE;
    startBtn.textContent = 'Start';
    nodes = initializeNodes();
    splinePoints = getAllBezierPoints(nodes, BEZIER_SEGMENTS);
    ball.x = nodes[0].x;
    ball.y = nodes[0].y;
    T = 0;
    draw();
  }

  // Set canvas size to match container
  function resizeCanvas() {
    const computedStyle = getComputedStyle(canvas);
    canvas.width = parseInt(computedStyle.width, 10);
    canvas.height = parseInt(computedStyle.height, 10);
    reset();
  }

  window.addEventListener('resize', resizeCanvas);

  // Event listeners for node dragging
  canvas.addEventListener('mousedown', (e) => {
    if (gameState !== GameState.FREE) return; // Only allow dragging in FREE state

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodes.forEach((node) => {
      if (node.isMovable && node.isPointInside(x, y)) {
        selectedNode = node;
        node.isDragging = true;
      }
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (selectedNode && selectedNode.isDragging) {
      const rect = canvas.getBoundingClientRect();
      selectedNode.x = e.clientX - rect.left;
      selectedNode.y = e.clientY - rect.top;
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (selectedNode) {
      selectedNode.isDragging = false;
      selectedNode = null;
    }
  });

  // Start/Reset buttons
  startBtn.addEventListener('click', () => {
    switch (gameState) {
      case GameState.FREE:
        gameState = GameState.RUNNING;
        times = integratePath(splinePoints);
        startBtn.textContent = 'Pause';
        // Disable control points
        nodes.slice(1, nodes.length - 1).forEach((node) => {
          node.isMovable = false;
        });
        break;

      case GameState.RUNNING:
        gameState = GameState.PAUSED;
        startBtn.textContent = 'Resume';
        break;

      case GameState.PAUSED:
        gameState = GameState.RUNNING;
        startBtn.textContent = 'Pause';
        break;

      case GameState.FINISHED:
        reset();
        break;
    }
    draw();
  });

  resetBtn.addEventListener('click', reset);

  // Add slider event listener
  pointsSlider.addEventListener('input', (e) => {
    pointsValue.textContent = e.target.value;
    reset();
  });

  resizeCanvas();

  // Update loop
  setInterval(() => {
    update();
    draw();
  }, GAME_SPEED);
});
