export class ODESolver {
  constructor(derivatives) {
    this.derivatives = derivatives; // function that returns dx/dt for given (t, state)
  }

  // Simple Euler method
  euler(state, dt, t = 0) {
    const k1 = this.derivatives(t, state);
    return this.addStates(state, this.scaleState(k1, dt));
  }

  // Backward Euler method with fixed-point iteration
  backwardEuler(state, dt, t = 0, maxIterations = 100, tolerance = 1e-6) {
    // yn+1 = yn + dt * f(tn+1, yn+1)
    let currentGuess = this.euler(state, dt, t); // Initial guess using forward Euler
    console.log(`Initial guess: \n${JSON.stringify(currentGuess)}`);
    for (let i = 0; i < maxIterations; i++) {
      const derivatives = this.derivatives(t + dt, currentGuess);
      const newGuess = this.addStates(state, this.scaleState(derivatives, dt));

      // Check convergence
      const diff = Math.abs(this.stateDistance(newGuess, currentGuess));
      if (diff < tolerance) {
        console.log(`Converged in ${i} iterations with diff ${diff} \n${JSON.stringify(newGuess)}`);
        return newGuess;
      }

      currentGuess = newGuess;
    }

    // Return last guess if not converged
    return currentGuess;
  }

  // Helper method to compute "distance" between states using L2 norm
  stateDistance(state1, state2) {
    if (typeof state1 !== 'object' || state1 === null) {
      return Math.abs(state1 - state2);
    }

    let sumSquaredDiff = 0;
    let count = 0;

    for (const key in state1) {
      if (Array.isArray(state1[key])) {
        state1[key].forEach((item, index) => {
          if (typeof item === 'object') {
            const diff = this.stateDistance(item, state2[key][index]);
            sumSquaredDiff += diff * diff;
            count += 1;
          } else if (typeof item === 'number') {
            const diff = item - state2[key][index];
            sumSquaredDiff += diff * diff;
            count += 1;
          }
        });
      } else if (typeof state1[key] === 'object') {
        const diff = this.stateDistance(state1[key], state2[key]);
        sumSquaredDiff += diff * diff;
        count += 1;
      } else if (typeof state1[key] === 'number') {
        const diff = state1[key] - state2[key];
        sumSquaredDiff += diff * diff;
        count += 1;
      }
    }

    return count > 0 ? Math.sqrt(sumSquaredDiff / count) : 0;
  }

  // Midpoint method (RK2)
  midpoint(state, dt, t = 0) {
    const k1 = this.derivatives(t, state);
    const midState = this.addStates(state, this.scaleState(k1, dt / 2));
    const k2 = this.derivatives(t + dt / 2, midState);
    return this.addStates(state, this.scaleState(k2, dt));
  }

  // RK4 method
  rk4(state, dt, t = 0) {
    const k1 = this.derivatives(t, state);
    const k2 = this.derivatives(t + dt / 2, this.addStates(state, this.scaleState(k1, dt / 2)));
    const k3 = this.derivatives(t + dt / 2, this.addStates(state, this.scaleState(k2, dt / 2)));
    const k4 = this.derivatives(t + dt, this.addStates(state, this.scaleState(k3, dt)));

    const combinedK = this.addStates(
      this.addStates(this.scaleState(k1, 1 / 6), this.scaleState(k2, 1 / 3)),
      this.addStates(this.scaleState(k3, 1 / 3), this.scaleState(k4, 1 / 6))
    );

    return this.addStates(state, this.scaleState(combinedK, dt));
  }

  // Utility functions for state operations
  addStates(state1, state2) {
    if (typeof state1 !== 'object' || state1 === null) {
      return state1;
    }

    const result = Array.isArray(state1) ? [] : {};

    for (const key in state1) {
      if (Array.isArray(state1[key])) {
        result[key] = state1[key].map((item, index) => {
          if (typeof item === 'object') {
            return this.addStates(item, state2[key][index]);
          } else {
            return item + state2[key][index];
          }
        });
      } else if (typeof state1[key] === 'object') {
        result[key] = this.addStates(state1[key], state2[key]);
      } else if (typeof state1[key] === 'number') {
        result[key] = state1[key] + state2[key];
      } else {
        result[key] = state1[key];
      }
    }
    return result;
  }

  scaleState(state, factor) {
    if (typeof state !== 'object' || state === null) {
      return state;
    }

    const result = Array.isArray(state) ? [] : {};

    for (const key in state) {
      if (Array.isArray(state[key])) {
        result[key] = state[key].map((item) => {
          if (typeof item === 'object') {
            return this.scaleState(item, factor);
          } else {
            return item * factor;
          }
        });
      } else if (typeof state[key] === 'object') {
        result[key] = this.scaleState(state[key], factor);
      } else if (typeof state[key] === 'number') {
        result[key] = state[key] * factor;
      } else {
        result[key] = state[key];
      }
    }
    return result;
  }
}

// Example usage for simple harmonic oscillator:
export class HarmonicOscillatorSolver extends ODESolver {
  constructor(k, m) {
    // k: spring constant, m: mass
    super((t, state) => ({
      // Now takes time parameter
      x: state.v,
      v: (-k * state.x) / m,
    }));
  }
}
