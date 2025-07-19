/**
 * Global setup eseguito una volta prima di tutti i test
 */

import { vi } from 'vitest';

export async function setup() {
  // Setup console per test environment
  setupConsole();
  
  // Setup global mocks
  setupGlobalMocks();
  
  // Setup performance monitoring
  setupPerformanceMonitoring();
  
  // Setup error handling
  setupErrorHandling();
  
  console.log('🚀 Test environment initialized');
}

export async function teardown() {
  // Cleanup global resources
  cleanupGlobalResources();
  
  console.log('🧹 Test environment cleaned up');
}

function setupConsole() {
  // Suppress console.log in tests unless DEBUG=true
  if (!process.env.DEBUG) {
    global.console = {
      ...console,
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: console.warn, // Keep warnings
      error: console.error // Keep errors
    };
  }
}

function setupGlobalMocks() {
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  });
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  });
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
}

function setupPerformanceMonitoring() {
  // Track test performance
  global.testPerformance = {
    startTime: Date.now(),
    slowTests: [],
    memoryUsage: []
  };
  
  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => [])
    };
  }
}

function setupErrorHandling() {
  // Global error handler for unhandled promises
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Global error handler
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

function cleanupGlobalResources() {
  // Clear any global timers
  vi.clearAllTimers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}