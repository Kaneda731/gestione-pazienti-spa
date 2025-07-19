import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';

describe('Error Recovery and Resilience', () => {
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