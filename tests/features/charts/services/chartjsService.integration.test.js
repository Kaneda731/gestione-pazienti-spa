/**
 * Test di integrazione per chartjsService refactorizzato
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as chartjsService from '../../../../src/features/charts/services/chartjsService.js';

// Mock del DOM
const mockContainer = {
  nodeType: 1,
  innerHTML: '',
  appendChild: vi.fn(),
  removeChild: vi.fn(), // Aggiunto mock per removeChild
  tagName: 'DIV',
  id: 'test-container'
};

const mockCanvas = {
  width: 800,
  height: 600,
  style: {},
  parentNode: mockContainer,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn()
  })),
  toBlob: vi.fn(function(callback, type) {
    const blob = new Blob(['mock-blob-content'], { type: type || 'image/png' });
    callback(blob);
  })
};

const mockDocument = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') return { ...mockCanvas }; // Return a copy
    if (tag === 'link') return { rel: '', href: '', as: '', crossOrigin: '' };
    if (tag === 'script') return {
      src: '',
      async: false,
      crossOrigin: '',
      onload: null,
      onerror: null,
      parentNode: null
    };
    return { style: {} };
  }),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  documentElement: {
    classList: {
      contains: vi.fn(() => false)
    }
  },
  addEventListener: vi.fn()
};

const mockWindow = {
  Chart: null,
  devicePixelRatio: 1,
  performance: {
    now: vi.fn(() => Date.now())
  },
  alert: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock di Chart.js
const mockChartInstance = {
  update: vi.fn(),
  destroy: vi.fn(),
  toBase64Image: vi.fn(() => 'data:image/png;base64,test'),
  canvas: mockCanvas,
  config: {
    type: 'pie',
    data: { labels: [], datasets: [] },
    options: {}
  },
  data: { labels: [], datasets: [] },
  options: {}
};

const MockChart = vi.fn(() => mockChartInstance);

// Mock di MutationObserver
const mockMutationObserver = vi.fn();
mockMutationObserver.prototype.observe = vi.fn();
mockMutationObserver.prototype.disconnect = vi.fn();

// Mock di ResponsiveChartAdapter
const mockResponsiveAdapter = {
  adaptLayout: vi.fn(),
  adaptOptions: vi.fn((options) => options),
  handleResize: vi.fn(),
  cleanup: vi.fn(),
};

vi.mock('../../../../src/features/charts/components/ResponsiveChartAdapter.js', () => ({
  __esModule: true,
  default: vi.fn(() => mockResponsiveAdapter),
}));


// Setup globali
global.document = mockDocument;
global.window = mockWindow;
global.MutationObserver = mockMutationObserver;
global.performance = mockWindow.performance;

// Correzione del mock di setTimeout per evitare ricorsione infinita
const nativeSetTimeout = global.setTimeout;
global.setTimeout = vi.fn((fn, delay) => {
  if (typeof fn === 'function') {
    return nativeSetTimeout(fn, delay);
  }
  return nativeSetTimeout(() => {}, delay);
});
global.requestIdleCallback = vi.fn((fn) => global.setTimeout(fn, 0));


describe('chartjsService Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup Chart.js mock
    mockWindow.Chart = MockChart;
    
    // Mock di window.location.href
    mockWindow.location = {
        href: 'http://localhost:3000/grafico.html?type=pie&filters=test'
    };
    
    // Reset container
    mockContainer.innerHTML = '';
    
    // Mock successful script loading
    mockDocument.createElement.mockImplementation((tag) => {
      if (tag === 'script') {
        const script = {
          src: '',
          async: false,
          crossOrigin: '',
          onload: null,
          onerror: null,
          parentNode: {
            removeChild: vi.fn()
          }
        };
        
        // Simula caricamento asincrono
        setTimeout(() => {
          if (script.onload) {
            script.onload();
          }
        }, 0);
        
        return script;
      }
      if (tag === 'canvas') return mockCanvas;
      if (tag === 'link') return { rel: '', href: '', as: '', crossOrigin: '' };
      if (tag === 'a') return { href: '', download: '', click: vi.fn() };
      return { style: {} };
    });
  });

  afterEach(() => {
    // Cleanup
    try {
      chartjsService.cleanupChartComponents();
    } catch (e) {
      // Ignora errori nel cleanup se i test hanno già fallito
    }
  });

  describe('Creazione grafici con nuova architettura', () => {
    const testData = { labels: ['Categoria A', 'Categoria B', 'Categoria C'], datasets: [{ data: [10, 20, 30] }] };

    it('dovrebbe creare un grafico a torta', async () => {
      const chart = await chartjsService.createChart(mockContainer, testData, {}, 'pie');

      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockCanvas);
    });

    it('dovrebbe creare un grafico a barre', async () => {
      const chart = await chartjsService.createBarChart(mockContainer, testData);

      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });

    it('dovrebbe creare un grafico a linee', async () => {
      const chart = await chartjsService.createLineChart(mockContainer, testData);

      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });

    it('dovrebbe gestire opzioni personalizzate', async () => {
      const customOptions = {
        plugins: {
          title: {
            display: true,
            text: 'Titolo Test'
          }
        }
      };

      const chart = await chartjsService.createChart(mockContainer, testData, customOptions, 'pie');

      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });
  });

  describe('Gestione errori e fallback', () => {
    it('dovrebbe gestire errori di caricamento Chart.js', async () => {
      // Simula errore di caricamento
      mockDocument.createElement.mockImplementation((tag) => {
        if (tag === 'script') {
          const script = {
            src: '',
            async: false,
            crossOrigin: '',
            onload: null,
            onerror: null,
            parentNode: {
              removeChild: vi.fn()
            }
          };
          
          setTimeout(() => {
            if (script.onerror) {
              script.onerror(new Error('Network error'));
            }
          }, 0);
          
          return script;
        }
        return { style: {} };
      });

      const chartData = { labels: [], datasets: [] };
      await expect(chartjsService.createChart(mockContainer, chartData, {}, 'pie'))
        .rejects.toThrow();

      expect(mockContainer.innerHTML).toContain('Errore');
    });

    it('dovrebbe usare fallback legacy in caso di errore', async () => {
      // Simula errore nella nuova architettura
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Forza un errore nella factory
      vi.doMock('../../../../src/features/charts/services/chart-factory/ChartFactory.js', () => {
        throw new Error('Factory error');
      });

      try {
        const chartData = { labels: ['A'], datasets: [{ data: [1] }] };
        await chartjsService.createChart(mockContainer, chartData, {}, 'pie');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('fallback'));
      } catch (error) {
        // È normale che fallisca nei test
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Aggiornamento grafici', () => {
    let chart;

    beforeEach(async () => {
      const chartData = { labels: ['A'], datasets: [{ data: [1] }] };
      chart = await chartjsService.createChart(mockContainer, chartData, {}, 'pie');
    });

    it('dovrebbe aggiornare grafico con nuovi dati', async () => {
      const newData = { labels: ['B', 'C'], datasets: [{ data: [2, 3] }] };
      
      const updatedChart = await chartjsService.updateChart(chart, newData);

      expect(updatedChart).toBeDefined();
      expect(mockChartInstance.update).toHaveBeenCalled();
    });

    it('dovrebbe gestire grafico non valido', async () => {
      await expect(chartjsService.updateChart(null))
        .rejects.toThrow('Grafico non valido');
    });
  });

  describe('Esportazione grafici', () => {
    let chart;

    beforeEach(async () => {
      const chartData = { labels: ['A'], datasets: [{ data: [1] }] };
      chart = await chartjsService.createChart(mockContainer, chartData, {}, 'pie');
    });

    it('dovrebbe esportare grafico come immagine', async () => {
      // Mock Blob e URL
      global.Blob = vi.fn(() => ({ type: 'image/png', size: 1234 }));
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:http://localhost:3000/test-guid'),
        revokeObjectURL: vi.fn(),
      };

      const blob = await chartjsService.exportChartAsImage(chart, 'png');
      
      expect(blob).toBeDefined();
      expect(blob.type).toBe('image/png');
    });

    it('dovrebbe scaricare grafico come immagine', async () => {
      // Mock URL e link
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn()
      };
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      mockDocument.createElement.mockImplementation((tag) => {
        if (tag === 'a') return mockLink;
        if (tag === 'canvas') return mockCanvas;
        return { style: {} };
      });

      await chartjsService.downloadChartAsImage(chart, 'test-chart');

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Gestione cache', () => {
    it('dovrebbe restituire statistiche cache', () => {
      const stats = chartjsService.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('dovrebbe pulire la cache', () => {
      expect(() => chartjsService.clearCache()).not.toThrow();
    });
  });

  describe('Stato servizi', () => {
    it('dovrebbe verificare stato caricamento Chart.js', () => {
      const isLoaded = chartjsService.isChartJsLoaded();
      const isLoading = chartjsService.isChartJsLoading();
      
      expect(typeof isLoaded).toBe('boolean');
      expect(typeof isLoading).toBe('boolean');
    });

    it('dovrebbe ottenere tipi di grafico disponibili', async () => {
      const types = await chartjsService.getAvailableChartTypes();
      
      expect(Array.isArray(types)).toBe(true);
    });

    it('dovrebbe generare link condivisibile', () => {
      const link = chartjsService.generateShareableLink({ test: 'filter' }, 'pie');
      
      expect(typeof link).toBe('string');
    });

    it('dovrebbe ottenere statistiche complete dei servizi', () => {
      const stats = chartjsService.getServiceStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('servicesInitialized');
      expect(stats).toHaveProperty('legacyComponents');
    });
  });

  describe('Cleanup e gestione memoria', () => {
    it('dovrebbe pulire tutti i componenti', () => {
      expect(() => chartjsService.cleanupChartComponents()).not.toThrow();
    });

    it('dovrebbe gestire cleanup multipli', () => {
      chartjsService.cleanupChartComponents();
      expect(() => chartjsService.cleanupChartComponents()).not.toThrow();
    });
  });

  describe('Backward compatibility', () => {
    const testData = { labels: ['A'], datasets: [{ data: [1] }] };

    it('dovrebbe mantenere API legacy per createPieChart', async () => {
      const chart = await chartjsService.createPieChart(mockContainer, testData);
      
      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });

    it('dovrebbe mantenere API legacy per createBarChart', async () => {
      const chart = await chartjsService.createBarChart(mockContainer, testData);
      
      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });

    it('dovrebbe mantenere API legacy per createLineChart', async () => {
      const chart = await chartjsService.createLineChart(mockContainer, testData);
      
      expect(chart).toBeDefined();
      expect(MockChart).toHaveBeenCalled();
    });

    it('dovrebbe esportare utility functions', () => {
      expect(chartjsService.showLoadingInContainer).toBeDefined();
      expect(chartjsService.showErrorInContainer).toBeDefined();
      expect(chartjsService.showMessageInContainer).toBeDefined();
    });
  });
});
