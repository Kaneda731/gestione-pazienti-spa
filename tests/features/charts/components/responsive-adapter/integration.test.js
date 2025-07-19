import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../src/features/charts/components/responsive-adapter/index.js';
import ResponsiveChartAdapterMain from '../../../../../src/features/charts/components/ResponsiveChartAdapter.js';
import { DeviceDetector } from '../../../../../src/features/charts/components/responsive-adapter/DeviceDetector.js';
import { OptionsAdapter } from '../../../../../src/features/charts/components/responsive-adapter/OptionsAdapter.js';
import { ResponsiveEventHandler } from '../../../../../src/features/charts/components/responsive-adapter/EventHandler.js';

describe('ResponsiveChartAdapter Integration Tests', () => {
  let adapter;
  let mainAdapter;
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
    mainAdapter = new ResponsiveChartAdapterMain();
    mockCallback = vi.fn();
  });

  afterEach(() => {
    adapter.destroy();
    mainAdapter.destroy();
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

  describe('Module Integration', () => {
    test('should initialize all modules correctly', () => {
      expect(adapter.deviceDetector).toBeDefined();
      expect(adapter.optionsAdapter).toBeDefined();
      expect(adapter.eventHandler).toBeDefined();
      expect(typeof adapter.deviceDetector.detectDevice).toBe('function');
      expect(typeof adapter.optionsAdapter.adaptOptions).toBe('function');
      expect(typeof adapter.eventHandler.setupEventListeners).toBe('function');
    });

    test('should pass device detector to options adapter', () => {
      expect(adapter.optionsAdapter.deviceDetector).toBe(adapter.deviceDetector);
    });

    test('should pass device detector to event handler', () => {
      expect(adapter.eventHandler.deviceDetector).toBe(adapter.deviceDetector);
    });

    test('should use custom breakpoints across all modules', () => {
      const customBreakpoints = { mobile: 600, tablet: 900, desktop: 1200 };
      const customAdapter = new ResponsiveChartAdapter(customBreakpoints);
      
      expect(customAdapter.deviceDetector.breakpoints).toEqual(customBreakpoints);
      expect(customAdapter.optionsAdapter.deviceDetector.breakpoints).toEqual(customBreakpoints);
      expect(customAdapter.eventHandler.deviceDetector.breakpoints).toEqual(customBreakpoints);
      
      customAdapter.destroy();
    });
  });

  describe('Device Detection Integration', () => {
    test('should detect mobile device and adapt options accordingly', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });

      const options = {
        plugins: { title: { display: true, text: 'Test Chart' } },
        interaction: {}
      };

      const adaptedOptions = adapter.adaptOptions(options);
      
      expect(adapter.deviceDetector.detectDevice()).toBe('mobile');
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(12);
      expect(adaptedOptions.maintainAspectRatio).toBe(false);
    });

    test('should detect tablet device and adapt options accordingly', () => {
      // Set tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600
      });
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 0 }
      });
      delete window.ontouchstart;

      const options = {
        plugins: { title: { display: true, text: 'Test Chart' } },
        interaction: {}
      };

      const adaptedOptions = adapter.adaptOptions(options);
      
      expect(adapter.deviceDetector.detectDevice()).toBe('tablet');
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      expect(adaptedOptions.plugins.title.font.size).toBe(18);
    });

    test('should detect desktop device and adapt options accordingly', () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      const options = {
        plugins: { title: { display: true, text: 'Test Chart' } },
        interaction: {}
      };

      const adaptedOptions = adapter.adaptOptions(options);
      
      expect(adapter.deviceDetector.detectDevice()).toBe('desktop');
      expect(adaptedOptions.plugins.legend.position).toBe('right');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      expect(adaptedOptions.plugins.title.font.size).toBe(20);
      expect(adaptedOptions.plugins.zoom).toBeDefined();
    });
  });

  describe('Event Handling Integration', () => {
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

  describe('Backward Compatibility', () => {
    test('should maintain same API as original ResponsiveChartAdapter', () => {
      // Test that both adapters have the same public methods
      const adapterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(adapter));
      const mainAdapterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(mainAdapter));
      
      // Core methods that should exist in both
      const coreMethods = ['adaptOptions', 'getDeviceInfo', 'initialize', 'destroy'];
      
      coreMethods.forEach(method => {
        expect(adapterMethods).toContain(method);
        expect(mainAdapterMethods).toContain(method);
        expect(typeof adapter[method]).toBe('function');
        expect(typeof mainAdapter[method]).toBe('function');
      });
    });

    test('should produce same results as original adapter for mobile', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const options = {
        plugins: { title: { display: true, text: 'Test Chart' } },
        interaction: {}
      };

      const newAdapterResult = adapter.adaptOptions(options);
      const mainAdapterResult = mainAdapter.adaptOptions(options);
      
      // Both should detect mobile and apply similar adaptations
      expect(newAdapterResult.plugins.legend.position).toBe(mainAdapterResult.plugins.legend.position);
      expect(newAdapterResult.maintainAspectRatio).toBe(mainAdapterResult.maintainAspectRatio);
    });

    test('should produce same device info structure', () => {
      const newAdapterInfo = adapter.getDeviceInfo();
      const mainAdapterInfo = mainAdapter.getDeviceInfo();
      
      // Both should return objects with same structure
      expect(typeof newAdapterInfo).toBe(typeof mainAdapterInfo);
      expect(newAdapterInfo).toHaveProperty('width');
      expect(newAdapterInfo).toHaveProperty('height');
      expect(newAdapterInfo).toHaveProperty('deviceType');
      expect(mainAdapterInfo).toHaveProperty('width');
      expect(mainAdapterInfo).toHaveProperty('height');
      expect(mainAdapterInfo).toHaveProperty('devicePixelRatio');
    });
  });

  describe('Advanced Integration Scenarios', () => {
    test('should handle complete chart lifecycle with responsive changes', async () => {
      const lifecycleEvents = [];
      
      // Mock chart-like object
      const mockChart = {
        canvas: {
          parentNode: document.createElement('div')
        },
        data: {
          labels: ['Red', 'Blue', 'Yellow'],
          datasets: [{
            data: [300, 50, 100],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
          }]
        },
        options: {
          plugins: { title: { display: true, text: 'Test Chart' } },
          interaction: {}
        },
        update: vi.fn(() => {
          lifecycleEvents.push('chart_updated');
        }),
        destroy: vi.fn(() => {
          lifecycleEvents.push('chart_destroyed');
        })
      };

      // Initialize adapter with chart lifecycle tracking
      adapter.initialize((eventData) => {
        lifecycleEvents.push(`event_${eventData.type}`);
        
        // Simulate chart update on device change
        if (eventData.type === 'resize') {
          const newOptions = adapter.adaptOptions(mockChart.options);
          mockChart.options = { ...mockChart.options, ...newOptions };
          mockChart.update();
        }
      });

      // Start with mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      let adaptedOptions = adapter.adaptOptions(mockChart.options);
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      lifecycleEvents.push('initial_mobile_adapt');

      // Trigger resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      adapter.eventHandler.handleResize();

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify chart was updated
      expect(mockChart.update).toHaveBeenCalled();
      expect(lifecycleEvents).toContain('event_resize');
      expect(lifecycleEvents).toContain('chart_updated');

      // Verify final options are desktop-optimized
      adaptedOptions = adapter.adaptOptions(mockChart.options);
      expect(adaptedOptions.plugins.legend.position).toBe('right');
    });

    test('should maintain data integrity across module interactions', () => {
      const testData = {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [{
          data: [10, 20, 30, 40],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
      };

      const originalOptions = {
        plugins: { 
          title: { display: true, text: 'Data Integrity Test' },
          legend: { display: true }
        },
        interaction: { mode: 'index' }
      };

      // Test data integrity across different devices
      const devices = ['mobile', 'tablet', 'desktop'];
      const results = [];

      devices.forEach(deviceType => {
        // Set viewport for device
        const viewports = {
          mobile: 375,
          tablet: 800,
          desktop: 1200
        };

        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewports[deviceType]
        });

        const adaptedOptions = adapter.adaptOptions(originalOptions);
        const deviceInfo = adapter.getDeviceInfo();

        results.push({
          device: deviceType,
          detectedDevice: adapter.deviceDetector.detectDevice(),
          legendPosition: adaptedOptions.plugins.legend.position,
          titleDisplay: adaptedOptions.plugins.title.display,
          interactionMode: adaptedOptions.interaction.mode,
          viewportWidth: deviceInfo.width
        });
      });

      // Verify data integrity
      expect(results).toHaveLength(3);
      expect(results[0].device).toBe('mobile');
      expect(results[0].detectedDevice).toBe('mobile');
      expect(results[0].legendPosition).toBe('bottom');
      
      expect(results[1].device).toBe('tablet');
      expect(results[1].detectedDevice).toBe('tablet');
      expect(results[1].legendPosition).toBe('bottom');
      
      expect(results[2].device).toBe('desktop');
      expect(results[2].detectedDevice).toBe('desktop');
      expect(results[2].legendPosition).toBe('right');

      // All should maintain title display
      results.forEach(result => {
        expect(result.titleDisplay).toBe(true);
      });
    });

    test('should handle custom breakpoints correctly', () => {
      // Create adapter with custom breakpoints
      const customBreakpoints = { mobile: 500, tablet: 800, desktop: 1000 };
      const customAdapter = new ResponsiveChartAdapter(customBreakpoints);

      // Test functionality with custom breakpoints
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });

      const options = customAdapter.adaptOptions({ plugins: {}, interaction: {} });
      expect(customAdapter.deviceDetector.detectDevice()).toBe('tablet');
      expect(options.plugins.legend.position).toBe('bottom');

      // Test event handler initialization
      const mockCallback = vi.fn();
      customAdapter.initialize(mockCallback);
      expect(customAdapter.isInitialized).toBe(true);

      // Cleanup
      customAdapter.destroy();
    });
  });

  describe('Comprehensive Regression Tests', () => {
    test('should maintain all original ResponsiveChartAdapter functionality', () => {
      // Test all public methods exist and return expected types
      const publicMethods = [
        'adaptOptions',
        'getDeviceInfo', 
        'initialize',
        'destroy'
      ];

      publicMethods.forEach(method => {
        expect(typeof adapter[method]).toBe('function');
        expect(typeof mainAdapter[method]).toBe('function');
      });

      // Test adaptOptions returns object
      const options = adapter.adaptOptions({ plugins: {}, interaction: {} });
      expect(typeof options).toBe('object');
      expect(options.plugins).toBeDefined();

      // Test getDeviceInfo returns object with expected properties
      const deviceInfo = adapter.getDeviceInfo();
      expect(typeof deviceInfo).toBe('object');
      expect(deviceInfo).toHaveProperty('width');
      expect(deviceInfo).toHaveProperty('height');
      expect(deviceInfo).toHaveProperty('deviceType');
      expect(deviceInfo).toHaveProperty('orientation');
    });

    test('should produce consistent results across multiple calls', () => {
      const testOptions = {
        plugins: { title: { display: true, text: 'Consistency Test' } },
        interaction: {}
      };

      // Set fixed viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      // Call adaptOptions multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(adapter.adaptOptions(testOptions));
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.plugins.legend.position).toBe(firstResult.plugins.legend.position);
        expect(result.plugins.legend.labels.font.size).toBe(firstResult.plugins.legend.labels.font.size);
        expect(result.plugins.title.font.size).toBe(firstResult.plugins.title.font.size);
      });
    });

    test('should handle edge cases without breaking', () => {
      // Test with null/undefined options
      expect(() => adapter.adaptOptions(null)).not.toThrow();
      expect(() => adapter.adaptOptions(undefined)).not.toThrow();
      expect(() => adapter.adaptOptions({})).not.toThrow();

      // Test with malformed options
      const malformedOptions = {
        plugins: null,
        interaction: undefined,
        invalidProperty: 'test'
      };
      expect(() => adapter.adaptOptions(malformedOptions)).not.toThrow();

      // Test with extreme viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1
      });
      expect(() => adapter.adaptOptions({ plugins: {}, interaction: {} })).not.toThrow();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 10000
      });
      expect(() => adapter.adaptOptions({ plugins: {}, interaction: {} })).not.toThrow();
    });

    test('should maintain performance characteristics', () => {
      const testOptions = {
        plugins: { title: { display: true, text: 'Performance Test' } },
        interaction: {}
      };

      // Measure time for multiple adaptations
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        adapter.adaptOptions(testOptions);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 100 adaptations in reasonable time (less than 100ms)
      expect(totalTime).toBeLessThan(100);
    });

    test('should handle concurrent operations safely', async () => {
      const results = [];
      const promises = [];

      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        const promise = new Promise(resolve => {
          setTimeout(() => {
            const options = adapter.adaptOptions({
              plugins: { title: { display: true, text: `Test ${i}` } },
              interaction: {}
            });
            results.push(options);
            resolve(options);
          }, Math.random() * 10);
        });
        promises.push(promise);
      }

      // Wait for all operations to complete
      await Promise.all(promises);

      // All operations should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.plugins).toBeDefined();
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle DeviceDetector errors by propagating them', () => {
      // Mock DeviceDetector to throw error
      const originalDetectDevice = adapter.deviceDetector.detectDevice;
      adapter.deviceDetector.detectDevice = vi.fn(() => {
        throw new Error('Device detection failed');
      });

      // Should propagate the error (current implementation doesn't have error handling)
      expect(() => {
        adapter.adaptOptions({ plugins: {}, interaction: {} });
      }).toThrow('Device detection failed');

      // Restore original method
      adapter.deviceDetector.detectDevice = originalDetectDevice;
    });

    test('should handle OptionsAdapter errors by propagating them', () => {
      // Mock OptionsAdapter to throw error
      const originalAdaptOptions = adapter.optionsAdapter.adaptOptions;
      adapter.optionsAdapter.adaptOptions = vi.fn(() => {
        throw new Error('Options adaptation failed');
      });

      // Should propagate the error (current implementation doesn't have error handling)
      expect(() => {
        adapter.adaptOptions({ plugins: {}, interaction: {} });
      }).toThrow('Options adaptation failed');

      // Restore original method
      adapter.optionsAdapter.adaptOptions = originalAdaptOptions;
    });

    test('should handle EventHandler errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      // Should not crash when callback throws error (EventHandler has error handling)
      expect(() => {
        adapter.initialize(errorCallback);
        adapter.eventHandler.handleResize();
      }).not.toThrow();
    });
  });

  describe('Memory Management and Cleanup', () => {
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
});