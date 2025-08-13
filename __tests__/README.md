# Test Infrastructure Documentation

This document provides comprehensive guidance on the enhanced test infrastructure for the gestione-pazienti-spa project. The infrastructure has been systematically improved to handle DOM/Browser API mocking, service mocking, and test environment consistency.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Browser API Mocking](#browser-api-mocking)
3. [Service Mock Patterns](#service-mock-patterns)
4. [Test Assertion Guidelines](#test-assertion-guidelines)
5. [Common Test Patterns](#common-test-patterns)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Best Practices](#best-practices)

## Test Environment Setup

### Global Setup Files

The test infrastructure uses three main setup files:

- **`__tests__/setup/__setup__/vitest.setup.js`** - Global test environment configuration
- **`__tests__/setup/__setup__/browser-mocks.js`** - Browser API mocking utilities
- **`__tests__/setup/__setup__/test-environment-utils.js`** - Test environment utilities

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup/__setup__/test-environment-utils.js';

describe('YourComponent', () => {
    beforeEach(() => {
        setupTestEnvironment({
            useFakeTimers: true,
            setupBrowserAPIs: true,
            mockLocalStorage: true
        });
    });

    afterEach(() => {
        cleanupTestEnvironment();
    });

    it('should work correctly', () => {
        // Your test code here
    });
});
```

## Browser API Mocking

### Enhanced matchMedia Mock

The `window.matchMedia` mock has been enhanced to handle all notification test cases:

```javascript
// Automatically available in all tests
window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes("prefers-reduced-motion: reduce") ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));
```

### Document Event Handling

Document event methods are automatically mocked:

```javascript
// Available in all tests
document.addEventListener = vi.fn();
document.removeEventListener = vi.fn();
document.dispatchEvent = vi.fn();
```

### Observer APIs

Modern browser APIs are mocked for compatibility:

```javascript
// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: options?.root || null,
    rootMargin: options?.rootMargin || '0px',
    thresholds: options?.threshold || [0],
}));

// ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
```

### Canvas and Media APIs

```javascript
// Canvas mock
global.HTMLCanvasElement = vi.fn().mockImplementation(() => ({
    width: 800,
    height: 600,
    getContext: vi.fn((type) => {
        if (type === '2d') {
            return {
                fillStyle: '#000000',
                strokeStyle: '#000000',
                fillRect: vi.fn(),
                // ... other canvas methods
            };
        }
        return null;
    }),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-canvas-data'),
}));

// Audio mock
global.Audio = vi.fn().mockImplementation(() => ({
    src: "",
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}));
```

## Service Mock Patterns

### Complete Service Mocks

All service mocks must include all methods used by the tests:

```javascript
// Example: Complete notification service mock
const mockNotificationService = {
    init: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    clear: vi.fn(),
    removeNotification: vi.fn(),
    pauseAutoCloseTimer: vi.fn(),
    resumeAutoCloseTimer: vi.fn(),
    startAutoCloseTimer: vi.fn(),
    stopAutoCloseTimer: vi.fn(),
    timers: new Map(),
    initialized: false,
    notificationContainer: null
};
```

### Feature-Specific Service Mocks

#### Eventi Clinici API Mock

```javascript
const mockEventiCliniciApi = {
    resetCurrentFiltersToDefaults: vi.fn(),
    resetFiltersUI: vi.fn(),
    getCurrentFilters: vi.fn(() => ({})),
    applyFilters: vi.fn(),
    clearFilters: vi.fn(),
    // Add all other required methods
};
```

#### Infection Data Manager Mock

```javascript
const mockInfectionDataManager = {
    getInfectionData: vi.fn(),
    clearInfectionData: vi.fn(),
    hasValidInfectionData: vi.fn(() => false),
    hasInfectionData: vi.fn(() => false),
    setInfectionData: vi.fn(),
    validateInfectionData: vi.fn(),
    // Add all other required methods
};
```

#### Logger Service Mock

```javascript
const mockLoggerService = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(), // This was missing in many tests
    info: vi.fn(),
    trace: vi.fn(),
};
```

### Mock Implementation in Tests

```javascript
// Use vi.mock for module-level mocking
vi.mock('../../../../src/features/eventi-clinici/services/eventi-clinici-api.js', () => ({
    eventiCliniciApi: mockEventiCliniciApi,
    resetCurrentFiltersToDefaults: vi.fn(),
    // Include all exported functions
}));

