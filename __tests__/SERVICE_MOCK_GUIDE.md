# Service Mock Usage Guide

This guide provides comprehensive examples and patterns for properly mocking services in the gestione-pazienti-spa test suite.

## Table of Contents

1. [Core Service Mocks](#core-service-mocks)
2. [Feature Service Mocks](#feature-service-mocks)
3. [Mock Implementation Patterns](#mock-implementation-patterns)
4. [Common Mock Scenarios](#common-mock-scenarios)
5. [Mock Validation](#mock-validation)

## Core Service Mocks

### NotificationService Mock

Complete mock implementation for the notification service:

```javascript
// __tests__/mocks/notificationService.mock.js
import { vi } from 'vitest';

export const mockNotificationService = {
    // Core notification methods
    init: vi.fn().mockResolvedValue(undefined),
    success: vi.fn().mockReturnValue('mock-success-id'),
    error: vi.fn().mockReturnValue('mock-error-id'),
    warning: vi.fn().mockReturnValue('mock-warning-id'),
    info: vi.fn().mockReturnValue('mock-info-id'),
    
    // Management methods
    clear: vi.fn(),
    removeNotification: vi.fn(),
    clearByType: vi.fn(),
    
    // Timer management methods
    pauseAutoCloseTimer: vi.fn(),
    resumeAutoCloseTimer: vi.fn(),
    startAutoCloseTimer: vi.fn(),
    stopAutoCloseTimer: vi.fn(),
    
    // Animation and event manager methods
    pauseAllTimers: vi.fn(),
    resumeAllTimers: vi.fn(),
    setupGlobalCleanup: vi.fn(),
    
    // Properties
    timers: new Map(),
    initialized: false,
    notificationContainer: null,
    
    // Helper methods for testing
    reset: () => {
        mockNotificationService.timers.clear();
        mockNotificationService.initialized = false;
        mockNotificationService.notificationContainer = null;
        vi.clearAllMocks();
    }
};

// Usage in tests
vi.mock('../../../../src/core/services/notificationService.js', () => ({
    notificationService: mockNotificationService
}));
```

### LoggerService Mock

Complete mock for the logger service:

```javascript
// __tests__/mocks/loggerService.mock.js
import { vi } from 'vitest';

export const mockLoggerService = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(), // This was missing in many tests
    info: vi.fn(),
    trace: vi.fn(),
    
    // Configuration methods
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('debug'),
    
    // Utility methods
    group: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    
    // Helper for testing
    reset: () => {
        vi.clearAllMocks();
    }
};

// Usage in tests
vi.mock('../../../../src/core/services/loggerService.js', () => ({
    loggerService: mockLoggerService
}));
```

### StateService Mock

Mock for state management:

```javascript
// __tests__/mocks/stateService.mock.js
import { vi } from 'vitest';

const mockState = new Map();

export const mockStateService = {
    setState: vi.fn((key, value) => {
        mockState.set(key, value);
    }),
    getState: vi.fn((key) => {
        return mockState.get(key);
    }),
    updateState: vi.fn((key, updater) => {
        const current = mockState.get(key);
        const updated = typeof updater === 'function' ? updater(current) : updater;
        mockState.set(key, updated);
        return updated;
    }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    
    // Helper for testing
    reset: () => {
        mockState.clear();
        vi.clearAllMocks();
    },
    
    // Direct access to mock state for testing
    _getMockState: () => mockState
};

// Usage in tests
vi.mock('../../../../src/core/services/stateService.js', () => ({
    stateService: mockStateService
}));
```

## Feature Service Mocks

### Eventi Clinici API Mock

Complete mock for eventi-clinici API:

```javascript
// __tests__/mocks/eventiCliniciApi.mock.js
import { vi } from 'vitest';

export const mockEventiCliniciApi = {
    // Filter management - CRITICAL: Include all filter methods
    resetCurrentFiltersToDefaults: vi.fn(),
    resetFiltersUI: vi.fn(),
    getCurrentFilters: vi.fn().mockReturnValue({
        searchTerm: '',
        eventType: '',
        dateRange: null,
        department: ''
    }),
    applyFilters: vi.fn(),
    clearFilters: vi.fn(),
    setFilter: vi.fn(),
    
    // Data operations
    getEvents: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn().mockResolvedValue({ id: 'mock-event-id' }),
    updateEvent: vi.fn().mockResolvedValue({ id: 'mock-event-id' }),
    deleteEvent: vi.fn().mockResolvedValue(true),
    
    // Search and pagination
    searchEvents: vi.fn().mockResolvedValue([]),
    getEventsPaginated: vi.fn().mockResolvedValue({
        data: [],
        totalCount: 0,
        hasMore: false
    }),
    
    // Helper for testing
    reset: () => {
        vi.clearAllMocks();
    }
};

// Usage in tests
vi.mock('../../../../src/features/eventi-clinici/services/eventi-clinici-api.js', () => ({
    eventiCliniciApi: mockEventiCliniciApi,
    // Export individual functions that might be imported directly
    resetCurrentFiltersToDefaults: mockEventiCliniciApi.resetCurrentFiltersToDefaults,
    resetFiltersUI: mockEventiCliniciApi.resetFiltersUI,
    getCurrentFilters: mockEventiCliniciApi.getCurrentFilters
}));
```

### Patient Service Mock

Complete mock for patient operations:

```javascript
// __tests__/mocks/patientService.mock.js
import { vi } from 'vitest';

export const mockPatientService = {
    // CRUD operations
    getPatients: vi.fn().mockResolvedValue([]),
    getPatient: vi.fn().mockResolvedValue(null),
    createPatient: vi.fn().mockResolvedValue({ id: 'mock-patient-id' }),
    updatePatient: vi.fn().mockResolvedValue({ id: 'mock-patient-id' }),
    deletePatient: vi.fn().mockResolvedValue(true),
    
    // Status operations
    updatePatientStatus: vi.fn().mockResolvedValue(true),
    dischargePatient: vi.fn().mockResolvedValue(true),
    reactivatePatient: vi.fn().mockResolvedValue(true),
    
    // Search and filtering
    searchPatients: vi.fn().mockResolvedValue([]),
    getPatientsByStatus: vi.fn().mockResolvedValue([]),
    
    // Validation
    validatePatientData: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    
    // Helper for testing
    reset: () => {
        vi.clearAllMocks();
    }
};

// Usage in tests
vi.mock('../../../../src/features/patients/services/patientService.js', () => ({
    patientService: mockPatientService
}));
```

### Infection Data Manager Mock

Complete mock for infection data management:

```javascript
// __tests__/mocks/infectionDataManager.mock.js
import { vi } from 'vitest';

export const mockInfectionDataManager = {
    // Data retrieval
    getInfectionData: vi.fn().mockReturnValue(null),
    getAllInfectionData: vi.fn().mockReturnValue([]),
    
    // Data management
    setInfectionData: vi.fn(),
    clearInfectionData: vi.fn(),
    updateInfectionData: vi.fn(),
    
    // Validation
    hasValidInfectionData: vi.fn().mockReturnValue(false),
    hasInfectionData: vi.fn().mockReturnValue(false),
    validateInfectionData: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    
    // Data processing
    processInfectionData: vi.fn().mockReturnValue({}),
    formatInfectionData: vi.fn().mockReturnValue(''),
    
    // Storage
    saveInfectionData: vi.fn().mockResolvedValue(true),
    loadInfectionData: vi.fn().mockResolvedValue(null),
    
    // Helper for testing
    reset: () => {
        vi.clearAllMocks();
    }
};

// Usage in tests - CRITICAL: Use this exact pattern for form-ui-infection tests
vi.mock('../../../../src/features/patients/services/infectionDataManager.js', () => ({
    infectionDataManager: mockInfectionDataManager,
    // Export individual functions if imported directly
    getInfectionData: mockInfectionDataManager.getInfectionData,
    hasValidInfectionData: mockInfectionDataManager.hasValidInfectionData
}));
```

## Mock Implementation Patterns

### Pattern 1: Module-Level Mocking

Use this pattern when you need to mock an entire module:

```javascript
// At the top of your test file, before any imports
vi.mock('../../../../src/core/services/notificationService.js', () => ({
    notificationService: {
        success: vi.fn().mockReturnValue('mock-id'),
        error: vi.fn().mockReturnValue('mock-id'),
        // ... all other methods
    }
}));

// Then import and use normally
import { notificationService } from '../../../../src/core/services/notificationService.js';
```

### Pattern 2: Selective Method Mocking

Use this pattern when you only need to mock specific methods:

```javascript
import { loggerService } from '../../../../src/core/services/loggerService.js';

beforeEach(() => {
    // Mock only the methods you need
    vi.spyOn(loggerService, 'debug').mockImplementation(() => {});
    vi.spyOn(loggerService, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});
```

### Pattern 3: Dynamic Mock Configuration

Use this pattern when you need different mock behavior in different tests:

```javascript
const mockService = {
    someMethod: vi.fn()
};

beforeEach(() => {
    // Reset to default behavior
    mockService.someMethod.mockReturnValue('default');
});

it('should handle success case', () => {
    mockService.someMethod.mockReturnValue('success');
    // Test success scenario
});

it('should handle error case', () => {
    mockService.someMethod.mockRejectedValue(new Error('Test error'));
    // Test error scenario
});
```

### Pattern 4: Mock with State

Use this pattern when your mock needs to maintain state:

```javascript
const createStatefulMock = () => {
    const state = new Map();
    
    return {
        setState: vi.fn((key, value) => {
            state.set(key, value);
        }),
        getState: vi.fn((key) => {
            return state.get(key);
        }),
        clearState: vi.fn(() => {
            state.clear();
        }),
        // Expose state for testing
        _getInternalState: () => state
    };
};

const mockStateService = createStatefulMock();
```

## Common Mock Scenarios

### Scenario 1: Testing Notification Integration

```javascript
import { vi } from 'vitest';
import { mockNotificationService } from '../mocks/notificationService.mock.js';

// Mock the service
vi.mock('../../../../src/core/services/notificationService.js', () => ({
    notificationService: mockNotificationService
}));

describe('Component with Notifications', () => {
    beforeEach(() => {
        mockNotificationService.reset();
    });

    it('should show success notification', async () => {
        const component = new YourComponent();
        await component.performAction();
        
        expect(mockNotificationService.success).toHaveBeenCalledWith(
            'Operazione completata con successo'
        );
    });

    it('should show error notification on failure', async () => {
        // Configure mock to simulate error
        mockSomeService.performOperation.mockRejectedValue(new Error('Test error'));
        
        const component = new YourComponent();
        await component.performAction();
        
        expect(mockNotificationService.error).toHaveBeenCalledWith(
            'Errore durante l\'operazione'
        );
    });
});
```

### Scenario 2: Testing Form with Infection Data

```javascript
import { vi } from 'vitest';
import { mockInfectionDataManager } from '../mocks/infectionDataManager.mock.js';

// CRITICAL: Use this exact mock pattern for form-ui-infection tests
vi.mock('../../../../src/features/patients/services/infectionDataManager.js', () => ({
    infectionDataManager: mockInfectionDataManager
}));

describe('Form UI Infection', () => {
    beforeEach(() => {
        mockInfectionDataManager.reset();
    });

    it('should handle infection data validation', () => {
        // Configure mock behavior
        mockInfectionDataManager.hasValidInfectionData.mockReturnValue(true);
        mockInfectionDataManager.getInfectionData.mockReturnValue({
            type: 'surgical',
            severity: 'moderate'
        });
        
        const form = new InfectionForm();
        const isValid = form.validateData();
        
        expect(isValid).toBe(true);
        expect(mockInfectionDataManager.hasValidInfectionData).toHaveBeenCalled();
    });
});
```

### Scenario 3: Testing Eventi Clinici Filters

```javascript
import { vi } from 'vitest';
import { mockEventiCliniciApi } from '../mocks/eventiCliniciApi.mock.js';

// Mock the API with all required methods
vi.mock('../../../../src/features/eventi-clinici/services/eventi-clinici-api.js', () => ({
    eventiCliniciApi: mockEventiCliniciApi,
    resetCurrentFiltersToDefaults: mockEventiCliniciApi.resetCurrentFiltersToDefaults
}));

describe('Eventi Clinici Component', () => {
    beforeEach(() => {
        mockEventiCliniciApi.reset();
    });

    it('should reset filters to defaults', () => {
        const component = new EventiCliniciComponent();
        component.resetFilters();
        
        // CRITICAL: This method was missing in many tests
        expect(mockEventiCliniciApi.resetCurrentFiltersToDefaults).toHaveBeenCalled();
    });
});
```

### Scenario 4: Testing Timer-Based Components

```javascript
import { vi } from 'vitest';
import { mockNotificationService } from '../mocks/notificationService.mock.js';

vi.mock('../../../../src/core/services/notificationService.js', () => ({
    notificationService: mockNotificationService
}));

describe('Timer Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockNotificationService.reset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should handle timer operations', () => {
        const component = new TimerComponent();
        const notificationId = 'test-notification';
        
        component.pauseTimer(notificationId);
        expect(mockNotificationService.pauseAutoCloseTimer).toHaveBeenCalledWith(notificationId);
        
        component.resumeTimer(notificationId);
        expect(mockNotificationService.resumeAutoCloseTimer).toHaveBeenCalledWith(notificationId);
    });
});
```

## Mock Validation

### Validating Mock Completeness

Use this helper to ensure your mocks have all required methods:

```javascript
// __tests__/helpers/mockValidator.js
export function validateMockCompleteness(mock, requiredMethods) {
    const missingMethods = requiredMethods.filter(method => {
        return typeof mock[method] !== 'function';
    });
    
    if (missingMethods.length > 0) {
        throw new Error(`Mock is missing required methods: ${missingMethods.join(', ')}`);
    }
    
    return true;
}

// Usage in tests
import { validateMockCompleteness } from '../helpers/mockValidator.js';

describe('Service Mock Validation', () => {
    it('should have all required notification service methods', () => {
        const requiredMethods = [
            'init', 'success', 'error', 'warning', 'info',
            'clear', 'removeNotification', 'pauseAutoCloseTimer',
            'resumeAutoCloseTimer', 'startAutoCloseTimer', 'stopAutoCloseTimer'
        ];
        
        expect(() => {
            validateMockCompleteness(mockNotificationService, requiredMethods);
        }).not.toThrow();
    });
});
```

### Mock Behavior Verification

```javascript
describe('Mock Behavior Verification', () => {
    it('should maintain consistent mock behavior', () => {
        // Test that mocks return expected types
        expect(typeof mockNotificationService.success('test')).toBe('string');
        expect(mockNotificationService.timers).toBeInstanceOf(Map);
        
        // Test that mocks can be configured
        mockNotificationService.success.mockReturnValue('custom-id');
        expect(mockNotificationService.success('test')).toBe('custom-id');
    });
});
```

### Common Mock Validation Patterns

```javascript
// Validate mock was called with correct parameters
expect(mockService.method).toHaveBeenCalledWith(
    expect.objectContaining({
        id: expect.any(String),
        type: 'expected-type'
    })
);

// Validate mock was called correct number of times
expect(mockService.method).toHaveBeenCalledTimes(1);

// Validate mock call order
expect(mockService.firstMethod).toHaveBeenCalledBefore(mockService.secondMethod);

// Validate mock return value
const result = mockService.method();
expect(result).toEqual(expect.objectContaining({
    success: true,
    data: expect.any(Object)
}));
```

## Best Practices for Service Mocks

1. **Complete Method Coverage**: Always include ALL methods that your component uses
2. **Realistic Return Values**: Use return values that match the actual service
3. **State Management**: Use stateful mocks when the service maintains state
4. **Reset Between Tests**: Always reset mocks in `beforeEach` or `afterEach`
5. **Validation**: Validate that your mocks have all required methods
6. **Documentation**: Document any special mock behavior or requirements
7. **Consistency**: Use consistent mock patterns across your test suite

This guide ensures that all service mocks are complete, consistent, and properly implemented across the test suite.