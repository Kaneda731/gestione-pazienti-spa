// __tests__/unit/features/patients/views/dimissione-ui.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
    dom,
    initializeUI,
    cleanupUI,
    displayDischargeForm,
    resetView,
    showFeedback,
    handleDischargeTypeChange,
    initializeTransferFieldListeners,
    validateDischargeForm,
    getDischargeFormData
} from '@/features/patients/views/dimissione-ui.js';

// Mock dependencies utilizzate nel modulo UI
vi.mock('@/shared/components/forms/CustomDatepicker.js', () => ({
    default: vi.fn().mockImplementation(() => ({
        destroy: vi.fn()
    }))
}));

vi.mock('@/shared/components/forms/CustomSelect.js', () => ({
    initCustomSelects: vi.fn()
}));

vi.mock('@/shared/components/ui/PatientAutocomplete.js', () => ({
    attach: vi.fn().mockReturnValue({
        destroy: vi.fn()
    })
}));

vi.mock('@/core/services/notifications/notificationService.js', () => ({
    notificationService: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
    }
}));

describe('Enhanced Dimissione UI', () => {
    let mockDOM;
    let mockDocument;

    beforeEach(() => {
        // Create a mock DOM environment
        mockDOM = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="search-paziente" />
                <button id="search-button" />
                <div id="search-results"></div>
                <form id="form-dimissione" class="d-none">
                    <span id="selected-paziente-nome"></span>
                    <span id="selected-paziente-ricovero"></span>
                    <input id="data_dimissione" data-datepicker />
                    <select id="tipo_dimissione">
                        <option value="dimissione">Dimissione</option>
                        <option value="trasferimento_interno">Trasferimento Interno</option>
                        <option value="trasferimento_esterno">Trasferimento Esterno</option>
                    </select>
                    <div id="internal-transfer-fields" class="d-none">
                        <input id="reparto_destinazione" />
                    </div>
                    <div id="external-transfer-fields" class="d-none">
                        <input id="clinica_destinazione" />
                        <select id="codice_clinica">
                            <option value="">Seleziona</option>
                            <option value="56">56</option>
                            <option value="60">60</option>
                        </select>
                    </div>
                    <select id="codice_dimissione">
                        <option value="">Seleziona</option>
                        <option value="3">3</option>
                        <option value="6">6</option>
                    </select>
                </form>
                <div id="messaggio-container-dimissione"></div>
            </body>
            </html>
        `);
        
        mockDocument = mockDOM.window.document;
        global.document = mockDocument;
        global.window = mockDOM.window;
    });

    afterEach(() => {
        cleanupUI();
        vi.clearAllMocks();
    });

    describe('DOM element access', () => {
        it('should access all enhanced DOM elements correctly', () => {
            expect(dom.tipoDimissioneSelect).toBeTruthy();
            expect(dom.repartoDestinazioneInput).toBeTruthy();
            expect(dom.clinicaDestinazioneInput).toBeTruthy();
            expect(dom.codiceClinicaSelect).toBeTruthy();
            expect(dom.codiceDimissioneSelect).toBeTruthy();
            expect(dom.internalTransferFields).toBeTruthy();
            expect(dom.externalTransferFields).toBeTruthy();
        });
    });

    describe('handleDischargeTypeChange', () => {
        it('should show internal transfer fields for trasferimento_interno', () => {
            handleDischargeTypeChange('trasferimento_interno');
            
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(false);
            expect(dom.externalTransferFields.classList.contains('d-none')).toBe(true);
            expect(dom.repartoDestinazioneInput.required).toBe(true);
        });

        it('should show external transfer fields for trasferimento_esterno', () => {
            handleDischargeTypeChange('trasferimento_esterno');
            
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(true);
            expect(dom.externalTransferFields.classList.contains('d-none')).toBe(false);
            expect(dom.clinicaDestinazioneInput.required).toBe(true);
            expect(dom.codiceClinicaSelect.required).toBe(true);
        });

        it('should hide all transfer fields for dimissione', () => {
            handleDischargeTypeChange('dimissione');
            
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(true);
            expect(dom.externalTransferFields.classList.contains('d-none')).toBe(true);
            expect(dom.repartoDestinazioneInput.required).toBe(false);
            expect(dom.clinicaDestinazioneInput.required).toBe(false);
            expect(dom.codiceClinicaSelect.required).toBe(false);
        });

        it('should always require codice_dimissione', () => {
            handleDischargeTypeChange('dimissione');
            expect(dom.codiceDimissioneSelect.required).toBe(true);
            
            handleDischargeTypeChange('trasferimento_interno');
            expect(dom.codiceDimissioneSelect.required).toBe(true);
            
            handleDischargeTypeChange('trasferimento_esterno');
            expect(dom.codiceDimissioneSelect.required).toBe(true);
        });
    });

    describe('validateDischargeForm', () => {
        beforeEach(() => {
            // Set up basic required fields
            dom.dataDimissioneInput.value = '01/01/2025';
            dom.tipoDimissioneSelect.value = 'dimissione';
            dom.codiceDimissioneSelect.value = '3';
        });

        it('should validate basic discharge form successfully', () => {
            const result = validateDischargeForm();
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require data_dimissione', () => {
            dom.dataDimissioneInput.value = '';
            const result = validateDischargeForm();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('La data di dimissione è obbligatoria');
        });

        it('should require tipo_dimissione', () => {
            dom.tipoDimissioneSelect.value = '';
            const result = validateDischargeForm();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Il tipo di dimissione è obbligatorio');
        });

        it('should require codice_dimissione', () => {
            dom.codiceDimissioneSelect.value = '';
            const result = validateDischargeForm();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Il codice dimissione è obbligatorio');
        });

        it('should validate internal transfer fields', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_interno';
            dom.repartoDestinazioneInput.value = '';
            
            const result = validateDischargeForm();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
        });

        it('should validate external transfer fields', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_esterno';
            dom.clinicaDestinazioneInput.value = '';
            dom.codiceClinicaSelect.value = '';
            
            const result = validateDischargeForm();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('La clinica di destinazione è obbligatoria per i trasferimenti esterni');
            expect(result.errors).toContain('Il codice clinica è obbligatorio per i trasferimenti esterni');
        });

        it('should pass validation for complete internal transfer', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_interno';
            dom.repartoDestinazioneInput.value = 'Cardiologia';
            
            const result = validateDischargeForm();
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation for complete external transfer', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_esterno';
            dom.clinicaDestinazioneInput.value = 'Clinica San Giuseppe';
            dom.codiceClinicaSelect.value = '56';
            
            const result = validateDischargeForm();
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('getDischargeFormData', () => {
        beforeEach(() => {
            dom.dataDimissioneInput.value = '01/01/2025';
            dom.codiceDimissioneSelect.value = '3';
        });

        it('should collect basic discharge data', () => {
            dom.tipoDimissioneSelect.value = 'dimissione';
            
            const data = getDischargeFormData();
            expect(data).toEqual({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            });
        });

        it('should collect internal transfer data', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_interno';
            dom.repartoDestinazioneInput.value = 'Cardiologia';
            
            const data = getDischargeFormData();
            expect(data).toEqual({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_interno',
                codice_dimissione: '3',
                reparto_destinazione: 'Cardiologia'
            });
        });

        it('should collect external transfer data', () => {
            dom.tipoDimissioneSelect.value = 'trasferimento_esterno';
            dom.clinicaDestinazioneInput.value = 'Clinica San Giuseppe';
            dom.codiceClinicaSelect.value = '56';
            
            const data = getDischargeFormData();
            expect(data).toEqual({
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '3',
                clinica_destinazione: 'Clinica San Giuseppe',
                codice_clinica: '56'
            });
        });
    });

    describe('resetView', () => {
        it('should reset all form fields including transfer fields', () => {
            // Set some values
            dom.dataDimissioneInput.value = '01/01/2025';
            dom.tipoDimissioneSelect.value = 'trasferimento_interno';
            dom.repartoDestinazioneInput.value = 'Cardiologia';
            dom.clinicaDestinazioneInput.value = 'Clinica Test';
            dom.codiceClinicaSelect.value = '56';
            dom.codiceDimissioneSelect.value = '3';
            
            resetView();
            
            expect(dom.dataDimissioneInput.value).toBe('');
            expect(dom.tipoDimissioneSelect.value).toBe('dimissione');
            expect(dom.repartoDestinazioneInput.value).toBe('');
            expect(dom.clinicaDestinazioneInput.value).toBe('');
            expect(dom.codiceClinicaSelect.value).toBe('');
            expect(dom.codiceDimissioneSelect.value).toBe('');
        });

        it('should hide transfer fields after reset', () => {
            // Show some transfer fields first
            handleDischargeTypeChange('trasferimento_interno');
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(false);
            
            resetView();
            
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(true);
            expect(dom.externalTransferFields.classList.contains('d-none')).toBe(true);
        });
    });

    describe('initializeTransferFieldListeners', () => {
        it('should add change listener to tipo_dimissione select', () => {
            const addEventListenerSpy = vi.spyOn(dom.tipoDimissioneSelect, 'addEventListener');
            
            initializeTransferFieldListeners();
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should trigger handleDischargeTypeChange on select change', () => {
            initializeTransferFieldListeners();
            
            // Simulate change event
            dom.tipoDimissioneSelect.value = 'trasferimento_interno';
            dom.tipoDimissioneSelect.dispatchEvent(new mockDOM.window.Event('change'));
            
            // Check that internal transfer fields are shown
            expect(dom.internalTransferFields.classList.contains('d-none')).toBe(false);
        });
    });
});