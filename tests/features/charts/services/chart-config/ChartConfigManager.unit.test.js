import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartConfigManager } from '../../../../../src/features/charts/services/chart-config/ChartConfigManager.js';

describe('ChartConfigManager Unit Tests', () => {
  let configManager;
  let mockResponsiveAdapter;

  beforeEach(() => {
    mockResponsiveAdapter = {
      adaptOptions: vi.fn(options => options),
    };
    configManager = new ChartConfigManager(mockResponsiveAdapter);
  });

  it('should create a pie chart configuration', () => {
    const data = [['A', 10], ['B', 20]];
    const config = configManager.createConfig('pie', data, {});

    expect(config.type).toBe('pie');
    expect(config.data.labels).toEqual(['A', 'B']);
    expect(config.data.datasets[0].data).toEqual([10, 20]);
    expect(config.options).toBeDefined();
  });

  it('should create a bar chart configuration', () => {
    const data = [['A', 10], ['B', 20]];
    const config = configManager.createConfig('bar', data, {});

    expect(config.type).toBe('bar');
    expect(config.data.labels).toEqual(['A', 'B']);
    expect(config.data.datasets[0].data).toEqual([10, 20]);
    expect(config.options.scales.y.beginAtZero).toBe(true);
  });

  it('should apply a dark theme', () => {
    configManager.themeService = { getCurrentTheme: () => 'dark' };
    const data = [['A', 10], ['B', 20]];
    const config = configManager.createConfig('pie', data, {});

    expect(config.data.datasets[0].backgroundColor).toEqual(configManager.themeConfigs.dark.backgroundColor);
  });

  it('should use responsive adapter to adapt options', () => {
    const data = [['A', 10], ['B', 20]];
    configManager.createConfig('pie', data, {});

    expect(mockResponsiveAdapter.adaptOptions).toHaveBeenCalled();
  });

  it('should update an existing configuration', () => {
    const initialData = [['A', 10], ['B', 20]];
    const initialConfig = configManager.createConfig('pie', initialData, {});

    const newData = [['C', 30], ['D', 40]];
    const newOptions = { plugins: { title: { text: 'New Title' } } };

    const updatedConfig = configManager.updateConfig(initialConfig, newData, newOptions);

    expect(updatedConfig.data.labels).toEqual(['C', 'D']);
    expect(updatedConfig.data.datasets[0].data).toEqual([30, 40]);
    expect(updatedConfig.options.plugins.title.text).toBe('New Title');
  });
});
