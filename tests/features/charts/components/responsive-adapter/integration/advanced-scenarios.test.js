import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveChartAdapter } from '../../../../../../src/features/charts/components/responsive-adapter/index.js';

describe('Advanced Integration Scenarios', () => {
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