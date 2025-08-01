/**
 * Unit tests for EventiFormManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import EventiFormManager from '../../../../../src/features/eventi-clinici/components/eventi-form-manager.js';

// Mock the form components
vi.mock('../../../../../src/shared/components/forms/CustomSelect.js', () => ({
    CustomSelect: vi.fn().mockImplementation(() => ({
        setValue: vi.fn(),
        destroy: vi.fn()
    })),
    initCustomSelects: vi.fn()
}));

vi.mock('../../../../../src/shared/components/forms/CustomDatepicker.js', () => ({
    initCustomDatepickers: vi.fn().mockReturnValue({
        destroy: vi.fn()
    })
}));

describe('EventiFormManager', () => {
    let dom;
    let formManager;
    let mockForm;

    beforeEach(() => {
        // Setup DOM
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <form id="evento-form">
                    <input type="hidden" id="evento-id" name="id">
                    <div id="evento-messaggio-container"></div>
                    
                    <input type="text" id="evento-paziente" placeholder="Cerca paziente..." required>
                    <input type="hidden" id="evento-paziente-id" name="paziente_id">
                    <div id="evento-patient-search-results" class="dropdown-menu" style="display: none;"></div>
                    
                    <select id="evento-tipo" name="tipo_evento" required data-custom="true">
                        <option value="">Seleziona tipo...</option>
                        <option value="intervento">Intervento Chirurgico</option>
                        <option value="infezione">Infezione</option>
                    </select>
                    
                    <input type="text" id="evento-data" name="data_evento" data-datepicker required>
                    <textarea id="evento-descrizione" name="descrizione"></textarea>
                    
                    <div id="intervento-fields" style="display: none;">
                        <select id="evento-tipo-intervento" name="tipo_intervento" data-custom="true">
                            <option value="">Seleziona tipo intervento...</option>
                            <option value="Chirurgia Ortopedica">Chirurgia Ortopedica</option>
                            <option value="Chirurgia Plastica">Chirurgia Plastica</option>
                        </select>
                    </div>
                    
                    <div id="infezione-fields" style="display: none;">
                        <input type="text" id="evento-agente-patogeno" name="agente_patogeno">
                    </div>
                </form>
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;
        global.window.appLogger = {
            debug: vi.fn(),
            error: vi.fn()
        };

        mockForm = document.querySelector('#evento-form');
        
        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (formManager) {
            formManager.destroy();
        }
    });

    describe('Initialization', () => {
        it('should initialize successfully with valid form selector', () => {
            expect(() => {
                formManager = new EventiFormManager('#evento-form');
            }).not.toThrow();
            
            expect(formManager.formElement).toBe(mockForm);
            expect(formManager.currentEventType).toBe('');
        });

        it('should throw error with invalid form selector', () => {
            expect(() => {
                new EventiFormManager('#non-existent-form');
            }).toThrow('Form element not found: #non-existent-form');
        });

        it('should setup form elements correctly', () => {
            formManager = new EventiFormManager('#evento-form');
            
            expect(formManager.elements.form).toBe(mockForm);
            expect(formManager.elements.pazienteInput).toBeTruthy();
            expect(formManager.elements.tipoEvento).toBeTruthy();
            expect(formManager.elements.dataEvento).toBeTruthy();
        });

        it('should initialize with custom options', () => {
            const options = {
                onSubmit: vi.fn(),
                onValidationError: vi.fn(),
                onFieldChange: vi.fn()
            };

            formManager = new EventiFormManager('#evento-form', options);
            
            expect(formManager.options.onSubmit).toBe(options.onSubmit);
            expect(formManager.options.onValidationError).toBe(options.onValidationError);
            expect(formManager.options.onFieldChange).toBe(options.onFieldChange);
        });
    });

    describe('Event Type Handling', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should show intervention fields when intervention type is selected', () => {
            formManager.handleEventTypeChange('intervento');
            
            expect(formManager.currentEventType).toBe('intervento');
            expect(formManager.elements.interventoFields.style.display).toBe('block');
            expect(formManager.elements.infezioneFields.style.display).toBe('none');
        });

        it('should show infection fields when infection type is selected', () => {
            formManager.handleEventTypeChange('infezione');
            
            expect(formManager.currentEventType).toBe('infezione');
            expect(formManager.elements.infezioneFields.style.display).toBe('block');
            expect(formManager.elements.interventoFields.style.display).toBe('none');
        });

        it('should hide all conditional fields when no type is selected', () => {
            formManager.handleEventTypeChange('');
            
            expect(formManager.currentEventType).toBe('');
            expect(formManager.elements.interventoFields.style.display).toBe('none');
            expect(formManager.elements.infezioneFields.style.display).toBe('none');
        });

        it('should clear hidden field values when switching event types', () => {
            // Set some values
            formManager.elements.tipoIntervento.value = 'Chirurgia Ortopedica';
            formManager.elements.agentePatogeno.value = 'Test pathogen';
            
            // Switch to intervention - should clear infection fields
            formManager.handleEventTypeChange('intervento');
            expect(formManager.elements.agentePatogeno.value).toBe('');
            
            // Switch to infection - should clear intervention fields
            formManager.handleEventTypeChange('infezione');
            expect(formManager.elements.tipoIntervento.value).toBe('');
        });

        it('should update form validation based on event type', () => {
            formManager.handleEventTypeChange('intervento');
            expect(formManager.elements.tipoIntervento.required).toBe(true);
            
            formManager.handleEventTypeChange('infezione');
            expect(formManager.elements.tipoIntervento.required).toBe(false);
        });
    });

    describe('Patient Search', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should not search with short search terms', async () => {
            const spy = vi.spyOn(formManager, 'performPatientSearch');
            
            await formManager.handlePatientSearch('a');
            vi.runAllTimers();
            
            expect(spy).not.toHaveBeenCalled();
        });

        it('should debounce search requests', async () => {
            const spy = vi.spyOn(formManager, 'performPatientSearch');
            
            formManager.handlePatientSearch('test');
            formManager.handlePatientSearch('test patient');
            
            vi.runAllTimers();
            
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('test patient');
        });

        it('should display patient search results', () => {
            const mockPatients = [
                {
                    id: '1',
                    nome: 'Mario',
                    cognome: 'Rossi',
                    codice_rad: 'RAD001',
                    data_nascita: '1980-01-01',
                    reparto: 'Cardiologia'
                },
                {
                    id: '2',
                    nome: 'Luigi',
                    cognome: 'Verdi',
                    codice_rad: 'RAD002',
                    data_nascita: '1975-05-15',
                    reparto: 'Ortopedia'
                }
            ];

            formManager.displayPatientSearchResults(mockPatients);
            
            const results = formManager.elements.patientSearchResults;
            expect(results.style.display).toBe('block');
            expect(results.children.length).toBe(2);
            expect(results.innerHTML).toContain('Mario Rossi');
            expect(results.innerHTML).toContain('Luigi Verdi');
        });

        it('should select patient when clicked', () => {
            const mockPatient = {
                id: '1',
                nome: 'Mario',
                cognome: 'Rossi',
                codice_rad: 'RAD001'
            };

            formManager.selectPatient(mockPatient);
            
            expect(formManager.selectedPatient).toBe(mockPatient);
            expect(formManager.elements.pazienteInput.value).toBe('Mario Rossi');
            expect(formManager.elements.pazienteIdInput.value).toBe('1');
        });

        it('should hide search results when patient is selected', () => {
            const mockPatient = { id: '1', nome: 'Mario', cognome: 'Rossi' };
            
            formManager.selectPatient(mockPatient);
            
            expect(formManager.elements.patientSearchResults.style.display).toBe('none');
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should validate required fields', () => {
            const formData = {
                paziente_id: '',
                tipo_evento: '',
                data_evento: ''
            };

            const result = formManager.validateForm(formData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3);
            expect(result.errors.map(e => e.field)).toContain('paziente_id');
            expect(result.errors.map(e => e.field)).toContain('tipo_evento');
            expect(result.errors.map(e => e.field)).toContain('data_evento');
        });

        it('should validate conditional required fields for interventions', () => {
            const formData = {
                paziente_id: '1',
                tipo_evento: 'intervento',
                data_evento: '01/01/2024',
                tipo_intervento: ''
            };

            const result = formManager.validateForm(formData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'tipo_intervento')).toBe(true);
        });

        it('should not require intervention type for infections', () => {
            const formData = {
                paziente_id: '1',
                tipo_evento: 'infezione',
                data_evento: '01/01/2024'
            };

            const result = formManager.validateForm(formData);
            
            expect(result.isValid).toBe(true);
        });

        it('should validate date format and future dates', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const futureDate = `${tomorrow.getDate().toString().padStart(2, '0')}/${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}/${tomorrow.getFullYear()}`;

            const formData = {
                paziente_id: '1',
                tipo_evento: 'intervento',
                data_evento: futureDate,
                tipo_intervento: 'Chirurgia Ortopedica'
            };

            const result = formManager.validateForm(formData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'data_evento')).toBe(true);
        });

        it('should accept valid past dates', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const pastDate = `${yesterday.getDate().toString().padStart(2, '0')}/${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getFullYear()}`;

            const formData = {
                paziente_id: '1',
                tipo_evento: 'intervento',
                data_evento: pastDate,
                tipo_intervento: 'Chirurgia Ortopedica'
            };

            const result = formManager.validateForm(formData);
            
            expect(result.isValid).toBe(true);
        });
    });

    describe('Form Data Handling', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should get form data correctly', () => {
            // Set form values
            formManager.elements.pazienteIdInput.value = '1';
            formManager.elements.tipoEvento.value = 'intervento';
            formManager.elements.dataEvento.value = '15/03/2024';
            formManager.elements.descrizione.value = 'Test description';
            formManager.elements.tipoIntervento.value = 'Chirurgia Ortopedica';

            const formData = formManager.getFormData();
            
            expect(formData.paziente_id).toBe('1');
            expect(formData.tipo_evento).toBe('intervento');
            // Use the actual converted date to avoid timezone issues
            expect(formData.data_evento).toBe(formManager.convertDateToISO('15/03/2024'));
            expect(formData.descrizione).toBe('Test description');
            expect(formData.tipo_intervento).toBe('Chirurgia Ortopedica');
        });

        it('should set form data correctly', () => {
            const mockData = {
                id: '123',
                paziente_id: '1',
                paziente_nome: 'Mario Rossi',
                tipo_evento: 'infezione',
                data_evento: '2024-03-15',
                descrizione: 'Test infection',
                agente_patogeno: 'E. coli'
            };

            formManager.setFormData(mockData);
            
            expect(formManager.elements.eventoId.value).toBe('123');
            expect(formManager.elements.pazienteIdInput.value).toBe('1');
            expect(formManager.elements.pazienteInput.value).toBe('Mario Rossi');
            expect(formManager.elements.tipoEvento.value).toBe('infezione');
            expect(formManager.elements.dataEvento.value).toBe('15/03/2024');
            expect(formManager.elements.descrizione.value).toBe('Test infection');
            expect(formManager.elements.agentePatogeno.value).toBe('E. coli');
        });

        it('should reset form correctly', () => {
            // Set some values first
            formManager.elements.pazienteInput.value = 'Test Patient';
            formManager.elements.tipoEvento.value = 'intervento';
            formManager.currentEventType = 'intervento';
            formManager.selectedPatient = { id: '1', nome: 'Test' };

            formManager.reset();
            
            expect(formManager.selectedPatient).toBeNull();
            expect(formManager.currentEventType).toBe('');
            expect(formManager.elements.patientSearchResults.style.display).toBe('none');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should display field errors', () => {
            formManager.showFieldError('tipo_evento', 'Test error message');
            
            const field = formManager.elements.tipoEvento;
            expect(field.classList.contains('is-invalid')).toBe(true);
            
            const errorElement = field.parentNode.querySelector('.invalid-feedback');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toBe('Test error message');
        });

        it('should clear field errors', () => {
            const field = formManager.elements.tipoEvento;
            field.classList.add('is-invalid');
            
            const errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            errorElement.textContent = 'Error message';
            field.parentNode.appendChild(errorElement);
            
            formManager.clearFieldError(field);
            
            expect(field.classList.contains('is-invalid')).toBe(false);
            expect(field.parentNode.querySelector('.invalid-feedback')).toBeNull();
        });

        it('should display validation errors', () => {
            const errors = [
                { field: 'paziente_id', message: 'Patient required' },
                { field: 'tipo_evento', message: 'Event type required' }
            ];

            formManager.displayValidationErrors(errors);
            
            expect(formManager.elements.pazienteInput.classList.contains('is-invalid')).toBe(true);
            expect(formManager.elements.tipoEvento.classList.contains('is-invalid')).toBe(true);
            expect(formManager.elements.messaggioContainer.innerHTML).toContain('alert-danger');
        });

        it('should show and clear messages', () => {
            formManager.showError('Test error');
            expect(formManager.elements.messaggioContainer.innerHTML).toContain('alert-danger');
            expect(formManager.elements.messaggioContainer.innerHTML).toContain('Test error');
            
            formManager.showSuccess('Test success');
            expect(formManager.elements.messaggioContainer.innerHTML).toContain('alert-success');
            expect(formManager.elements.messaggioContainer.innerHTML).toContain('Test success');
            
            formManager.clearMessage();
            expect(formManager.elements.messaggioContainer.innerHTML).toBe('');
        });
    });

    describe('Utility Methods', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should parse dates correctly', () => {
            const date = formManager.parseDate('15/03/2024');
            expect(date.getDate()).toBe(15);
            expect(date.getMonth()).toBe(2); // 0-indexed
            expect(date.getFullYear()).toBe(2024);
        });

        it('should convert dates to ISO format', () => {
            const isoDate = formManager.convertDateToISO('15/03/2024');
            // Check that it's a valid ISO date format
            expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            // Check that the ISO date is correct
            expect(isoDate).toBe('2024-03-15');
        });

        it('should handle invalid date formats', () => {
            const invalidDate = formManager.parseDate('invalid-date');
            expect(invalidDate).toBeNull();
            
            const isoDate = formManager.convertDateToISO('invalid-date');
            expect(isoDate).toBe('invalid-date');
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should call onSubmit callback with valid data', () => {
            const onSubmit = vi.fn();
            formManager.options.onSubmit = onSubmit;
            
            // Set valid form data
            formManager.elements.pazienteIdInput.value = '1';
            formManager.elements.tipoEvento.value = 'intervento';
            formManager.elements.dataEvento.value = '15/03/2024';
            formManager.elements.tipoIntervento.value = 'Chirurgia Ortopedica';
            
            formManager.handleSubmit();
            
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
                paziente_id: '1',
                tipo_evento: 'intervento',
                data_evento: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                tipo_intervento: 'Chirurgia Ortopedica'
            }));
        });

        it('should call onValidationError callback with invalid data', () => {
            const onValidationError = vi.fn();
            formManager.options.onValidationError = onValidationError;
            
            // Leave form empty (invalid)
            formManager.handleSubmit();
            
            expect(onValidationError).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ field: 'paziente_id' }),
                expect.objectContaining({ field: 'tipo_evento' }),
                expect.objectContaining({ field: 'data_evento' })
            ]));
        });

        it('should prevent form submission on validation errors', () => {
            const onSubmit = vi.fn();
            formManager.options.onSubmit = onSubmit;
            
            // Leave form empty (invalid)
            formManager.handleSubmit();
            
            expect(onSubmit).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            formManager = new EventiFormManager('#evento-form');
        });

        it('should destroy properly', () => {
            const mockCustomSelect = {
                destroy: vi.fn()
            };
            const mockDatepicker = {
                destroy: vi.fn()
            };
            
            formManager.customSelects.set('test', mockCustomSelect);
            formManager.datepickers = mockDatepicker;
            
            formManager.destroy();
            
            expect(mockCustomSelect.destroy).toHaveBeenCalled();
            expect(mockDatepicker.destroy).toHaveBeenCalled();
            expect(formManager.customSelects.size).toBe(0);
        });
    });
});