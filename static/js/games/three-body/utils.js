import { ODESolver } from '../utils/ode-solvers.js';

// Example usage for N-body problem:
export class NBodySolver extends ODESolver {
  constructor(G) {
    const MIN_DISTANCE = 50; // Minimum 50 pixels separation

    super((t, state) => {
      const derivatives = {
        bodies: state.bodies.map((body) => ({
          x: body.vx,
          y: body.vy,
          vx: 0,
          vy: 0,
          mass: 0,
        })),
      };

      // Calculate accelerations
      for (let i = 0; i < state.bodies.length; i++) {
        for (let j = i + 1; j < state.bodies.length; j++) {
          const body1 = state.bodies[i];
          const body2 = state.bodies[j];

          const dx = body2.x - body1.x;
          const dy = body2.y - body1.y;
          const r2 = dx * dx + dy * dy;

          // Apply minimum distance threshold
          const r = Math.max(Math.sqrt(r2), MIN_DISTANCE);

          // Calculate gravitational force (simplified for screen coordinates)
          const force = (G * body1.mass * body2.mass) / (r * r);

          // Get normalized direction
          const fx = (force * dx) / r;
          const fy = (force * dy) / r;

          // Apply accelerations (F = ma, so a = F/m)
          derivatives.bodies[i].vx += fx / body1.mass;
          derivatives.bodies[i].vy += fy / body1.mass;
          derivatives.bodies[j].vx -= fx / body2.mass;
          derivatives.bodies[j].vy -= fy / body2.mass;
        }
      }

      return derivatives;
    });
  }
}
