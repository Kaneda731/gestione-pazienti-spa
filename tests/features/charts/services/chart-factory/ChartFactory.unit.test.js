import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartFactory } from '../../../../../src/features/charts/services/chart-factory/ChartFactory.js';

describe('ChartFactory Unit Tests', () => {
  let chartFactory;
  let mockChartLoader;
  let mockConfigManager;
  let mockExportService;
  let mockContainer;

  beforeEach(() => {
    const MockChart = vi.fn(() => ({
      update: vi.fn(),
      destroy: vi.fn(),
      toBase64Image: vi.fn(),
    }));

    mockChartLoader = {
      load: vi.fn(() => Promise.resolve(MockChart)),
    };

    mockConfigManager = {
      createConfig: vi.fn((type, data, options) => ({ type, data, options })),
      updateConfig: vi.fn((config, data, options) => ({...config, data, options})),
    };

    mockExportService = {
      exportAsImage: vi.fn(),
    };

    chartFactory = new ChartFactory(mockChartLoader, mockConfigManager, mockExportService);

    mockContainer = {
      nodeType: 1,
      innerHTML: '',
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    global.document = {
        createElement: vi.fn().mockReturnValue({
            getContext: vi.fn().mockReturnValue({}),
            style: {}
        }),
        body: {
            nodeType: 1,
            appendChild: vi.fn(),
            removeChild: vi.fn()
        }
    };

    global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    };

    global.MutationObserver = vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
    }));
  });

  it('should create a chart', async () => {
    const chartData = { labels: ['A'], datasets: [{ data: [10] }] };
    const chart = await chartFactory.createChart(mockContainer, 'pie', chartData, {});
    expect(chart).toBeDefined();
    expect(mockChartLoader.load).toHaveBeenCalled();
    expect(mockConfigManager.createConfig).toHaveBeenCalled();
    expect(mockContainer.appendChild).toHaveBeenCalled();
    expect(chartFactory.getActiveCharts().length).toBe(1);
  });

  it('should destroy a chart', async () => {
    const chartData = { labels: ['A'], datasets: [{ data: [10] }] };
    const chart = await chartFactory.createChart(mockContainer, 'pie', chartData, {});
    chartFactory.destroyChart(chart);
    expect(chart.destroy).toHaveBeenCalled();
    expect(chartFactory.getActiveCharts().length).toBe(0);
  });

  it('should update a chart', async () => {
    const chartData = { labels: ['A'], datasets: [{ data: [10] }] };
    const chart = await chartFactory.createChart(mockContainer, 'pie', chartData, {});
    const newData = { labels: ['C'], datasets: [{ data: [30] }] };
    await chartFactory.updateChart(chart, newData, {});
    expect(chart.update).toHaveBeenCalled();
  });

  it('should handle chart creation error', async () => {
    mockChartLoader.load.mockRejectedValue(new Error('Load error'));
    const chartData = { labels: ['A'], datasets: [{ data: [10] }] };
    await expect(chartFactory.createChart(mockContainer, 'pie', chartData, {})).rejects.toThrow('Load error');
    expect(mockContainer.innerHTML).toContain('Errore');
  });

  it('should export a chart', async () => {
    const chartData = { labels: ['A'], datasets: [{ data: [10] }] };
    const chart = await chartFactory.createChart(mockContainer, 'pie', chartData, {});
    await chartFactory.exportChart(chart, 'png', {});
    expect(mockExportService.exportAsImage).toHaveBeenCalled();
  });
});
