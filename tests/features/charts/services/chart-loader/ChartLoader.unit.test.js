import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChartLoader } from '../../../../../src/features/charts/services/chart-loader/ChartLoader.js';

describe('ChartLoader Unit Tests', () => {
  let chartLoader;

  beforeEach(() => {
    // Mock document and window
    global.document = {
      createElement: vi.fn((tag) => ({
        tag,
        src: '',
        async: true,
        crossOrigin: '',
        onload: null,
        onerror: null,
        parentNode: {
          removeChild: vi.fn(),
        },
      })),
      head: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    global.window = {
      Chart: null,
    };

    chartLoader = new ChartLoader({
      version: '4.3.3',
      maxRetries: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    chartLoader.cleanup();
  });

  it('should load Chart.js successfully', async () => {
    const script = { onload: null };
    document.createElement.mockReturnValue(script);

    const loadPromise = chartLoader.load();

    // Simulate successful script load
    setTimeout(() => {
      global.window.Chart = vi.fn();
      script.onload();
    }, 50);

    const Chart = await loadPromise;

    expect(Chart).toBeDefined();
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(document.head.appendChild).toHaveBeenCalled();
  });

  it('should handle Chart.js loading error and retry', async () => {
    const script = { onerror: null, onload: null };
    document.createElement.mockReturnValue(script);

    const loadPromise = chartLoader.load();

    // Simulate script load error
    setTimeout(() => script.onerror(new Error('Network Error')), 50);

    // After the first error, simulate a successful load
    setTimeout(() => {
        global.window.Chart = vi.fn();
        script.onload();
    }, 200);

    const Chart = await loadPromise;

    expect(Chart).toBeDefined();
    expect(document.createElement).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const script = { onerror: null };
    document.createElement.mockReturnValue(script);

    const loadPromise = chartLoader.load();

    // Simulate script load error multiple times
    setTimeout(() => script.onerror(new Error('Network Error')), 50);
    setTimeout(() => script.onerror(new Error('Network Error')), 200);

    await expect(loadPromise).rejects.toThrow('Impossibile caricare Chart.js dopo 2 tentativi');
  });

  it('should use cached Chart.js instance if already loaded', async () => {
    const mockChart = vi.fn();
    chartLoader.chartJsRef = mockChart;

    const Chart1 = await chartLoader.load();
    const Chart2 = await chartLoader.load();

    expect(Chart1).toBe(mockChart);
    expect(Chart2).toBe(mockChart);
    expect(document.createElement).not.toHaveBeenCalledWith('script');
  });

  it('should prefetch Chart.js', () => {
    chartLoader.prefetch();
    expect(document.createElement).toHaveBeenCalledWith('link');
  });
});
