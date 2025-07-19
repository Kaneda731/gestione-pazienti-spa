import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ResponsiveChartAdapter from '../../../../../src/features/charts/components/ResponsiveChartAdapter.js';

describe('ResponsiveChartAdapter Basic Tests', () => {
  let adapter;
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    adapter = new ResponsiveChartAdapter();
  });

  afterEach(() => {
    if (adapter && typeof adapter.destroy === 'function') {
      adapter.destroy();
    }
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
  });

  test('should initialize correctly', () => {
    expect(adapter).toBeDefined();
  });

  test('should have required methods', () => {
    expect(typeof adapter.adaptOptions).toBe('function');
    expect(typeof adapter.adaptLayout).toBe('function');
    expect(typeof adapter.handleResize).toBe('function');
  });

  test('should adapt options based on device', () => {
    const options = {
      plugins: { title: { display: true, text: 'Test Chart' } },
      interaction: {}
    };

    const adaptedOptions = adapter.adaptOptions(options);
    expect(adaptedOptions).toBeDefined();
    expect(adaptedOptions.plugins).toBeDefined();
  });
});