// Use vi.spyOn for selective mocking
beforeEach(() => {
    vi.spyOn(loggerService, 'debug').mockImplementation(() => {});
});
```

## Test Assertion Guidelines

### CSS Class Verification

Always verify actual CSS classes applied by the implementation:

```javascript
// ❌ Wrong - checking for classes that don't exist
expect(element.classList.contains('mobile-compact')).toBe(true);

// ✅ Correct - checking for actual classes
expect(element.classList.contains('mobile-action-btn')).toBe(true);
```

### Component Property Verification

Check actual component properties and methods:

```javascript
// ❌ Wrong - assuming property values
expect(component.zIndex).toBe(2000);

// ✅ Correct - checking actual values
expect(component.style.zIndex).toBe('1050');
```

### Method Call Verification

Verify actual method signatures and calls:

```javascript
// ❌ Wrong - incorrect method name
expect(mockService.resetFilters).toHaveBeenCalled();

// ✅ Correct - actual method name
expect(mockService.resetCurrentFiltersToDefaults).toHaveBeenCalled();
```

### Error Message Verification

Match actual error messages from the implementation:

```javascript
// ❌ Wrong - generic error message
expect(error.message).toContain('Transaction failed');

// ✅ Correct - actual error message
expect(error.message).toContain('Errore durante l\'aggiornamento del paziente');
```

## Common Test Patterns

### Notification System Tests

```javascript
import { setupNotificationTestEnvironment } from '../setup/__setup__/test-environment-utils.js';

describe('Notification Component', () => {
    beforeEach(() => {
        setupNotificationTestEnvironment();
    });

    it('should handle reduced motion preference', () => {
        // matchMedia mock automatically handles this
        window.matchMedia('(prefers-reduced-motion: reduce)').matches = true;
        
        // Your test code
    });
});
```

### Patient Service Tests

```javascript
import { setupPatientTestEnvironment } from '../setup/__setup__/test-environment-utils.js';

describe('Patient Service', () => {
    beforeEach(() => {
        setupPatientTestEnvironment();
    });

    it('should handle patient operations', () => {
        // localStorage and window.location are automatically mocked
    });
});
```

### Eventi Clinici Tests

```javascript
import { setupEventiCliniciTestEnvironment } from '../setup/__setup__/test-environment-utils.js';

describe('Eventi Clinici', () => {
    beforeEach(() => {
        setupEventiCliniciTestEnvironment();
    });

    it('should handle clinical events', () => {
        // URL and other APIs are automatically mocked
    });
});
```

### Timer-Based Tests

```javascript
describe('Timer Tests', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setupTestEnvironment({ useFakeTimers: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should handle timers correctly', () => {
        const callback = vi.fn();
        setTimeout(callback, 1000);
        
        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalled();
    });
});
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "matchMedia is not a function"

**Problem**: Tests fail because `window.matchMedia` is not mocked.

**Solution**: The global setup automatically provides this mock. If you're still seeing this error:

```javascript
// Add this to your test file if needed
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

#### 2. "document.addEventListener is not a function"

**Problem**: Document event methods are not available.

**Solution**: Use the browser mocks setup:

```javascript
import { setupBrowserMocks } from '../setup/__setup__/browser-mocks.js';

beforeEach(() => {
    setupBrowserMocks();
});
```

#### 3. "Method X is not a function" in service mocks

**Problem**: Service mock is missing required methods.

**Solution**: Add all required methods to your mock:

```javascript
const mockService = {
    // Add ALL methods used by your component
    existingMethod: vi.fn(),
    missingMethod: vi.fn(), // Add this
};
```

#### 4. CSS class assertions failing

**Problem**: Tests expect CSS classes that don't match the actual implementation.

**Solution**: Check the actual implementation and update your assertions:

```javascript
// Check what classes are actually applied
console.log('Actual classes:', element.className);

