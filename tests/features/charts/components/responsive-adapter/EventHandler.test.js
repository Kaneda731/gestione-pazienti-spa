import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveEventHandler } from '../../../../../src/features/charts/components/responsive-adapter/EventHandler.js';

describe('ResponsiveEventHandler', () => {
  let eventHandler;
  let mockDeviceDetector;
  let mockCallback;

  beforeEach(() => {
    mockDeviceDetector = {
      detectDevice: vi.fn(),
      getOrientation: vi.fn(),
      getViewportInfo: vi.fn()
    };

    mockCallback = vi.fn();
    eventHandler = new ResponsiveEventHandler(mockDeviceDetector);
  });

  afterEach(() => {
    // Clean up any event listeners
    eventHandler.cleanup();
    vi.clearAllMocks();
  });

  describe('Event Listener Setup', () => {
    test('should setup resize event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      eventHandler.setupEventListeners(mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    });

    test('should setup orientation change event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      eventHandler.setupEventListeners(mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true });
    });

    test('should store callback function', () => {
      eventHandler.setupEventListeners(mockCallback);
      
      expect(eventHandler.callback).toBe(mockCallback);
    });
  });

  describe('Resize Handling', () => {
    test('should handle resize event', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      mockDeviceDetector.getViewportInfo.mockReturnValue({
        width: 375,
        height: 667,
        device: 'mobile',
        orientation: 'portrait'
      });

      eventHandler.setupEventListeners(mockCallback);
      eventHandler.handleResize();

      expect(mockDeviceDetector.getViewportInfo).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'resize',
        viewportInfo: {
          width: 375,
          height: 667,
          device: 'mobile',
          orientation: 'portrait'
        }
      });
    });

    test('should debounce resize events', async () => {
      mockDeviceDetector.getViewportInfo.mockReturnValue({
        width: 375,
        height: 667,
        device: 'mobile',
        orientation: 'portrait'
      });

      eventHandler.setupEventListeners(mockCallback);
      
      // Trigger multiple resize events quickly
      eventHandler.handleResize();
      eventHandler.handleResize();
      eventHandler.handleResize();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should call callback immediately for first event, then once more after debounce
      expect(mockCallback).toHaveBeenCalledTimes(2);
      
      // First call should be immediate
      expect(mockCallback).toHaveBeenNthCalledWith(1, {
        type: 'resize',
        viewportInfo: {
          width: 375,
          height: 667,
          device: 'mobile',
          orientation: 'portrait'
        }
      });
      
      // Second call should be debounced
      expect(mockCallback).toHaveBeenNthCalledWith(2, {
        type: 'resize',
        viewportInfo: {
          width: 375,
          height: 667,
          device: 'mobile',
          orientation: 'portrait'
        },
        debounced: true
      });
    });
  });

  describe('Orientation Change Handling', () => {
    test('should handle orientation change event', () => {
      mockDeviceDetector.getOrientation.mockReturnValue('landscape');
      mockDeviceDetector.getViewportInfo.mockReturnValue({
        width: 667,
        height: 375,
        device: 'mobile',
        orientation: 'landscape'
      });

      eventHandler.setupEventListeners(mockCallback);
      eventHandler.handleOrientationChange();

      expect(mockDeviceDetector.getViewportInfo).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'orientationchange',
        viewportInfo: {
          width: 667,
          height: 375,
          device: 'mobile',
          orientation: 'landscape'
        }
      });
    });

    test('should handle orientation change with immediate and delayed callbacks', async () => {
      mockDeviceDetector.getViewportInfo.mockReturnValue({
        width: 667,
        height: 375,
        device: 'mobile',
        orientation: 'landscape'
      });

      eventHandler.setupEventListeners(mockCallback);
      
      eventHandler.handleOrientationChange();

      // Should call immediately
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenNthCalledWith(1, {
        type: 'orientationchange',
        viewportInfo: {
          width: 667,
          height: 375,
          device: 'mobile',
          orientation: 'landscape'
        }
      });

      // Wait for delayed callback
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have been called twice (immediate + delayed)
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(2, {
        type: 'orientationchange',
        viewportInfo: {
          width: 667,
          height: 375,
          device: 'mobile',
          orientation: 'landscape'
        },
        delayed: true
      });
    });
  });

  describe('Cleanup', () => {
    test('should remove event listeners on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      eventHandler.setupEventListeners(mockCallback);
      eventHandler.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });

    test('should clear callback on cleanup', () => {
      eventHandler.setupEventListeners(mockCallback);
      eventHandler.cleanup();

      expect(eventHandler.callback).toBeNull();
    });

    test('should clear timers on cleanup', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      eventHandler.setupEventListeners(mockCallback);
      eventHandler.handleResize(); // This sets a timeout
      eventHandler.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should accept custom options', () => {
      const customOptions = {
        debounceTimeout: 500,
        orientationDelay: 200,
        throttleTimeout: 400
      };
      
      const customEventHandler = new ResponsiveEventHandler(mockDeviceDetector, customOptions);
      const options = customEventHandler.getOptions();
      
      expect(options.debounceTimeout).toBe(500);
      expect(options.orientationDelay).toBe(200);
      expect(options.throttleTimeout).toBe(400);
    });

    test('should update options', () => {
      eventHandler.updateOptions({ debounceTimeout: 1000 });
      const options = eventHandler.getOptions();
      
      expect(options.debounceTimeout).toBe(1000);
      expect(options.orientationDelay).toBe(100); // Should keep default
    });
  });

  describe('Error Handling', () => {
    test('should handle missing callback gracefully', () => {
      expect(() => {
        eventHandler.setupEventListeners();
        eventHandler.handleResize();
      }).not.toThrow();
    });

    test('should handle invalid callback type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      eventHandler.setupEventListeners('not a function');
      
      expect(consoleSpy).toHaveBeenCalledWith('EventHandler: callback must be a function');
      
      consoleSpy.mockRestore();
    });

    test('should handle device detector errors', () => {
      mockDeviceDetector.getViewportInfo.mockImplementation(() => {
        throw new Error('Device detection failed');
      });

      eventHandler.setupEventListeners(mockCallback);
      
      expect(() => {
        eventHandler.handleResize();
      }).not.toThrow();
    });

    test('should handle orientation change errors', () => {
      mockDeviceDetector.getViewportInfo.mockImplementation(() => {
        throw new Error('Device detection failed');
      });

      eventHandler.setupEventListeners(mockCallback);
      
      expect(() => {
        eventHandler.handleOrientationChange();
      }).not.toThrow();
    });
  });
});