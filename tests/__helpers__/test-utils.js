/**
 * Utilities generali per test
 */

import { vi } from 'vitest';

/**
 * Aspetta per un numero specificato di millisecondi
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Aspetta fino a quando una condizione diventa vera
 */
export async function waitFor(condition, options = {}) {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await wait(interval);
  }
  
  throw new Error(`Timeout: condition not met within ${timeout}ms`);
}

/**
 * Aspetta fino a quando un elemento appare nel DOM
 */
export async function waitForElement(selector, container = document) {
  return waitFor(() => {
    return container.querySelector(selector) !== null;
  });
}

/**
 * Aspetta fino a quando un elemento scompare dal DOM
 */
export async function waitForElementToBeRemoved(selector, container = document) {
  return waitFor(() => {
    return container.querySelector(selector) === null;
  });
}

/**
 * Retry di una funzione con backoff esponenziale
 */
export async function retry(fn, options = {}) {
  const { maxAttempts = 3, delay = 100, backoff = 2 } = options;
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await wait(waitTime);
    }
  }
  
  throw lastError;
}

/**
 * Verifica che una funzione lanci un errore con un messaggio specifico
 */
export function expectToThrow(fn, expectedMessage) {
  let error;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  
  if (!error) {
    throw new Error('Expected function to throw an error');
  }
  
  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
  }
  
  return error;
}

/**
 * Verifica che una funzione asincrona lanci un errore
 */
export async function expectToThrowAsync(fn, expectedMessage) {
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  
  if (!error) {
    throw new Error('Expected async function to throw an error');
  }
  
  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
  }
  
  return error;
}

/**
 * Crea un mock di una Promise che può essere risolta/rigettata manualmente
 */
export function createControllablePromise() {
  let resolve, reject;
  
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return {
    promise,
    resolve,
    reject
  };
}

/**
 * Mock di console per catturare log
 */
export function mockConsole() {
  const originalConsole = { ...console };
  const logs = [];
  
  console.log = vi.fn((...args) => {
    logs.push({ type: 'log', args });
  });
  
  console.warn = vi.fn((...args) => {
    logs.push({ type: 'warn', args });
  });
  
  console.error = vi.fn((...args) => {
    logs.push({ type: 'error', args });
  });
  
  console.info = vi.fn((...args) => {
    logs.push({ type: 'info', args });
  });
  
  return {
    logs,
    restore: () => {
      Object.assign(console, originalConsole);
    },
    getLogs: (type) => type ? logs.filter(log => log.type === type) : logs,
    clear: () => logs.length = 0
  };
}

/**
 * Genera dati casuali per test
 */
export const randomData = {
  string: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  number: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  boolean: () => Math.random() < 0.5,
  
  email: () => {
    const username = randomData.string(8).toLowerCase();
    const domain = randomData.string(5).toLowerCase();
    return `${username}@${domain}.com`;
  },
  
  date: (startYear = 1990, endYear = 2024) => {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  },
  
  phone: () => {
    const prefix = '+39 3';
    const number = Math.floor(Math.random() * 900000000) + 100000000;
    return `${prefix}${number}`;
  },
  
  array: (generator, length = 5) => {
    return Array.from({ length }, generator);
  }
};

/**
 * Utilities per test di performance
 */
export const performance = {
  measure: async (fn, name = 'test') => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    const duration = end - start;
    
    return {
      result,
      duration,
      name
    };
  },
  
  benchmark: async (functions, iterations = 100) => {
    const results = [];
    
    for (const [name, fn] of Object.entries(functions)) {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await fn();
        const end = Date.now();
        times.push(end - start);
      }
      
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      results.push({
        name,
        average,
        min,
        max,
        times
      });
    }
    
    return results;
  },
  
  expectWithinThreshold: (duration, threshold, message) => {
    if (duration > threshold) {
      throw new Error(message || `Performance threshold exceeded: ${duration}ms > ${threshold}ms`);
    }
  }
};

/**
 * Utilities per test di memoria
 */
export const memory = {
  getUsage: () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        heapLimit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return null;
  },
  
  measureMemoryUsage: async (fn) => {
    const before = memory.getUsage();
    const result = await fn();
    const after = memory.getUsage();
    
    if (before && after) {
      return {
        result,
        memoryDelta: after.heapUsed - before.heapUsed,
        before,
        after
      };
    }
    
    return { result };
  },
  
  forceGC: () => {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
};

/**
 * Utilities per test di rete
 */
export const network = {
  mockFetch: (responses = {}) => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn();
    
    fetchMock.mockImplementation((url, options) => {
      const method = options?.method || 'GET';
      const key = `${method} ${url}`;
      
      if (responses[key]) {
        return Promise.resolve(responses[key]);
      }
      
      if (responses[url]) {
        return Promise.resolve(responses[url]);
      }
      
      // Default response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      });
    });
    
    global.fetch = fetchMock;
    
    return {
      mock: fetchMock,
      restore: () => {
        global.fetch = originalFetch;
      }
    };
  },
  
  simulateNetworkDelay: (delay = 100) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },
  
  simulateNetworkError: () => {
    throw new Error('Network Error');
  }
};

/**
 * Utilities per test di storage
 */
export const storage = {
  mockLocalStorage: () => {
    const store = new Map();
    
    const mock = {
      getItem: vi.fn((key) => store.get(key) || null),
      setItem: vi.fn((key, value) => store.set(key, String(value))),
      removeItem: vi.fn((key) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((index) => Array.from(store.keys())[index] || null),
      get length() { return store.size; }
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mock,
      writable: true
    });
    
    return mock;
  },
  
  mockSessionStorage: () => {
    const store = new Map();
    
    const mock = {
      getItem: vi.fn((key) => store.get(key) || null),
      setItem: vi.fn((key, value) => store.set(key, String(value))),
      removeItem: vi.fn((key) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((index) => Array.from(store.keys())[index] || null),
      get length() { return store.size; }
    };
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mock,
      writable: true
    });
    
    return mock;
  }
};

/**
 * Utilities per test di date
 */
export const dateUtils = {
  mockDate: (fixedDate) => {
    const originalDate = Date;
    const MockDate = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedDate);
        } else {
          super(...args);
        }
      }
      
      static now() {
        return new Date(fixedDate).getTime();
      }
    };
    
    global.Date = MockDate;
    
    return {
      restore: () => {
        global.Date = originalDate;
      }
    };
  },
  
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  formatDate: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  }
};

/**
 * Utilities per test di URL e routing
 */
export const urlUtils = {
  mockLocation: (url) => {
    const originalLocation = window.location;
    
    delete window.location;
    window.location = new URL(url);
    
    return {
      restore: () => {
        window.location = originalLocation;
      }
    };
  },
  
  parseQueryString: (search) => {
    const params = new URLSearchParams(search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }
};

/**
 * Utilities per debugging test
 */
export const debug = {
  logTestState: (state, label = 'Test State') => {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(state, null, 2));
    console.log('='.repeat(label.length + 8));
  },
  
  logMockCalls: (mock, label = 'Mock Calls') => {
    console.log(`\n=== ${label} ===`);
    console.log('Calls:', mock.mock.calls);
    console.log('Results:', mock.mock.results);
    console.log('='.repeat(label.length + 8));
  },
  
  screenshot: (element, filename) => {
    // Placeholder per screenshot in test environment
    console.log(`Screenshot saved: ${filename}`);
    return Promise.resolve();
  }
};