// __tests__/unit/features/patients/views/dimissione.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock dependencies (uso alias '@')
vi.mock('@/features/patients/views/dimissione-api.js', () => ({
    dischargePatientWithTransfer: vi.fn()
}));

vi.mock('@/features/patients/views/dimissione-ui.js', () => ({
    dom: {
        searchInput: null,
        dischargeForm: null,
        dataDimissioneInput: null,
        tipoDimissioneSelect: null,
        repartoDestinazioneInput: null,
        clinicaDestinazioneInput: null
    },
    initializeUI: vi.fn(),
    cleanupUI: vi.fn(),
    displayDischargeForm: vi.fn(),
    resetView: vi.fn(),
    showFeedback: vi.fn(),
    validateDischargeForm: vi.fn(),
    getDischargeFormData: vi.fn()
}));

describe('Enhanced Dimissione Controller', () => {
    let mockDOM;
    let mockDocument;
    let initDimissioneView;
    let dischargePatientWithTransfer;
    let dimissioneUI;

    beforeEach(async () => {
        // Create a mock DOM environment
        mockDOM = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="search-paziente" />
                <form id="form-dimissione" class="d-none">
                    <input id="data_dimissione" />
                    <select id="tipo_dimissione">
                        <option value="dimissione">Dimissione</option>
                        <option value="trasferimento_interno">Trasferimento Interno</option>
                        <option value="trasferimento_esterno">Trasferimento Esterno</option>
                    </select>
                    <input id="reparto_destinazione" />
                    <input id="clinica_destinazione" />
                </form>
            </body>
            </html>
        `);
        
        mockDocument = mockDOM.window.document;
        global.document = mockDocument;
        global.window = mockDOM.window;
        global.setTimeout = vi.fn((fn) => fn());

        // Import modules after setting up mocks (uso alias '@')
        const apiModule = await import('@/features/patients/views/dimissione-api.js');
        const uiModule = await import('@/features/patients/views/dimissione-ui.js');
        const controllerModule = await import('@/features/patients/views/dimissione.js');

        dischargePatientWithTransfer = apiModule.dischargePatientWithTransfer;
        dimissioneUI = uiModule;
        initDimissioneView = controllerModule.initDimissioneView;

        // Update DOM references in the UI mock
        dimissioneUI.dom.searchInput = mockDocument.getElementById('search-paziente');
        dimissioneUI.dom.dischargeForm = mockDocument.getElementById('form-dimissione');
        dimissioneUI.dom.dataDimissioneInput = mockDocument.getElementById('data_dimissione');
        dimissioneUI.dom.tipoDimissioneSelect = mockDocument.getElementById('tipo_dimissione');
        dimissioneUI.dom.repartoDestinazioneInput = mockDocument.getElementById('reparto_destinazione');
        dimissioneUI.dom.clinicaDestinazioneInput = mockDocument.getElementById('clinica_destinazione');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initDimissioneView', () => {
        it('should initialize the view correctly', () => {
            const cleanup = initDimissioneView();
            
            expect(dimissioneUI.initializeUI).toHaveBeenCalled();
            expect(typeof cleanup).toBe('function');
        });

        it('should focus on search input if available', () => {
            const focusSpy = vi.spyOn(dimissioneUI.dom.searchInput, 'focus');
            
            initDimissioneView();
            
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe('form submission', () => {
        let cleanup;

        beforeEach(() => {
            cleanup = initDimissioneView();
            
            // Mock successful validation and form data
            dimissioneUI.validateDischargeForm.mockReturnValue({
                isValid: true,
                errors: []
            });
            
            dimissioneUI.getDischargeFormData.mockReturnValue({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            });
        });

        afterEach(() => {
            if (cleanup) cleanup();
        });

        it('should handle successful basic discharge', async () => {
            // Set up a selected patient
            const mockPatient = { id: 'patient-123', nome: 'Mario', cognome: 'Rossi' };
            
            // Simula la selezione paziente invocando la callback onSelectPatient
            const onSelectPatient = dimissioneUI.initializeUI.mock.calls[0][0];
            onSelectPatient(mockPatient);
            
            // Mock successful discharge
            dischargePatientWithTransfer.mockResolvedValue({});
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dischargePatientWithTransfer).toHaveBeenCalledWith('patient-123', {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            });
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Paziente dimesso con successo!',
                'success'
            );
            
            expect(dimissioneUI.resetView).toHaveBeenCalled();
        });

        it('should handle successful internal transfer', async () => {
            const mockPatient = { id: 'patient-123', nome: 'Mario', cognome: 'Rossi' };
            
            // Simula selezione paziente
            const onSelectPatient = dimissioneUI.initializeUI.mock.calls[0][0];
            onSelectPatient(mockPatient);
            
            // Mock internal transfer data
            dimissioneUI.getDischargeFormData.mockReturnValue({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_interno',
                codice_dimissione: '6',
                reparto_destinazione: 'Cardiologia'
            });
            
            dischargePatientWithTransfer.mockResolvedValue({});
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Paziente trasferito con successo al reparto Cardiologia!',
                'success'
            );
        });

        it('should handle successful external transfer', async () => {
            const mockPatient = { id: 'patient-123', nome: 'Mario', cognome: 'Rossi' };
            
            // Simula selezione paziente
            const onSelectPatient = dimissioneUI.initializeUI.mock.calls[0][0];
            onSelectPatient(mockPatient);
            
            // Mock external transfer data
            dimissioneUI.getDischargeFormData.mockReturnValue({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '6',
                clinica_destinazione: 'Clinica San Giuseppe',
                codice_clinica: '56'
            });
            
            dischargePatientWithTransfer.mockResolvedValue({});
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Paziente trasferito con successo alla clinica Clinica San Giuseppe!',
                'success'
            );
        });

        it('should handle validation errors', async () => {
            const mockPatient = { id: 'patient-123', nome: 'Mario', cognome: 'Rossi' };
            
            // Selezione paziente
            const onSelectPatient = dimissioneUI.initializeUI.mock.calls[0][0];
            onSelectPatient(mockPatient);
            
            // Mock validation failure
            dimissioneUI.validateDischargeForm.mockReturnValue({
                isValid: false,
                errors: ['La data di dimissione è obbligatoria', 'Il tipo di dimissione è obbligatorio']
            });
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Errori di validazione: La data di dimissione è obbligatoria, Il tipo di dimissione è obbligatorio',
                'error'
            );
            
            expect(dischargePatientWithTransfer).not.toHaveBeenCalled();
        });

        it('should handle no selected patient', async () => {
            // Don't select any patient
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Seleziona un paziente prima di procedere.',
                'warning'
            );
            
            expect(dischargePatientWithTransfer).not.toHaveBeenCalled();
        });

        it('should handle API errors', async () => {
            const mockPatient = { id: 'patient-123', nome: 'Mario', cognome: 'Rossi' };
            
            // Selezione paziente
            const onSelectPatient = dimissioneUI.initializeUI.mock.calls[0][0];
            onSelectPatient(mockPatient);
            
            // Mock API error
            dischargePatientWithTransfer.mockRejectedValue(new Error('Database connection failed'));
            
            // Trigger form submission
            const submitEvent = new mockDOM.window.Event('submit');
            submitEvent.preventDefault = vi.fn();
            
            dimissioneUI.dom.dischargeForm.dispatchEvent(submitEvent);
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(dimissioneUI.showFeedback).toHaveBeenCalledWith(
                'Database connection failed',
                'error'
            );
            
            expect(dimissioneUI.resetView).not.toHaveBeenCalled();
        });
    });
    // Ricerca gestita da Autocomplete: test legacy rimossi
});