// Base class for ODE solvers, only works with 1D Y arrays.
export class ODESolver {
  constructor(derivatives) {
    // function that returns derivatives for given (t, y)
    this.derivatives = derivatives;
  }

  // Simple Euler method
  euler(Y, dt, t = 0) {
    const k1 = this.derivatives(t, Y);
    return Y.map((x, i) => x + k1[i] * dt);
  }

  // Backward Euler method with fixed-point iteration
  backwardEuler(Y, dt, t = 0, maxIterations = 100, tolerance = 1e-6) {
    // yn+1 = yn + dt * f(tn+1, yn+1)
    let currentGuess = this.euler(Y, dt, t); // Initial guess using forward Euler

    for (let i = 0; i < maxIterations; i++) {
      const derivatives = this.derivatives(t + dt, currentGuess);
      const newGuess = Y.map((x, i) => x + derivatives[i] * dt);

      // Check convergence using L2 norm
      const diff = Math.sqrt(newGuess.reduce((sum, x, i) => sum + (x - currentGuess[i]) ** 2, 0));

      if (diff < tolerance) {
        return newGuess;
      }

      currentGuess = newGuess;
    }

    // Return last guess if not converged
    console.warn('Backward euler did not converge after ', maxIterations, ' iterations');
    return currentGuess;
  }

  // Implicit midpoint method with fixed-point iteration
  implicitMidpoint(Y, dt, t = 0, maxIterations = 100, tolerance = 1e-6) {
    // yn+1 = yn + dt * f(tn + dt/2, (yn + yn+1)/2)
    let currentGuess = this.euler(Y, dt, t); // Initial guess using forward Euler

    for (let i = 0; i < maxIterations; i++) {
      // Calculate midpoint state
      const midY = currentGuess.map((x, i) => (x + Y[i]) / 2);
      const derivatives = this.derivatives(t + dt / 2, midY);
      const newGuess = Y.map((x, i) => x + derivatives[i] * dt);

      // Check convergence using L2 norm
      const diff = Math.sqrt(newGuess.reduce((sum, x, i) => sum + (x - currentGuess[i]) ** 2, 0));

      if (diff < tolerance) {
        return newGuess;
      }

      currentGuess = newGuess;
    }

    console.warn('Implicit midpoint did not converge after ', maxIterations, ' iterations');
    // Return last guess if not converged
    return currentGuess;
  }

  // Midpoint method (RK2)
  midpoint(Y, dt, t = 0) {
    const k1 = this.derivatives(t, Y);
    const midY = Y.map((x, i) => x + (k1[i] * dt) / 2);
    const k2 = this.derivatives(t + dt / 2, midY);
    return Y.map((x, i) => x + k2[i] * dt);
  }

  // RK4 method
  rk4(Y, dt, t = 0) {
    const k1 = this.derivatives(t, Y);
    const k2 = this.derivatives(
      t + dt / 2,
      Y.map((x, i) => x + (k1[i] * dt) / 2)
    );
    const k3 = this.derivatives(
      t + dt / 2,
      Y.map((x, i) => x + (k2[i] * dt) / 2)
    );
    const k4 = this.derivatives(
      t + dt,
      Y.map((x, i) => x + k3[i] * dt)
    );

    return Y.map((x, i) => x + ((k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt) / 6);
  }

  // Generic solve method that calls the appropriate solver
  solve(method, Y, dt, t = 0, options = {}) {
    switch (method) {
      case 'euler':
        return this.euler(Y, dt, t);
      case 'midpoint':
        return this.midpoint(Y, dt, t);
      case 'backward-euler':
        return this.backwardEuler(Y, dt, t, options.maxIterations, options.tolerance);
      case 'implicit-midpoint':
        return this.implicitMidpoint(Y, dt, t, options.maxIterations, options.tolerance);
      case 'rk4':
        return this.rk4(Y, dt, t);
      default:
        throw new Error(`Unknown solver: ${method}`);
    }
  }
}
