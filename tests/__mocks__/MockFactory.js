/**
 * Factory principale per creazione mock centralizzati e riutilizzabili
 */

import { vi } from 'vitest';

export class MockFactory {
  constructor() {
    this.registeredMocks = new Map();
    this.activeMocks = new Map();
    this.resetHandlers = new Map();
    
    this.initializeCoreMocks();
  }
  
  /**
   * Registra un mock riutilizzabile
   */
  registerMock(name, factory, options = {}) {
    if (this.registeredMocks.has(name)) {
      console.warn(`Mock ${name} already registered, overwriting`);
    }
    
    this.registeredMocks.set(name, {
      factory,
      options: {
        autoReset: true,
        singleton: false,
        ...options
      },
      createdAt: Date.now()
    });
    
    // Registra handler reset se fornito
    if (options.resetHandler) {
      this.resetHandlers.set(name, options.resetHandler);
    }
  }
  
  /**
   * Crea istanza di mock registrato
   */
  createMock(name, overrides = {}) {
    const mockConfig = this.registeredMocks.get(name);
    if (!mockConfig) {
      throw new Error(`Mock ${name} not registered`);
    }
    
    // Se singleton e già creato, restituisci istanza esistente
    if (mockConfig.options.singleton && this.activeMocks.has(name)) {
      return this.activeMocks.get(name);
    }
    
    // Crea nuova istanza
    const mockInstance = mockConfig.factory(overrides);
    
    // Salva se singleton
    if (mockConfig.options.singleton) {
      this.activeMocks.set(name, mockInstance);
    }
    
    return mockInstance;
  }
  
  /**
   * Reset mock specifico
   */
  resetMock(name) {
    const resetHandler = this.resetHandlers.get(name);
    if (resetHandler) {
      resetHandler();
    }
    
    // Rimuovi da active mocks se singleton
    if (this.activeMocks.has(name)) {
      this.activeMocks.delete(name);
    }
  }
  
  /**
   * Reset tutti i mock
   */
  resetAllMocks() {
    // Reset mock registrati
    for (const name of this.registeredMocks.keys()) {
      this.resetMock(name);
    }
    
    // Clear active mocks
    this.activeMocks.clear();
    
    // Reset Vitest mocks
    vi.clearAllMocks();
  }
  
  /**
   * Ottiene statistiche mock
   */
  getStats() {
    return {
      registered: this.registeredMocks.size,
      active: this.activeMocks.size,
      mockNames: Array.from(this.registeredMocks.keys())
    };
  }
  
  /**
   * Inizializza mock core
   */
  initializeCoreMocks() {
    // Mock Supabase
    this.registerMock('supabase', this.createSupabaseMockFactory(), {
      singleton: true,
      autoReset: true
    });
    
    // Mock DOM elements
    this.registerMock('dom-element', this.createDOMElementMockFactory(), {
      singleton: false,
      autoReset: true
    });
    
    // Mock Chart.js
    this.registerMock('chart', this.createChartMockFactory(), {
      singleton: false,
      autoReset: true
    });
    
    // Mock fetch
    this.registerMock('fetch', this.createFetchMockFactory(), {
      singleton: true,
      autoReset: true
    });
    
    // Mock localStorage
    this.registerMock('localStorage', this.createLocalStorageMockFactory(), {
      singleton: true,
      autoReset: true
    });
  }
  
  /**
   * Factory per mock Supabase
   */
  createSupabaseMockFactory() {
    return (overrides = {}) => {
      // Implementazione dettagliata nel file supabase.js
      const { createSupabaseMock } = require('./supabase.js');
      return createSupabaseMock(overrides);
    };
  }
  
  /**
   * Factory per mock DOM elements
   */
  createDOMElementMockFactory() {
    return (tagName = 'div', properties = {}) => {
      const element = {
        tagName: tagName.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        
        // Properties
        ...properties,
        
        // Methods
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        insertBefore: vi.fn(),
        replaceChild: vi.fn(),
        
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        getElementById: vi.fn(),
        getElementsByClassName: vi.fn(() => []),
        getElementsByTagName: vi.fn(() => []),
        
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        hasAttribute: vi.fn(() => false),
        
        focus: vi.fn(),
        blur: vi.fn(),
        click: vi.fn(),
        
        getBoundingClientRect: vi.fn(() => ({
          x: 0, y: 0, width: 100, height: 100,
          top: 0, right: 100, bottom: 100, left: 0
        })),
        
        scrollIntoView: vi.fn(),
        
        // classList mock
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false),
          toggle: vi.fn(),
          replace: vi.fn()
        }
      };
      
