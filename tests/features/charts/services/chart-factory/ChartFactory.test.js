/**
 * Test per ChartFactory Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChartFactory } from '../../../../../src/features/charts/services/chart-factory/ChartFactory.js';

// Mock delle dipendenze
const mockChartLoader = {
  load: vi.fn(),
  getLoadStats: vi.fn(() => ({
    isLoaded: true,
    isLoading: false,
    loadAttempts: 1,
    version: '4.3.3'
  }))
};

const mockConfigManager = {
  createConfig: vi.fn(),
  updateConfig: vi.fn(),
  getAvailableThemes: vi.fn(() => ['light', 'dark'])
};

const mockExportService = {
  exportAsImage: vi.fn()
};

// Mock di Chart.js
const mockChartInstance = {
  update: vi.fn(),
  destroy: vi.fn(),
  toBase64Image: vi.fn(),
  canvas: {
    parentNode: {
      removeChild: vi.fn()
    }
  },
  config: {
    type: 'pie',
    data: { labels: [], datasets: [] },
    options: {}
  },
  data: { labels: [], datasets: [] },
  options: {}
};

const MockChart = vi.fn(() => mockChartInstance);

// Mock del DOM
const mockContainer = {
  nodeType: 1,
  innerHTML: '',
  appendChild: vi.fn(),
  tagName: 'DIV',
  id: 'test-container'
};

const mockCanvas = {
  style: {},
  parentNode: mockContainer
};

const mockDocument = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') return mockCanvas;
    return { style: {} };
  }),
  body: {}
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock di MutationObserver
const mockMutationObserver = vi.fn();
mockMutationObserver.prototype.observe = vi.fn();
mockMutationObserver.prototype.disconnect = vi.fn();

// Setup globali
global.document = mockDocument;
global.window = mockWindow;
global.MutationObserver = mockMutationObserver;

describe('ChartFactory', () => {
  let chartFactory;

  beforeEach(() => {
    chartFactory = new ChartFactory(mockChartLoader, mockConfigManager, mockExportService);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockChartLoader.load.mockResolvedValue(MockChart);
    mockConfigManager.createConfig.mockReturnValue({
      type: 'pie',
      data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] },
      options: { responsive: true }
    });
    mockConfigManager.updateConfig.mockReturnValue({
      type: 'pie',
      data: { labels: ['C', 'D'], datasets: [{ data: [3, 4] }] },
      options: { responsive: true }
    });
  });

  afterEach(() => {
    chartFactory.destroyAllCharts();
  });

  describe('Costruttore', () => {
    it('dovrebbe inizializzare con dipendenze', () => {
      const factory = new ChartFactory(mockChartLoader, mockConfigManager);
      
      expect(factory.chartLoader).toBe(mockChartLoader);
      expect(factory.configManager).toBe(mockConfigManager);
      expect(factory.activeCharts).toBeInstanceOf(Map);
      expect(factory.chartCounter).toBe(0);
    });

    it('dovrebbe inizializzare con exportService opzionale', () => {
      const factory = new ChartFactory(mockChartLoader, mockConfigManager, mockExportService);
      
      expect(factory.exportService).toBe(mockExportService);
    });
  });

  describe('createChart()', () => {
    const testData = [['A', 10], ['B', 20]];

    it('dovrebbe creare un grafico con successo', async () => {
      const chart = await chartFactory.createChart(mockContainer, 'pie', testData);

      expect(mockChartLoader.load).toHaveBeenCalled();
      expect(mockConfigManager.createConfig).toHaveBeenCalledWith('pie', testData, expect.any(Object));
      expect(MockChart).toHaveBeenCalled();
      expect(chart).toBe(mockChartInstance);
      expect(chart._factoryId).toBeDefined();
      expect(chartFactory.activeCharts.size).toBe(1);
    });

    it('dovrebbe validare gli input', async () => {
      // Container non valido
      await expect(chartFactory.createChart(null, 'pie', testData))
        .rejects.toThrow('Container non valido');

      // Tipo non valido
      await expect(chartFactory.createChart(mockContainer, null, testData))
        .rejects.toThrow('Tipo di grafico non valido');

      // Dati non validi
      await expect(chartFactory.createChart(mockContainer, 'pie', 'invalid'))
        .rejects.toThrow('Dati non validi');
    });

    it('dovrebbe gestire dati vuoti con warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await chartFactory.createChart(mockContainer, 'pie', []);

      expect(consoleSpy).toHaveBeenCalledWith('Dati vuoti forniti per il grafico');
      consoleSpy.mockRestore();
    });

    it('dovrebbe gestire errori di caricamento', async () => {
      const error = new Error('Caricamento fallito');
      mockChartLoader.load.mockRejectedValue(error);

      await expect(chartFactory.createChart(mockContainer, 'pie', testData))
        .rejects.toThrow('Caricamento fallito');

      expect(mockContainer.innerHTML).toContain('Errore');
    });

    it('dovrebbe applicare opzioni personalizzate', async () => {
      const customOptions = { animation: false };
      
      await chartFactory.createChart(mockContainer, 'pie', testData, customOptions);

      expect(mockConfigManager.createConfig).toHaveBeenCalledWith(
        'pie',
        testData,
        expect.objectContaining(customOptions)
      );
    });

    it('dovrebbe preparare il canvas correttamente', async () => {
      await chartFactory.createChart(mockContainer, 'pie', testData);

      expect(mockDocument.createElement).toHaveBeenCalledWith('canvas');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockCanvas);
      expect(mockCanvas.style.maxWidth).toBe('100%');
    });
  });

  describe('updateChart()', () => {
    let chartInstance;

    beforeEach(async () => {
      chartInstance = await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
    });

    it('dovrebbe aggiornare grafico con nuovi dati', async () => {
      const newData = [['B', 20]];
      
      const result = await chartFactory.updateChart(chartInstance, newData);

      expect(mockConfigManager.updateConfig).toHaveBeenCalledWith(
        chartInstance.config,
        newData,
        {}
      );
      expect(chartInstance.update).toHaveBeenCalledWith('active');
      expect(result).toBe(chartInstance);
    });

    it('dovrebbe aggiornare grafico con nuove opzioni', async () => {
      const newOptions = { animation: false };
      
      await chartFactory.updateChart(chartInstance, null, newOptions);

      expect(mockConfigManager.updateConfig).toHaveBeenCalledWith(
        chartInstance.config,
        null,
        newOptions
      );
    });

    it('dovrebbe gestire istanza non valida', async () => {
      await expect(chartFactory.updateChart(null))
        .rejects.toThrow('Istanza del grafico non valida');

      await expect(chartFactory.updateChart({}))
        .rejects.toThrow('Istanza del grafico non valida');
    });

    it('dovrebbe gestire grafico non nel registry', async () => {
      const orphanChart = { ...mockChartInstance, _factoryId: 'nonexistent' };
      
      await expect(chartFactory.updateChart(orphanChart))
        .rejects.toThrow('Grafico non trovato nel registry');
    });
  });

  describe('destroyChart()', () => {
    let chartInstance;

    beforeEach(async () => {
      chartInstance = await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
    });

    it('dovrebbe distruggere grafico con successo', () => {
      const result = chartFactory.destroyChart(chartInstance);

      expect(result).toBe(true);
      expect(chartInstance.destroy).toHaveBeenCalled();
      expect(chartFactory.activeCharts.size).toBe(0);
    });

    it('dovrebbe gestire istanza null', () => {
      const result = chartFactory.destroyChart(null);

      expect(result).toBe(false);
    });

    it('dovrebbe pulire il canvas dal DOM', () => {
      chartFactory.destroyChart(chartInstance);

      expect(mockCanvas.parentNode.removeChild).toHaveBeenCalledWith(mockCanvas);
    });

    it('dovrebbe gestire errori nella distruzione', () => {
      mockChartInstance.destroy.mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      const result = chartFactory.destroyChart(chartInstance);

      expect(result).toBe(false);
    });
  });

  describe('getActiveCharts()', () => {
    it('dovrebbe restituire array vuoto inizialmente', () => {
      const charts = chartFactory.getActiveCharts();

      expect(Array.isArray(charts)).toBe(true);
      expect(charts.length).toBe(0);
    });

    it('dovrebbe restituire informazioni sui grafici attivi', async () => {
      await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
      await chartFactory.createChart(mockContainer, 'bar', [['B', 20]]);

      const charts = chartFactory.getActiveCharts();

      expect(charts.length).toBe(2);
      expect(charts[0]).toHaveProperty('id');
      expect(charts[0]).toHaveProperty('type');
      expect(charts[0]).toHaveProperty('created');
      expect(charts[0].container).toContain('DIV#test-container');
    });
  });

  describe('destroyAllCharts()', () => {
    it('dovrebbe distruggere tutti i grafici attivi', async () => {
      await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
      await chartFactory.createChart(mockContainer, 'bar', [['B', 20]]);

      expect(chartFactory.activeCharts.size).toBe(2);

      const destroyedCount = chartFactory.destroyAllCharts();

      expect(destroyedCount).toBe(2);
      expect(chartFactory.activeCharts.size).toBe(0);
    });
  });

  describe('exportChart()', () => {
    let chartInstance;

    beforeEach(async () => {
      chartInstance = await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
    });

    it('dovrebbe esportare grafico se exportService disponibile', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockExportService.exportAsImage.mockResolvedValue(mockBlob);

      const result = await chartFactory.exportChart(chartInstance, 'png', { title: 'Test' });

      expect(mockExportService.exportAsImage).toHaveBeenCalledWith(
        chartInstance,
        'png',
        { title: 'Test' }
      );
      expect(result).toBe(mockBlob);
    });

    it('dovrebbe lanciare errore se exportService non disponibile', async () => {
      const factoryWithoutExport = new ChartFactory(mockChartLoader, mockConfigManager);
      
      await expect(factoryWithoutExport.exportChart(chartInstance))
        .rejects.toThrow('ExportService non disponibile');
    });

    it('dovrebbe validare istanza del grafico', async () => {
      await expect(chartFactory.exportChart(null))
        .rejects.toThrow('Istanza del grafico non valida');

      await expect(chartFactory.exportChart({}))
        .rejects.toThrow('Istanza del grafico non valida');
    });
  });

  describe('getStats()', () => {
    it('dovrebbe restituire statistiche complete', async () => {
      await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);

      const stats = chartFactory.getStats();

      expect(stats).toHaveProperty('activeChartsCount', 1);
      expect(stats).toHaveProperty('totalChartsCreated', 1);
      expect(stats).toHaveProperty('loaderStats');
      expect(stats).toHaveProperty('availableThemes');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats.memoryUsage).toHaveProperty('activeCharts', 1);
    });
  });

  describe('Metodi enhanced dell\'istanza', () => {
    let chartInstance;

    beforeEach(async () => {
      chartInstance = await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);
    });

    it('dovrebbe aggiungere metodo getInfo', () => {
      expect(typeof chartInstance.getInfo).toBe('function');
      
      const info = chartInstance.getInfo();
      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('type', 'pie');
      expect(info).toHaveProperty('created');
    });

    it('dovrebbe aggiungere metodo destroyChart', () => {
      expect(typeof chartInstance.destroyChart).toBe('function');
      
      const result = chartInstance.destroyChart();
      expect(result).toBe(true);
    });

    it('dovrebbe aggiungere metodo exportAsImage se exportService disponibile', () => {
      expect(typeof chartInstance.exportAsImage).toBe('function');
    });
  });

  describe('Cleanup automatico', () => {
    it('dovrebbe configurare MutationObserver per cleanup', async () => {
      await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);

      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockMutationObserver.prototype.observe).toHaveBeenCalledWith(
        document.body,
        { childList: true, subtree: true }
      );
    });

    it('dovrebbe configurare listener beforeunload', async () => {
      await chartFactory.createChart(mockContainer, 'pie', [['A', 10]]);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });
  });
});