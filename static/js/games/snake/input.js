let direction = { x: 0, y: 0 };
let lastDirection = { x: 0, y: 0 };

export function changeDirection(ev) {
  console.log('listening for event');
  switch (ev.code) {
    case 'ArrowUp':
    case 'KeyW':
      if (lastDirection.y !== 0) break;
      direction = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 'KeyS':
      if (lastDirection.y !== 0) break;
      direction = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'KeyA':
      if (lastDirection.x !== 0) break;
      direction = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'KeyD':
      if (lastDirection.x !== 0) break;
      direction = { x: 1, y: 0 };
      break;
  }
}

export function initialize() {
  direction = { x: 0, y: 0 };
  lastDirection = { x: 0, y: 0 };
}

export function getInputDirection() {
  lastDirection = direction;
  return direction;
}
