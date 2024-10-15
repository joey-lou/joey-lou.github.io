export const friction = 0.999;
export const wallDamping = 0.5;
export const trailSize = 10;

export let canvas;
export let mouseX;
export let mouseY;
export let isAttractMode = false;

export function setMousePosition(x, y) {
  mouseX = x;
  mouseY = y;
}

export function toggleAttractMode() {
  isAttractMode = !isAttractMode;
}

export function initConfig(canvasElement) {
  canvas = canvasElement;
  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;
}
