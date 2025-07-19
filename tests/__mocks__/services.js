/**
 * Mock per servizi comuni dell'applicazione
 */

import { vi } from 'vitest';

/**
 * Mock per authService
 */
export function createAuthServiceMock() {
  return {
    currentUser: {
      session: null,
      profile: null
    },
    
    signInWithGoogle: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'mock-user-id', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      },
      error: null
    }),
    
    signOut: vi.fn().mockResolvedValue({ error: null }),
    
    initAuth: vi.fn().mockResolvedValue(undefined),
    
    onAuthStateChange: vi.fn((callback) => {
      // Simula callback immediato con stato non autenticato
      callback({ user: null, session: null });
      return { unsubscribe: vi.fn() };
    }),
    
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null
    })
  };
}

/**
 * Mock per errorService
 */
export function createErrorServiceMock() {
  return {
    initErrorHandling: vi.fn(),
    
    logError: vi.fn(),
    
    handleError: vi.fn((error) => {
      console.error('Mock error handler:', error);
    }),
    
    showErrorMessage: vi.fn(),
    
    clearErrors: vi.fn(),
    
    getErrorHistory: vi.fn(() => [])
  };
}

/**
 * Mock per loggerService
 */
export function createLoggerServiceMock() {
  return {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    
    setLevel: vi.fn(),
    getLevel: vi.fn(() => 'info'),
    
    createLogger: vi.fn((name) => ({
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }))
  };
}

/**
 * Mock per modalService
 */
export function createModalServiceMock() {
  return {
    showDeleteConfirmModal: vi.fn().mockResolvedValue(true),
    
    showConfirmModal: vi.fn().mockResolvedValue(true),
    
    showInfoModal: vi.fn().mockResolvedValue(undefined),
    
    showErrorModal: vi.fn().mockResolvedValue(undefined),
    
    closeModal: vi.fn(),
    
    closeAllModals: vi.fn()
  };
}

/**
 * Mock per themeService
 */
export function createThemeServiceMock(currentTheme = 'light') {
  return {
    getCurrentTheme: vi.fn(() => currentTheme),
    
    setTheme: vi.fn((theme) => {
      currentTheme = theme;
    }),
    
    toggleTheme: vi.fn(() => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      return currentTheme;
    }),
    
    getThemeColors: vi.fn((theme) => {
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
      return themes[theme] || themes.light;
    }),
    
    onThemeChange: vi.fn((callback) => {
      // Simula callback immediato
      callback(currentTheme);
      return { unsubscribe: vi.fn() };
    })
  };
}

/**
 * Mock per stateService
 */
export function createStateServiceMock() {
  const state = new Map();
  
  return {
    get: vi.fn((key) => state.get(key)),
    
    set: vi.fn((key, value) => {
      state.set(key, value);
    }),
    
    remove: vi.fn((key) => state.delete(key)),
    
    clear: vi.fn(() => state.clear()),
    
    has: vi.fn((key) => state.has(key)),
    
    subscribe: vi.fn((key, callback) => {
      // Simula callback immediato con valore corrente
      callback(state.get(key));
      return { unsubscribe: vi.fn() };
    }),
    
    getState: vi.fn(() => Object.fromEntries(state))
  };
}

/**
 * Mock per uiStateService
 */
export function createUIStateServiceMock() {
  return {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    isLoading: vi.fn(() => false),
    
    showMessage: vi.fn(),
    hideMessage: vi.fn(),
    
    setPageTitle: vi.fn(),
    getPageTitle: vi.fn(() => 'Test Page'),
    
    setBreadcrumbs: vi.fn(),
    getBreadcrumbs: vi.fn(() => []),
    
    setActiveNavItem: vi.fn(),
    getActiveNavItem: vi.fn(() => null)
  };
}

/**
 * Mock per patientService
 */
