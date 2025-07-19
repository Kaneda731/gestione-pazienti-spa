import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';
import ResponsiveChartAdapterMain from '../../../../../../src/features/charts/components/ResponsiveChartAdapter.js';

describe('Module Integration', () => {
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