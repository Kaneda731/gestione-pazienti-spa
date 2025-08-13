// Vitest global setup for DOM tests (no test definitions here)
import '@testing-library/jest-dom/vitest';

// JSDOM defaults
if (!window.scrollTo) {
  window.scrollTo = () => {};
}

// Polyfill matchMedia used by notificationAnimationManager in import graph
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}
