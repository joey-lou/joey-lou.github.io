import { ThemeColors } from './theme-colors.js';
import { MazeGenerator } from './maze-generator.js';

export class MazeEditor {
  constructor(mazeSize = 20) {
    this.mazeSize = mazeSize;
    this.maze = [];
    this.playerStart = { x: 1, y: 1 };
    this.exitPos = { x: this.mazeSize - 2, y: this.mazeSize - 2 };

    this.selectedWallType = 1;
    this.isDrawing = false;
    this.settingStart = false;
    this.settingExit = false;
    this.themeColors = new ThemeColors();
    this.mazeGenerator = new MazeGenerator(mazeSize);

    this.generateEmptyMaze();
    this.initializeElements();
    this.setupEventListeners();
    this.updateGrid();
  }

  initializeElements() {
    this.gridElement = document.getElementById('maze-grid');
    this.colorBtns = document.querySelectorAll('.color-btn');
    this.setStartBtn = document.getElementById('set-start-btn');
    this.setExitBtn = document.getElementById('set-exit-btn');
    this.sizeSlider = document.getElementById('maze-size-slider');
    this.sizeValue = document.getElementById('maze-size-value');
  }

  setupEventListeners() {
    this.colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.colorBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedWallType = parseInt(btn.dataset.wall);
        this.settingStart = false;
        this.settingExit = false;
        this.updateButtonStates();
      });
    });

    this.setStartBtn.addEventListener('click', () => {
      this.settingStart = !this.settingStart;
      this.settingExit = false;
      this.updateButtonStates();
    });

    this.setExitBtn.addEventListener('click', () => {
      this.settingExit = !this.settingExit;
      this.settingStart = false;
      this.updateButtonStates();
    });

    this.sizeSlider.addEventListener('input', (e) => {
      const newSize = parseInt(e.target.value);
      this.sizeValue.textContent = newSize;
      this.resizeMaze(newSize);
    });
  }

  updateButtonStates() {
    this.setStartBtn.classList.toggle('active', this.settingStart);
    this.setExitBtn.classList.toggle('active', this.settingExit);

    if (this.settingStart) {
      this.setStartBtn.textContent = 'Click to Set Start';
    } else {
      this.setStartBtn.textContent = 'Set Start';
    }

    if (this.settingExit) {
      this.setExitBtn.textContent = 'Click to Set Exit';
    } else {
      this.setExitBtn.textContent = 'Set Exit';
    }
  }

  updateGrid() {
    this.updateColorPalette();

    this.gridElement.innerHTML = '';
    this.gridElement.style.gridTemplateColumns = `repeat(${this.mazeSize}, 1fr)`;
    this.gridElement.style.gridTemplateRows = `repeat(${this.mazeSize}, 1fr)`;

    for (let y = 0; y < this.mazeSize; y++) {
      for (let x = 0; x < this.mazeSize; x++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        this.updateCellAppearance(cell, x, y);
        this.setupCellEventListeners(cell, x, y);

        this.gridElement.appendChild(cell);
      }
    }
  }

  updateColorPalette() {
    this.themeColors.refresh();
    this.colorBtns.forEach((btn, index) => {
      const wallType = index;
      if (wallType <= 4) {
        btn.style.background = this.themeColors.getWallColor(wallType);
      }
    });
  }

  updateCellAppearance(cell, x, y) {
    const wallType = this.getMazeCell(x, y);

    cell.className = 'maze-cell';

    if (x === this.playerStart.x && y === this.playerStart.y) {
      cell.classList.add('start');
    } else if (x === this.exitPos.x && y === this.exitPos.y) {
      cell.classList.add('exit');
    } else if (wallType === 5) {
      cell.classList.add('maze-border');
    } else if (wallType > 0) {
      cell.classList.add(`wall-${wallType}`);
    }
  }

  setupCellEventListeners(cell, x, y) {
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleCellClick(x, y);
      this.isDrawing = true;
    });

    cell.addEventListener('mouseenter', () => {
      if (this.isDrawing && !this.settingStart && !this.settingExit) {
        this.handleCellClick(x, y);
      }
    });

    cell.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  handleCellClick(x, y) {
    if (this.settingStart) {
      this.setStartPosition(x, y);
    } else if (this.settingExit) {
      this.setExitPosition(x, y);
    } else {
      this.setCellWallType(x, y);
    }
  }

  setStartPosition(x, y) {
    if (x === 0 || x === this.mazeSize - 1 || y === 0 || y === this.mazeSize - 1) {
      return;
    }

    this.playerStart = { x, y };
    this.setMazeCell(x, y, 0);
    this.settingStart = false;
    this.updateButtonStates();
    this.updateGrid();
  }

  setExitPosition(x, y) {
    if (x === 0 || x === this.mazeSize - 1 || y === 0 || y === this.mazeSize - 1) {
      return;
    }

    this.exitPos = { x, y };
    this.setMazeCell(x, y, -1);
    this.settingExit = false;
    this.updateButtonStates();
    this.updateGrid();
  }

  setCellWallType(x, y) {
    if (x === 0 || x === this.mazeSize - 1 || y === 0 || y === this.mazeSize - 1) {
      return;
    }

    if (
      (x === this.playerStart.x && y === this.playerStart.y) ||
      (x === this.exitPos.x && y === this.exitPos.y)
    ) {
      return;
    }

    this.setMazeCell(x, y, this.selectedWallType);

    const cell = this.gridElement.children[y * this.mazeSize + x];
    this.updateCellAppearance(cell, x, y);
  }

  static setupGlobalEvents() {
    document.addEventListener('mouseup', () => {
      document.querySelectorAll('.maze-editor').forEach((editor) => {
        if (editor.mazeEditor) {
          editor.mazeEditor.isDrawing = false;
        }
      });
    });
  }

  generateEmptyMaze() {
    this.maze = this.mazeGenerator.generateEmpty();
  }

  generateDFSMaze() {
    this.maze = this.mazeGenerator.generateDFS();
    this.setStartPosition(this.playerStart.x, this.playerStart.y);
    this.setExitPosition(this.exitPos.x, this.exitPos.y);
    this.updateGrid();
  }

  getMazeCell(x, y) {
    if (x < 0 || x >= this.mazeSize || y < 0 || y >= this.mazeSize) {
      return 1;
    }
    return this.maze[y][x];
  }

  setMazeCell(x, y, value) {
    if (x >= 0 && x < this.mazeSize && y >= 0 && y < this.mazeSize) {
      this.maze[y][x] = value;
    }
  }

  hasValidStartAndExit() {
    if (this.maze[this.playerStart.y][this.playerStart.x] !== 0) {
      return false;
    }
    if (this.maze[this.exitPos.y][this.exitPos.x] !== -1) {
      return false;
    }
    return true;
  }

  getMazeData() {
    const data = {
      maze: this.maze,
      playerStart: this.playerStart,
      exitPos: this.exitPos,
      mazeSize: this.mazeSize,
    };
    return data;
  }

  clearMaze() {
    this.generateEmptyMaze();
    this.updateGrid();
  }

  generateMaze(algorithm = 'dfs') {
    switch (algorithm) {
      case 'dfs':
        this.generateDFSMaze();
        break;
      case 'empty':
        this.generateEmptyMaze();
        this.updateGrid();
        break;
      default:
        console.warn(`Unknown algorithm: ${algorithm}`);
        this.generateEmptyMaze();
        this.updateGrid();
    }
  }

  resizeMaze(newSize) {
    this.mazeSize = newSize;
    this.mazeGenerator.setSize(newSize);

    this.playerStart = { x: 1, y: 1 };
    this.exitPos = { x: newSize - 2, y: newSize - 2 };

    this.generateEmptyMaze();
    this.updateGrid();
  }
}

MazeEditor.setupGlobalEvents();
