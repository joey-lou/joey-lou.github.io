import { ODESolver } from '../utils/ode-solvers.js';

// N-body solver that handles array of bodies internally
export class NBodySolver extends ODESolver {
  constructor(G, masses) {
    const MIN_DISTANCE = 50; // Minimum 50 pixels separation
    const N = masses.length; // Number of bodies

    // Create a flattened state vector:
    // [x1, y1, vx1, vy1, x2, y2, vx2, vy2, ...]
    super((t, state) => {
      const derivatives = new Array(4 * N).fill(0);

      // First set all position derivatives to velocities
      for (let i = 0; i < N; i++) {
        derivatives[4 * i] = state[4 * i + 2]; // dx/dt = vx
        derivatives[4 * i + 1] = state[4 * i + 3]; // dy/dt = vy
      }

      // Then calculate accelerations
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const x1 = state[4 * i];
          const y1 = state[4 * i + 1];
          const x2 = state[4 * j];
          const y2 = state[4 * j + 1];

          const dx = x2 - x1;
          const dy = y2 - y1;
          const r2 = dx * dx + dy * dy;

          // Apply minimum distance threshold
          const r = Math.max(Math.sqrt(r2), MIN_DISTANCE);

          // Calculate gravitational force
          const force = (G * masses[i] * masses[j]) / (r * r);

          // Get normalized direction
          const fx = (force * dx) / r;
          const fy = (force * dy) / r;

          // Apply accelerations (F = ma, so a = F/m)
          derivatives[4 * i + 2] += fx / masses[i]; // dvx1/dt
          derivatives[4 * i + 3] += fy / masses[i]; // dvy1/dt
          derivatives[4 * j + 2] -= fx / masses[j]; // dvx2/dt
          derivatives[4 * j + 3] -= fy / masses[j]; // dvy2/dt
        }
      }

      return derivatives;
    });

    this.masses = masses;
    this.G = G;
    this.N = N;
  }

  // Convert from array of bodies to flat state array
  getState(bodies) {
    const state = new Array(4 * this.N);
    bodies.forEach((body, i) => {
      state[4 * i] = body.x;
      state[4 * i + 1] = body.y;
      state[4 * i + 2] = body.vx;
      state[4 * i + 3] = body.vy;
    });
    return state;
  }

  // Convert from flat state array back to body states
  updateBodies(bodies, state) {
    bodies.forEach((body, i) => {
      if (!body.isDragging) {
        body.x = state[4 * i];
        body.y = state[4 * i + 1];
        body.vx = state[4 * i + 2];
        body.vy = state[4 * i + 3];
      }
    });
  }

  // Solve one step and update bodies directly
  step(bodies, dt, t = 0, method = 'rk4', options = {}) {
    const state = this.getState(bodies);
    const newState = this.solve(method, state, dt, t, options);
    this.updateBodies(bodies, newState);
  }
}
