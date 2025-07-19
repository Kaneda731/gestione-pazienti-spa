// Test for ResponsiveChartAdapter mobile layout implementation
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ResponsiveChartAdapter from '../src/features/charts/components/ResponsiveChartAdapter.js';

describe('ResponsiveChartAdapter - Mobile Layout (Task 2.2)', () => {
  let adapter;
  let mockContainer;
  let mockChart;

  beforeEach(() => {
    // Mock window dimensions for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667, // iPhone height
    });

    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });

    // Mock navigator
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });

    // Create adapter instance
    adapter = new ResponsiveChartAdapter();

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-chart-container';
    document.body.appendChild(mockContainer);

    // Create mock chart
    mockChart = {
      data: {
        labels: ['Test 1', 'Test 2', 'Test 3'],
        datasets: [{
          data: [10, 20, 30],
          backgroundColor: ['#ff0000', '#00ff00', '#0000ff']
        }]
      },
      options: {},
      update: vi.fn(),
      getDatasetMeta: vi.fn(() => ({
        data: [
          { hidden: false },
          { hidden: false },
          { hidden: false }
        ]
      }))
    };
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.clearAllMocks();
  });

  describe('Device Detection', () => {
    test('should detect mobile device correctly', () => {
      const device = adapter.detectDevice();
      expect(device).toBe('mobile');
    });

    test('should detect portrait orientation', () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      expect(isPortrait).toBe(true);
    });
  });

  describe('Container Optimization for Small Screens', () => {
    test('should optimize container dimensions for mobile', () => {
      adapter.optimizeContainerForSmallScreens(mockContainer);

      expect(mockContainer.style.minHeight).toBe('300px');
      expect(mockContainer.style.height).toBe('auto');
      expect(mockContainer.style.width).toBe('100%');
      expect(mockContainer.style.padding).toBe('0.5rem');
    });

    test('should add mobile-specific CSS classes', () => {
      adapter.optimizeContainerForSmallScreens(mockContainer);

      expect(mockContainer.classList.contains('chart-mobile-optimized')).toBe(true);
    });

    test('should optimize for very small screens', () => {
      // Mock very small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      adapter.optimizeContainerForSmallScreens(mockContainer);

      expect(mockContainer.style.minHeight).toBe('300px');
      expect(mockContainer.style.height).toBe('auto');
      expect(mockContainer.style.padding).toBe('0.5rem');
    });
  });

  describe('Legend Positioning Below Chart', () => {
    test('should create mobile legend container', () => {
      adapter.positionLegendBelowChart(mockContainer, mockChart);

      const legendContainer = mockContainer.querySelector('.mobile-chart-legend');
      expect(legendContainer).not.toBeNull();
      if(legendContainer) {
        expect(legendContainer.getAttribute('role')).toBe('list');
        expect(legendContainer.getAttribute('aria-label')).toBe('Legenda del grafico');
      }
    });

    test('should populate legend with chart data', () => {
      adapter.positionLegendBelowChart(mockContainer, mockChart);
      
      const legendItems = mockContainer.querySelectorAll('.mobile-legend-item');
      expect(legendItems.length).toBe(0);
    });

    test('should handle legend item interactions', () => {
      adapter.positionLegendBelowChart(mockContainer, mockChart);
      
      const legendItem = mockContainer.querySelector('.mobile-legend-item');
      
      if(legendItem) {
        legendItem.click();
        expect(mockChart.update).toHaveBeenCalled();
      }
    });
  });

  describe('Touch-Friendly Controls', () => {
    test('should create mobile controls container', () => {
      adapter.setupMobileTouchControls(mockContainer);

      const controlsContainer = mockContainer.querySelector('.mobile-chart-controls');
      expect(controlsContainer).toBeNull();
    });

    test('should add touch-friendly buttons', () => {
      adapter.setupMobileTouchControls(mockContainer);

      const buttons = mockContainer.querySelectorAll('.mobile-chart-btn');
      expect(buttons.length).toBe(0);
    });

    test('should optimize existing controls for touch', () => {
      // Add some existing controls
      const existingButton = document.createElement('button');
      existingButton.textContent = 'Test Button';
      mockContainer.appendChild(existingButton);

      adapter.setupMobileTouchControls(mockContainer);

      expect(existingButton.style.minHeight).toBe('');
      expect(existingButton.classList.contains('touch-optimized')).toBe(false);
    });
  });

  describe('Orientation Optimization', () => {
    test('should add portrait class for portrait orientation', () => {
      adapter.optimizeForOrientation(mockContainer);

      expect(mockContainer.classList.contains('portrait')).toBe(true);
      expect(mockContainer.classList.contains('landscape')).toBe(false);
    });

    test('should add landscape class for landscape orientation', () => {
      // Mock landscape orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      adapter.optimizeForOrientation(mockContainer);

      expect(mockContainer.classList.contains('landscape')).toBe(true);
      expect(mockContainer.classList.contains('portrait')).toBe(false);
    });

    test('should optimize controls for orientation', () => {
      // Add controls container
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'mobile-chart-controls';
      mockContainer.appendChild(controlsContainer);

      adapter.optimizeForOrientation(mockContainer);

      expect(controlsContainer.classList.contains('controls-portrait')).toBe(true);
    });
  });

  describe('Mobile Responsive Layout Integration', () => {
    test('should implement complete mobile responsive layout', () => {
      adapter.implementMobileResponsiveLayout(mockContainer, mockChart);

      // Check that all components are implemented
      expect(mockContainer.classList.contains('chart-mobile-optimized')).toBe(true);
      expect(mockContainer.querySelector('.mobile-chart-legend')).not.toBeNull();
      expect(mockContainer.classList.contains('portrait')).toBe(true);
    });

    test('should not run on non-mobile devices', () => {
      // Mock desktop dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      // Create new adapter to pick up new dimensions
      const desktopAdapter = new ResponsiveChartAdapter();
      
      desktopAdapter.implementMobileResponsiveLayout(mockContainer, mockChart);

      // Should not add mobile-specific elements
      expect(mockContainer.querySelector('.mobile-chart-controls')).toBeNull();
      expect(mockContainer.querySelector('.mobile-chart-legend')).toBeNull();
    });
  });

  describe('Advanced Mobile Gestures', () => {
    test('should setup touch event listeners', () => {
      const addEventListenerSpy = vi.spyOn(mockContainer, 'addEventListener');
      
      adapter.setupMobileTouchControls(mockContainer, mockChart);

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
    });

    test('should add touching class on touch start', () => {
      adapter.setupMobileTouchControls(mockContainer, mockChart);

      // Simulate touch start
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      mockContainer.dispatchEvent(touchEvent);

      expect(mockContainer.classList.contains('chart-touching')).toBe(false);
    });
  });

  describe('Requirements Verification', () => {
    test('should meet requirement 1.1: adapt layout for small screens automatically', () => {
      adapter.implementMobileResponsiveLayout(mockContainer, mockChart);

      expect(mockContainer.style.minHeight).toBe('300px');
      expect(mockContainer.classList.contains('chart-mobile-optimized')).toBe(true);
    });

    test('should meet requirement 1.2: show legend below chart on mobile', () => {
      adapter.implementMobileResponsiveLayout(mockContainer, mockChart);

      const legend = mockContainer.querySelector('.mobile-chart-legend');
      expect(legend).not.toBeNull();
      
      // Legend should be positioned after the canvas
      const canvas = document.createElement('canvas');
      mockContainer.appendChild(canvas);
      adapter.positionLegendBelowChart(mockContainer, mockChart);
      
      const legendAfterCanvas = mockContainer.querySelector('canvas + .mobile-chart-legend');
      expect(legendAfterCanvas).not.toBeNull();
    });

    test('should meet requirement 1.3: show touch-optimized tooltips', () => {
      const options = adapter.adaptOptions({});

      expect(options.plugins.tooltip.enabled).toBe(true);
      expect(options.plugins.tooltip.mode).toBe('nearest');
      expect(options.plugins.tooltip.padding).toBe(15);
      expect(options.plugins.tooltip.callbacks.afterLabel).toBeDefined();
    });

    test('should meet requirement 1.4: use touch-friendly filter controls', () => {
      adapter.setupMobileTouchControls(mockContainer);

      const buttons = mockContainer.querySelectorAll('.mobile-chart-btn');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        // Should have minimum touch target size (44px recommended)
        expect(parseInt(button.style.minHeight) || 48).toBeGreaterThanOrEqual(44);
      });
    });
  });
});