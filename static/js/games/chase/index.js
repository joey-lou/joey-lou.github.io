import { setupHighDPICanvas, resizeHighDPICanvas } from '../utils/canvas-utils.js';

// Constants
const DUCK_SPEED = 200;
let FOX_SPEED_MULTIPLIER = 1.05;
const CAPTURE_RADIUS = 20;

let POND_RADIUS; // Will be set dynamically

class Duck {
  constructor() {
    this.reset();
    this.radius = 10;
    this.isMoving = false;
    this.targetX = this.x;
    this.targetY = this.y;
    this.velocity = 0;
    this.angularVelocity = 0;
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.closePath();
  }

  moveTo(targetX, targetY, dt) {
    this.targetX = targetX;
    this.targetY = targetY;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const maxDistance = DUCK_SPEED * dt;
      const scale = Math.min(maxDistance / distance, 1);
      this.velocity = (Math.sqrt(dx * dx + dy * dy) * scale) / dt;
      const prevAngle = this.getAngle();
      this.x += dx * scale;
      this.y += dy * scale;
      this.angularVelocity = (this.getAngle() - prevAngle) / dt;
    }
  }

  isInPond() {
    const distanceFromCenter = Math.sqrt(this.x * this.x + this.y * this.y);
    return distanceFromCenter <= POND_RADIUS;
  }

  getAngle() {
    // radians increases clockwise
    let angle = Math.atan2(this.y, this.x);
    if (angle < 0) {
      angle += Math.PI * 2;
    }
    return angle;
  }
}

class Fox {
  constructor() {
    this.reset();
    this.radius = 15;
    this.angle = 0;
    this.velocity = 0;
    this.angularVelocity = 0;
  }

  reset() {
    this.angle = 0;
    this.updatePosition();
  }

  updatePosition() {
    this.x = Math.cos(this.angle) * POND_RADIUS;
    this.y = Math.sin(this.angle) * POND_RADIUS;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4500';
    ctx.fill();
    ctx.closePath();
  }

  chaseDuck(duck, dt) {
    // Calculate angle to duck
    const targetAngle = duck.getAngle();

    // Find shortest angular distance
    let deltaAngle = targetAngle - this.angle;
    if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
    if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

    // Move along the circle's circumference
    const angularSpeed = (Math.PI * DUCK_SPEED * FOX_SPEED_MULTIPLIER) / POND_RADIUS;
    const maxRotation = angularSpeed * dt;
    const rotation = Math.sign(deltaAngle) * Math.min(Math.abs(deltaAngle), maxRotation);
    const prevAngle = this.angle;
    const prevX = this.x;
    const prevY = this.y;
    this.angle += rotation;
    if (this.angle < 0) this.angle += Math.PI * 2;
    if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    this.updatePosition();
    this.velocity = Math.sqrt((this.x - prevX) ** 2 + (this.y - prevY) ** 2) / dt;
    this.angularVelocity = (this.angle - prevAngle) / dt;
  }

  hasCaughtDuck(duck) {
    const dx = duck.x - this.x;
    const dy = duck.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= CAPTURE_RADIUS;
  }

  getAngle() {
    return this.angle;
  }
}

class GameInfo {
  constructor() {
    this.cachedFont = null;
    this.cachedFontFamily = null;
    this.cachedTheme = null;
    this.cachedFillStyle = null;
    // Use rem-based values for responsive sizing
    this.leftPaddingRem = 3;
    this.lineHeightRem = 1.5;
    this.fontSizeRem = 1.5;
    this.updateFontCache();
  }

