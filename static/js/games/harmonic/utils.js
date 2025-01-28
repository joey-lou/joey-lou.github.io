import { ODESolver } from '../utils/ode-solvers.js';

// Simple Harmonic Oscillator solver using ODESolver
export class OscillatorSolver extends ODESolver {
  constructor(k, m, damping = 0) {
    // The SHO equation: m(d²x/dt²) = -kx - b(dx/dt)
    // where k is spring constant, m is mass, b is damping coefficient
    // Convert to first order system:
    // dx/dt = v
    // dv/dt = -(k/m)x - (b/m)v
    super((t, state) => [state[1], -(k / m) * state[0] - (damping / m) * state[1]]);

    this.omega = Math.sqrt(k / m); // Natural frequency
    this.damping = damping;
    this.k = k;
    this.m = m;
    console.log('omega', this.omega);
  }

  step(state, dt, t = 0, method = 'rk4', options = {}) {
    const arrayState = [state.x, state.v];
    const newState = this.solve(method, arrayState, dt, t, options);
    return {
      x: newState[0],
      v: newState[1],
    };
  }
}

// Helper class to track oscillator state and draw it
export class Oscillator {
  constructor(x0, y0, x_init = 200, v_init = 0) {
    this.x0 = x0; // Origin x
    this.y0 = y0; // Origin y
    this.x = x_init; // Position (pixels from origin)
    this.v = v_init; // Velocity

    // Store initial conditions for analytical solution
    this.resetInitialConditions();
  }

  resetInitialConditions() {
    this.x_init = this.x;
    this.v_init = this.v;
    this.t0 = 0;
  }

  // Get analytical solution
  getAnalyticalState(t, omega) {
    const dt = t - this.t0;
    const x = this.x_init * Math.cos(omega * dt) + (this.v_init / omega) * Math.sin(omega * dt);
    return {
      x,
      v: -this.x_init * omega * Math.sin(omega * dt) + this.v_init * Math.cos(omega * dt),
    };
  }

  getPoint() {
    return {
      x: this.x0 + this.x,
      y: this.y0,
    };
  }

  // Get theme-adjusted colors
  getColors() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'light') {
      return {
        spring: '#333333',
        mass: '#cc0000',
        shadow: 'rgba(100, 100, 100, 0.2)',
        wall: '#666666',
      };
    } else {
      return {
        spring: '#00ffff', // Cyan
        mass: '#ff6b6b', // Coral pink
        shadow: 'rgba(200, 200, 200, 0.15)',
        wall: '#7f7fff', // Periwinkle blue
      };
    }
  }

  draw(ctx, t = 0, omega = 1) {
    const colors = this.getColors();

    // Draw spring
    ctx.beginPath();
    ctx.moveTo(this.x0, this.y0);

    // Draw a zigzag spring
    const numSegments = 20;
    const dx = this.x / numSegments;
    const amplitude = 10;
    for (let i = 0; i <= numSegments; i++) {
      const x = this.x0 + i * dx;
      const y = this.y0 + (i % 2 === 0 ? amplitude : -amplitude);
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = colors.spring;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw analytical solution shadow
    if (t > 0) {
      const analyticalState = this.getAnalyticalState(t, omega);
      const shadowX = this.x0 + analyticalState.x;

      // Draw shadow spring
      ctx.beginPath();
      ctx.moveTo(this.x0, this.y0);
      const shadowDx = analyticalState.x / numSegments;
      for (let i = 0; i <= numSegments; i++) {
        const x = this.x0 + i * shadowDx;
        const y = this.y0 + (i % 2 === 0 ? amplitude : -amplitude);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors.shadow;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw shadow mass
      ctx.beginPath();
      ctx.arc(shadowX, this.y0, 15, 0, Math.PI * 2);
      ctx.fillStyle = colors.shadow;
      ctx.fill();
    }

    // Draw mass
    const massX = this.x0 + this.x;
    const massY = this.y0;
    const massRadius = 15;

    ctx.beginPath();
    ctx.arc(massX, massY, massRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.mass;
    ctx.fill();

    // Draw fixed point (wall)
    ctx.beginPath();
    ctx.rect(this.x0 - 5, this.y0 - 30, 10, 60);
    ctx.fillStyle = colors.wall;
    ctx.fill();
  }
}
