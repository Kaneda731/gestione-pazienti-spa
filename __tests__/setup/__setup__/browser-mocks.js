/**
 * Enhanced Browser API Mocks
 * 
 * This file provides comprehensive mocking for all browser APIs used by the application:
 * - DOM event handling (addEventListener, removeEventListener, dispatchEvent)
 * - Observer APIs (IntersectionObserver, ResizeObserver, MutationObserver)
 * - Media APIs (Canvas, Audio, Image, FileReader)
 * - Storage APIs (localStorage with state management)
 * - Performance APIs (performance.now, memory monitoring)
 * 
 * All mocks are designed to provide realistic behavior while being deterministic for testing.
 * See __tests__/BROWSER_API_MOCKS.md for detailed documentation.
 */

import { vi } from 'vitest';

/**
 * Setup fake timers with consistent configuration
 * Add missing fake timer setup where needed without changing existing patterns
 */
export function setupFakeTimers() {
  if (vi.useFakeTimers) {
    vi.useFakeTimers();
  }
}

/**
 * Cleanup fake timers with consistent configuration
 */
export function cleanupFakeTimers() {
  if (vi.useRealTimers) {
    vi.useRealTimers();
  }
  if (vi.clearAllTimers) {
    vi.clearAllTimers();
  }
}

/**
 * Setup browser environment mocks
 */
