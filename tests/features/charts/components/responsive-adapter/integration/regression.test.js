import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';
import ResponsiveChartAdapterMain from '../../../../../../src/features/charts/components/ResponsiveChartAdapter.js';

describe('Comprehensive Regression Tests', () => {
  let adapter;
  let mainAdapter;
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