/**
 * Configurazione ambiente test - eseguito prima di ogni file di test
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Setup DOM environment
setupDOMEnvironment();

// Setup automatic cleanup
beforeEach(() => {
  // Reset DOM safely
  if (document.body) {
    document.body.innerHTML = '';
  }
  if (document.head) {
    // Rimuovi solo elementi aggiunti dai test
    const testElements = document.head.querySelectorAll('[data-test]');
    testElements.forEach(el => el.remove());
  }
  
  // Reset window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768
  });
  
  // Reset localStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset fetch mock
  global.fetch = vi.fn();
});

afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear all timers
  vi.clearAllTimers();
  
  // Reset modules
  vi.resetModules();
});

function setupDOMEnvironment() {
  // Enhanced DOM setup for better test compatibility
  
  // Mock createElement with better defaults
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName, options) => {
    const element = originalCreateElement(tagName, options);
    
    // Add common properties that might be missing in jsdom
    if (tagName.toLowerCase() === 'canvas') {
      element.getContext = vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        drawImage: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        save: vi.fn(),
        restore: vi.fn()
      }));
      
      element.toBlob = vi.fn((callback, type) => {
        const blob = new Blob(['mock-canvas-data'], { type: type || 'image/png' });
        callback(blob);
      });
      
      element.toDataURL = vi.fn(() => 'data:image/png;base64,mock-data');
    }
    
    return element;
  });
  
  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
    toJSON: vi.fn()
  }));
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  
  // Mock focus and blur
  Element.prototype.focus = vi.fn();
  Element.prototype.blur = vi.fn();
  
  // classList è già disponibile in jsdom, non serve mock
  
  // Mock URL constructor
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = base || 'http://localhost:3000';
      this.pathname = url.split('?')[0];
      this.search = url.includes('?') ? '?' + url.split('?')[1] : '';
    }
    
    static createObjectURL = vi.fn(() => 'blob:mock-url');
    static revokeObjectURL = vi.fn();
  };
  
  // Mock Blob
  global.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type || '';
      this.size = parts.reduce((size, part) => size + part.length, 0);
    }
  };
  
  // Mock File
  global.File = class File extends Blob {
    constructor(parts, name, options) {
      super(parts, options);
      this.name = name;
      this.lastModified = Date.now();
    }
  };
  
  // Mock FormData
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    
    append(key, value) {
      this.data.set(key, value);
    }
    
    get(key) {
      return this.data.get(key);
    }
    
    has(key) {
      return this.data.has(key);
    }
    
    delete(key) {
      this.data.delete(key);
    }
  };
}