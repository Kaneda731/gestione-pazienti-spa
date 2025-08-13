// __tests__/unit/features/patients/views/form-ui-infection.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock delle dipendenze
vi.mock('../../../../../src/features/eventi-clinici/components/InfectionEventModal.js', () => ({
    InfectionEventModal: vi.fn().mockImplementation(() => ({
        show: vi.fn().mockResolvedValue({
            data_evento: '2024-01-15',
            agente_patogeno: 'Staphylococcus aureus',
            descrizione: 'Test infection'
        })
    }))
}));

vi.mock('../../../../../src/features/patients/services/infectionDataManager.js', () => ({
    default: {
        setInfectionData: vi.fn(),
        getInfectionData: vi.fn(),
        clearInfectionData: vi.fn(),
        hasValidInfectionData: vi.fn(),
        hasInfectionData: vi.fn(),
        validateInfectionData: vi.fn()
    }
}));

vi.mock('../../../../../src/core/services/notificationService.js', () => ({
    notificationService: {
        error: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
    }
}));

vi.mock('../../../../../src/features/patients/views/eventi-clinici-tab.js', () => ({
    initEventiCliniciTab: vi.fn(),
    setCurrentPatient: vi.fn(),
    cleanupEventiCliniciTab: vi.fn(),
    isPatientCurrentlyInfected: vi.fn().mockReturnValue(false)
}));

vi.mock('../../../../../src/shared/components/forms/CustomSelect.js', () => ({
    initCustomSelects: vi.fn(),
    updateCustomSelect: vi.fn()
}));

vi.mock('../../../../../src/shared/components/forms/CustomDatepicker.js', () => ({
    default: vi.fn().mockImplementation(() => ({
        destroy: vi.fn()
    }))
}));

vi.mock('../../../../../src/shared/utils/domSecurity.js', () => ({
    sanitizeHtml: vi.fn(html => html)
}));

// Import delle funzioni da testare dopo i mock
import {
    setupInfectionFlagHandler,
    showInfectionModal,
    getInfectionData,
    clearInfectionData,
    hasValidInfectionData,
    hasInfectionData
} from '../../../../../src/features/patients/views/form-ui.js';

// Import dei mock per i test
import infectionDataManager from '../../../../../src/features/patients/services/infectionDataManager.js';
import { notificationService } from '../../../../../src/core/services/notificationService.js';
import { InfectionEventModal } from '../../../../../src/features/eventi-clinici/components/InfectionEventModal.js';

// Create reference to the mocked infectionDataManager for tests
const mockInfectionDataManager = infectionDataManager;

