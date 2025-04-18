import {
  maze,
  isGenerating,
  setIsGenerating,
  setGenerationSpeed,
  GRID_SIZE,
  resizeGrid,
  clearTimeouts,
} from './share.js';
import { dfsAlgorithm2 } from './dfs.js';
import { primsAlgorithm2 } from './prims.js';
import { fractalAlgorithm } from './fractal.js';
import { generateCellularMaze } from './cellular.js';

document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('game-board');
  const generateBtn = document.getElementById('generate-btn');
  const algorithmSelect = document.getElementById('algorithm-select');
  const speedSlider = document.getElementById('speed-slider');

  function createGrid() {
    clearTimeouts();
    setIsGenerating(false);
    resizeGrid();

    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    for (let i = 0; i < GRID_SIZE; i++) {
      maze[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = document.createElement('div');
        cell.classList.add('maze', 'wall');
        gridElement.appendChild(cell);
        maze[i][j] = { element: cell, isWall: true };
      }
    }
    generateBtn.disabled = false;
    algorithmSelect.disabled = false;
  }

  function generateMaze() {
    if (isGenerating) return;
    setIsGenerating(true);
    generateBtn.disabled = true;
    const algorithm = algorithmSelect.value;
    algorithmSelect.disabled = true;
    resetMaze();
    if (algorithm === 'prim') {
      primsAlgorithm2(generateBtn, algorithmSelect);
    } else if (algorithm === 'dfs') {
      dfsAlgorithm2(generateBtn, algorithmSelect);
    } else if (algorithm === 'cellular') {
      generateCellularMaze(generateBtn, algorithmSelect);
    } else if (algorithm === 'fractal') {
      fractalAlgorithm(generateBtn, algorithmSelect);
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
    const value = parseInt(e.target.value);
    setGenerationSpeed(value);
    document.getElementById('speed-value').textContent = value;
  });
});
