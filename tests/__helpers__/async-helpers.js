/**
 * Helper per test asincroni e Promise
 */

import { vi } from 'vitest';

/**
 * Aspetta che una Promise si risolva o si rigetti
 */
export async function waitForPromise(promise, timeout = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Promise timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

/**
 * Aspetta che una condizione asincrona diventi vera
 */
export async function waitForCondition(condition, options = {}) {
  const { timeout = 5000, interval = 50, timeoutMessage } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return result;
      }
    } catch (error) {
      // Ignora errori durante il polling, continua a provare
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(timeoutMessage || `Condition not met within ${timeout}ms`);
}

/**
 * Aspetta che una funzione asincrona non lanci più errori
 */
export async function waitForNoError(asyncFn, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  
  return waitForCondition(async () => {
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      return false;
    }
  }, { timeout, interval, timeoutMessage: 'Function still throwing errors' });
}

/**
 * Aspetta che un mock sia stato chiamato
 */
export async function waitForMockCall(mockFn, options = {}) {
  const { timeout = 5000, callCount = 1 } = options;
  
  return waitForCondition(() => {
    return mockFn.mock.calls.length >= callCount;
  }, { timeout, timeoutMessage: `Mock not called ${callCount} times within ${timeout}ms` });
}

/**
 * Aspetta che un mock sia stato chiamato con argomenti specifici
 */
export async function waitForMockCallWith(mockFn, expectedArgs, options = {}) {
  const { timeout = 5000 } = options;
  
  return waitForCondition(() => {
    return mockFn.mock.calls.some(call => {
      return expectedArgs.every((arg, index) => {
        return JSON.stringify(call[index]) === JSON.stringify(arg);
      });
    });
  }, { timeout, timeoutMessage: 'Mock not called with expected arguments' });
}

/**
 * Crea una Promise controllabile manualmente
 */
export function createControllablePromise() {
  let resolve, reject;
  let isResolved = false;
  let isRejected = false;
  
  const promise = new Promise((res, rej) => {
    resolve = (value) => {
      if (!isResolved && !isRejected) {
        isResolved = true;
        res(value);
      }
    };
    
    reject = (error) => {
      if (!isResolved && !isRejected) {
        isRejected = true;
        rej(error);
      }
    };
  });
  
  return {
    promise,
    resolve,
    reject,
    get isResolved() { return isResolved; },
    get isRejected() { return isRejected; },
    get isPending() { return !isResolved && !isRejected; }
  };
}

/**
 * Mock di Promise che può essere controllata
 */
export function mockPromise(initialValue) {
  const controllable = createControllablePromise();
  
  if (initialValue !== undefined) {
    controllable.resolve(initialValue);
  }
  
  return controllable;
}

/**
 * Simula delay asincrono
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Esegue funzioni in parallelo con limite di concorrenza
 */
export async function parallelLimit(tasks, limit = 3) {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task()).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

/**
 * Retry di funzione asincrona con backoff
 */
