/**
 * Global Vitest Setup
 * 
 * This file provides comprehensive test environment setup including:
 * - Enhanced browser API mocking (matchMedia, document events, observers)
 * - Performance API mocking for notification tests
 * - Audio API mocking for sound-enabled components
 * - LocalStorage mocking with state management
 * - Proper cleanup between tests
 * 
 * All mocks are automatically available in every test file.
 * See __tests__/README.md for detailed usage documentation.
 */

import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupBrowserMocks, cleanupBrowserMocks } from "./browser-mocks.js";

// Enhanced matchMedia mock to handle all notification test cases - MUST be first
// This mock specifically handles reduced motion queries and responsive breakpoints
if (!global.window) {
  global.window = global;
}
if (!global.window.matchMedia) {
  global.window.matchMedia = vi.fn().mockImplementation((query) => ({
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

beforeAll(() => {
  // Provide minimal window features used by notificationService
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      memory: { usedJSHeapSize: 10 * 1024 * 1024 },
    };
  }
  if (!global.window) {
    global.window = global;
  }
  if (!global.navigator) {
    global.navigator = { userAgent: "vitest", deviceMemory: 8 };
  }
  if (!global.document && typeof window !== "undefined") {
    global.document = window.document;
  }
  if (global.document && !global.document.body) {
    const body = global.document.createElement("body");
    global.document.appendChild(body);
  }

  // Add document.addEventListener mock to existing setup
  // This is critical for NotificationEventManager and other components that listen to document events
  if (global.document) {
    // Ensure document has addEventListener method
    if (
      !global.document.addEventListener ||
      typeof global.document.addEventListener !== "function"
    ) {
      global.document.addEventListener = vi.fn();
    } else if (!global.document.addEventListener.mock) {
      // If it exists but isn't mocked, spy on it
      vi.spyOn(global.document, "addEventListener");
    }

    // Ensure document has removeEventListener method
    if (
      !global.document.removeEventListener ||
      typeof global.document.removeEventListener !== "function"
    ) {
      global.document.removeEventListener = vi.fn();
    } else if (!global.document.removeEventListener.mock) {
      vi.spyOn(global.document, "removeEventListener");
    }

    // Ensure document has dispatchEvent method
    if (
      !global.document.dispatchEvent ||
      typeof global.document.dispatchEvent !== "function"
    ) {
      global.document.dispatchEvent = vi.fn();
    } else if (!global.document.dispatchEvent.mock) {
      vi.spyOn(global.document, "dispatchEvent");
    }

    // Add visibilityState property for notification tests
    if (!global.document.hasOwnProperty("visibilityState")) {
      Object.defineProperty(global.document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
    }
  }

  // Audio mock (fallback HTML5 Audio API)
  // Required for notification sound tests and any audio-enabled components
  if (!global.window.Audio) {
    const MockAudio = vi.fn().mockImplementation(() => ({
      src: "",
      currentTime: 0,
      volume: 1,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    global.window.Audio = MockAudio;
  }
  // Assicura alias anche su global per codice che usa new Audio senza window.
  if (!global.Audio && global.window.Audio) {
    global.Audio = global.window.Audio;
  }

  // Spy su setTimeout per test che ne verificano l'uso
  if (typeof global.setTimeout === "function") {
    try {
      // Evita doppio spy se già applicato da altri test
      if (!("mock" in global.setTimeout)) {
        vi.spyOn(global, "setTimeout");
      }
    } catch (_) {
      // noop
    }
  }

  // localStorage: Enhanced mock with state management and spy capabilities
  // This provides a complete localStorage implementation for testing
  if (global.window.localStorage) {
    try {
      // Alcune versioni di jsdom non permettono spy diretti: rimpiazziamo con funzioni spiate
      const original = global.window.localStorage;
      const store = new Map();
      const getItem = vi.fn((k) => (store.has(k) ? store.get(k) : null));
      const setItem = vi.fn((k, v) => store.set(k, String(v)));
      const removeItem = vi.fn((k) => store.delete(k));
      const clear = vi.fn(() => store.clear());
      const key = vi.fn((i) => Array.from(store.keys())[i] ?? null);
      const wrapped = {
        getItem,
        setItem,
        removeItem,
        clear,
        key,
        get length() {
          return store.size;
        },
      };
      // Copia eventuali valori pre-esistenti
      try {
        for (let i = 0; i < (original.length || 0); i++) {
          const k = original.key(i);
          if (k != null) {
            const v = original.getItem(k);
            if (v != null) store.set(k, v);
          }
        }
      } catch (_) {
        /* noop */
      }
      global.window.localStorage = wrapped;
      // Esponi anche su global per i test che referenziano localStorage direttamente
      global.localStorage = global.window.localStorage;
    } catch (_) {
      // Alcune implementazioni jsdom non sono estendibili: fallback a mock
      const store = new Map();
      global.window.localStorage = {
        getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
        setItem: vi.fn((k, v) => store.set(k, String(v))),
        removeItem: vi.fn((k) => store.delete(k)),
        clear: vi.fn(() => store.clear()),
        key: vi.fn((i) => Array.from(store.keys())[i] ?? null),
        get length() {
          return store.size;
        },
      };
      global.localStorage = global.window.localStorage;
    }
  } else {
    const store = new Map();
    global.window.localStorage = {
      getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
      setItem: vi.fn((k, v) => store.set(k, String(v))),
      removeItem: vi.fn((k) => store.delete(k)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((i) => Array.from(store.keys())[i] ?? null),
      get length() {
        return store.size;
      },
    };
    global.localStorage = global.window.localStorage;
  }
  setupBrowserMocks();
});

// Ensure existing mock cleanup works properly in afterEach hooks
// This comprehensive cleanup prevents test interference and memory leaks
afterEach(() => {
  // Clear all mocks but preserve the mock implementations
  vi.clearAllMocks();

  // Add proper DOM element cleanup to existing afterEach hooks
  // Critical for preventing DOM state leakage between tests
  if (global.document) {
    // Reset DOM state
    if (global.document.body) {
      global.document.body.innerHTML = "";
    }
    
    // Clean up any remaining event listeners on document
    if (global.document.removeEventListener && global.document.removeEventListener.mock) {
      global.document.removeEventListener.mockClear();
    }
    if (global.document.addEventListener && global.document.addEventListener.mock) {
      global.document.addEventListener.mockClear();
    }
    if (global.document.dispatchEvent && global.document.dispatchEvent.mock) {
      global.document.dispatchEvent.mockClear();
    }
    
    // Reset document visibility state
    if (global.document.hasOwnProperty("visibilityState")) {
      Object.defineProperty(global.document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
    }
  }

  // Reset any timers - ensure existing vi.clearAllMocks() calls cover all new mocks
  if (vi.clearAllTimers) {
    vi.clearAllTimers();
  }
  
  // Reset window properties that might have been modified
  if (global.window) {
    // Reset window dimensions to defaults
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
    
    // Reset matchMedia mock to default state
    if (global.window.matchMedia && global.window.matchMedia.mock) {
      global.window.matchMedia.mockClear();
    }
  }
  
  // Reset localStorage to clean state
  if (global.localStorage && global.localStorage.clear) {
    global.localStorage.clear();
  }
  
  // Reset performance mocks
  if (global.performance && global.performance.now && global.performance.now.mock) {
    global.performance.now.mockClear();
  }
});

afterAll(() => {
  cleanupBrowserMocks();
});