export function createPatientServiceMock() {
  const mockPatients = [
    {
      id: 1,
      nome: 'Mario',
      cognome: 'Rossi',
      reparto_appartenenza: 'Medicina',
      diagnosi: 'Ipertensione'
    },
    {
      id: 2,
      nome: 'Luigi',
      cognome: 'Verdi',
      reparto_appartenenza: 'Chirurgia',
      diagnosi: 'Appendicite'
    }
  ];
  
  return {
    getAllPatients: vi.fn().mockResolvedValue({
      data: mockPatients,
      error: null
    }),
    
    getPatientById: vi.fn((id) => {
      const patient = mockPatients.find(p => p.id === id);
      return Promise.resolve({
        data: patient || null,
        error: patient ? null : { message: 'Patient not found' }
      });
    }),
    
    createPatient: vi.fn((patientData) => {
      const newPatient = {
        id: mockPatients.length + 1,
        ...patientData,
        created_at: new Date().toISOString()
      };
      mockPatients.push(newPatient);
      return Promise.resolve({
        data: newPatient,
        error: null
      });
    }),
    
    updatePatient: vi.fn((id, patientData) => {
      const index = mockPatients.findIndex(p => p.id === id);
      if (index >= 0) {
        mockPatients[index] = { ...mockPatients[index], ...patientData };
        return Promise.resolve({
          data: mockPatients[index],
          error: null
        });
      }
      return Promise.resolve({
        data: null,
        error: { message: 'Patient not found' }
      });
    }),
    
    deletePatient: vi.fn((id) => {
      const index = mockPatients.findIndex(p => p.id === id);
      if (index >= 0) {
        mockPatients.splice(index, 1);
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({
        error: { message: 'Patient not found' }
      });
    }),
    
    searchPatients: vi.fn((query) => {
      const filtered = mockPatients.filter(p => 
        p.nome.toLowerCase().includes(query.toLowerCase()) ||
        p.cognome.toLowerCase().includes(query.toLowerCase())
      );
      return Promise.resolve({
        data: filtered,
        error: null
      });
    })
  };
}

/**
 * Mock per chartService
 */
export function createChartServiceMock() {
  return {
    createChart: vi.fn().mockResolvedValue({
      id: 'mock-chart-id',
      destroy: vi.fn(),
      update: vi.fn(),
      render: vi.fn()
    }),
    
    createPieChart: vi.fn().mockResolvedValue({
      id: 'mock-pie-chart',
      type: 'pie',
      destroy: vi.fn(),
      update: vi.fn()
    }),
    
    createBarChart: vi.fn().mockResolvedValue({
      id: 'mock-bar-chart',
      type: 'bar',
      destroy: vi.fn(),
      update: vi.fn()
    }),
    
    createLineChart: vi.fn().mockResolvedValue({
      id: 'mock-line-chart',
      type: 'line',
      destroy: vi.fn(),
      update: vi.fn()
    }),
    
    updateChart: vi.fn().mockResolvedValue(true),
    
    destroyChart: vi.fn(),
    
    exportChartAsImage: vi.fn().mockResolvedValue(new Blob()),
    
    downloadChartAsImage: vi.fn().mockResolvedValue(undefined),
    
    isChartJsLoaded: vi.fn(() => true),
    
    getAvailableChartTypes: vi.fn().mockResolvedValue(['pie', 'bar', 'line'])
  };
}

/**
 * Mock per validationService
 */
export function createValidationServiceMock() {
  return {
    validatePatientData: vi.fn((data) => ({
      isValid: true,
      errors: []
    })),
    
    validateEmail: vi.fn((email) => ({
      isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      error: null
    })),
    
    validateRequired: vi.fn((value, fieldName) => ({
      isValid: value != null && value !== '',
      error: value == null || value === '' ? `${fieldName} is required` : null
    })),
    
    validateLength: vi.fn((value, min, max, fieldName) => {
      const length = String(value).length;
      const isValid = length >= min && length <= max;
      return {
        isValid,
        error: isValid ? null : `${fieldName} must be between ${min} and ${max} characters`
      };
    }),
    
    validateDate: vi.fn((date) => ({
      isValid: !isNaN(Date.parse(date)),
      error: isNaN(Date.parse(date)) ? 'Invalid date format' : null
    }))
  };
}

/**
 * Factory per creare mock di servizi personalizzati
 */
export function createCustomServiceMock(serviceName, methods = {}) {
  const mockService = {};
  
  for (const [methodName, defaultReturn] of Object.entries(methods)) {
    mockService[methodName] = vi.fn();
    
    if (defaultReturn !== undefined) {
      if (typeof defaultReturn === 'function') {
        mockService[methodName].mockImplementation(defaultReturn);
      } else if (defaultReturn instanceof Promise) {
        mockService[methodName].mockResolvedValue(defaultReturn);
      } else {
        mockService[methodName].mockReturnValue(defaultReturn);
      }
    }
  }
  
  return mockService;
}

/**
 * Registry per mock di servizi
 */
export const serviceRegistry = {
  auth: createAuthServiceMock,
  error: createErrorServiceMock,
  logger: createLoggerServiceMock,
  modal: createModalServiceMock,
  theme: createThemeServiceMock,
  state: createStateServiceMock,
  uiState: createUIStateServiceMock,
  patient: createPatientServiceMock,
  chart: createChartServiceMock,
  validation: createValidationServiceMock
};

/**
 * Crea mock per servizio dal registry
 */
export function createServiceMock(serviceName, options = {}) {
  const factory = serviceRegistry[serviceName];
  if (!factory) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  
  return factory(options);
}