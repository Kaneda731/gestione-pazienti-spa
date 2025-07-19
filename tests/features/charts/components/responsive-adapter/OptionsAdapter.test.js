import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptionsAdapter } from '../../../../../src/features/charts/components/responsive-adapter/OptionsAdapter.js';

describe('OptionsAdapter', () => {
  let optionsAdapter;
  let mockDeviceDetector;
  let baseOptions;

  beforeEach(() => {
    // Mock DeviceDetector
    mockDeviceDetector = {
      detectDevice: vi.fn()
    };

    optionsAdapter = new OptionsAdapter(mockDeviceDetector);

    // Base options for testing
    baseOptions = {
      plugins: {
        title: {
          display: true,
          text: 'Test Chart'
        }
      },
      interaction: {}
    };
  });

  describe('constructor', () => {
    it('should initialize with device detector', () => {
      expect(optionsAdapter.deviceDetector).toBe(mockDeviceDetector);
    });
  });

  describe('adaptOptions', () => {
    it('should adapt options for mobile when device is mobile', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('mobile');
      
      const adaptedOptions = optionsAdapter.adaptOptions(baseOptions);
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(12);
      expect(adaptedOptions.plugins.tooltip.mode).toBe('nearest');
      expect(adaptedOptions.maintainAspectRatio).toBe(false);
      expect(adaptedOptions.animation.duration).toBe(800);
    });

    it('should adapt options for tablet when device is tablet', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('tablet');
      
      const adaptedOptions = optionsAdapter.adaptOptions(baseOptions);
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      expect(adaptedOptions.plugins.tooltip.mode).toBe('index');
      expect(adaptedOptions.plugins.title.font.size).toBe(18);
    });

    it('should adapt options for desktop when device is desktop', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('desktop');
      
      const adaptedOptions = optionsAdapter.adaptOptions(baseOptions);
      
      expect(adaptedOptions.plugins.legend.position).toBe('right');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      expect(adaptedOptions.plugins.tooltip.mode).toBe('index');
      expect(adaptedOptions.plugins.title.font.size).toBe(20);
      expect(adaptedOptions.plugins.zoom).toBeDefined();
      expect(adaptedOptions.animation.duration).toBe(1000);
    });

    it('should use provided device parameter instead of detecting', () => {
      mockDeviceDetector.detectDevice.mockReturnValue('desktop');
      
      const adaptedOptions = optionsAdapter.adaptOptions(baseOptions, 'mobile');
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(12);
      expect(mockDeviceDetector.detectDevice).not.toHaveBeenCalled();
    });
  });

  describe('adaptMobileOptions', () => {
    it('should configure mobile-specific options', () => {
      const options = { plugins: {}, interaction: {} };
      const adaptedOptions = optionsAdapter.adaptMobileOptions(options);
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.align).toBe('center');
      expect(adaptedOptions.plugins.legend.labels.boxWidth).toBe(15);
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(12);
      expect(adaptedOptions.plugins.legend.labels.usePointStyle).toBe(true);
      
      expect(adaptedOptions.plugins.tooltip.mode).toBe('nearest');
      expect(adaptedOptions.plugins.tooltip.intersect).toBe(false);
      expect(adaptedOptions.plugins.tooltip.titleFont.size).toBe(14);
      expect(adaptedOptions.plugins.tooltip.bodyFont.size).toBe(13);
      
      expect(adaptedOptions.interaction.mode).toBe('nearest');
      expect(adaptedOptions.interaction.intersect).toBe(false);
      
      expect(adaptedOptions.maintainAspectRatio).toBe(false);
      expect(adaptedOptions.responsive).toBe(true);
      expect(adaptedOptions.animation.duration).toBe(800);
      expect(adaptedOptions.animation.easing).toBe('easeOutQuart');
    });

    it('should preserve existing tooltip callbacks', () => {
      const options = {
        plugins: {
          tooltip: {
            callbacks: {
              customCallback: vi.fn()
            }
          }
        },
        interaction: {}
      };
      
      const adaptedOptions = optionsAdapter.adaptMobileOptions(options);
      
      expect(adaptedOptions.plugins.tooltip.callbacks.customCallback).toBeDefined();
      expect(adaptedOptions.plugins.tooltip.callbacks.title).toBeDefined();
      expect(adaptedOptions.plugins.tooltip.callbacks.label).toBeDefined();
    });
  });

  describe('adaptTabletOptions', () => {
    it('should configure tablet-specific options', () => {
      const options = { plugins: {}, interaction: {} };
      const adaptedOptions = optionsAdapter.adaptTabletOptions(options);
      
      expect(adaptedOptions.plugins.legend.position).toBe('bottom');
      expect(adaptedOptions.plugins.legend.labels.boxWidth).toBe(18);
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      
      expect(adaptedOptions.plugins.title.font.size).toBe(18);
      expect(adaptedOptions.plugins.title.padding).toBe(25);
      
      expect(adaptedOptions.plugins.tooltip.mode).toBe('index');
      expect(adaptedOptions.plugins.tooltip.titleFont.size).toBe(15);
      expect(adaptedOptions.plugins.tooltip.bodyFont.size).toBe(14);
      
      expect(adaptedOptions.interaction.mode).toBe('index');
      expect(adaptedOptions.interaction.intersect).toBe(false);
    });
  });

  describe('adaptDesktopOptions', () => {
    it('should configure desktop-specific options', () => {
      const options = { plugins: {}, interaction: {} };
      const adaptedOptions = optionsAdapter.adaptDesktopOptions(options);
      
      expect(adaptedOptions.plugins.legend.position).toBe('right');
      expect(adaptedOptions.plugins.legend.align).toBe('start');
      expect(adaptedOptions.plugins.legend.labels.boxWidth).toBe(20);
      expect(adaptedOptions.plugins.legend.labels.font.size).toBe(14);
      
      expect(adaptedOptions.plugins.title.font.size).toBe(20);
      expect(adaptedOptions.plugins.title.padding).toBe(30);
      expect(adaptedOptions.plugins.title.display).toBe(true);
      
      expect(adaptedOptions.plugins.tooltip.mode).toBe('index');
      expect(adaptedOptions.plugins.tooltip.titleFont.size).toBe(16);
      expect(adaptedOptions.plugins.tooltip.bodyFont.size).toBe(14);
      
      expect(adaptedOptions.plugins.zoom).toBeDefined();
      expect(adaptedOptions.plugins.zoom.zoom.wheel.enabled).toBe(true);
      expect(adaptedOptions.plugins.zoom.pan.enabled).toBe(true);
      
      expect(adaptedOptions.animation.duration).toBe(1000);
      expect(adaptedOptions.animation.easing).toBe('easeOutQuart');
    });
  });

  describe('_cloneOptions', () => {
    it('should deep clone options successfully', () => {
      const options = {
        plugins: {
          title: { text: 'Test' }
        },
        interaction: { mode: 'index' }
      };
      
      const cloned = optionsAdapter._cloneOptions(options);
      
      expect(cloned).toEqual(options);
      expect(cloned).not.toBe(options);
      expect(cloned.plugins).not.toBe(options.plugins);
    });

    it('should fallback to shallow copy on JSON error', () => {
      const options = {
        plugins: {
          title: { text: 'Test' }
        },
        interaction: { mode: 'index' }
      };
      
      // Create circular reference to force JSON error
      options.circular = options;
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const cloned = optionsAdapter._cloneOptions(options);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error cloning chart options, using shallow copy:',
        expect.any(Error)
      );
      expect(cloned.plugins).toEqual(options.plugins);
      expect(cloned.interaction).toEqual(options.interaction);
      
      consoleSpy.mockRestore();
    });
  });

  describe('legend label generators', () => {
    let mockChart;

    beforeEach(() => {
      mockChart = {
        data: {
          labels: ['Label 1', 'Label 2'],
          datasets: [{
            backgroundColor: ['#FF6384', '#36A2EB'],
            borderColor: '#000'
          }]
        },
        getDatasetMeta: vi.fn(() => ({
          data: [
            { hidden: false },
            { hidden: true }
          ]
        }))
      };
    });

    it('should generate mobile legend labels', () => {
      const labels = optionsAdapter._generateMobileLegendLabels(mockChart);
      
      expect(labels).toHaveLength(2);
      expect(labels[0]).toEqual({
        text: 'Label 1',
        fillStyle: '#FF6384',
        strokeStyle: '#FF6384',
        lineWidth: 0,
        pointStyle: 'circle',
        hidden: false,
        index: 0
      });
    });

    it('should generate desktop legend labels with hidden state', () => {
      const labels = optionsAdapter._generateDesktopLegendLabels(mockChart);
      
      expect(labels).toHaveLength(2);
      expect(labels[0].hidden).toBe(false);
      expect(labels[1].hidden).toBe(true);
    });

    it('should handle single backgroundColor color', () => {
      mockChart.data.datasets[0].backgroundColor = '#FF6384';
      
      const labels = optionsAdapter._generateMobileLegendLabels(mockChart);
      
      expect(labels[0].fillStyle).toBe('#FF6384');
      expect(labels[1].fillStyle).toBe('#FF6384');
    });

    it('should fallback to borderColor when backgroundColor is not available', () => {
      mockChart.data.datasets[0].backgroundColor = null;
      
      const labels = optionsAdapter._generateMobileLegendLabels(mockChart);
      
      expect(labels[0].fillStyle).toBe('#000');
    });
  });

  describe('event handlers', () => {
    let mockEvent;
    let mockChart;

    beforeEach(() => {
      mockEvent = {
        native: {
          target: {
            style: {}
          }
        },
        chart: {
          data: {
            labels: ['Label 1'],
            datasets: [{
              data: [100],
              backgroundColor: ['#FF6384']
            }]
          }
        }
      };

      mockChart = {
        getDatasetMeta: vi.fn(() => ({
          data: [{ hidden: false }]
        })),
        update: vi.fn(),
        canvas: {
          parentNode: {
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(() => [])
          }
        }
      };
    });

    it('should handle mobile hover events', () => {
      const activeElements = [{ index: 0 }];
      
      // Mock navigator.vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(),
        writable: true
      });
      
      optionsAdapter._handleMobileHover(mockEvent, activeElements);
      
      expect(mockEvent.native.target.style.cursor).toBe('pointer');
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('should handle mobile click events', () => {
      const activeElements = [{ index: 0 }];
      
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(),
        writable: true
      });
      
      const dispatchEventSpy = vi.spyOn(document, 'dispatchEvent');
      
      optionsAdapter._handleMobileClick(mockEvent, activeElements);
      
      expect(navigator.vibrate).toHaveBeenCalledWith(20);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'showMobileDetail',
          detail: expect.objectContaining({
            label: 'Label 1',
            value: 100,
            color: '#FF6384'
          })
        })
      );
      
      dispatchEventSpy.mockRestore();
    });

    it('should handle legend click events', () => {
      const legendItem = { index: 0 };
      const legend = { chart: mockChart };
      
      optionsAdapter._handleMobileLegendClick({}, legendItem, legend);
      
      expect(mockChart.getDatasetMeta).toHaveBeenCalledWith(0);
      expect(mockChart.update).toHaveBeenCalled();
    });
  });
});