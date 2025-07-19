/**
 * Mock per Chart.js e librerie grafici
 */

import { vi } from 'vitest';

/**
 * Mock Chart.js instance
 */
export function createChartMock(config = {}) {
  const mockChart = {
    // Configuration
    config: {
      type: 'pie',
      data: { labels: [], datasets: [] },
      options: {},
      ...config
    },
    
    // Data and options (shortcuts)
    data: config.data || { labels: [], datasets: [] },
    options: config.options || {},
    
    // Canvas reference
    canvas: {
      width: 800,
      height: 600,
      getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn()
      })),
      toBlob: vi.fn((callback, type) => {
        const blob = new Blob(['mock-chart-data'], { type: type || 'image/png' });
        callback(blob);
      }),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock-chart-data')
    },
    
    // Chart methods
    update: vi.fn(function(mode) {
      // Simula aggiornamento chart
      return this;
    }),
    
    destroy: vi.fn(function() {
      // Simula distruzione chart
      this._destroyed = true;
    }),
    
    reset: vi.fn(function() {
      // Simula reset chart
      return this;
    }),
    
    render: vi.fn(function() {
      // Simula rendering chart
      return this;
    }),
    
    stop: vi.fn(function() {
      // Simula stop animazioni
      return this;
    }),
    
    resize: vi.fn(function(width, height) {
      // Simula resize chart
      if (width) this.canvas.width = width;
      if (height) this.canvas.height = height;
      return this;
    }),
    
    clear: vi.fn(function() {
      // Simula clear chart
      return this;
    }),
    
    toBase64Image: vi.fn(() => 'data:image/png;base64,mock-chart-data'),
    
    // Event handlers
    onClick: vi.fn(),
    onHover: vi.fn(),
    
    // Internal state
    _destroyed: false,
    _animating: false,
    
    // Utility methods
    getElementsAtEventForMode: vi.fn(() => []),
    getElementAtEvent: vi.fn(() => null),
    getDatasetAtEvent: vi.fn(() => []),
    
    // Chart.js specific
    chartArea: {
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600
    },
    
    scales: {},
    legend: {
      display: true,
      position: 'top'
    }
  };
  
  return mockChart;
}

/**
 * Mock Chart.js constructor
 */
export function createChartConstructorMock() {
  const MockChart = vi.fn((ctx, config) => {
    return createChartMock(config);
  });
  
  // Static methods
  MockChart.register = vi.fn();
  MockChart.unregister = vi.fn();
  MockChart.getChart = vi.fn(() => null);
  
  // Defaults
  MockChart.defaults = {
    global: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true
        }
      }
    },
    pie: {
      cutout: 0,
      radius: '100%'
    },
    bar: {
      scales: {
        x: { display: true },
        y: { display: true }
      }
    },
    line: {
      elements: {
        line: {
          tension: 0.1
        }
      }
    }
  };
  
  // Helpers
  MockChart.helpers = {
    color: vi.fn((color) => ({
      alpha: vi.fn(() => color),
      lighten: vi.fn(() => color),
      darken: vi.fn(() => color)
    })),
    
    merge: vi.fn((target, source) => ({ ...target, ...source })),
    
    clone: vi.fn((obj) => JSON.parse(JSON.stringify(obj)))
  };
  
  return MockChart;
}

/**
 * Mock per Chart.js plugins
 */
export function createChartPluginMock(pluginName) {
  return {
    id: pluginName,
    
    beforeInit: vi.fn(),
    afterInit: vi.fn(),
    
    beforeUpdate: vi.fn(),
    afterUpdate: vi.fn(),
    
    beforeDraw: vi.fn(),
    afterDraw: vi.fn(),
    
    beforeRender: vi.fn(),
    afterRender: vi.fn(),
    
    beforeEvent: vi.fn(),
    afterEvent: vi.fn(),
    
    destroy: vi.fn()
  };
}

/**
 * Mock per responsive chart adapter
 */
export function createResponsiveChartAdapterMock() {
  return {
    // Device detection
    detectDevice: vi.fn(() => 'desktop'),
    isTouchDevice: vi.fn(() => false),
    getOrientation: vi.fn(() => 'landscape'),
    
    // Options adaptation
    adaptOptions: vi.fn((options) => ({
      ...options,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...options.plugins,
        legend: {
          ...options.plugins?.legend,
          position: 'top'
        }
      }
    })),
    
    // Layout adaptation
    adaptLayout: vi.fn(),
    
    // Event handling
    handleResize: vi.fn(),
    handleOrientationChange: vi.fn(),
    
    // Initialization
    initialize: vi.fn(),
    destroy: vi.fn(),
    
    // State
    isInitialized: false,
    currentDevice: 'desktop',
    currentOrientation: 'landscape'
  };
}

/**
 * Mock per chart configuration manager
 */