// Update your assertion to match
expect(element.classList.contains('actual-class-name')).toBe(true);
```

#### 5. Timer tests not working

**Problem**: Timer-based tests are unreliable.

**Solution**: Use fake timers consistently:

```javascript
beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
});

it('should handle timers', () => {
    // Use vi.advanceTimersByTime() instead of real delays
    vi.advanceTimersByTime(1000);
});
```

#### 6. DOM cleanup issues

**Problem**: Tests interfere with each other due to DOM state.

**Solution**: Use proper cleanup:

```javascript
import { cleanupDOM } from '../setup/__setup__/browser-mocks.js';

afterEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
});
```

#### 7. Memory leaks in tests

**Problem**: Tests consume increasing memory.

**Solution**: Ensure proper cleanup:

```javascript
afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Clear timers
    vi.clearAllTimers();
    
    // Clean DOM
    document.body.innerHTML = '';
    
    // Reset global state
    if (serviceInstance) {
        serviceInstance.destroy();
    }
});
```

### Debugging Test Failures

#### 1. Enable Debug Logging

```javascript
// Add to your test to see what's happening
beforeEach(() => {
    console.log('Test environment status:', getTestEnvironmentStatus());
});
```

#### 2. Verify Mock Setup

```javascript
// Check if mocks are properly set up
it('should have proper mocks', () => {
    expect(window.matchMedia).toBeDefined();
    expect(document.addEventListener).toBeDefined();
    expect(global.IntersectionObserver).toBeDefined();
});
```

#### 3. Check Actual vs Expected

```javascript
// Log actual values to understand discrepancies
it('should match expected behavior', () => {
    const result = component.someMethod();
    console.log('Actual result:', result);
    console.log('Expected result:', expectedResult);
    expect(result).toBe(expectedResult);
});
```

## Best Practices

### 1. Test Environment Consistency

- Always use the provided setup utilities
- Clean up properly in `afterEach` hooks
- Use fake timers for time-dependent tests
- Reset mocks between tests

### 2. Mock Completeness

- Include ALL methods used by your components
- Use realistic return values in mocks
- Mock at the appropriate level (module vs instance)
- Keep mocks simple but complete

### 3. Assertion Accuracy

- Verify actual implementation behavior
- Use specific assertions over generic ones
- Check both positive and negative cases
- Test edge cases and error conditions

### 4. Test Isolation

- Each test should be independent
- Don't rely on test execution order
- Clean up global state between tests
- Use fresh instances for each test

### 5. Performance

- Use fake timers for time-based tests
- Clean up resources properly
- Avoid unnecessary DOM manipulation
- Use efficient mock implementations

### 6. Maintainability

- Keep tests focused and simple
- Use descriptive test names
- Group related tests logically
- Document complex test setups

### 7. Coverage

- Test both success and failure paths
- Include edge cases
- Test error handling
- Verify cleanup behavior

## Migration Guide

If you're updating existing tests to use the new infrastructure:

### 1. Update Imports

```javascript
// Old
import { vi } from 'vitest';

// New
import { vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup/__setup__/test-environment-utils.js';
```

### 2. Update Setup/Cleanup

```javascript
// Old
beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
});

// New
beforeEach(() => {
    setupTestEnvironment();
});

afterEach(() => {
    cleanupTestEnvironment();
});
```

### 3. Update Mocks

```javascript
// Old - incomplete mock
const mockService = {
    someMethod: vi.fn()
};

// New - complete mock
const mockService = {
    someMethod: vi.fn(),
    missingMethod: vi.fn(), // Add all required methods
    anotherMethod: vi.fn()
};
```

### 4. Update Assertions

```javascript
// Old - incorrect assertion
expect(element.classList.contains('wrong-class')).toBe(true);

// New - correct assertion
expect(element.classList.contains('actual-class')).toBe(true);
```

This enhanced test infrastructure provides a solid foundation for reliable, maintainable tests. Follow these patterns and guidelines to ensure your tests are robust and accurate.