      // Special handling per canvas
      if (tagName.toLowerCase() === 'canvas') {
        element.getContext = vi.fn(() => ({
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 100 })),
          drawImage: vi.fn(),
          scale: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          save: vi.fn(),
          restore: vi.fn()
        }));
        
        element.toBlob = vi.fn((callback, type) => {
          const blob = new Blob(['mock-canvas-data'], { type: type || 'image/png' });
          callback(blob);
        });
        
        element.toDataURL = vi.fn(() => 'data:image/png;base64,mock-data');
        element.width = 800;
        element.height = 600;
      }
      
      return element;
    };
  }
  
  /**
   * Factory per mock Chart.js
   */
  createChartMockFactory() {
    return (config = {}) => {
      const mockChart = {
        config: {
          type: 'pie',
          data: { labels: [], datasets: [] },
          options: {},
          ...config
        },
        
        data: config.data || { labels: [], datasets: [] },
        options: config.options || {},
        
        canvas: this.createMock('dom-element', 'canvas'),
        
        // Methods
        update: vi.fn(),
        destroy: vi.fn(),
        reset: vi.fn(),
        render: vi.fn(),
        stop: vi.fn(),
        resize: vi.fn(),
        
        toBase64Image: vi.fn(() => 'data:image/png;base64,mock-chart-data'),
        
        // Events
        onClick: vi.fn(),
        onHover: vi.fn()
      };
      
      // Mock Chart constructor
      const MockChart = vi.fn(() => mockChart);
      MockChart.register = vi.fn();
      MockChart.unregister = vi.fn();
      MockChart.defaults = {};
      
      return { Chart: MockChart, instance: mockChart };
    };
  }
  
  /**
   * Factory per mock fetch
   */
  createFetchMockFactory() {
    return (defaultResponse = {}) => {
      const mockFetch = vi.fn();
      
      // Default successful response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(defaultResponse),
        text: vi.fn().mockResolvedValue(JSON.stringify(defaultResponse)),
        blob: vi.fn().mockResolvedValue(new Blob()),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        headers: new Map(),
        ...defaultResponse
      });
      
      // Helper methods
      mockFetch.mockSuccess = (data) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(data),
          text: vi.fn().mockResolvedValue(JSON.stringify(data))
        });
      };
      
      mockFetch.mockError = (status = 500, message = 'Server Error') => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: message,
          json: vi.fn().mockRejectedValue(new Error(message)),
          text: vi.fn().mockRejectedValue(new Error(message))
        });
      };
      
      mockFetch.mockNetworkError = () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      };
      
      return mockFetch;
    };
  }
  
  /**
   * Factory per mock localStorage
   */
  createLocalStorageMockFactory() {
    return () => {
      const storage = new Map();
      
      return {
        getItem: vi.fn((key) => storage.get(key) || null),
        setItem: vi.fn((key, value) => storage.set(key, String(value))),
        removeItem: vi.fn((key) => storage.delete(key)),
        clear: vi.fn(() => storage.clear()),
        key: vi.fn((index) => Array.from(storage.keys())[index] || null),
        get length() { return storage.size; }
      };
    };
  }
  
  /**
   * Crea mock per servizio generico
   */
  createServiceMock(serviceName, methods = {}) {
    const mockService = {};
    
    // Crea mock per ogni metodo
    for (const [methodName, defaultReturn] of Object.entries(methods)) {
      mockService[methodName] = vi.fn();
      
      if (defaultReturn !== undefined) {
        if (typeof defaultReturn === 'function') {
          mockService[methodName].mockImplementation(defaultReturn);
        } else {
          mockService[methodName].mockReturnValue(defaultReturn);
        }
      }
    }
    
    return mockService;
  }
  
  /**
   * Crea mock per componente UI
   */
  createComponentMock(componentName, props = {}) {
    return {
      name: componentName,
      props: { ...props },
      
      render: vi.fn(() => `<div data-testid="${componentName.toLowerCase()}">${componentName}</div>`),
      mount: vi.fn(),
      unmount: vi.fn(),
      update: vi.fn(),
      
      // Event handlers
      onClick: vi.fn(),
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      
      // State
      state: {},
      setState: vi.fn()
    };
  }
}

// Istanza singleton
export const mockFactory = new MockFactory();

// Export convenience methods
export const createMock = (name, overrides) => mockFactory.createMock(name, overrides);
export const resetMocks = () => mockFactory.resetAllMocks();
export const getMockStats = () => mockFactory.getStats();