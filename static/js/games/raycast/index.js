import { RaycastEngine } from './raycast-engine.js';
import { MazeEditor } from './maze-editor.js';

class RaycastGame {
  constructor() {
    this.mode = 'editor';

    this.initializeElements();
    this.setupEventListeners();

    this.mazeEditor = new MazeEditor(20);
    this.raycastEngine = new RaycastEngine(this.canvas);

    this.showEditor();
  }

  initializeElements() {
    this.canvas = document.getElementById('raycast-canvas');
    this.toggleModeBtn = document.getElementById('toggle-mode-btn');
    this.clearMazeBtn = document.getElementById('clear-maze-btn');
    this.generateMazeBtn = document.getElementById('generate-maze-btn');
    this.mazeEditorElement = document.getElementById('maze-editor');
  }

  setupEventListeners() {
    this.toggleModeBtn.addEventListener('click', () => this.toggleMode());
    this.clearMazeBtn.addEventListener('click', () => this.mazeEditor.clearMaze());
    this.generateMazeBtn.addEventListener('click', () => {
      this.mazeEditor.generateMaze('dfs');
    });

    window.addEventListener('resize', () => {
      if (this.mode === '3d') {
        this.raycastEngine.handleResize();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (this.mode === '3d') {
        this.raycastEngine.handleKeyDown(e);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.mode === '3d') {
        this.raycastEngine.handleKeyUp(e);
      }
    });

    this.setupThemeChangeListener();
  }

  setupThemeChangeListener() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
          this.handleThemeChange();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-bs-theme'],
    });
  }

  toggleMode() {
    if (this.mode === 'editor') {
      this.enter3DMode();
    } else {
      this.enterEditorMode();
    }
  }

  enter3DMode() {
    if (!this.mazeEditor.hasValidStartAndExit()) {
      alert('Please set both start and exit positions before entering 3D mode!');
      return;
    }

    this.mode = '3d';
    this.toggleModeBtn.textContent = 'Back to Editor';

    this.mazeEditorElement.classList.add('hidden');
    this.canvas.classList.remove('hidden');

    const mazeData = this.mazeEditor.getMazeData();
    this.raycastEngine.start(mazeData, this);
  }

  enterEditorMode() {
    this.mode = 'editor';
    this.toggleModeBtn.textContent = 'Enter 3D Mode';

    this.canvas.classList.add('hidden');
    this.mazeEditorElement.classList.remove('hidden');

    this.raycastEngine.stop();
    this.showEditor();
  }

  showEditor() {
    this.mazeEditor.updateGrid();
  }

  handleThemeChange() {
    if (this.mode === 'editor') {
      this.mazeEditor.themeColors.refresh();
      this.mazeEditor.updateGrid();
    } else if (this.mode === '3d') {
      this.raycastEngine.themeColors.refresh();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.raycastGame = new RaycastGame();
});
