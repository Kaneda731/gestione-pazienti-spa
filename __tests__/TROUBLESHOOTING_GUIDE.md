# Test Troubleshooting Guide

This guide provides solutions for common test failures and debugging techniques for the gestione-pazienti-spa test suite.

## Table of Contents

1. [Common Test Failures](#common-test-failures)
2. [Mock-Related Issues](#mock-related-issues)
3. [DOM and Browser API Issues](#dom-and-browser-api-issues)
4. [Timer and Async Issues](#timer-and-async-issues)
5. [Service Integration Issues](#service-integration-issues)
6. [Debugging Techniques](#debugging-techniques)
7. [Performance Issues](#performance-issues)
8. [Environment Issues](#environment-issues)

## Common Test Failures

### 1. "matchMedia is not a function"

**Error Message:**
```
TypeError: window.matchMedia is not a function
```

**Cause:** The `window.matchMedia` API is not available in the Node.js test environment.

**Solution:**
The global setup automatically provides this mock. If you're still seeing this error:

```javascript
// Add this to your test file if the global mock isn't working
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
    })),
});
```

**Prevention:**
```javascript
// Verify the mock is available in your test
beforeEach(() => {
    expect(window.matchMedia).toBeDefined();
    expect(typeof window.matchMedia).toBe('function');
});
```

### 2. "document.addEventListener is not a function"

**Error Message:**
```
TypeError: document.addEventListener is not a function
```

**Cause:** Document event methods are not properly mocked.

**Solution:**
```javascript
import { setupBrowserMocks } from '../setup/__setup__/browser-mocks.js';

beforeEach(() => {
    setupBrowserMocks();
    
    // Verify the mock is available
    expect(document.addEventListener).toBeDefined();
    expect(typeof document.addEventListener).toBe('function');
});
```

**Alternative Solution:**
```javascript
// Manual setup if automatic setup fails
beforeEach(() => {
    if (!document.addEventListener) {
        document.addEventListener = vi.fn();
    }
    if (!document.removeEventListener) {
        document.removeEventListener = vi.fn();
    }
    if (!document.dispatchEvent) {
        document.dispatchEvent = vi.fn();
    }
});
```

### 3. "Method X is not a function" in Service Mocks

**Error Message:**
```
TypeError: mockService.resetCurrentFiltersToDefaults is not a function
```

**Cause:** Service mock is missing required methods.

**Solution:**
Add all required methods to your mock:

```javascript
// ❌ Incomplete mock
const mockEventiCliniciApi = {
    getEvents: vi.fn()
};

// ✅ Complete mock
const mockEventiCliniciApi = {
    getEvents: vi.fn(),
    resetCurrentFiltersToDefaults: vi.fn(), // Add missing method
    resetFiltersUI: vi.fn(),
    getCurrentFilters: vi.fn(),
    applyFilters: vi.fn(),
    // ... all other required methods
};
```

**Prevention:**
Use the complete mock templates from the Service Mock Guide:

```javascript
import { mockEventiCliniciApi } from '../mocks/eventiCliniciApi.mock.js';

vi.mock('../../../../src/features/eventi-clinici/services/eventi-clinici-api.js', () => ({
    eventiCliniciApi: mockEventiCliniciApi,
    resetCurrentFiltersToDefaults: mockEventiCliniciApi.resetCurrentFiltersToDefaults
}));
```

### 4. CSS Class Assertion Failures

**Error Message:**
```
Expected element to have class 'mobile-compact' but it has 'mobile-action-btn'
```

**Cause:** Test assertions don't match the actual implementation.

**Solution:**
Update assertions to match actual CSS classes:

```javascript
// ❌ Wrong - checking for non-existent class
expect(element.classList.contains('mobile-compact')).toBe(true);

// ✅ Correct - checking for actual class
expect(element.classList.contains('mobile-action-btn')).toBe(true);
```

**Debugging:**
```javascript
// Log actual classes to see what's applied
console.log('Actual classes:', element.className);
console.log('Class list:', Array.from(element.classList));

// Then update your assertion
expect(element.classList.contains('actual-class-name')).toBe(true);
```

### 5. Component Property Mismatches

**Error Message:**
```
Expected 2000 but received 1050
```

**Cause:** Test expects different values than the actual implementation returns.

**Solution:**
Check the actual implementation and update expectations:

```javascript
// ❌ Wrong - expecting incorrect value
expect(component.zIndex).toBe(2000);

// ✅ Correct - expecting actual value
expect(component.style.zIndex).toBe('1050');
```

**Debugging:**
```javascript
// Log actual values
console.log('Actual zIndex:', component.style.zIndex);
console.log('Component properties:', Object.keys(component));

// Update assertion based on actual values
```

## Mock-Related Issues

### 1. Mock Not Being Called

**Problem:** Mock function shows 0 calls when it should have been called.

**Debugging:**
```javascript
it('should call mock function', () => {
    const mockFn = vi.fn();
    component.setCallback(mockFn);
    
    component.performAction();
    
    // Debug: Check if mock was called
    console.log('Mock calls:', mockFn.mock.calls);
    console.log('Mock call count:', mockFn.mock.calls.length);
    
    expect(mockFn).toHaveBeenCalled();
});
```

**Common Causes:**
1. Mock not properly set up
2. Component using different method name
3. Async operation not awaited
4. Mock cleared before assertion

**Solutions:**
```javascript
// 1. Verify mock setup
beforeEach(() => {
    mockService.method = vi.fn();
    expect(mockService.method).toBeDefined();
});

// 2. Check actual method name in implementation
// Look at the source code to verify method names

// 3. Await async operations
it('should call async method', async () => {
    await component.performAsyncAction();
    expect(mockService.asyncMethod).toHaveBeenCalled();
});

// 4. Don't clear mocks before assertions
afterEach(() => {
    // Clear mocks AFTER all assertions
    vi.clearAllMocks();
});
```

### 2. Mock Returning Undefined

**Problem:** Mock returns `undefined` instead of expected value.

**Solution:**
```javascript
// ❌ Mock without return value
const mockService = {
    getData: vi.fn() // Returns undefined by default
};

// ✅ Mock with return value
const mockService = {
    getData: vi.fn().mockReturnValue({ data: 'test' })
};

// ✅ Mock with different return values for different calls
mockService.getData
    .mockReturnValueOnce({ data: 'first' })
    .mockReturnValueOnce({ data: 'second' });
```

### 3. Mock State Not Persisting

**Problem:** Mock state resets between calls.

**Solution:**
```javascript
// Create stateful mock
const createStatefulMock = () => {
    const state = new Map();
    
    return {
        setState: vi.fn((key, value) => {
            state.set(key, value);
        }),
        getState: vi.fn((key) => {
            return state.get(key);
        }),
        // Expose state for testing
        _getState: () => state
    };
};

const mockStateService = createStatefulMock();
```

## DOM and Browser API Issues

### 1. Element Not Found

**Error Message:**
```
Cannot read property 'addEventListener' of null
```

**Cause:** DOM element doesn't exist or querySelector returns null.

**Solution:**
```javascript
// Mock querySelector to return a mock element
beforeEach(() => {
    const mockElement = {
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
    
    document.querySelector = vi.fn(() => mockElement);
    document.querySelectorAll = vi.fn(() => [mockElement]);
});
```

### 2. IntersectionObserver Not Available

**Error Message:**
```
ReferenceError: IntersectionObserver is not defined
```

**Solution:**
The global setup provides this mock. If it's not working:

```javascript
// Manual setup
beforeEach(() => {
    global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        root: options?.root || null,
        rootMargin: options?.rootMargin || '0px',
        thresholds: options?.threshold || [0],
    }));
});
```

### 3. Canvas Context Not Available

**Error Message:**
```
Cannot read property 'fillRect' of null
```

**Solution:**
```javascript
// Ensure canvas mock is properly set up
beforeEach(() => {
    const mockCanvas = {
        getContext: vi.fn((type) => {
            if (type === '2d') {
                return {
                    fillRect: vi.fn(),
                    strokeRect: vi.fn(),
                    clearRect: vi.fn(),
                    // ... other canvas methods
                };
            }
            return null;
        })
    };
    
    document.createElement = vi.fn((tagName) => {
        if (tagName === 'canvas') {
            return mockCanvas;
        }
        return document.createElement.call(document, tagName);
    });
});
```

## Timer and Async Issues

### 1. Timer Tests Not Working

**Problem:** Timer-based tests are unreliable or don't work.

**Solution:**
```javascript
describe('Timer Tests', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllTimers();
    });

    it('should handle timers correctly', () => {
        const callback = vi.fn();
        setTimeout(callback, 1000);
        
        // Don't use real delays - advance fake timers
        vi.advanceTimersByTime(1000);
        
        expect(callback).toHaveBeenCalled();
    });
});
```

### 2. Async Tests Timing Out

**Problem:** Async tests never resolve or timeout.

**Solution:**
```javascript
// ❌ Wrong - not awaiting async operation
it('should handle async operation', () => {
    component.performAsyncAction();
    expect(mockService.asyncMethod).toHaveBeenCalled();
});

// ✅ Correct - properly awaiting
it('should handle async operation', async () => {
    await component.performAsyncAction();
    expect(mockService.asyncMethod).toHaveBeenCalled();
});

// ✅ Alternative - using done callback
it('should handle async operation', (done) => {
    component.performAsyncAction().then(() => {
        expect(mockService.asyncMethod).toHaveBeenCalled();
        done();
    });
});
```

### 3. Promise Not Resolving

**Problem:** Mock promises don't resolve as expected.

**Solution:**
```javascript
// ❌ Wrong - mock doesn't return promise
const mockService = {
    asyncMethod: vi.fn().mockReturnValue('result')
};

// ✅ Correct - mock returns resolved promise
const mockService = {
    asyncMethod: vi.fn().mockResolvedValue('result')
};

// ✅ For rejected promises
const mockService = {
    asyncMethod: vi.fn().mockRejectedValue(new Error('Test error'))
};
```

## Service Integration Issues

### 1. Service Not Initialized

**Problem:** Service methods fail because service isn't initialized.

**Solution:**
```javascript
beforeEach(async () => {
    // Initialize service before tests
    await notificationService.init();
    
    // Verify initialization
    expect(notificationService.initialized).toBe(true);
});
```

### 2. Service State Conflicts

**Problem:** Service state from one test affects another.

**Solution:**
```javascript
afterEach(() => {
    // Reset service state
    notificationService.clear();
    notificationService.timers.clear();
    notificationService.initialized = false;
    
    // Clear mocks
    vi.clearAllMocks();
});
```

### 3. Circular Dependency Issues

**Problem:** Services depend on each other causing mock conflicts.

**Solution:**
```javascript
// Mock all dependencies at module level
vi.mock('../../../../src/core/services/stateService.js', () => ({
    stateService: mockStateService
}));

vi.mock('../../../../src/core/services/loggerService.js', () => ({
    loggerService: mockLoggerService
}));

// Then import the service under test
import { notificationService } from '../../../../src/core/services/notificationService.js';
```

## Debugging Techniques

### 1. Enable Debug Logging

```javascript
// Add debug logging to understand test flow
beforeEach(() => {
    console.log('=== Test Setup ===');
    console.log('Window matchMedia:', typeof window.matchMedia);
    console.log('Document addEventListener:', typeof document.addEventListener);
    console.log('Mock service methods:', Object.keys(mockService));
});

it('should work correctly', () => {
    console.log('=== Test Execution ===');
    
    const result = component.performAction();
    console.log('Action result:', result);
    
    console.log('Mock calls:', mockService.method.mock.calls);
    
    expect(result).toBe('expected');
});
```

### 2. Inspect Mock Calls

```javascript
it('should call service correctly', () => {
    component.performAction();
    
    // Inspect all mock calls
    console.log('All mock calls:');
    mockService.method.mock.calls.forEach((call, index) => {
        console.log(`Call ${index}:`, call);
    });
    
    // Check specific call
    expect(mockService.method).toHaveBeenNthCalledWith(1, 'expected-arg');
});
```

### 3. Verify Test Environment

```javascript
import { getTestEnvironmentStatus } from '../setup/__setup__/test-environment-utils.js';

beforeEach(() => {
    const status = getTestEnvironmentStatus();
    console.log('Test environment status:', status);
    
    // Verify critical components
    expect(status.jsdom.available).toBe(true);
    expect(status.mocks.matchMedia).toBe(true);
});
```

### 4. Component State Inspection

```javascript
it('should update component state', () => {
    const initialState = { ...component.state };
    console.log('Initial state:', initialState);
    
    component.performAction();
    
    const finalState = { ...component.state };
    console.log('Final state:', finalState);
    
    // Compare states
    expect(finalState).not.toEqual(initialState);
});
```

## Performance Issues

### 1. Tests Running Slowly

**Problem:** Test suite takes too long to run.

**Solutions:**
```javascript
// 1. Use fake timers for time-based tests
beforeEach(() => {
    vi.useFakeTimers();
});

// 2. Mock expensive operations
const mockExpensiveOperation = vi.fn().mockReturnValue('result');

// 3. Avoid real DOM operations
const mockElement = { /* minimal mock */ };
document.createElement = vi.fn(() => mockElement);

// 4. Use shallow rendering for complex components
const shallowRender = (component) => {
    // Return minimal representation
    return { props: component.props };
};
```

### 2. Memory Leaks in Tests

**Problem:** Test memory usage keeps increasing.

**Solutions:**
```javascript
afterEach(() => {
    // Clear all references
    component = null;
    mockService = null;
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Clear timers
    vi.clearAllTimers();
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Force garbage collection (if available)
    if (global.gc) {
        global.gc();
    }
});
```

## Environment Issues

### 1. JSDOM Configuration Problems

**Problem:** JSDOM environment not working correctly.

**Solution:**
```javascript
// Verify JSDOM is properly configured
beforeEach(() => {
    expect(global.window).toBeDefined();
    expect(global.document).toBeDefined();
    expect(document.body).toBeDefined();
    
    // Reset DOM state
    document.body.innerHTML = '';
});
```

### 2. Module Resolution Issues

**Problem:** Modules not found or incorrectly resolved.

**Solution:**
```javascript
// Use absolute paths from project root
import { service } from '../../../../src/core/services/service.js';

// Or configure path mapping in vitest.config.js
export default {
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@tests': path.resolve(__dirname, './__tests__')
        }
    }
};
```

### 3. Environment Variable Issues

**Problem:** Environment variables not available in tests.

**Solution:**
```javascript
// Set environment variables for tests
beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.VITE_SUPABASE_URL = 'test-url';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
});

afterEach(() => {
    // Clean up environment variables
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
});
```

## Quick Debugging Checklist

When a test fails, check these items in order:

1. **Mock Setup**
   - [ ] Are all required mocks defined?
   - [ ] Do mocks have all required methods?
   - [ ] Are mocks returning expected values?

2. **Environment**
   - [ ] Is JSDOM properly configured?
   - [ ] Are browser APIs mocked?
   - [ ] Is the DOM in a clean state?

3. **Async Operations**
   - [ ] Are promises properly awaited?
   - [ ] Are timers using fake timers?
   - [ ] Are async operations completing?

4. **Assertions**
   - [ ] Do assertions match actual implementation?
   - [ ] Are CSS classes correct?
   - [ ] Are return values correct?

5. **Cleanup**
   - [ ] Are mocks cleared between tests?
   - [ ] Is DOM cleaned up?
   - [ ] Are timers cleared?

This troubleshooting guide should help you quickly identify and resolve common test issues in the gestione-pazienti-spa project.