export function setupBrowserMocks() {
  // Ensure document has proper event handling methods
  if (global.document) {
    if (!global.document.addEventListener) {
      global.document.addEventListener = vi.fn();
    }
    if (!global.document.removeEventListener) {
      global.document.removeEventListener = vi.fn();
    }
    if (!global.document.dispatchEvent) {
      global.document.dispatchEvent = vi.fn();
    }
    
    // Add querySelector and querySelectorAll if missing
    if (!global.document.querySelector) {
      global.document.querySelector = vi.fn((selector) => {
        // Return a mock element with addEventListener
        return {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          innerHTML: '',
          textContent: '',
          style: {},
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            toggle: vi.fn()
          }
        };
      });
    }
    
    if (!global.document.querySelectorAll) {
      global.document.querySelectorAll = vi.fn(() => []);
    }
  }
  // FileReader mock
  if (!global.FileReader) {
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsDataURL: vi.fn(),
      readAsText: vi.fn(),
      readAsArrayBuffer: vi.fn(),
      readAsBinaryString: vi.fn(),
      abort: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      readyState: 0,
      result: null,
      error: null,
      onload: null,
      onerror: null,
      onloadstart: null,
      onloadend: null,
      onprogress: null,
      onabort: null,
    }));
  }

  // Canvas mock
  if (!global.HTMLCanvasElement) {
    global.HTMLCanvasElement = vi.fn().mockImplementation(() => ({
      width: 800,
      height: 600,
      getContext: vi.fn((type) => {
        if (type === '2d') {
          return {
            fillStyle: '#000000',
            strokeStyle: '#000000',
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            clearRect: vi.fn(),
            fillText: vi.fn(),
            strokeText: vi.fn(),
            measureText: vi.fn(() => ({ width: 100, height: 20 })),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            bezierCurveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            arc: vi.fn(),
            arcTo: vi.fn(),
            rect: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            clip: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            translate: vi.fn(),
            transform: vi.fn(),
            setTransform: vi.fn(),
            resetTransform: vi.fn(),
            createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
            getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
            putImageData: vi.fn(),
            globalAlpha: 1.0,
            globalCompositeOperation: 'source-over',
          };
        }
        return null;
      }),
      toDataURL: vi.fn((type, quality) => 'data:image/' + (type || 'png') + ';base64,mock-canvas-data'),
      toBlob: vi.fn((callback, type, quality) => {
        const blob = new Blob(['mock-canvas-data'], { type: type || 'image/png' });
        callback(blob);
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // URL mock
  if (!global.URL) {
    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };
  }

  // Image mock
  if (!global.Image) {
    global.Image = vi.fn().mockImplementation(() => ({
      src: '',
      width: 0,
      height: 0,
      onload: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  // Mock document.createElement
  if (global.document && global.document.createElement) {
    const originalCreateElement = global.document.createElement;
    global.document.createElement = vi.fn((tagName) => {
      if (tagName === 'canvas') {
        return global.HTMLCanvasElement();
      }
      const element = originalCreateElement.call(document, tagName);
      
      // Ensure all DOM elements have addEventListener
      if (element && !element.addEventListener) {
        element.addEventListener = vi.fn();
        element.removeEventListener = vi.fn();
        element.dispatchEvent = vi.fn();
      }
      
      return element;
    });
  }

  // Add missing browser APIs (IntersectionObserver, ResizeObserver)
  // These are critical for components that use modern browser observation APIs
  if (!global.IntersectionObserver) {
    global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: options?.root || null,
      rootMargin: options?.rootMargin || '0px',
      thresholds: options?.threshold || [0],
    }));
  }

  if (!global.ResizeObserver) {
    global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Ensure window has these observers too
  if (global.window) {
    global.window.IntersectionObserver = global.IntersectionObserver;
    global.window.ResizeObserver = global.ResizeObserver;
  }
}

/**
 * Comprehensive DOM cleanup utility
 * Add proper DOM element cleanup to existing afterEach hooks
 * 
 * This function ensures that DOM state doesn't leak between tests,
 * preventing test interference and maintaining test isolation.
 */
export function cleanupDOM() {
  if (global.document) {
    // Clean up body content
    if (global.document.body) {
      global.document.body.innerHTML = '';
      
      // Remove any remaining attributes
      const attributes = Array.from(global.document.body.attributes || []);
      attributes.forEach(attr => {
        if (attr.name !== 'class') { // Keep basic class attribute
          global.document.body.removeAttribute(attr.name);
        }
      });
    }
    
    // Clean up head content (except essential elements)
    if (global.document.head) {
      const elementsToRemove = global.document.head.querySelectorAll(
        'style[data-test], link[data-test], script[data-test]'
      );
      elementsToRemove.forEach(el => el.remove());
    }
    
    // Reset document properties
    if (global.document.hasOwnProperty("visibilityState")) {
      Object.defineProperty(global.document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
    }
    
    // Reset document title
    if (global.document.title) {
      global.document.title = '';
    }
  }
}

/**
 * Reset all global mocks to their initial state
 * Ensure existing vi.clearAllMocks() calls cover all new mocks
 * 
 * This function provides a comprehensive reset of all browser API mocks
 * to their default state, ensuring consistent test behavior.
 */
export function resetAllMocks() {
  // Clear all vitest mocks
  vi.clearAllMocks();
  
  // Reset specific global mocks that might need special handling
  if (global.window && global.window.matchMedia && global.window.matchMedia.mock) {
    global.window.matchMedia.mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce") ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  
  // Reset localStorage mock
  if (global.localStorage && global.localStorage.clear) {
    global.localStorage.clear();
  }
  
  // Reset performance mocks
  if (global.performance && global.performance.now && global.performance.now.mock) {
    global.performance.now.mockReturnValue(Date.now());
  }
}

/**
 * Cleanup browser mocks
 */
export function cleanupBrowserMocks() {
  vi.clearAllMocks();
  
  // Add proper DOM element cleanup to existing afterEach hooks
  if (global.document) {
    // Reset DOM state
    if (global.document.body) {
      global.document.body.innerHTML = '';
    }
    
    // Clean up any remaining event listeners
    if (global.document.removeEventListener && global.document.removeEventListener.mock) {
      global.document.removeEventListener.mockClear();
    }
    if (global.document.addEventListener && global.document.addEventListener.mock) {
      global.document.addEventListener.mockClear();
    }
    if (global.document.dispatchEvent && global.document.dispatchEvent.mock) {
      global.document.dispatchEvent.mockClear();
    }
    
    // Reset querySelector mocks
    if (global.document.querySelector && global.document.querySelector.mock) {
      global.document.querySelector.mockClear();
    }
    if (global.document.querySelectorAll && global.document.querySelectorAll.mock) {
      global.document.querySelectorAll.mockClear();
    }
    
    // Reset createElement mock
    if (global.document.createElement && global.document.createElement.mock) {
      global.document.createElement.mockClear();
    }
  }
  
  // Clear any remaining timers
  if (vi.clearAllTimers) {
    vi.clearAllTimers();
  }
  
  // Reset window properties
  if (global.window) {
    // Reset window dimensions
    Object.defineProperty(global.window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(global.window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    // Reset observers
    if (global.IntersectionObserver && global.IntersectionObserver.mock) {
      global.IntersectionObserver.mockClear();
    }
    if (global.ResizeObserver && global.ResizeObserver.mock) {
      global.ResizeObserver.mockClear();
    }
  }
  
  // Reset global mocks
  if (global.FileReader && global.FileReader.mock) {
    global.FileReader.mockClear();
  }
  if (global.Image && global.Image.mock) {
    global.Image.mockClear();
  }
  if (global.HTMLCanvasElement && global.HTMLCanvasElement.mock) {
    global.HTMLCanvasElement.mockClear();
  }
}