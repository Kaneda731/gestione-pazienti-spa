import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';

describe('Device Detection Integration', () => {
  let adapter;
  let originalInnerWidth;
  let originalInnerHeight;
  let originalNavigator;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalNavigator = window.navigator;

    adapter = new ResponsiveChartAdapter();
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