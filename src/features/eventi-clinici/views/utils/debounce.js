// Utility: debounce functions for UI performance
// - debounce: delays execution until wait ms have passed since last call
// - rafDebounce: collapse multiple calls into one per animation frame

/**
 * Debounce a function by a given wait time.
 * @param {Function} fn - function to debounce
 * @param {number} wait - milliseconds to wait after the last call (default 150)
 * @param {{leading?: boolean, trailing?: boolean}} options
 * @returns {Function} debounced function with .cancel() method
 */
export function debounce(fn, wait = 150, options = {}) {
  const { leading = false, trailing = true } = options;
  let timer = null;
  let lastArgs;
  let lastThis;
  let leadingCalled = false;

  function invoke() {
    timer = null;
    if (trailing && lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = undefined;
      leadingCalled = false;
    }
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this; // eslint-disable-line @typescript-eslint/no-this-alias

    if (!timer) {
      if (leading && !leadingCalled) {
        fn.apply(lastThis, lastArgs);
        leadingCalled = true;
        lastArgs = lastThis = undefined;
      }
      timer = setTimeout(invoke, wait);
    } else {
      clearTimeout(timer);
      timer = setTimeout(invoke, wait);
    }
  }

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = lastThis = undefined;
    leadingCalled = false;
  };

  return debounced;
}

/**
 * Debounce a function using requestAnimationFrame (one call per frame).
 * @param {Function} fn
 * @returns {Function}
 */
export function rafDebounce(fn) {
  let scheduled = false;
  let lastArgs;
  let lastThis;

  function run() {
    scheduled = false;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = undefined;
  }

  return function debouncedRaf(...args) {
    lastArgs = args;
    lastThis = this; // eslint-disable-line @typescript-eslint/no-this-alias
    if (!scheduled) {
      scheduled = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(run);
      } else {
        // Fallback if rAF not available
        setTimeout(run, 16);
      }
    }
  };
}