describe('Form UI - Infection Flag Handling', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Setup DOM
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <form id="form-inserimento">
                    <input type="hidden" id="paziente-id" name="id">
                    <input type="text" id="nome" name="nome" value="">
                    <input type="text" id="cognome" name="cognome" value="">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="infetto" name="infetto">
                        <label class="form-check-label" for="infetto">Paziente Infetto</label>
                    </div>
                    <small id="infetto-helper-text" class="form-text text-muted" style="display: none;"></small>
                </form>
            </body>
            </html>
        `);
        
        document = dom.window.document;
        window = dom.window;
        
        // Setup global DOM
        global.document = document;
        global.window = window;
        global.HTMLElement = window.HTMLElement;
        global.Event = window.Event;
    });

    afterEach(() => {
        dom?.window?.close();
    });

    describe('setupInfectionFlagHandler', () => {
        it('should setup event listener for infection checkbox', () => {
            const checkbox = document.getElementById('infetto');
            const addEventListenerSpy = vi.spyOn(checkbox, 'addEventListener');

            setupInfectionFlagHandler();

            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should handle missing checkbox gracefully', () => {
            // Remove checkbox from DOM
            document.getElementById('infetto').remove();

            expect(() => setupInfectionFlagHandler()).not.toThrow();
        });

        it('should add visual indicator when infection data exists', () => {
            infectionDataManager.hasInfectionData.mockReturnValue(true);
            infectionDataManager.hasValidInfectionData.mockReturnValue(true);
            infectionDataManager.getInfectionData.mockReturnValue({
                data_evento: '2024-01-15',
                agente_patogeno: 'Test pathogen'
            });

            setupInfectionFlagHandler();

            const label = document.querySelector('label[for="infetto"]');
            const badge = label.querySelector('.infection-data-badge');
            expect(badge).toBeTruthy();
            expect(badge.classList.contains('bg-success')).toBe(true);
        });
    });

    describe('showInfectionModal', () => {
        it('should create and show infection modal with patient name', async () => {
            document.getElementById('nome').value = 'Mario';
            document.getElementById('cognome').value = 'Rossi';

            await showInfectionModal();

            expect(InfectionEventModal).toHaveBeenCalledWith({
                title: 'Dati Infezione Paziente',
                patientName: 'Mario Rossi',
                defaultDate: expect.any(String)
            });
        });

        it('should handle empty patient name', async () => {
            await showInfectionModal();

            expect(InfectionEventModal).toHaveBeenCalledWith({
                title: 'Dati Infezione Paziente',
                patientName: 'Nuovo Paziente',
                defaultDate: expect.any(String)
            });
        });

        it('should use existing infection data as default', async () => {
            infectionDataManager.getInfectionData.mockReturnValue({
                data_evento: '2024-01-15'
            });

            await showInfectionModal();

            expect(InfectionEventModal).toHaveBeenCalledWith({
                title: 'Dati Infezione Paziente',
                patientName: 'Nuovo Paziente',
                defaultDate: '2024-01-15'
            });
        });
    });

    describe('getInfectionData', () => {
        it('should return data from infection data manager', () => {
            const mockData = { data_evento: '2024-01-15', agente_patogeno: 'Test' };
            mockInfectionDataManager.getInfectionData.mockReturnValue(mockData);

            const result = getInfectionData();

            expect(result).toEqual(mockData);
            expect(mockInfectionDataManager.getInfectionData).toHaveBeenCalled();
        });
    });

    describe('clearInfectionData', () => {
        it('should clear data and uncheck checkbox', () => {
            const checkbox = document.getElementById('infetto');
            checkbox.checked = true;

            clearInfectionData();

            expect(mockInfectionDataManager.clearInfectionData).toHaveBeenCalled();
            expect(checkbox.checked).toBe(false);
        });

        it('should handle missing checkbox gracefully', () => {
            document.getElementById('infetto').remove();

            expect(() => clearInfectionData()).not.toThrow();
            expect(mockInfectionDataManager.clearInfectionData).toHaveBeenCalled();
        });
    });

    describe('hasValidInfectionData', () => {
        it('should return value from infection data manager', () => {
            mockInfectionDataManager.hasValidInfectionData.mockReturnValue(true);

            const result = hasValidInfectionData();

            expect(result).toBe(true);
            expect(mockInfectionDataManager.hasValidInfectionData).toHaveBeenCalled();
        });
    });

    describe('hasInfectionData', () => {
        it('should return value from infection data manager', () => {
            mockInfectionDataManager.hasInfectionData.mockReturnValue(true);

            const result = hasInfectionData();

            expect(result).toBe(true);
            expect(mockInfectionDataManager.hasInfectionData).toHaveBeenCalled();
        });
    });

    describe('Visual indicator functionality', () => {
        it('should add success badge when infection data is valid', () => {
            mockInfectionDataManager.hasInfectionData.mockReturnValue(true);
            mockInfectionDataManager.hasValidInfectionData.mockReturnValue(true);
            mockInfectionDataManager.getInfectionData.mockReturnValue({
                data_evento: '2024-01-15',
                agente_patogeno: 'Test pathogen'
            });

            setupInfectionFlagHandler();

            const label = document.querySelector('label[for="infetto"]');
            const badge = label.querySelector('.infection-data-badge');
            
            expect(badge).toBeTruthy();
            expect(badge.classList.contains('bg-success')).toBe(true);
            expect(badge.textContent).toContain('Dati inseriti');
        });

        it('should add warning badge when infection data is invalid', () => {
            mockInfectionDataManager.hasInfectionData.mockReturnValue(true);
            mockInfectionDataManager.hasValidInfectionData.mockReturnValue(false);

            setupInfectionFlagHandler();

            const label = document.querySelector('label[for="infetto"]');
            const badge = label.querySelector('.infection-data-badge');
            
            expect(badge).toBeTruthy();
            expect(badge.classList.contains('bg-warning')).toBe(true);
            expect(badge.textContent).toContain('Dati incompleti');
        });
    });

    describe('Basic functionality', () => {
        it('should handle checkbox state changes', () => {
            setupInfectionFlagHandler();

            const checkbox = document.getElementById('infetto');
            
            // Test unchecking
            checkbox.checked = false;
            checkbox.dispatchEvent(new window.Event('change'));

            expect(mockInfectionDataManager.clearInfectionData).toHaveBeenCalled();
        });

        it('should handle missing elements gracefully', () => {
            document.getElementById('infetto').remove();
            
            expect(() => {
                clearInfectionData();
                hasInfectionData();
                hasValidInfectionData();
                getInfectionData();
            }).not.toThrow();
        });
    });
});