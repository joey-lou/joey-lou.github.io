import { maze, isGenerating, GRID_SIZE, setIsGenerating, setGenerationSpeed } from './share.js';
import { dfsAlgorithm } from './dfs.js';
import { primAlgorithm } from './prims.js';

document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('game-board');
  const generateBtn = document.getElementById('generate-btn');
  const algorithmSelect = document.getElementById('algorithm-select');
  const speedSlider = document.getElementById('speed-slider');

  function createGrid() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    for (let i = 0; i < GRID_SIZE; i++) {
      maze[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell', 'wall');
        gridElement.appendChild(cell);
        maze[i][j] = { element: cell, isWall: true };
      }
    }
  }

  function generateMaze() {
    if (isGenerating) return;
    setIsGenerating(true);
    generateBtn.disabled = true;
    const algorithm = algorithmSelect.value;
    algorithmSelect.disabled = true;
    resetMaze();
    if (algorithm === 'prim') {
      primAlgorithm(generateBtn, algorithmSelect);
    } else if (algorithm === 'dfs') {
      dfsAlgorithm(generateBtn, algorithmSelect);
    } else {
      console.warn('Unknown algorithm:', algorithm);
      setIsGenerating(false);
      generateBtn.disabled = false;
      algorithmSelect.disabled = false;
    }
  }

  function resetMaze() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        maze[i][j].isWall = true;
        maze[i][j].element.classList.add('wall');
      }
    }
  }

  createGrid();
  generateBtn.addEventListener('click', generateMaze);
  window.addEventListener('resize', createGrid);

  speedSlider.addEventListener('input', (e) => {
    setGenerationSpeed(parseInt(e.target.value));
  });
});
