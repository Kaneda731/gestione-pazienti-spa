/**
 * Test per ChartConfigManager Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartConfigManager } from '../../../../../src/features/charts/services/chart-config/ChartConfigManager.js';

// Mock del ResponsiveChartAdapter
const mockResponsiveAdapter = {
  adaptOptions: vi.fn((options) => ({
    ...options,
    responsive: true,
    maintainAspectRatio: false
  }))
};

// Mock del ThemeService
const mockThemeService = {
  getCurrentTheme: vi.fn(() => 'light')
};

// Mock del DOM
const mockDocument = {
  documentElement: {
    classList: {
      contains: vi.fn(() => false)
    }
  }
};

global.document = mockDocument;

describe('ChartConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ChartConfigManager(mockResponsiveAdapter, mockThemeService);
    vi.clearAllMocks();
  });

  describe('Costruttore', () => {
    it('dovrebbe inizializzare con configurazioni di base', () => {
      const manager = new ChartConfigManager();
      
      expect(manager.baseConfigs).toBeDefined();
      expect(manager.baseConfigs.pie).toBeDefined();
      expect(manager.baseConfigs.bar).toBeDefined();
      expect(manager.baseConfigs.line).toBeDefined();
      expect(manager.themeConfigs).toBeDefined();
      expect(manager.themeConfigs.light).toBeDefined();
      expect(manager.themeConfigs.dark).toBeDefined();
    });

    it('dovrebbe accettare dipendenze esterne', () => {
      const manager = new ChartConfigManager(mockResponsiveAdapter, mockThemeService);
      
      expect(manager.responsiveAdapter).toBe(mockResponsiveAdapter);
      expect(manager.themeService).toBe(mockThemeService);
    });
  });

  describe('createConfig()', () => {
    const testData = [
      ['Categoria A', 10],
      ['Categoria B', 20],
      ['Categoria C', 30]
    ];

    it('dovrebbe creare configurazione per grafico a torta', () => {
      const config = configManager.createConfig('pie', testData);

      expect(config.type).toBe('pie');
      expect(config.data.labels).toEqual(['Categoria A', 'Categoria B', 'Categoria C']);
      expect(config.data.datasets[0].data).toEqual([10, 20, 30]);
      expect(config.options.responsive).toBe(true);
      expect(config.options.maintainAspectRatio).toBe(false);
    });

    it('dovrebbe creare configurazione per grafico a barre', () => {
      const config = configManager.createConfig('bar', testData);

      expect(config.type).toBe('bar');
      expect(config.data.labels).toEqual(['Categoria A', 'Categoria B', 'Categoria C']);
      expect(config.data.datasets[0].data).toEqual([10, 20, 30]);
      expect(config.options.scales).toBeDefined();
      expect(config.options.scales.x).toBeDefined();
      expect(config.options.scales.y).toBeDefined();
    });

    it('dovrebbe creare configurazione per grafico a linee', () => {
      const config = configManager.createConfig('line', testData);

      expect(config.type).toBe('line');
      expect(config.data.datasets[0].fill).toBe(false);
      expect(config.data.datasets[0].tension).toBe(0.1);
      expect(config.options.elements.line.tension).toBe(0.1);
    });

    it('dovrebbe lanciare errore per tipo non supportato', () => {
      expect(() => {
        configManager.createConfig('unsupported', testData);
      }).toThrow('Tipo di grafico non supportato: unsupported');
    });

    it('dovrebbe applicare opzioni personalizzate', () => {
      const customOptions = {
        plugins: {
          title: {
            display: true,
            text: 'Titolo Personalizzato'
          }
        }
      };

      const config = configManager.createConfig('pie', testData, customOptions);

      expect(config.options.plugins.title.display).toBe(true);
      expect(config.options.plugins.title.text).toBe('Titolo Personalizzato');
    });

    it('dovrebbe gestire dati vuoti', () => {
      const config = configManager.createConfig('pie', []);

      expect(config.data.labels).toEqual([]);
      expect(config.data.datasets).toEqual([]);
    });
  });

  describe('applyTheme()', () => {
    let baseConfig;

    beforeEach(() => {
      baseConfig = {
        type: 'pie',
        data: {
          datasets: [{}]
        },
        options: {
          scales: {
            x: { ticks: {}, grid: {}, title: {} },
            y: { ticks: {}, grid: {}, title: {} }
          },
          plugins: {
            legend: { labels: {} },
            tooltip: {}
          }
        }
      };
    });

    it('dovrebbe applicare tema light', () => {
      const themedConfig = configManager.applyTheme(baseConfig, 'light');

      expect(themedConfig.data.datasets[0].backgroundColor).toBeDefined();
      expect(themedConfig.data.datasets[0].borderColor).toBeDefined();
      expect(themedConfig.options.scales.x.ticks.color).toBe('#333333');
      expect(themedConfig.options.plugins.legend.labels.color).toBe('#333333');
    });

    it('dovrebbe applicare tema dark', () => {
      const themedConfig = configManager.applyTheme(baseConfig, 'dark');

      expect(themedConfig.options.scales.x.ticks.color).toBe('#ffffff');
      expect(themedConfig.options.plugins.legend.labels.color).toBe('#ffffff');
    });

    it('dovrebbe usare tema light come fallback per tema non supportato', () => {
      const themedConfig = configManager.applyTheme(baseConfig, 'nonexistent');

      expect(themedConfig.options.scales.x.ticks.color).toBe('#333333');
    });

    it('dovrebbe gestire configurazione senza scale', () => {
      const configWithoutScales = {
        type: 'pie',
        data: { datasets: [{}] },
        options: {}
      };

      const themedConfig = configManager.applyTheme(configWithoutScales, 'light');

      expect(themedConfig.data.datasets[0].backgroundColor).toBeDefined();
    });
  });

  describe('applyResponsiveSettings()', () => {
    it('dovrebbe applicare impostazioni responsive se adapter disponibile', () => {
      const config = { options: { responsive: false } };
      
      const responsiveConfig = configManager.applyResponsiveSettings(config);

      expect(mockResponsiveAdapter.adaptOptions).toHaveBeenCalledWith({ responsive: false });
      expect(responsiveConfig.options.responsive).toBe(true);
      expect(responsiveConfig.options.maintainAspectRatio).toBe(false);
    });

    it('dovrebbe restituire configurazione originale se adapter non disponibile', () => {
      const managerWithoutAdapter = new ChartConfigManager();
      const config = { options: { responsive: false } };
      
      const responsiveConfig = managerWithoutAdapter.applyResponsiveSettings(config);

      expect(responsiveConfig).toEqual(config);
    });

    it('dovrebbe gestire errori dell\'adapter', () => {
      mockResponsiveAdapter.adaptOptions.mockImplementationOnce(() => {
        throw new Error('Adapter error');
      });

      const config = { options: {} };
      const responsiveConfig = configManager.applyResponsiveSettings(config);

      expect(responsiveConfig).toEqual(config);
    });
  });

  describe('updateConfig()', () => {
    let baseConfig;

    beforeEach(() => {
      baseConfig = {
        type: 'pie',
        data: {
          labels: ['A', 'B'],
          datasets: [{ data: [1, 2] }]
        },
        options: { responsive: true }
      };
    });

    it('dovrebbe aggiornare solo i dati', () => {
      const newData = [['C', 3], ['D', 4]];
      const updatedConfig = configManager.updateConfig(baseConfig, newData);

      expect(updatedConfig.data.labels).toEqual(['C', 'D']);
      expect(updatedConfig.data.datasets[0].data).toEqual([3, 4]);
      expect(updatedConfig.options.responsive).toBe(true);
    });

    it('dovrebbe aggiornare solo le opzioni', () => {
      const newOptions = { plugins: { title: { display: true } } };
      const updatedConfig = configManager.updateConfig(baseConfig, null, newOptions);

      expect(updatedConfig.data.labels).toEqual(['A', 'B']);
      expect(updatedConfig.options.plugins.title.display).toBe(true);
    });

    it('dovrebbe aggiornare sia dati che opzioni', () => {
      const newData = [['E', 5]];
      const newOptions = { animation: false };
      const updatedConfig = configManager.updateConfig(baseConfig, newData, newOptions);

      expect(updatedConfig.data.labels).toEqual(['E']);
      expect(updatedConfig.data.datasets[0].data).toEqual([5]);
      expect(updatedConfig.options.animation).toBe(false);
    });
  });

  describe('getBaseConfig()', () => {
    it('dovrebbe restituire configurazione base per tipo valido', () => {
      const pieConfig = configManager.getBaseConfig('pie');

      expect(pieConfig.type).toBe('pie');
      expect(pieConfig.options).toBeDefined();
    });

    it('dovrebbe lanciare errore per tipo non supportato', () => {
      expect(() => {
        configManager.getBaseConfig('invalid');
      }).toThrow('Tipo di grafico non supportato: invalid');
    });

    it('dovrebbe restituire una copia profonda', () => {
      const config1 = configManager.getBaseConfig('pie');
      const config2 = configManager.getBaseConfig('pie');

      config1.options.responsive = false;
      expect(config2.options.responsive).toBe(true);
    });
  });

  describe('getAvailableThemes()', () => {
    it('dovrebbe restituire lista dei temi disponibili', () => {
      const themes = configManager.getAvailableThemes();

      expect(themes).toContain('light');
      expect(themes).toContain('dark');
      expect(Array.isArray(themes)).toBe(true);
    });
  });

  describe('_getCurrentTheme()', () => {
    it('dovrebbe usare themeService se disponibile', () => {
      mockThemeService.getCurrentTheme.mockReturnValue('dark');
      
      const theme = configManager._getCurrentTheme();

      expect(theme).toBe('dark');
      expect(mockThemeService.getCurrentTheme).toHaveBeenCalled();
    });

    it('dovrebbe rilevare tema dal DOM se themeService non disponibile', () => {
      const managerWithoutThemeService = new ChartConfigManager();
      mockDocument.documentElement.classList.contains.mockReturnValue(true);
      
      const theme = managerWithoutThemeService._getCurrentTheme();

      expect(theme).toBe('dark');
    });

    it('dovrebbe usare light come fallback', () => {
      const managerWithoutThemeService = new ChartConfigManager();
      mockDocument.documentElement.classList.contains.mockReturnValue(false);
      
      const theme = managerWithoutThemeService._getCurrentTheme();

      expect(theme).toBe('light');
    });
  });

  describe('_prepareChartData()', () => {
    it('dovrebbe preparare dati nel formato Chart.js', () => {
      const rawData = [['A', 10], ['B', 20]];
      const chartData = configManager._prepareChartData(rawData, 'pie');

      expect(chartData.labels).toEqual(['A', 'B']);
      expect(chartData.datasets[0].data).toEqual([10, 20]);
      expect(chartData.datasets[0].backgroundColor).toBeDefined();
    });

    it('dovrebbe gestire dati in formato oggetto', () => {
      const rawData = [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 }
      ];
      const chartData = configManager._prepareChartData(rawData, 'pie');

      expect(chartData.labels).toEqual(['A', 'B']);
      expect(chartData.datasets[0].data).toEqual([10, 20]);
    });

    it('dovrebbe gestire array vuoto', () => {
      const chartData = configManager._prepareChartData([], 'pie');

      expect(chartData.labels).toEqual([]);
      expect(chartData.datasets).toEqual([]);
    });

    it('dovrebbe configurare dataset per grafico a linee', () => {
      const rawData = [['A', 10]];
      const chartData = configManager._prepareChartData(rawData, 'line');

      expect(chartData.datasets[0].fill).toBe(false);
      expect(chartData.datasets[0].tension).toBe(0.1);
    });
  });
});