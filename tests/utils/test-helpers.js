/**
 * Test utilities and helpers for the refactored modules
 */

import { vi } from 'vitest';

/**
 * Creates a mock Supabase client with chainable methods and realistic hospital data
 * @param {Object} mockData - Default data to return from queries
 * @returns {Object} Mock Supabase client
 */
export function createMockSupabaseClient(mockData = { data: [], error: null }) {
  const createChain = (finalResult = mockData) => ({
    select: vi.fn(() => createChain(finalResult)),
    eq: vi.fn(() => createChain(finalResult)),
    neq: vi.fn(() => createChain(finalResult)),
    gt: vi.fn(() => createChain(finalResult)),
    lt: vi.fn(() => createChain(finalResult)),
    gte: vi.fn(() => createChain(finalResult)),
    lte: vi.fn(() => createChain(finalResult)),
    like: vi.fn(() => createChain(finalResult)),
    ilike: vi.fn(() => createChain(finalResult)),
    is: vi.fn(() => createChain(finalResult)),
    not: vi.fn(() => createChain(finalResult)),
    or: vi.fn(() => createChain(finalResult)),
    order: vi.fn(() => createChain(finalResult)),
    range: vi.fn(() => createChain(finalResult)),
    single: vi.fn(() => Promise.resolve(finalResult)),
    then: vi.fn((callback) => Promise.resolve(finalResult).then(callback)),
    catch: vi.fn((callback) => Promise.resolve(finalResult).catch(callback))
  });

  // Mock realistic database responses based on table
  const mockTableData = {
    pazienti: {
      data: [
        { id: 1, nome: 'Mario', cognome: 'Rossi', reparto_appartenenza: 'Medicina', diagnosi: 'Ipertensione' },
        { id: 2, nome: 'Luigi', cognome: 'Verdi', reparto_appartenenza: 'Chirurgia', diagnosi: 'Appendicite' }
      ],
      error: null
    },
    reparti: {
      data: [
        { id: 1, nome: 'Medicina', descrizione: 'Reparto di Medicina Generale' },
        { id: 2, nome: 'Chirurgia', descrizione: 'Reparto di Chirurgia Generale' },
        { id: 3, nome: 'Cardiologia', descrizione: 'Reparto di Cardiologia' },
        { id: 4, nome: 'Neurologia', descrizione: 'Reparto di Neurologia' },
        { id: 5, nome: 'Ortopedia', descrizione: 'Reparto di Ortopedia' }
      ],
      error: null
    },
    diagnosi: {
      data: [
        { id: 1, nome: 'Ipertensione', categoria: 'Cardiovascolare' },
        { id: 2, nome: 'Diabete', categoria: 'Endocrinologica' },
        { id: 3, nome: 'Appendicite', categoria: 'Chirurgica' },
        { id: 4, nome: 'Infarto', categoria: 'Cardiovascolare' },
        { id: 5, nome: 'Frattura', categoria: 'Ortopedica' }
      ],
      error: null
    }
  };

  return {
    from: vi.fn((tableName) => {
      const tableData = mockTableData[tableName] || mockData;
      
      return {
        select: vi.fn(() => createChain(tableData)),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: Date.now() }, error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 1, ...tableData.data[0] }, error: null }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      };
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  };
}

/**
 * Creates a mock device detector for responsive chart adapter tests
 * @param {string} device - Device type to return ('mobile', 'tablet', 'desktop')
 * @param {boolean} isTouch - Whether device supports touch
 * @returns {Object} Mock device detector
 */
export function createMockDeviceDetector(device = 'desktop', isTouch = false) {
  return {
    detectDevice: vi.fn(() => device),
    isTouchDevice: vi.fn(() => isTouch),
    getOrientation: vi.fn(() => window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
    getViewportInfo: vi.fn(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      device,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isTouch
    }))
  };
}

/**
 * Creates a mock theme manager for chart configuration tests
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {Object} Mock theme manager
 */
export function createMockThemeManager(theme = 'light') {
  const themes = {
    light: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      text: '#212529'
    },
    dark: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      background: '#212529',
      text: '#ffffff'
    }
  };

  return {
    getCurrentTheme: vi.fn(() => theme),
    getThemeColors: vi.fn((themeName) => themes[themeName] || themes.light)
  };
}

/**
 * Creates a mock cache for testing cache-dependent modules
 * @returns {Object} Mock cache
 */
export function createMockCache() {
  const cache = new Map();
  
  return {
    get: vi.fn((key) => cache.get(key)),
    set: vi.fn((key, value) => cache.set(key, value)),
    invalidate: vi.fn((key) => cache.delete(key)),
    clear: vi.fn(() => cache.clear()),
    has: vi.fn((key) => cache.has(key)),
    size: vi.fn(() => cache.size),
    keys: vi.fn(() => Array.from(cache.keys()))
  };
}

/**
 * Creates a mock validator for patient service tests
 * @param {boolean} isValid - Whether validation should pass by default
 * @returns {Object} Mock validator
 */
export function createMockValidator(isValid = true) {
  return {
    validatePatientData: vi.fn(() => ({ isValid, errors: [] })),
    validateFilters: vi.fn(() => ({ isValid, errors: [] })),
    validatePagination: vi.fn(() => ({ isValid, errors: [], sanitized: { page: 1, limit: 20, offset: 0 } })),
    sanitizeInput: vi.fn((input) => input)
  };
}

/**
 * Mocks window dimensions for responsive testing
 * @param {number} width - Window width
 * @param {number} height - Window height
 */
export function mockWindowDimensions(width, height) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
}

