import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ResponsiveChartAdapter from '../src/features/charts/components/ResponsiveChartAdapter.js';
import { DeviceDetector } from '../src/features/charts/components/responsive-adapter/DeviceDetector.js';
import { OptionsAdapter } from '../src/features/charts/components/responsive-adapter/OptionsAdapter.js';
import { ResponsiveEventHandler } from '../src/features/charts/components/responsive-adapter/EventHandler.js';

describe('ResponsiveChartAdapter', () => {
  let adapter;
  let mockDeviceDetector;
  let mockOptionsAdapter;
  let mockEventHandler;
  let mockCallback;

  beforeEach(() => {
    // Create mock implementations for dependency injection
    mockDeviceDetector = {
      detectDevice: vi.fn().mockReturnValue('mobile'),
      getViewportInfo: vi.fn().mockReturnValue({
        width: 375,
        height: 667,
        devicePixelRatio: 2,
        orientation: 'portrait',
        isTouchDevice: true,
        deviceType: 'mobile'
      }),
      isMobile: vi.fn().mockReturnValue(true),
      isTablet: vi.fn().mockReturnValue(false),
      isDesktop: vi.fn().mockReturnValue(false),
      isTouchDevice: vi.fn().mockReturnValue(true),
      getOrientation: vi.fn().mockReturnValue('portrait')
    };

    mockOptionsAdapter = {
      adaptOptions: vi.fn().mockImplementation((options) => {
        return { ...options, adapted: true };
      })
    };

    mockEventHandler = {
      setupEventListeners: vi.fn(),
      cleanup: vi.fn()
    };

    mockCallback = vi.fn();

    // Create adapter with mocked dependencies
    adapter = new ResponsiveChartAdapter(
      { mobile: 767, tablet: 991, desktop: 1199 },
      mockDeviceDetector,
      mockOptionsAdapter,
      mockEventHandler
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with dependency injection', () => {
    expect(adapter.deviceDetector).toBe(mockDeviceDetector);
    expect(adapter.optionsAdapter).toBe(mockOptionsAdapter);
    expect(adapter.eventHandler).toBe(mockEventHandler);
  });

  test('should initialize without dependency injection', () => {
    const defaultAdapter = new ResponsiveChartAdapter();
    expect(defaultAdapter.deviceDetector).toBeInstanceOf(DeviceDetector);
    expect(defaultAdapter.optionsAdapter).toBeInstanceOf(OptionsAdapter);
    expect(defaultAdapter.eventHandler).toBeInstanceOf(ResponsiveEventHandler);
  });

  test('should delegate detectDevice to DeviceDetector', () => {
    const result = adapter.detectDevice();
    expect(mockDeviceDetector.detectDevice).toHaveBeenCalled();
    expect(result).toBe('mobile');
  });

  test('should delegate adaptOptions to OptionsAdapter', () => {
    const options = { foo: 'bar' };
    const result = adapter.adaptOptions(options);
    expect(mockDeviceDetector.detectDevice).toHaveBeenCalled();
    expect(mockOptionsAdapter.adaptOptions).toHaveBeenCalledWith(options, 'mobile');
    expect(result).toEqual({ foo: 'bar', adapted: true });
  });

  test('should delegate getDeviceInfo to DeviceDetector', () => {
    const result = adapter.getDeviceInfo();
    expect(mockDeviceDetector.getViewportInfo).toHaveBeenCalled();
    expect(result).toEqual({
      width: 375,
      height: 667,
      devicePixelRatio: 2,
      orientation: 'portrait',
      isTouchDevice: true,
      deviceType: 'mobile'
    });
  });

  test('should delegate isMobile to DeviceDetector', () => {
    const result = adapter.isMobile();
    expect(mockDeviceDetector.isMobile).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('should delegate isTablet to DeviceDetector', () => {
    const result = adapter.isTablet();
    expect(mockDeviceDetector.isTablet).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test('should delegate isDesktop to DeviceDetector', () => {
    const result = adapter.isDesktop();
    expect(mockDeviceDetector.isDesktop).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test('should delegate isTouchDevice to DeviceDetector', () => {
    const result = adapter.isTouchDevice();
    expect(mockDeviceDetector.isTouchDevice).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('should delegate getOrientation to DeviceDetector', () => {
    const result = adapter.getOrientation();
    expect(mockDeviceDetector.getOrientation).toHaveBeenCalled();
    expect(result).toBe('portrait');
  });

  test('should delegate initialize to EventHandler', () => {
    adapter.initialize(mockCallback);
    expect(mockEventHandler.setupEventListeners).toHaveBeenCalledWith(mockCallback);
    expect(adapter.isInitialized).toBe(true);
  });

  test('should not initialize twice', () => {
    adapter.initialize(mockCallback);
    adapter.initialize(mockCallback);
    expect(mockEventHandler.setupEventListeners).toHaveBeenCalledTimes(1);
  });

  test('should delegate destroy to EventHandler', () => {
    adapter.isInitialized = true;
    adapter.destroy();
    expect(mockEventHandler.cleanup).toHaveBeenCalled();
    expect(adapter.isInitialized).toBe(false);
  });

  test('should not destroy if not initialized', () => {
    adapter.isInitialized = false;
    adapter.destroy();
    expect(mockEventHandler.cleanup).not.toHaveBeenCalled();
  });

  test('should adapt layout based on device type', () => {
    const container = document.createElement('div');
    
    // Test mobile layout
    mockDeviceDetector.detectDevice.mockReturnValue('mobile');
    adapter.adaptLayout(container);
    expect(container.classList.contains('chart-mobile')).toBe(true);
    expect(container.style.minHeight).toBe('300px');
    expect(container.style.height).toBe('60vh');
    
    // Test tablet layout
    mockDeviceDetector.detectDevice.mockReturnValue('tablet');
    adapter.adaptLayout(container);
    expect(container.classList.contains('chart-tablet')).toBe(true);
    expect(container.style.minHeight).toBe('400px');
    expect(container.style.height).toBe('70vh');
    
    // Test desktop layout
    mockDeviceDetector.detectDevice.mockReturnValue('desktop');
    adapter.adaptLayout(container);
    expect(container.classList.contains('chart-desktop')).toBe(true);
    expect(container.style.minHeight).toBe('500px');
    expect(container.style.height).toBe('80vh');
  });

  test('should handle resize events', () => {
    const chart = {
      canvas: {
        parentNode: document.createElement('div')
      },
      options: {},
      update: vi.fn()
    };
    const options = { foo: 'bar' };
    
    adapter.handleResize(chart, options);
    
    expect(mockEventHandler.setupEventListeners).toHaveBeenCalled();
    expect(adapter.isInitialized).toBe(true);
    
    // Simulate event callback
    const callback = mockEventHandler.setupEventListeners.mock.calls[0][0];
    mockDeviceDetector.detectDevice.mockReturnValue('tablet'); // Change device type
    
    callback({
      viewportInfo: {
        deviceType: 'tablet'
      }
    });
    
    expect(mockOptionsAdapter.adaptOptions).toHaveBeenCalledWith(options, 'tablet');
    expect(chart.update).toHaveBeenCalled();
  });
});