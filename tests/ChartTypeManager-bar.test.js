// tests/ChartTypeManager-bar.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ChartTypeManager from '../src/features/charts/components/ChartTypeManager.js';

// Mock Chart.js
const mockChart = {
  destroy: vi.fn(),
  update: vi.fn(),
  data: {
    labels: [],
    datasets: [{ data: [] }]
  },
  options: {}
};

const mockChartConstructor = vi.fn(() => mockChart);

describe('ChartTypeManager - Bar Chart', () => {
  let chartTypeManager;
  let mockContainer;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock DOM elements
    mockContext = {
      getContext: vi.fn(() => ({}))
    };
    
    mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: 400,
      height: 300
    };
    
    mockContainer = {
      innerHTML: '',
      clientWidth: 400,
      clientHeight: 300,
      appendChild: vi.fn()
    };
    
    // Mock document.createElement
    global.document = {
      createElement: vi.fn(() => mockCanvas)
    };
    
    // Initialize ChartTypeManager with mock Chart.js
    chartTypeManager = new ChartTypeManager(mockChartConstructor);
  });

  describe('Bar Chart Rendering', () => {
    it('should render bar chart with correct configuration', () => {
      const testData = [
        ['Diagnosi', 'Pazienti'],
        ['Influenza', 5],
        ['Polmonite', 3],
        ['Frattura', 2]
      ];

      const result = chartTypeManager.renderBarChart(mockContainer, testData);

      // Verify Chart.js was called
      expect(mockChartConstructor).toHaveBeenCalledTimes(1);
      
      // Get the chart configuration passed to Chart.js
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      // Verify chart type
      expect(chartConfig.type).toBe('bar');
      
      // Verify data structure
      expect(chartConfig.data.labels).toEqual(['Influenza', 'Polmonite', 'Frattura']);
      expect(chartConfig.data.datasets[0].data).toEqual([5, 3, 2]);
      expect(chartConfig.data.datasets[0].label).toBe('Valori');
      
      // Verify chart instance is returned
      expect(result).toBe(mockChart);
    });

    it('should include clear labels for each bar', () => {
      const testData = [
        ['Diagnosi', 'Count'],
        ['Diabete', 8],
        ['Ipertensione', 12],
        ['Asma', 4]
      ];

      chartTypeManager.renderBarChart(mockContainer, testData);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      // Verify labels are clear and present
      expect(chartConfig.data.labels).toEqual(['Diabete', 'Ipertensione', 'Asma']);
      expect(chartConfig.data.labels.length).toBe(3);
      
      // Verify tooltip configuration for clear labeling
      expect(chartConfig.options.plugins.tooltip).toBeDefined();
      expect(chartConfig.options.plugins.tooltip.callbacks).toBeDefined();
      expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeDefined();
    });

    it('should handle different data formats correctly', () => {
      // Test with object format
      const objectData = [
        { label: 'Cardiopatia', value: 6 },
        { label: 'Neurologia', value: 9 },
        { label: 'Ortopedia', value: 3 }
      ];

      chartTypeManager.renderBarChart(mockContainer, objectData);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      expect(chartConfig.data.labels).toEqual(['Cardiopatia', 'Neurologia', 'Ortopedia']);
      expect(chartConfig.data.datasets[0].data).toEqual([6, 9, 3]);
    });

    it('should support horizontal bar charts', () => {
      const testData = [
        ['Reparto', 'Pazienti'],
        ['Medicina', 15],
        ['Chirurgia', 8],
        ['Pediatria', 12]
      ];

      const options = { horizontal: true };
      
      chartTypeManager.renderBarChart(mockContainer, testData, options);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      // Verify horizontal configuration
      expect(chartConfig.options.indexAxis).toBe('y');
    });

    it('should include percentage information in tooltips', () => {
      const testData = [
        ['Diagnosi', 'Count'],
        ['A', 10],
        ['B', 20],
        ['C', 70] // Total = 100, so percentages should be 10%, 20%, 70%
      ];

      chartTypeManager.renderBarChart(mockContainer, testData);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
      
      // Mock context for tooltip
      const mockContext = {
        dataset: { 
          label: 'Valori',
          data: [10, 20, 70]
        },
        parsed: { y: 20 }, // Testing the second bar (20 out of 100)
        label: 'B'
      };

      const tooltipText = tooltipCallback(mockContext);
      
      // Should include percentage
      expect(tooltipText).toContain('20.0%');
      expect(tooltipText).toContain('Valori: 20');
    });

    it('should apply responsive scaling options', () => {
      const testData = [
        ['Test', 'Value'],
        ['Item1', 5]
      ];

      chartTypeManager.renderBarChart(mockContainer, testData);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      // Verify responsive options
      expect(chartConfig.options.responsive).toBe(true);
      expect(chartConfig.options.maintainAspectRatio).toBe(false);
    });

    it('should configure scales properly for bar charts', () => {
      const testData = [
        ['Category', 'Value'],
        ['Cat1', 100],
        ['Cat2', 200]
      ];

      chartTypeManager.renderBarChart(mockContainer, testData);
      
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      
      // Verify Y-axis starts at zero
      expect(chartConfig.options.scales.y.beginAtZero).toBe(true);
      
      // Verify X-axis has proper tick configuration
      expect(chartConfig.options.scales.x.ticks.maxRotation).toBe(45);
      expect(chartConfig.options.scales.x.ticks.autoSkip).toBe(true);
    });
  });

  describe('Chart Type Management', () => {
    it('should include bar chart in available chart types', () => {
      const availableTypes = chartTypeManager.getAvailableChartTypes();
      
      const barChart = availableTypes.find(type => type.id === 'bar');
      expect(barChart).toBeDefined();
      expect(barChart.name).toBe('Barre');
      expect(barChart.icon).toContain('fa-chart-bar');
    });

    it('should set chart type to bar successfully', () => {
      const result = chartTypeManager.setChartType('bar');
      
      expect(result).toBe(true);
      expect(chartTypeManager.currentType).toBe('bar');
    });

    it('should render bar chart when current type is bar', () => {
      chartTypeManager.setChartType('bar');
      
      const testData = [
        ['Test', 'Value'],
        ['A', 1],
        ['B', 2]
      ];

      chartTypeManager.renderChart(mockContainer, testData);
      
      // Verify bar chart renderer was used
      expect(mockChartConstructor).toHaveBeenCalledTimes(1);
      const chartConfig = mockChartConstructor.mock.calls[0][1];
      expect(chartConfig.type).toBe('bar');
    });
  });
});