export function createChartConfigManagerMock() {
  return {
    // Configuration creation
    createConfig: vi.fn((type, data, options) => ({
      type,
      data: {
        labels: data.map(item => item[0]),
        datasets: [{
          data: data.map(item => item[1]),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
      },
      options: {
        responsive: true,
        ...options
      }
    })),
    
    // Theme application
    applyTheme: vi.fn((config, theme) => ({
      ...config,
      options: {
        ...config.options,
        plugins: {
          ...config.options.plugins,
          legend: {
            ...config.options.plugins?.legend,
            labels: {
              color: theme === 'dark' ? '#ffffff' : '#333333'
            }
          }
        }
      }
    })),
    
    // Responsive settings
    applyResponsiveSettings: vi.fn((config) => ({
      ...config,
      options: {
        ...config.options,
        responsive: true,
        maintainAspectRatio: false
      }
    })),
    
    // Configuration update
    updateConfig: vi.fn((config, newData, newOptions) => ({
      ...config,
      data: newData ? {
        labels: newData.map(item => item[0]),
        datasets: [{
          ...config.data.datasets[0],
          data: newData.map(item => item[1])
        }]
      } : config.data,
      options: { ...config.options, ...newOptions }
    })),
    
    // Base configurations
    getBaseConfig: vi.fn((type) => {
      const baseConfigs = {
        pie: {
          type: 'pie',
          options: {
            responsive: true,
            plugins: {
              legend: { display: true }
            }
          }
        },
        bar: {
          type: 'bar',
          options: {
            responsive: true,
            scales: {
              x: { display: true },
              y: { display: true }
            }
          }
        },
        line: {
          type: 'line',
          options: {
            responsive: true,
            elements: {
              line: { tension: 0.1 }
            }
          }
        }
      };
      
      return baseConfigs[type] || baseConfigs.pie;
    }),
    
    // Available themes
    getAvailableThemes: vi.fn(() => ['light', 'dark'])
  };
}

/**
 * Mock per chart data processor
 */
export function createChartDataProcessorMock() {
  return {
    // Data processing
    processData: vi.fn((rawData, chartType) => {
      if (Array.isArray(rawData) && rawData.length > 0) {
        if (Array.isArray(rawData[0])) {
          // Array of arrays format
          return {
            labels: rawData.map(item => item[0]),
            datasets: [{
              data: rawData.map(item => item[1]),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }]
          };
        } else if (typeof rawData[0] === 'object') {
          // Array of objects format
          return {
            labels: rawData.map(item => item.label),
            datasets: [{
              data: rawData.map(item => item.value),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }]
          };
        }
      }
      
      return { labels: [], datasets: [] };
    }),
    
    // Data validation
    validateData: vi.fn((data) => ({
      isValid: Array.isArray(data) && data.length > 0,
      errors: []
    })),
    
    // Data transformation
    transformData: vi.fn((data, transformation) => data),
    
    // Data aggregation
    aggregateData: vi.fn((data, groupBy) => data),
    
    // Data filtering
    filterData: vi.fn((data, filters) => data)
  };
}

/**
 * Setup completo mock Chart.js environment
 */
export function setupChartMockEnvironment() {
  const MockChart = createChartConstructorMock();
  
  // Global Chart object
  global.Chart = MockChart;
  window.Chart = MockChart;
  
  // Chart.js plugins
  MockChart.plugins = {
    register: vi.fn(),
    unregister: vi.fn(),
    getAll: vi.fn(() => [])
  };
  
  return {
    Chart: MockChart,
    createChart: (ctx, config) => new MockChart(ctx, config),
    cleanup: () => {
      delete global.Chart;
      delete window.Chart;
    }
  };
}

/**
 * Helper per creare dati chart di test
 */
export function createMockChartData(type = 'pie', itemCount = 3) {
  const labels = [];
  const data = [];
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  
  for (let i = 0; i < itemCount; i++) {
    labels.push(`Item ${i + 1}`);
    data.push(Math.floor(Math.random() * 100) + 10);
  }
  
  const dataset = {
    data,
    backgroundColor: colors.slice(0, itemCount)
  };
  
  if (type === 'bar' || type === 'line') {
    dataset.label = 'Dataset 1';
  }
  
  if (type === 'line') {
    dataset.fill = false;
    dataset.tension = 0.1;
    dataset.borderColor = colors[0];
  }
  
  return {
    labels,
    datasets: [dataset]
  };
}

/**
 * Helper per creare configurazione chart di test
 */
export function createMockChartConfig(type = 'pie', data = null, options = {}) {
  const chartData = data || createMockChartData(type);
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true
      }
    }
  };
  
  if (type === 'bar' || type === 'line') {
    baseOptions.scales = {
      x: { display: true },
      y: { display: true }
    };
  }
  
  return {
    type,
    data: chartData,
    options: { ...baseOptions, ...options }
  };
}