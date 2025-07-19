import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';

describe('Event Handling Integration', () => {
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

  test('should setup event listeners when initialized with callback', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    adapter.initialize(mockCallback);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true });
    
    addEventListenerSpy.mockRestore();
  });

  test('should cleanup event listeners on destroy', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    adapter.initialize(mockCallback);
    adapter.destroy();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  test('should handle resize events and trigger callback with viewport info', () => {
    adapter.initialize(mockCallback);
    
    // Trigger resize event manually
    adapter.eventHandler.handleResize();
    
    expect(mockCallback).toHaveBeenCalledWith({
      type: 'resize',
      viewportInfo: expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
        deviceType: expect.any(String),
        orientation: expect.any(String)
      })
    });
  });

  test('should handle orientation change events and trigger callback', () => {
    adapter.initialize(mockCallback);
    
    // Trigger orientation change event manually
    adapter.eventHandler.handleOrientationChange();
    
    expect(mockCallback).toHaveBeenCalledWith({
      type: 'orientationchange',
      viewportInfo: expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
        deviceType: expect.any(String),
        orientation: expect.any(String)
      })
    });
  });

  test('should prevent multiple initializations', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    adapter.initialize(mockCallback);
    adapter.initialize(mockCallback); // Second call should be ignored
    
    // Should only be called once for each event type
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    
    addEventListenerSpy.mockRestore();
  });
});