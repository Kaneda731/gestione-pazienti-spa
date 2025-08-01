/**
 * Mock browser specific objects for tests
 * Import this in test files that need browser mocks
 */

import { vi } from 'vitest';

/**
 * Setup browser environment mocks
 */
export function setupBrowserMocks() {
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
      return originalCreateElement.call(document, tagName);
    });
  }
}

/**
 * Cleanup browser mocks
 */
export function cleanupBrowserMocks() {
  vi.clearAllMocks();
}