/**
 * Mocks touch device capabilities
 * @param {boolean} hasTouch - Whether device supports touch
 */
export function mockTouchCapabilities(hasTouch = true) {
  if (hasTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
  } else {
    delete window.ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
  }
}

/**
 * Creates a mock DOM element with common properties and methods
 * @param {string} tagName - Element tag name
 * @returns {Object} Mock DOM element
 */
export function createMockElement(tagName = 'div') {
  const element = {
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
      toggle: vi.fn()
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  };
  
  return element;
}

/**
 * Creates sample patient data for testing with realistic Supabase structure
 * @param {Object} overrides - Properties to override in the sample data
 * @returns {Object} Sample patient data
 */
export function createSamplePatient(overrides = {}) {
  return {
    id: 1,
    nome: 'Mario',
    cognome: 'Rossi',
    data_nascita: '1980-01-01',
    data_ricovero: '2024-01-01',
    reparto_appartenenza: 'Medicina',
    diagnosi: 'Ipertensione',
    data_dimissione: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    ...overrides
  };
}

/**
 * Creates sample department data from Supabase
 * @returns {Array} Array of department objects
 */
export function createSampleDepartments() {
  return [
    { id: 1, nome: 'Medicina', descrizione: 'Reparto di Medicina Generale', attivo: true },
    { id: 2, nome: 'Chirurgia', descrizione: 'Reparto di Chirurgia Generale', attivo: true },
    { id: 3, nome: 'Cardiologia', descrizione: 'Reparto di Cardiologia', attivo: true },
    { id: 4, nome: 'Neurologia', descrizione: 'Reparto di Neurologia', attivo: true },
    { id: 5, nome: 'Ortopedia', descrizione: 'Reparto di Ortopedia', attivo: true },
    { id: 6, nome: 'Pediatria', descrizione: 'Reparto di Pediatria', attivo: true },
    { id: 7, nome: 'Ginecologia', descrizione: 'Reparto di Ginecologia', attivo: true }
  ];
}

/**
 * Creates sample diagnosis data from Supabase
 * @returns {Array} Array of diagnosis objects
 */
export function createSampleDiagnoses() {
  return [
    { id: 1, nome: 'Ipertensione', categoria: 'Cardiovascolare', codice_icd: 'I10', attivo: true },
    { id: 2, nome: 'Diabete Mellito', categoria: 'Endocrinologica', codice_icd: 'E11', attivo: true },
    { id: 3, nome: 'Appendicite Acuta', categoria: 'Chirurgica', codice_icd: 'K35', attivo: true },
    { id: 4, nome: 'Infarto Miocardico', categoria: 'Cardiovascolare', codice_icd: 'I21', attivo: true },
    { id: 5, nome: 'Frattura Femore', categoria: 'Ortopedica', codice_icd: 'S72', attivo: true },
    { id: 6, nome: 'Polmonite', categoria: 'Respiratoria', codice_icd: 'J18', attivo: true },
    { id: 7, nome: 'Gastrite', categoria: 'Gastroenterologica', codice_icd: 'K29', attivo: true }
  ];
}

/**
 * Creates a mock Supabase client configured for specific database tables
 * @param {Object} tableOverrides - Override data for specific tables
 * @returns {Object} Mock Supabase client with realistic data
 */
export function createMockSupabaseWithData(tableOverrides = {}) {
  const defaultData = {
    pazienti: createSamplePatient(),
    reparti: createSampleDepartments(),
    diagnosi: createSampleDiagnoses()
  };

  const mockData = { ...defaultData, ...tableOverrides };
  
  return createMockSupabaseClient(mockData);
}

/**
 * Creates sample chart data for testing
 * @param {string} type - Chart type ('pie', 'bar', 'line')
 * @returns {Object} Sample chart data
 */
export function createSampleChartData(type = 'pie') {
  const baseData = {
    labels: ['A', 'B', 'C'],
    datasets: [{
      data: [10, 20, 30],
      backgroundColor: ['#ff0000', '#00ff00', '#0000ff']
    }]
  };

  if (type === 'bar' || type === 'line') {
    baseData.datasets[0].label = 'Sample Data';
  }

  return baseData;
}

/**
 * Waits for a specified amount of time (useful for async tests)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Asserts that a function throws an error with a specific message
 * @param {Function} fn - Function to test
 * @param {string} expectedMessage - Expected error message
 */
export function expectToThrowWithMessage(fn, expectedMessage) {
  let error;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  
  if (!error) {
    throw new Error('Expected function to throw an error');
  }
  
  if (!error.message.includes(expectedMessage)) {
    throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
  }
}

/**
 * Creates a test suite template for module testing
 * @param {string} moduleName - Name of the module being tested
 * @param {Function} moduleFactory - Function that creates the module instance
 * @returns {Object} Test suite template
 */
export function createModuleTestSuite(moduleName, moduleFactory) {
  return {
    moduleName,
    moduleFactory,
    
    // Standard test categories
    testCategories: [
      'Initialization',
      'Core Functionality', 
      'Error Handling',
      'Edge Cases',
      'Integration'
    ],
    
    // Common test patterns
    shouldInitializeCorrectly: () => {
      const instance = moduleFactory();
      expect(instance).toBeDefined();
      expect(typeof instance).toBe('object');
    },
    
    shouldHandleNullInput: (methodName) => {
      const instance = moduleFactory();
      expect(() => instance[methodName](null)).not.toThrow();
    },
    
    shouldHandleUndefinedInput: (methodName) => {
      const instance = moduleFactory();
      expect(() => instance[methodName](undefined)).not.toThrow();
    }
  };
}