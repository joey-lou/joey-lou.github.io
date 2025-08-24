import { ThemeColors } from './theme-colors.js';
import { setupHighDPICanvas, resizeHighDPICanvas } from '../utils/canvas-utils.js';

export class RaycastEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = setupHighDPICanvas(this.canvas);
    this.mazeData = null;
    this.gameInstance = null;

    this.keys = {};
    this.animationId = null;
    this.lastTime = 0;
    this.showMinimap = false;

    this.posX = 1.5;
    this.posY = 1.5;
    this.dirX = 1.0;
    this.dirY = 0.0;
    this.planeX = 0.0;
    this.planeY = -0.66;

    this.themeColors = new ThemeColors();
    this.setupCanvas();
    this.initFontSystem();
  }

  initFontSystem() {
    this.gameFont = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-game')
      .trim();
    this.cachedFonts = {};
    this.updateFontCache();
  }

  updateFontCache() {
    const dpr = window.devicePixelRatio || 1;
    this.cachedFonts = {
      ui: `${Math.round(10 * dpr)}px ${this.gameFont}, monospace`,
      win: `bold ${Math.round(48 * dpr)}px ${this.gameFont}, monospace`,
      instruction: `${Math.round(24 * dpr)}px ${this.gameFont}, monospace`,
    };
  }

  setupCanvasFont(type = 'ui') {
    this.ctx.font = this.cachedFonts[type];
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  }

  setupCanvas() {
    this.handleResize();
  }

  handleResize() {
    const dimensions = resizeHighDPICanvas(this.canvas, this.ctx);
    this.screenWidth = dimensions.width;
    this.screenHeight = dimensions.height;
    this.screenSliceWidth = Math.min(Math.floor(this.screenWidth / 100), 10);
    this.updateFontCache();
    this.setupCanvasFont();
  }

  initVectors() {
    if (this.mazeData) {
      this.posX = this.mazeData.playerStart.x + 0.5;
      this.posY = this.mazeData.playerStart.y + 0.5;
    }
    this.dirX = 1.0;
    this.dirY = 0.0;
    this.planeX = 0.0;
    this.planeY = -0.66;
  }

  start(mazeData, gameInstance = null) {
    this.mazeData = mazeData;
    this.gameInstance = gameInstance;

    this.initVectors();
    this.themeColors.refresh();
    this.handleResize();
    this.gameLoop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  gameLoop = (currentTime) => {
    const deltaTime = (currentTime - this.lastTime) / 1000.0;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    if (this.checkWinCondition()) {
      this.handleWin();
      return;
    }

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  rotate(angle) {
    const oldDirX = this.dirX;
    this.dirX = this.dirX * Math.cos(angle) - this.dirY * Math.sin(angle);
    this.dirY = oldDirX * Math.sin(angle) + this.dirY * Math.cos(angle);

    const oldPlaneX = this.planeX;
    this.planeX = this.planeX * Math.cos(angle) - this.planeY * Math.sin(angle);
    this.planeY = oldPlaneX * Math.sin(angle) + this.planeY * Math.cos(angle);
  }

  move(dist) {
    const newX = this.posX + this.dirX * dist;
    const newY = this.posY + this.dirY * dist;

    const cellX = this.getMazeCell(Math.floor(newX), Math.floor(this.posY));
    if (cellX === 0 || cellX === -1) {
      this.posX = newX;
    }

    const cellY = this.getMazeCell(Math.floor(this.posX), Math.floor(newY));
    if (cellY === 0 || cellY === -1) {
      this.posY = newY;
    }
  }

  update(deltaTime) {
    const moveDist = deltaTime * 3.0;
    const rotRads = deltaTime * 2.0;

    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.move(moveDist);
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.move(-moveDist);
    }
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.rotate(rotRads);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.rotate(-rotRads);
    }
  }

  render() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    this.drawFloorAndCeiling();

    for (let x = 0; x < this.screenWidth; x += this.screenSliceWidth) {
      this.castRay(x);
    }

    this.drawUI();
  }

  drawFloorAndCeiling() {
    const halfHeight = this.screenHeight / 2;
    const envColors = this.themeColors.getEnvironmentColors();

    this.ctx.fillStyle = envColors.ceiling;
    this.ctx.fillRect(0, 0, this.screenWidth, halfHeight);

    this.ctx.fillStyle = envColors.floor;
    this.ctx.fillRect(0, halfHeight, this.screenWidth, halfHeight);
  }

  castRay(screenX) {
    const cameraX = (2 * screenX) / this.screenWidth - 1;
    const rayDirX = this.dirX + this.planeX * cameraX;
    const rayDirY = this.dirY + this.planeY * cameraX;

    let mapX = Math.floor(this.posX);
    let mapY = Math.floor(this.posY);

    let sideDistX, sideDistY;
    let stepX, stepY;
    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);

    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (this.posX - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
    }

    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (this.posY - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
    }

    let hit = false;
    let side;
    let wallType = 0;

    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }

      wallType = this.getMazeCell(mapX, mapY);

      if (wallType > 0 || wallType === -1) {
        hit = true;
      }
    }

    let perpWallDist;
    if (side === 0) {
      perpWallDist = sideDistX - deltaDistX;
    } else {
      perpWallDist = sideDistY - deltaDistY;
    }

    this.drawWallSlice(screenX, perpWallDist, wallType, side);
  }

  drawWallSlice(screenX, perpWallDist, wallType, side) {
    const lineHeight = Math.floor(this.screenHeight / perpWallDist);
    let drawStart = Math.floor(-lineHeight / 2 + this.screenHeight / 2);
    if (drawStart < 0) drawStart = 0;
    let drawEnd = Math.floor(lineHeight / 2 + this.screenHeight / 2);
    if (drawEnd >= this.screenHeight) drawEnd = this.screenHeight - 1;

    let color = this.themeColors.getWallColor(wallType);
    if (side === 1) {
      color = this.themeColors.getDarkenedWallColor(wallType);
    }

    const width =
      this.screenSliceWidth + drawStart > this.screenWidth
        ? this.screenWidth - drawStart
        : this.screenSliceWidth;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(screenX, drawStart, width, drawEnd - drawStart);
  }

  drawUI() {
    if (this.showMinimap) {
      this.drawMinimap();
    }
    this.drawInstructions();
  }

  drawMinimap() {
    const mapSize = 120;
    const cellSize = mapSize / this.mazeData.mazeSize;
    const mapX = this.screenWidth - mapSize - 10;
    const mapY = 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);

    for (let y = 0; y < this.mazeData.mazeSize; y++) {
      for (let x = 0; x < this.mazeData.mazeSize; x++) {
        const cellX = mapX + x * cellSize;
        const cellY = mapY + y * cellSize;

        const wallType = this.getMazeCell(x, y);

        if (wallType === -1) {
          this.ctx.fillStyle = this.themeColors.getExitColor();
          this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
        } else if (wallType > 0) {
          this.ctx.fillStyle = this.themeColors.getWallColor(wallType);
          this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }

    const playerMapX = mapX + this.posX * cellSize;
    const playerMapY = mapY + this.posY * cellSize;

    this.ctx.fillStyle = '#00FF00';
    this.ctx.beginPath();
    this.ctx.arc(playerMapX, playerMapY, cellSize / 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.closePath();
  }

  drawInstructions() {
    const instructions = ['WASD / Arrow Keys: Move', 'ESC: Back to editor', 'M: Cheat'];

    this.setupCanvasFont('ui');

    const dpr = window.devicePixelRatio || 1;
    const padding = Math.round(8 * dpr);
    const lineHeight = Math.round(12 * dpr);

    const boxWidth =
      instructions.reduce((max, text) => Math.max(max, this.ctx.measureText(text).width), 0) +
      padding * 2;
    const boxHeight = instructions.length * lineHeight + padding * 2;

    const x = Math.round(10 * dpr);
    const y = this.screenHeight - boxHeight - Math.round(10 * dpr);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, boxWidth, boxHeight);

    this.ctx.fillStyle = '#FFFFFF';
    instructions.forEach((text, index) => {
      this.ctx.fillText(text, x + padding, y + padding + index * lineHeight);
    });
  }

  checkWinCondition() {
    const exitX = this.mazeData.exitPos.x;
    const exitY = this.mazeData.exitPos.y;

    const distance = Math.sqrt(
      Math.pow(this.posX - (exitX + 0.5), 2) + Math.pow(this.posY - (exitY + 0.5), 2)
    );

    return distance < 0.5;
  }

  handleWin() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    const dpr = window.devicePixelRatio || 1;
    const centerX = Math.floor(this.screenWidth / 2);
    const centerY = Math.floor(this.screenHeight / 2);

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = this.cachedFonts.win;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('YOU WIN!', centerX, centerY - Math.round(20 * dpr));

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = this.cachedFonts.instruction;
    this.ctx.fillText('Press ESC to return to editor', centerX, centerY + Math.round(40 * dpr));

    this.setupCanvasFont();

    setTimeout(() => {
      if (this.gameInstance) {
        this.gameInstance.enterEditorMode();
      }
    }, 3000);
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;

    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.gameInstance) {
        this.gameInstance.enterEditorMode();
      }
    }

    if (e.code === 'KeyM') {
      e.preventDefault();
      this.showMinimap = !this.showMinimap;
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  getMazeCell(x, y) {
    if (!this.mazeData) return 1;
    if (x < 0 || x >= this.mazeData.mazeSize || y < 0 || y >= this.mazeData.mazeSize) {
      return 1;
    }
    return this.mazeData.maze[y][x];
  }
}