  // Convert rem to pixels based on document font size
  remToPx(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  updateFontCache() {
    const theme = localStorage.getItem('theme') || 'light';
    const gameFont = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-game')
      .trim();

    // Convert rem-based values to pixels
    const fontSizePx = this.remToPx(this.fontSizeRem);
    this.leftPadding = this.remToPx(this.leftPaddingRem);
    this.lineHeight = this.remToPx(this.lineHeightRem);

    this.cachedFont = `${fontSizePx}px ${gameFont}`;
    this.cachedFontFamily = gameFont;
    this.cachedTheme = theme;
    this.cachedFillStyle = theme === 'light' ? '#333' : '#fff';
  }

  setupTextStyle(ctx) {
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Only update font if theme changed
    if (currentTheme !== this.cachedTheme) {
      this.updateFontCache();
    }

    ctx.font = this.cachedFont;
    ctx.fillStyle = this.cachedFillStyle;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  draw(ctx, duck, fox) {
    ctx.save();
    ctx.resetTransform();
    this.setupTextStyle(ctx);

    const stats = [
      `Distance:       ${Math.sqrt((duck.x - fox.x) ** 2 + (duck.y - fox.y) ** 2)
        .toFixed(0)
        .padStart(6)}`,
      `Angular Dist:   ${((Math.abs(duck.getAngle() - fox.getAngle()) * 180) / Math.PI)
        .toFixed(1)
        .padStart(6)}°`,
      `Duck Angular v: ${((duck.angularVelocity * 180) / Math.PI).toFixed(1).padStart(6)}°/s`,
      `Fox Angular v:  ${((fox.angularVelocity * 180) / Math.PI).toFixed(1).padStart(6)}°/s`,
    ];

    stats.forEach((stat, i) => {
      ctx.fillText(stat, this.leftPadding, 30 + i * this.lineHeight);
    });

    ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-board');
  const ctx = setupHighDPICanvas(canvas);
  const resetBtn = document.getElementById('reset-btn');
  const infoBtn = document.getElementById('info-btn');

  // Track logical canvas dimensions for game calculations
  let canvasLogicalDimensions = {
    width: canvas.getBoundingClientRect().width,
    height: canvas.getBoundingClientRect().height,
  };
  let gameState = 'playing'; // 'playing', 'won', 'lost'
  let showInfo = true;

  const duck = new Duck();
  const fox = new Fox();
  const gameInfo = new GameInfo();
  function reset() {
    gameState = 'playing';
    duck.reset();
    fox.reset();
  }

  function resizeCanvas() {
    const dimensions = resizeHighDPICanvas(canvas, ctx);
    canvasLogicalDimensions = dimensions;
    // Set pond radius to 40% of the smaller canvas dimension (use logical dimensions)
    POND_RADIUS = Math.floor(Math.min(250, Math.min(dimensions.width, dimensions.height) * 0.4));
    reset();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  resetBtn.addEventListener('click', reset);
  infoBtn.addEventListener('click', () => {
    showInfo = !showInfo;
    infoBtn.classList.toggle('active', showInfo);
  });

  let lastTime = performance.now();
  function drawPond() {
    // Create gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POND_RADIUS);
    gradient.addColorStop(1, '#87CEEB'); // Light edge
    gradient.addColorStop(0.5, '#4F94CD'); // Medium blue
    gradient.addColorStop(0, '#104E8B'); // Dark blue center

    ctx.beginPath();
    ctx.arc(0, 0, POND_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#4F94CD';
    ctx.fill();

    // Add ripple effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, POND_RADIUS / FOX_SPEED_MULTIPLIER / Math.PI, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }

  function update(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (gameState === 'playing') {
      if (duck.isMoving) {
        duck.moveTo(duck.targetX, duck.targetY, dt);
        fox.chaseDuck(duck, dt);
      }

      if (!duck.isInPond()) {
        gameState = 'won';
        duck.isMoving = false;
      } else if (fox.hasCaughtDuck(duck)) {
        gameState = 'lost';
        duck.isMoving = false;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvasLogicalDimensions.width, canvasLogicalDimensions.height);
    ctx.save();
    ctx.translate(canvasLogicalDimensions.width / 2, canvasLogicalDimensions.height / 2);

    drawPond();
    duck.draw(ctx);
    fox.draw(ctx);

    if (showInfo) {
      gameInfo.draw(ctx, duck, fox);
    }

    if (gameState !== 'playing') {
      // Use cached font from gameInfo for consistency and performance
      gameInfo.setupTextStyle(ctx);
      const endGameFontSize = gameInfo.remToPx(5); // 5rem for end game text
      ctx.font = `${endGameFontSize}px ${gameInfo.cachedFontFamily}`;
      ctx.fillStyle = gameState === 'won' ? 'green' : 'red';
      ctx.textAlign = 'center';
      // Shift text up a bit
      ctx.fillText(
        gameState === 'won' ? 'Escaped!' : 'Caught!',
        0,
        -Math.floor(endGameFontSize / 2)
      );
    }

    ctx.restore();
  }

  function gameLoop(currentTime) {
    update(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;

    duck.isMoving = true;
    duck.targetX = x;
    duck.targetY = y;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (duck.isMoving && gameState === 'playing') {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - canvasLogicalDimensions.width / 2;
      const y = e.clientY - rect.top - canvasLogicalDimensions.height / 2;
      duck.targetX = x;
      duck.targetY = y;
    }
  });

  canvas.addEventListener('mouseup', () => {
    duck.isMoving = false;
  });

  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');

  speedSlider.addEventListener('input', (e) => {
    FOX_SPEED_MULTIPLIER = parseInt(e.target.value) / 100;
    speedValue.textContent = `${e.target.value}%`;
  });

  // Update font cache when theme changes (check on window focus)
  window.addEventListener('focus', () => {
    gameInfo.updateFontCache();
  });

  // Update font cache when window resizes (in case root font size changed)
  window.addEventListener('resize', () => {
    gameInfo.updateFontCache();
  });

  requestAnimationFrame(gameLoop);
});
