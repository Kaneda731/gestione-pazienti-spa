/**
 * Gestore configurazioni test dinamiche
 */

export class TestConfigManager {
  constructor() {
    this.configs = new Map();
    this.activeConfig = null;
    this.validators = new Map();
    
    this.initializeDefaultConfigs();
  }
  
  /**
   * Registra una configurazione per tipo di test
   */
  registerConfig(type, config) {
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid config for type: ${type}`);
    }
    
    this.configs.set(type, {
      ...config,
      type,
      createdAt: Date.now()
    });
  }
  
  /**
   * Ottiene configurazione per tipo di test
   */
  getConfig(type) {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`No config found for type: ${type}`);
    }
    
    return { ...config };
  }
  
  /**
   * Applica configurazione per tipo di test
   */
  applyConfig(type) {
    const config = this.getConfig(type);
    this.activeConfig = config;
    
    // Applica timeout specifici
    if (config.timeouts) {
      this.applyTimeouts(config.timeouts);
    }
    
    // Applica mock specifici
    if (config.mocks) {
      this.applyMocks(config.mocks);
    }
    
    // Applica setup specifico
    if (config.setup) {
      this.applySetup(config.setup);
    }
    
    return config;
  }
  
  /**
   * Ottiene configurazione attiva
   */
  getActiveConfig() {
    return this.activeConfig ? { ...this.activeConfig } : null;
  }
  
  /**
   * Valida struttura configurazione
   */
  validateConfig(config) {
    const requiredFields = ['name', 'type'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Valida timeouts se presenti
    if (config.timeouts) {
      if (typeof config.timeouts !== 'object') {
        console.error('Timeouts must be an object');
        return false;
      }
    }
    
    // Valida mocks se presenti
    if (config.mocks && !Array.isArray(config.mocks)) {
      console.error('Mocks must be an array');
      return false;
    }
    
    return true;
  }
  
  /**
   * Registra validatore personalizzato
   */
  registerValidator(type, validator) {
    this.validators.set(type, validator);
  }
  
  /**
   * Inizializza configurazioni di default
   */
  initializeDefaultConfigs() {
    // Configurazione per test unitari
    this.registerConfig('unit', {
      name: 'Unit Tests',
      type: 'unit',
      timeouts: {
        test: 5000,
        hook: 3000
      },
      mocks: ['dom', 'fetch'],
      setup: {
        clearMocks: true,
        resetModules: true
      },
      parallel: true
    });
    
    // Configurazione per test di integrazione
    this.registerConfig('integration', {
      name: 'Integration Tests',
      type: 'integration',
      timeouts: {
        test: 15000,
        hook: 10000
      },
      mocks: ['supabase', 'external-apis'],
      setup: {
        clearMocks: false,
        resetModules: false
      },
      parallel: false
    });
    
    // Configurazione per test di performance
    this.registerConfig('performance', {
      name: 'Performance Tests',
      type: 'performance',
      timeouts: {
        test: 60000,
        hook: 30000
      },
      mocks: ['minimal'],
      setup: {
        clearMocks: true,
        resetModules: true,
        monitoring: true
      },
      parallel: false
    });
    
    // Configurazione per test componenti
    this.registerConfig('component', {
      name: 'Component Tests',
      type: 'component',
      timeouts: {
        test: 10000,
        hook: 5000
      },
      mocks: ['dom', 'events', 'resize-observer'],
      setup: {
        clearMocks: true,
        resetModules: true,
        domCleanup: true
      },
      parallel: true
    });
  }
  
  /**
   * Applica timeout specifici
   */
  applyTimeouts(timeouts) {
    // Implementazione dipende dal test runner
    // Per Vitest, potremmo usare vi.setConfig o simili
    if (timeouts.test) {
      global.testTimeout = timeouts.test;
    }
    
    if (timeouts.hook) {
      global.hookTimeout = timeouts.hook;
    }
  }
  
  /**
   * Applica mock specifici
   */
  applyMocks(mocks) {
    // Carica mock richiesti
    for (const mockType of mocks) {
      this.loadMock(mockType);
    }
  }
  
  /**
   * Applica setup specifico
   */
  applySetup(setup) {
    if (setup.clearMocks) {
      // Configura clear automatico mock
      global.autoCleanMocks = true;
    }
    
    if (setup.resetModules) {
      // Configura reset automatico moduli
      global.autoResetModules = true;
    }
    
    if (setup.domCleanup) {
      // Configura cleanup automatico DOM
      global.autoDOMCleanup = true;
    }
    
    if (setup.monitoring) {
      // Abilita monitoring performance
      global.performanceMonitoring = true;
    }
  }
  
  /**
   * Carica mock specifico
   */
  loadMock(mockType) {
    // Implementazione specifica per tipo mock
    switch (mockType) {
      case 'dom':
        this.loadDOMMocks();
        break;
      case 'fetch':
        this.loadFetchMocks();
        break;
      case 'supabase':
        this.loadSupabaseMocks();
        break;
      case 'external-apis':
        this.loadExternalAPIMocks();
        break;
      case 'resize-observer':
        this.loadResizeObserverMocks();
        break;
      case 'events':
        this.loadEventMocks();
        break;
      default:
        console.warn(`Unknown mock type: ${mockType}`);
    }
  }
  
  /**
   * Carica mock DOM
   */
  loadDOMMocks() {
    // Mock già caricati in test-environment.js
    // Qui possiamo aggiungere mock aggiuntivi se necessario
  }
  
  /**
   * Carica mock Fetch
   */
  loadFetchMocks() {
    if (!global.fetch) {
      global.fetch = vi.fn();
    }
  }
  
  /**
   * Carica mock Supabase
   */
  loadSupabaseMocks() {
    // Sarà implementato nel MockFactory
  }
  
  /**
   * Carica mock API esterne
   */
  loadExternalAPIMocks() {
    // Mock per API esterne
  }
  
  /**
   * Carica mock ResizeObserver
   */
  loadResizeObserverMocks() {
    if (!global.ResizeObserver) {
      global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }));
    }
  }
  
  /**
   * Carica mock eventi
   */
  loadEventMocks() {
    // Mock per eventi personalizzati
  }
  
  /**
   * Reset configurazione
   */
  reset() {
    this.activeConfig = null;
    // Reset eventuali configurazioni globali
  }
  
  /**
   * Ottiene statistiche configurazioni
   */
  getStats() {
    return {
      totalConfigs: this.configs.size,
      activeConfig: this.activeConfig?.type || null,
      availableTypes: Array.from(this.configs.keys())
    };
  }
}

// Istanza singleton
export const testConfigManager = new TestConfigManager();