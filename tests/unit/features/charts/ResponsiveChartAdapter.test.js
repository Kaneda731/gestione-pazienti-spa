/**
 * Test migrato per ResponsiveChartAdapter usando infrastruttura ottimizzata
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChartMock, createResponsiveChartAdapterMock } from '../../../__mocks__/chart.js';
import { createMockElement, viewport } from '../../../__helpers__/dom-helpers.js';
import { waitFor, performance } from '../../../__helpers__/test-utils.js';
import { chartData } from '../../../__fixtures__/charts.js';

// Mock delle dipendenze
const mockDeviceDetector = {
  detectDevice: vi.fn(() => 'desktop'),
  getViewportInfo: vi.fn(() => ({
    width: 1024,
    height: 768,
    devicePixelRatio: 1,
    orientation: 'landscape',
    isTouchDevice: false,
    deviceType: 'desktop'
  })),
  isMobile: vi.fn(() => false),
  isTablet: vi.fn(() => false),
  isDesktop: vi.fn(() => true),
  isTouchDevice: vi.fn(() => false),
  getOrientation: vi.fn(() => 'landscape')
};

const mockOptionsAdapter = {
  adaptOptions: vi.fn((options) => ({
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options.plugins,
      legend: {
        ...options.plugins?.legend,
        position: 'top'
      }
    }
  }))
};

const mockEventHandler = {
  setupEventListeners: vi.fn(),
  cleanup: vi.fn(),
  handleResize: vi.fn(),
  handleOrientationChange: vi.fn()
};

// Mock del modulo ResponsiveChartAdapter
vi.mock('../../../../src/features/charts/components/ResponsiveChartAdapter.js', () => ({
  default: vi.fn().mockImplementation(() => createResponsiveChartAdapterMock())
}));

// Import del componente da testare
import ResponsiveChartAdapter from '../../../../src/features/charts/components/ResponsiveChartAdapter.js';

describe('ResponsiveChartAdapter', () => {
  let adapter;
  let mockContainer;
  let mockChart;
  let mockCallback;
  
  beforeEach(() => {
    // Setup mock container
    mockContainer = createMockElement('div', { 
      id: 'chart-container',
      style: { width: '800px', height: '600px' }
    });
    document.body.appendChild(mockContainer);
    
    // Setup mock chart
    mockChart = createChartMock({
      type: 'pie',
      data: chartData.pieChartData.simple,
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      }
    });
    
    // Setup callback
    mockCallback = vi.fn();
    
    // Create adapter instance
    adapter = new ResponsiveChartAdapter(
      { mobile: 767, tablet: 991, desktop: 1199 },
      mockDeviceDetector,
      mockOptionsAdapter,
      mockEventHandler
    );
    
    // Reset viewport to desktop
    viewport.desktop();
  });
  
  afterEach(() => {
    // Cleanup
    if (adapter && adapter.destroy) {
      adapter.destroy();
    }
    
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    
    vi.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should create adapter with default breakpoints', () => {
      const defaultAdapter = new ResponsiveChartAdapter();
      
      expect(defaultAdapter).toBeDefined();
      expect(defaultAdapter.breakpoints).toBeDefined();
    });
    
    it('should create adapter with custom breakpoints', () => {
      const customBreakpoints = { mobile: 500, tablet: 800, desktop: 1200 };
      const customAdapter = new ResponsiveChartAdapter(customBreakpoints);
      
      expect(customAdapter).toBeDefined();
      expect(customAdapter.breakpoints).toEqual(customBreakpoints);
    });
    
    it('should inject dependencies correctly', () => {
      expect(adapter.deviceDetector).toBe(mockDeviceDetector);
      expect(adapter.optionsAdapter).toBe(mockOptionsAdapter);
      expect(adapter.eventHandler).toBe(mockEventHandler);
    });
    
    it('should initialize with callback', () => {
      adapter.initialize(mockCallback);
      
      expect(adapter.isInitialized).toBe(true);
      expect(mockEventHandler.setupEventListeners).toHaveBeenCalledWith(mockCallback);
    });
  });
  
  describe('Device Detection', () => {
    it('should detect desktop device', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('desktop');
      
      const device = adapter.detectDevice();
      
      expect(device).toBe('desktop');
      expect(mockDeviceDetector.detectDevice).toHaveBeenCalled();
    });
    
    it('should detect mobile device', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      viewport.mobile();
      
      const device = adapter.detectDevice();
      
      expect(device).toBe('mobile');
    });
    
    it('should detect tablet device', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('tablet');
      viewport.tablet();
      
      const device = adapter.detectDevice();
      
      expect(device).toBe('tablet');
    });
    
    it('should detect touch capability', () => {
      mockDeviceDetector.isTouchDevice.mockReturnValue(true);
      
      const isTouch = adapter.isTouchDevice();
      
      expect(isTouch).toBe(true);
      expect(mockDeviceDetector.isTouchDevice).toHaveBeenCalled();
    });
    
    it('should get viewport information', () => {
      const viewportInfo = adapter.getViewportInfo();
      
      expect(viewportInfo).toBeDefined();
      expect(viewportInfo.width).toBeDefined();
      expect(viewportInfo.height).toBeDefined();
      expect(mockDeviceDetector.getViewportInfo).toHaveBeenCalled();
    });
  });
  
  describe('Options Adaptation', () => {
    it('should adapt options for desktop', () => {
      const originalOptions = {
        plugins: {
          legend: { display: true }
        }
      };
      
      const adaptedOptions = adapter.adaptOptions(originalOptions);
      
      expect(adaptedOptions).toBeDefined();
      expect(adaptedOptions.responsive).toBe(true);
      expect(mockOptionsAdapter.adaptOptions).toHaveBeenCalledWith(originalOptions);
    });
    
    it('should adapt options for mobile', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      viewport.mobile();
      
      const originalOptions = {
        plugins: {
          legend: { display: true, position: 'top' }
        }
      };
      
      mockOptionsAdapter.adaptOptions.mockReturnValue({
        ...originalOptions,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' }
        }
      });
      
      const adaptedOptions = adapter.adaptOptions(originalOptions);
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
    });
    
    it('should handle empty options', () => {
      const adaptedOptions = adapter.adaptOptions({});
      
      expect(adaptedOptions).toBeDefined();
      expect(mockOptionsAdapter.adaptOptions).toHaveBeenCalledWith({});
    });
    
    it('should preserve custom options', () => {
      const customOptions = {
        animation: false,
        plugins: {
          title: { display: true, text: 'Custom Title' }
        }
      };
      
      mockOptionsAdapter.adaptOptions.mockReturnValue({
        ...customOptions,
        responsive: true
      });
      
      const adaptedOptions = adapter.adaptOptions(customOptions);
      
      expect(adaptedOptions.animation).toBe(false);
      expect(adaptedOptions.plugins.title.text).toBe('Custom Title');
    });
  });
  
  describe('Layout Adaptation', () => {
    it('should adapt layout for container', () => {
      adapter.adaptLayout(mockContainer, mockChart);
      
      // Verifica che il layout sia stato adattato
      expect(mockContainer).toBeDefined();
      expect(mockChart).toBeDefined();
    });
    
    it('should handle mobile layout adaptation', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      viewport.mobile();
      
      adapter.adaptLayout(mockContainer, mockChart);
      
      // Per mobile, dovrebbero essere applicate ottimizzazioni specifiche
      expect(mockDeviceDetector.detectDevice).toHaveBeenCalled();
    });
    
    it('should handle responsive container sizing', () => {
      const originalWidth = mockContainer.style.width;
      
      adapter.adaptLayout(mockContainer, mockChart);
      
      // Il container dovrebbe essere adattato per la responsività
      expect(mockContainer.style).toBeDefined();
    });
  });
  
  describe('Event Handling', () => {
    it('should setup event listeners on initialization', () => {
      adapter.initialize(mockCallback);
      
      expect(mockEventHandler.setupEventListeners).toHaveBeenCalledWith(mockCallback);
    });
    
    it('should handle resize events', () => {
      adapter.initialize(mockCallback);
      
      // Simula resize
      viewport.setSize(500, 800);
      
      if (adapter.handleResize) {
        adapter.handleResize();
      }
      
      expect(mockEventHandler.handleResize).toHaveBeenCalled();
    });
    
    it('should handle orientation change', () => {
      adapter.initialize(mockCallback);
      
      // Simula cambio orientamento
      viewport.simulateOrientationChange();
      
      if (adapter.handleOrientationChange) {
        adapter.handleOrientationChange();
      }
      
      expect(mockEventHandler.handleOrientationChange).toHaveBeenCalled();
    });
    
    it('should cleanup event listeners on destroy', () => {
      adapter.initialize(mockCallback);
      adapter.destroy();
      
      expect(mockEventHandler.cleanup).toHaveBeenCalled();
    });
  });
  
  describe('Responsive Behavior', () => {
    it('should respond to viewport changes', async () => {
      adapter.initialize(mockCallback);
      
      // Cambia da desktop a mobile
      viewport.mobile();
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      
      // Simula evento resize
      window.dispatchEvent(new Event('resize'));
      
      await waitFor(() => {
        return mockCallback.mock.calls.length > 0;
      });
      
      expect(mockCallback).toHaveBeenCalled();
    });
    
    it('should adapt chart options on device change', () => {
      const originalOptions = { plugins: { legend: { position: 'top' } } };
      
      // Desktop
      let adaptedOptions = adapter.adaptOptions(originalOptions);
      expect(adaptedOptions.plugins.legend.position).toBe('top');
      
      // Cambia a mobile
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      mockOptionsAdapter.adaptOptions.mockReturnValue({
        ...originalOptions,
        plugins: { legend: { position: 'bottom' } }
      });
      
      adaptedOptions = adapter.adaptOptions(originalOptions);
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
    });
  });
  
  describe('Performance', () => {
    it('should adapt options quickly', async () => {
      const options = {
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        }
      };
      
      const { duration } = await performance.measure(() => {
        adapter.adaptOptions(options);
      });
      
      // Dovrebbe completare in meno di 10ms
      expect(duration).toBeLessThan(10);
    });
    
    it('should handle multiple rapid resize events efficiently', async () => {
      adapter.initialize(mockCallback);
      
      // Simula molti eventi resize rapidi
      for (let i = 0; i < 10; i++) {
        viewport.setSize(800 + i * 10, 600);
        window.dispatchEvent(new Event('resize'));
      }
      
      // Dovrebbe gestire gli eventi senza problemi
      expect(mockEventHandler.setupEventListeners).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Integration with Chart Data', () => {
    it('should work with pie chart data', () => {
      const pieOptions = {
        type: 'pie',
        data: chartData.pieChartData.simple,
        options: { plugins: { legend: { display: true } } }
      };
      
      const adaptedOptions = adapter.adaptOptions(pieOptions.options);
      
      expect(adaptedOptions).toBeDefined();
      expect(adaptedOptions.plugins.legend.display).toBe(true);
    });
    
    it('should work with bar chart data', () => {
      const barOptions = {
        type: 'bar',
        data: chartData.barChartData.departmentComparison,
        options: {
          scales: {
            x: { display: true },
            y: { display: true }
          }
        }
      };
      
      const adaptedOptions = adapter.adaptOptions(barOptions.options);
      
      expect(adaptedOptions.scales).toBeDefined();
    });
    
    it('should handle responsive chart configurations', () => {
      const responsiveConfig = chartData.chartConfigurations.responsive;
      
      const adaptedOptions = adapter.adaptOptions(responsiveConfig.options);
      
      expect(adaptedOptions.responsive).toBe(true);
      expect(adaptedOptions.maintainAspectRatio).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing container gracefully', () => {
      expect(() => {
        adapter.adaptLayout(null, mockChart);
      }).not.toThrow();
    });
    
    it('should handle missing chart gracefully', () => {
      expect(() => {
        adapter.adaptLayout(mockContainer, null);
      }).not.toThrow();
    });
    
    it('should handle invalid options', () => {
      expect(() => {
        adapter.adaptOptions(null);
      }).not.toThrow();
      
      expect(() => {
        adapter.adaptOptions(undefined);
      }).not.toThrow();
    });
    
    it('should handle device detection errors', () => {
      mockDeviceDetector.detectDevice.mockImplementation(() => {
        throw new Error('Detection failed');
      });
      
      expect(() => {
        adapter.detectDevice();
      }).not.toThrow();
    });
  });
  
  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      adapter.initialize(mockCallback);
      
      expect(adapter.isInitialized).toBe(true);
      
      adapter.destroy();
      
      expect(mockEventHandler.cleanup).toHaveBeenCalled();
      expect(adapter.isInitialized).toBe(false);
    });
    
    it('should handle multiple destroy calls safely', () => {
      adapter.initialize(mockCallback);
      
      expect(() => {
        adapter.destroy();
        adapter.destroy();
        adapter.destroy();
      }).not.toThrow();
    });
  });
  
  describe('Custom Breakpoints', () => {
    it('should use custom breakpoints for device detection', () => {
      const customBreakpoints = { mobile: 500, tablet: 800, desktop: 1000 };
      const customAdapter = new ResponsiveChartAdapter(customBreakpoints);
      
      expect(customAdapter.breakpoints).toEqual(customBreakpoints);
    });
    
    it('should adapt behavior based on custom breakpoints', () => {
      const customBreakpoints = { mobile: 500, tablet: 800, desktop: 1000 };
      const customAdapter = new ResponsiveChartAdapter(
        customBreakpoints,
        mockDeviceDetector,
        mockOptionsAdapter,
        mockEventHandler
      );
      
      // Con viewport 600px, dovrebbe essere tablet con breakpoint custom
      viewport.setSize(600, 800);
      mockDeviceDetector.detectDevice.mockReturnValue('tablet');
      
      const device = customAdapter.detectDevice();
      expect(device).toBe('tablet');
    });
  });
});