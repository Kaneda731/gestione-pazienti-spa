/**
 * Test per ChartLoader Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChartLoader } from '../../../../../src/features/charts/services/chart-loader/ChartLoader.js';

// Mock del DOM
const mockDocument = {
  createElement: vi.fn(),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

const mockWindow = {
  Chart: null,
  performance: {
    now: vi.fn(() => Date.now())
  },
  setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
  requestIdleCallback: vi.fn((fn) => setTimeout(fn, 0))
};

// Mock globali
global.document = mockDocument;
global.window = mockWindow;
global.performance = mockWindow.performance;
global.setTimeout = mockWindow.setTimeout;

describe('ChartLoader', () => {
  let chartLoader;
  let mockScript;

  beforeEach(() => {
    chartLoader = new ChartLoader();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock script element
    mockScript = {
      src: '',
      async: false,
      crossOrigin: '',
      onload: null,
      onerror: null,
      parentNode: {
        removeChild: vi.fn()
      }
    };
    
    mockDocument.createElement.mockReturnValue(mockScript);
    mockWindow.Chart = null;
  });

  afterEach(() => {
    chartLoader.cleanup();
  });

  describe('Costruttore', () => {
    it('dovrebbe inizializzare con configurazione di default', () => {
      const loader = new ChartLoader();
      
      expect(loader.chartJsVersion).toBe('4.3.3');
      expect(loader.maxRetries).toBe(3);
      expect(loader.retryDelay).toBe(1000);
      expect(loader.isLoaded()).toBe(false);
      expect(loader.isLoading()).toBe(false);
    });

    it('dovrebbe accettare configurazione personalizzata', () => {
      const config = {
        version: '4.4.0',
        maxRetries: 5,
        retryDelay: 2000,
        cdn: 'https://custom-cdn.com/chart.js'
      };
      
      const loader = new ChartLoader(config);
      
      expect(loader.chartJsVersion).toBe('4.4.0');
      expect(loader.maxRetries).toBe(5);
      expect(loader.retryDelay).toBe(2000);
      expect(loader.chartJsCdn).toBe('https://custom-cdn.com/chart.js');
    });
  });

  describe('prefetch()', () => {
    it('dovrebbe creare un link di prefetch', () => {
      const mockLink = {
        rel: '',
        href: '',
        as: ''
      };
      mockDocument.createElement.mockReturnValue(mockLink);

      chartLoader.prefetch();

      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('prefetch');
      expect(mockLink.href).toContain('chart.js');
      expect(mockLink.as).toBe('script');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink);
    });

    it('non dovrebbe creare prefetch duplicati', () => {
      chartLoader.prefetch();
      chartLoader.prefetch();

      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });

    it('non dovrebbe fare prefetch se Chart.js è già caricato', () => {
      chartLoader.chartJsRef = {};
      chartLoader.prefetch();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });
  });

  describe('preload()', () => {
    it('dovrebbe creare un link di preload', () => {
      const mockLink = {
        rel: '',
        href: '',
        as: '',
        crossOrigin: ''
      };
      mockDocument.createElement.mockReturnValue(mockLink);

      chartLoader.preload();

      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.href).toContain('chart.js');
      expect(mockLink.as).toBe('script');
      expect(mockLink.crossOrigin).toBe('anonymous');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink);
    });

    it('non dovrebbe creare preload duplicati', () => {
      chartLoader.preload();
      chartLoader.preload();

      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('load()', () => {
    it('dovrebbe restituire Chart.js se già caricato', async () => {
      const mockChart = { version: '4.3.3' };
      chartLoader.chartJsRef = mockChart;

      const result = await chartLoader.load();

      expect(result).toBe(mockChart);
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('dovrebbe caricare Chart.js con successo', async () => {
      const mockChart = { version: '4.3.3' };
      mockWindow.Chart = mockChart;

      const loadPromise = chartLoader.load();

      // Simula il caricamento riuscito
      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toContain('chart.js');
      expect(mockScript.async).toBe(true);
      expect(mockScript.crossOrigin).toBe('anonymous');

      // Simula onload
      mockScript.onload();

      const result = await loadPromise;
      expect(result).toBe(mockChart);
      expect(chartLoader.isLoaded()).toBe(true);
    });

    it('dovrebbe gestire errori di caricamento con retry', async () => {
      let attemptCount = 0;
      
      // Mock setTimeout per controllare i retry
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn, delay) => {
        attemptCount++;
        if (attemptCount === 1) {
          // Primo retry - simula ancora errore
          setTimeout(() => fn(), 10);
        } else {
          // Secondo retry - simula successo
          mockWindow.Chart = { version: '4.3.3' };
          setTimeout(() => fn(), 10);
        }
        return originalSetTimeout(fn, delay);
      });

      // Configura il mock script per simulare errore iniziale
      let scriptCallCount = 0;
      mockDocument.createElement.mockImplementation((tag) => {
        if (tag === 'script') {
          scriptCallCount++;
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
            if (scriptCallCount === 1) {
              // Primo tentativo fallisce
              if (script.onerror) script.onerror(new Error('Network error'));
            } else {
              // Retry ha successo
              if (script.onload) script.onload();
            }
          }, 5);
          
          return script;
        }
        return mockScript;
      });

      const result = await chartLoader.load();
      expect(result).toBe(mockWindow.Chart);
      
      global.setTimeout = originalSetTimeout;
    });

    it('dovrebbe fallire dopo il numero massimo di retry', async () => {
      chartLoader.maxRetries = 1;
      
      const loadPromise = chartLoader.load();

      // Simula errore
      mockScript.onerror(new Error('Network error'));

      await expect(loadPromise).rejects.toThrow('Impossibile caricare Chart.js dopo 1 tentativi');
    });

    it('dovrebbe restituire la stessa promise per caricamenti concorrenti', () => {
      const promise1 = chartLoader.load();
      const promise2 = chartLoader.load();

      expect(promise1).toEqual(promise2);
    });
  });

  describe('isLoaded() e isLoading()', () => {
    it('dovrebbe restituire false inizialmente', () => {
      expect(chartLoader.isLoaded()).toBe(false);
      expect(chartLoader.isLoading()).toBe(false);
    });

    it('dovrebbe restituire true per isLoading durante il caricamento', () => {
      chartLoader.load();
      
      expect(chartLoader.isLoading()).toBe(true);
      expect(chartLoader.isLoaded()).toBe(false);
    });

    it('dovrebbe restituire true per isLoaded dopo il caricamento', () => {
      chartLoader.chartJsRef = { version: '4.3.3' };
      
      expect(chartLoader.isLoaded()).toBe(true);
      expect(chartLoader.isLoading()).toBe(false);
    });
  });

  describe('getLoadStats()', () => {
    it('dovrebbe restituire statistiche corrette', () => {
      const stats = chartLoader.getLoadStats();

      expect(stats).toEqual({
        isLoaded: false,
        isLoading: false,
        loadAttempts: 0,
        version: '4.3.3',
        cdn: expect.stringContaining('chart.js')
      });
    });
  });

  describe('cleanup()', () => {
    it('dovrebbe pulire tutte le risorse', () => {
      // Setup
      chartLoader.chartJsRef = { version: '4.3.3' };
      chartLoader.chartJsLoadPromise = Promise.resolve();
      chartLoader.loadAttempts = 2;
      
      const mockPrefetchLink = {};
      const mockPreloadLink = {};
      chartLoader.prefetchLink = mockPrefetchLink;
      chartLoader.preloadLink = mockPreloadLink;

      // Cleanup
      chartLoader.cleanup();

      // Verifica
      expect(chartLoader.chartJsRef).toBeNull();
      expect(chartLoader.chartJsLoadPromise).toBeNull();
      expect(chartLoader.loadAttempts).toBe(0);
      expect(chartLoader.prefetchLink).toBeNull();
      expect(chartLoader.preloadLink).toBeNull();
      expect(mockDocument.head.removeChild).toHaveBeenCalledWith(mockPrefetchLink);
      expect(mockDocument.head.removeChild).toHaveBeenCalledWith(mockPreloadLink);
    });
  });
});