export async function retryAsync(asyncFn, options = {}) {
  const { 
    maxAttempts = 3, 
    delay: baseDelay = 100, 
    backoff = 2,
    shouldRetry = () => true 
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      const delayTime = baseDelay * Math.pow(backoff, attempt - 1);
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

/**
 * Timeout per Promise
 */
export function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage || `Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Debounce per funzioni asincrone
 */
export function debounceAsync(asyncFn, delay = 300) {
  let timeoutId;
  let lastPromise;
  
  return function(...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await asyncFn.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Throttle per funzioni asincrone
 */
export function throttleAsync(asyncFn, delay = 300) {
  let lastCall = 0;
  let pendingPromise = null;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return asyncFn.apply(this, args);
    }
    
    if (!pendingPromise) {
      pendingPromise = new Promise(resolve => {
        setTimeout(() => {
          pendingPromise = null;
          lastCall = Date.now();
          resolve(asyncFn.apply(this, args));
        }, delay - (now - lastCall));
      });
    }
    
    return pendingPromise;
  };
}

/**
 * Mock di fetch con risposte controllabili
 */
export function mockFetch(responses = {}) {
  const fetchMock = vi.fn();
  
  fetchMock.mockImplementation(async (url, options = {}) => {
    const method = options.method || 'GET';
    const key = `${method} ${url}`;
    
    // Simula delay di rete
    await delay(10);
    
    if (responses[key]) {
      const response = responses[key];
      
      if (response instanceof Error) {
        throw response;
      }
      
      return {
        ok: response.status < 400,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        json: async () => response.data || {},
        text: async () => JSON.stringify(response.data || {}),
        blob: async () => new Blob([JSON.stringify(response.data || {})]),
        headers: new Map(Object.entries(response.headers || {}))
      };
    }
    
    // Default response
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => '{}',
      blob: async () => new Blob(['{}'])
    };
  });
  
  // Helper methods
  fetchMock.mockSuccess = (url, data, status = 200) => {
    responses[url] = { data, status };
  };
  
  fetchMock.mockError = (url, status = 500, message = 'Server Error') => {
    responses[url] = { status, statusText: message };
  };
  
  fetchMock.mockNetworkError = (url) => {
    responses[url] = new Error('Network Error');
  };
  
  global.fetch = fetchMock;
  
  return {
    mock: fetchMock,
    restore: () => {
      delete global.fetch;
    }
  };
}

/**
 * Utilities per test di Promise
 */
export const promiseUtils = {
  // Verifica che una Promise si risolva
  expectToResolve: async (promise) => {
    try {
      const result = await promise;
      return result;
    } catch (error) {
      throw new Error(`Expected promise to resolve, but it rejected with: ${error.message}`);
    }
  },
  
  // Verifica che una Promise si rigetti
  expectToReject: async (promise, expectedMessage) => {
    try {
      await promise;
      throw new Error('Expected promise to reject, but it resolved');
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`Expected rejection message to contain "${expectedMessage}", but got "${error.message}"`);
      }
      return error;
    }
  },
  
  // Verifica che una Promise si risolva entro un timeout
  expectToResolveWithin: async (promise, timeout) => {
    return withTimeout(promise, timeout, `Promise did not resolve within ${timeout}ms`);
  },
  
  // Verifica che una Promise rimanga pending
  expectToPend: async (promise, checkDuration = 100) => {
    let resolved = false;
    let rejected = false;
    
    promise
      .then(() => { resolved = true; })
      .catch(() => { rejected = true; });
    
    await delay(checkDuration);
    
    if (resolved) {
      throw new Error('Expected promise to remain pending, but it resolved');
    }
    
    if (rejected) {
      throw new Error('Expected promise to remain pending, but it rejected');
    }
    
    return true;
  }
};

/**
 * Mock di async/await per test sincroni
 */
export function mockAsync(fn) {
  return vi.fn(async (...args) => {
    return fn(...args);
  });
}

/**
 * Utilities per test di streaming/observable
 */
export const streamUtils = {
  // Simula stream di dati
  createMockStream: (data, interval = 100) => {
    let index = 0;
    const listeners = [];
    
    const stream = {
      subscribe: (callback) => {
        listeners.push(callback);
        return {
          unsubscribe: () => {
            const idx = listeners.indexOf(callback);
            if (idx > -1) listeners.splice(idx, 1);
          }
        };
      },
      
      emit: (value) => {
        listeners.forEach(callback => callback(value));
      },
      
      start: () => {
        const intervalId = setInterval(() => {
          if (index < data.length) {
            stream.emit(data[index++]);
          } else {
            clearInterval(intervalId);
          }
        }, interval);
        
        return intervalId;
      }
    };
    
    return stream;
  },
  
  // Raccoglie valori da stream
  collectStreamValues: (stream, count, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const values = [];
      const timeoutId = setTimeout(() => {
        reject(new Error(`Did not receive ${count} values within ${timeout}ms`));
      }, timeout);
      
      const subscription = stream.subscribe((value) => {
        values.push(value);
        if (values.length >= count) {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve(values);
        }
      });
    });
  }
};