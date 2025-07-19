import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';
import ResponsiveChartAdapterMain from '../../../../../../src/features/charts/components/ResponsiveChartAdapter.js';

describe('Backward Compatibility', () => {
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