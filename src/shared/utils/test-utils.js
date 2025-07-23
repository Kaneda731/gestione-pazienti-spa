// Utility TestUtils per i test Vitest
import { vi } from 'vitest';

export const TestUtils = {
  setupDOM() {
    document.body.innerHTML = '';
    return {
      cleanup: () => { document.body.innerHTML = ''; }
    };
  },

  waitFor(condition, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      function check() {
        if (condition()) return resolve(true);
        if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for condition'));
        setTimeout(check, 10);
      }
      check();
    });
  },

  mockTimers() {
    let isMocked = false;
    if (!isMocked) {
      vi.useFakeTimers();
      isMocked = true;
    }
    return {
      advance: (ms) => vi.advanceTimersByTime(ms),
      runAll: () => vi.runAllTimers(),
      cleanup: () => {
        vi.useRealTimers();
        isMocked = false;
      }
    };
  }
};
