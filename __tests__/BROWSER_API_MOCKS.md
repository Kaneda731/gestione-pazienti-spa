# Enhanced Browser API Mocks Documentation

This document describes the comprehensive browser API mocking system implemented to ensure tests run reliably in the Node.js environment without browser dependencies.

## Table of Contents

1. [Overview](#overview)
2. [Core Browser APIs](#core-browser-apis)
3. [DOM Event Handling](#dom-event-handling)
4. [Observer APIs](#observer-apis)
5. [Media and Canvas APIs](#media-and-canvas-apis)
6. [Storage APIs](#storage-apis)
7. [Performance APIs](#performance-apis)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

## Overview

The enhanced browser API mocking system provides comprehensive mocks for all browser APIs used by the application. These mocks are automatically set up in the global test environment and provide consistent behavior across all tests.

### Key Features

- **Automatic Setup**: All mocks are configured automatically in `vitest.setup.js`
- **Comprehensive Coverage**: Covers all browser APIs used by the application
- **Consistent Behavior**: Provides predictable mock behavior across tests
- **Easy Cleanup**: Automatic cleanup between tests
- **Extensible**: Easy to add new mocks as needed

## Core Browser APIs

### Window.matchMedia Mock

The `window.matchMedia` mock is enhanced to handle all notification test cases and responsive behavior:

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

#### Usage Examples

```javascript
// Test reduced motion preference
it('should respect reduced motion preference', () => {
    // Mock returns false for reduced motion by default
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(mediaQuery.matches).toBe(false);
    
    // You can override for specific tests
    window.matchMedia.mockImplementation((query) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        // ... other properties
    }));
});

// Test responsive breakpoints
it('should handle mobile breakpoint', () => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    expect(mediaQuery.matches).toBe(true); // Default behavior
    
    // Test event listeners
    const callback = vi.fn();
    mediaQuery.addEventListener('change', callback);
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', callback);
});
```

### Window Dimensions

Window dimensions are automatically mocked with sensible defaults:

```javascript
// Default values set in setup
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});
```

#### Usage Examples

```javascript
it('should adapt to different screen sizes', () => {
    // Test desktop size (default)
    expect(window.innerWidth).toBe(1024);
    expect(window.innerHeight).toBe(768);
    
    // Change to mobile size for specific test
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    
    // Test mobile behavior
    const component = new ResponsiveComponent();
    expect(component.isMobile()).toBe(true);
});
```

## DOM Event Handling

### Document Event Methods

Document event handling methods are automatically mocked:

```javascript
// Automatically available in all tests
document.addEventListener = vi.fn();
document.removeEventListener = vi.fn();
document.dispatchEvent = vi.fn();
```

#### Usage Examples

```javascript
it('should handle document events', () => {
    const component = new EventComponent();
    component.init();
    
    // Verify event listeners were added
    expect(document.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
    );
    
    // Simulate event
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
    expect(document.dispatchEvent).toHaveBeenCalledWith(event);
});
```

### Element Event Methods

All DOM elements created in tests automatically have event methods:

```javascript
// Automatically added to all created elements
element.addEventListener = vi.fn();
element.removeEventListener = vi.fn();
element.dispatchEvent = vi.fn();
```

#### Usage Examples

```javascript
it('should handle element events', () => {
    const button = document.createElement('button');
    const clickHandler = vi.fn();
    
    button.addEventListener('click', clickHandler);
    expect(button.addEventListener).toHaveBeenCalledWith('click', clickHandler);
    
    // Simulate click
    const clickEvent = new MouseEvent('click');
    button.dispatchEvent(clickEvent);
    expect(button.dispatchEvent).toHaveBeenCalledWith(clickEvent);
});
```

### Document Properties

Document properties are automatically configured:

```javascript
// Document visibility state
Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true,
});

// Document title
document.title = '';
```

## Observer APIs

### IntersectionObserver Mock

Complete mock for intersection observation:

```javascript
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: options?.root || null,
    rootMargin: options?.rootMargin || '0px',
    thresholds: options?.threshold || [0],
}));
```

#### Usage Examples

```javascript
it('should handle intersection observation', () => {
    const callback = vi.fn();
    const options = { threshold: 0.5 };
    
    const observer = new IntersectionObserver(callback, options);
    expect(observer.thresholds).toEqual([0.5]);
    
    const element = document.createElement('div');
    observer.observe(element);
    expect(observer.observe).toHaveBeenCalledWith(element);
    
    observer.disconnect();
    expect(observer.disconnect).toHaveBeenCalled();
});
```

### ResizeObserver Mock

Complete mock for resize observation:

```javascript
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
```

#### Usage Examples

```javascript
it('should handle resize observation', () => {
    const callback = vi.fn();
    const observer = new ResizeObserver(callback);
    
    const element = document.createElement('div');
    observer.observe(element);
    expect(observer.observe).toHaveBeenCalledWith(element);
    
    observer.unobserve(element);
    expect(observer.unobserve).toHaveBeenCalledWith(element);
});
```

### MutationObserver Mock

Mock for DOM mutation observation:

```javascript
global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
}));
```

## Media and Canvas APIs

### Canvas API Mock

Comprehensive canvas API mock:

```javascript
global.HTMLCanvasElement = vi.fn().mockImplementation(() => ({
    width: 800,
    height: 600,
    getContext: vi.fn((type) => {
        if (type === '2d') {
            return {
                // Drawing methods
                fillStyle: '#000000',
                strokeStyle: '#000000',
                fillRect: vi.fn(),
                strokeRect: vi.fn(),
                clearRect: vi.fn(),
                
                // Text methods
                fillText: vi.fn(),
                strokeText: vi.fn(),
                measureText: vi.fn(() => ({ width: 100, height: 20 })),
                
                // Path methods
                beginPath: vi.fn(),
                closePath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                arc: vi.fn(),
                
                // Transform methods
                save: vi.fn(),
                restore: vi.fn(),
                scale: vi.fn(),
                rotate: vi.fn(),
                translate: vi.fn(),
                
                // Image methods
                drawImage: vi.fn(),
                createImageData: vi.fn(() => ({ 
                    data: new Uint8ClampedArray(4), 
                    width: 1, 
                    height: 1 
                })),
                getImageData: vi.fn(() => ({ 
                    data: new Uint8ClampedArray(4), 
                    width: 1, 
                    height: 1 
                })),
                putImageData: vi.fn(),
            };
        }
        return null;
    }),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-canvas-data'),
    toBlob: vi.fn((callback, type) => {
        const blob = new Blob(['mock-canvas-data'], { type: type || 'image/png' });
        callback(blob);
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}));
```

#### Usage Examples

```javascript
it('should handle canvas operations', () => {
    const canvas = document.createElement('canvas');
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeTruthy();
    
    ctx.fillRect(0, 0, 100, 100);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    
    const dataURL = canvas.toDataURL();
    expect(dataURL).toBe('data:image/png;base64,mock-canvas-data');
});
```

### Audio API Mock

Complete audio API mock:

```javascript
global.Audio = vi.fn().mockImplementation(() => ({
    src: "",
    currentTime: 0,
    volume: 1,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    // Audio properties
    duration: 0,
    paused: true,
    ended: false,
    muted: false,
    // Event handlers
    onload: null,
    onerror: null,
    onended: null,
}));
```

#### Usage Examples

```javascript
it('should handle audio playback', async () => {
    const audio = new Audio('test.mp3');
    expect(audio.src).toBe('test.mp3');
    
    await audio.play();
    expect(audio.play).toHaveBeenCalled();
    
    audio.pause();
    expect(audio.pause).toHaveBeenCalled();
    
    audio.addEventListener('ended', vi.fn());
    expect(audio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
});
```

### Image API Mock

Mock for image loading:

```javascript
global.Image = vi.fn().mockImplementation(() => ({
    src: '',
    width: 0,
    height: 0,
    onload: null,
    onerror: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    complete: false,
    naturalWidth: 0,
    naturalHeight: 0,
}));
```

### URL API Mock

Mock for URL operations:

```javascript
global.URL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
};
```

#### Usage Examples

```javascript
it('should handle URL operations', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    
    expect(url).toBe('blob:mock-url');
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    
    URL.revokeObjectURL(url);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
});
```

## Storage APIs

### LocalStorage Mock

Comprehensive localStorage mock with state management:

```javascript
const store = new Map();
global.localStorage = {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((i) => Array.from(store.keys())[i] ?? null),
    get length() {
        return store.size;
    },
};
```

#### Usage Examples

```javascript
it('should handle localStorage operations', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
    
    const value = localStorage.getItem('test');
    expect(value).toBe('value');
    expect(localStorage.getItem).toHaveBeenCalledWith('test');
    
    localStorage.removeItem('test');
    expect(localStorage.removeItem).toHaveBeenCalledWith('test');
    
    localStorage.clear();
    expect(localStorage.clear).toHaveBeenCalled();
});
```

### FileReader Mock

Mock for file reading operations:

```javascript
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
    // Event handlers
    onload: null,
    onerror: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    onabort: null,
}));
```

## Performance APIs

### Performance Mock

Mock for performance measurement:

```javascript
global.performance = {
    now: vi.fn(() => Date.now()),
    memory: { usedJSHeapSize: 10 * 1024 * 1024 },
    // Navigation timing
    timing: {
        navigationStart: Date.now() - 1000,
        loadEventEnd: Date.now(),
    },
    // Performance entries
    getEntries: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    // Marks and measures
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
};
```

#### Usage Examples

```javascript
it('should handle performance measurements', () => {
    const start = performance.now();
    expect(typeof start).toBe('number');
    expect(performance.now).toHaveBeenCalled();
    
    performance.mark('test-start');
    expect(performance.mark).toHaveBeenCalledWith('test-start');
    
    performance.measure('test-duration', 'test-start');
    expect(performance.measure).toHaveBeenCalledWith('test-duration', 'test-start');
});
```

### Navigator Mock

Mock for navigator properties:

```javascript
global.navigator = {
    userAgent: "vitest",
    deviceMemory: 8,
    vibrate: vi.fn(),
    // Geolocation
    geolocation: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
    },
    // Service worker
    serviceWorker: {
        register: vi.fn(),
        getRegistration: vi.fn(),
    },
};
```

## Usage Examples

### Setting Up Browser Mocks in Tests

```javascript
import { setupBrowserMocks, cleanupBrowserMocks } from '../setup/__setup__/browser-mocks.js';

describe('Component with Browser APIs', () => {
    beforeEach(() => {
        setupBrowserMocks();
    });

    afterEach(() => {
        cleanupBrowserMocks();
    });

    it('should use browser APIs', () => {
        // All browser APIs are now available
        const observer = new IntersectionObserver(() => {});
        const audio = new Audio();
        const canvas = document.createElement('canvas');
        
        // Test your component
    });
});
```

### Using Test Environment Utils

```javascript
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup/__setup__/test-environment-utils.js';

describe('Comprehensive Test', () => {
    beforeEach(() => {
        setupTestEnvironment({
            useFakeTimers: true,
            setupBrowserAPIs: true,
            mockLocalStorage: true,
            mockPerformance: true,
        });
    });

    afterEach(() => {
        cleanupTestEnvironment();
    });

    it('should have all APIs available', () => {
        // All browser APIs, timers, and storage are mocked
    });
});
```

### Specialized Test Environments

```javascript
import { 
    setupNotificationTestEnvironment,
    setupPatientTestEnvironment,
    setupEventiCliniciTestEnvironment 
} from '../setup/__setup__/test-environment-utils.js';

// For notification tests
describe('Notification Tests', () => {
    beforeEach(() => {
        setupNotificationTestEnvironment();
    });
    // Tests have matchMedia, document events, and timers
});

// For patient tests
describe('Patient Tests', () => {
    beforeEach(() => {
        setupPatientTestEnvironment();
    });
    // Tests have localStorage and location mocks
});

// For eventi-clinici tests
describe('Eventi Clinici Tests', () => {
    beforeEach(() => {
        setupEventiCliniciTestEnvironment();
    });
    // Tests have URL and file APIs
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "API is not defined" Errors

If you encounter errors about missing APIs:

```javascript
// Check if the API is properly mocked
beforeEach(() => {
    expect(window.matchMedia).toBeDefined();
    expect(global.IntersectionObserver).toBeDefined();
    expect(global.localStorage).toBeDefined();
});
```

#### 2. Mock Not Behaving as Expected

```javascript
// Reset mocks to default behavior
beforeEach(() => {
    vi.clearAllMocks();
    setupBrowserMocks();
});
```

#### 3. State Leaking Between Tests

```javascript
// Ensure proper cleanup
afterEach(() => {
    cleanupBrowserMocks();
    localStorage.clear();
    document.body.innerHTML = '';
});
```

#### 4. Custom Mock Behavior

```javascript
// Override default mock behavior for specific tests
it('should handle custom behavior', () => {
    window.matchMedia.mockImplementation((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        // ... other properties
    }));
    
    // Test with custom behavior
});
```

### Debugging Mock Issues

```javascript
// Log mock calls for debugging
it('should debug mock calls', () => {
    const component = new YourComponent();
    component.init();
    
    console.log('matchMedia calls:', window.matchMedia.mock.calls);
    console.log('addEventListener calls:', document.addEventListener.mock.calls);
    
    // Verify expected calls
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
});
```

This comprehensive browser API mocking system ensures that all tests run reliably in the Node.js environment while providing realistic browser behavior for thorough testing.