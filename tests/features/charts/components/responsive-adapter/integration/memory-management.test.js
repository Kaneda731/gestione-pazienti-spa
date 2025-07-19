import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';

describe('Memory Management and Cleanup', () => {
  let adapter;
  let mockCallback;
  let originalInnerWidth;
  let originalInnerHeight;
  let originalNavigator;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalNavigator = window.navigator;

    adapter = new ResponsiveChartAdapter();
    mockCallback = vi.fn();
  });

  afterEach(() => {
    adapter.destroy();
    vi.clearAllMocks();

    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: originalNavigator
    });
  });

  test('should properly clean up all resources', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    // Initialize adapter
    adapter.initialize(mockCallback);
    
    // Verify event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true });

    // Destroy adapter
    adapter.destroy();

    // Verify event listeners were removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  test('should handle multiple destroy calls safely', () => {
    adapter.initialize(mockCallback);
    
    expect(() => {
      adapter.destroy();
      adapter.destroy();
      adapter.destroy();
    }).not.toThrow();
  });

  test('should not leak memory with repeated initialization', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    // Initialize and destroy multiple times
    for (let i = 0; i < 5; i++) {
      adapter.initialize(mockCallback);
      adapter.destroy();
    }

    // Should have equal number of add and remove calls
    expect(addEventListenerSpy.mock.calls.length).toBe(removeEventListenerSpy.mock.calls.length);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});