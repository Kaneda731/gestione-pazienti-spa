/**
 * EventiFormManager - Dynamic form component for clinical events
 * Handles conditional field display based on event type (intervention/infection)
 * Integrates with CustomSelect and CustomDatepicker components
 */

import { CustomSelect, initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { initCustomDatepickers } from '../../../shared/components/forms/CustomDatepicker.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';

export class EventiFormManager {
    constructor(formSelector, options = {}) {
        this.formElement = document.querySelector(formSelector);
        if (!this.formElement) {
            throw new Error(`Form element not found: ${formSelector}`);
        }

        this.options = {
            onSubmit: null,
            onValidationError: null,
            onFieldChange: null,
            ...options
        };

        this.currentEventType = '';
        this.patientSearchTimeout = null;
        this.selectedPatient = null;
        this.customSelects = new Map();
        this.datepickers = null;

        this.init();
    }

    init() {
        try {
            this.setupFormElements();
            this.initializeComponents();
            this.bindEvents();
            this.setupValidation();
            
            window.appLogger?.debug('EventiFormManager initialized successfully');
        } catch (error) {
            window.appLogger?.error('Error initializing EventiFormManager:', error);
            throw error;
        }
    }

    setupFormElements() {
        // Get references to key form elements
        this.elements = {
            form: this.formElement,
            eventoId: this.formElement.querySelector('#evento-id'),
            pazienteInput: this.formElement.querySelector('#evento-paziente'),
            pazienteIdInput: this.formElement.querySelector('#evento-paziente-id'),
            patientSearchResults: this.formElement.querySelector('#evento-patient-search-results'),
            tipoEvento: this.formElement.querySelector('#evento-tipo'),
            dataEvento: this.formElement.querySelector('#evento-data'),
            descrizione: this.formElement.querySelector('#evento-descrizione'),
            interventoFields: this.formElement.querySelector('#intervento-fields'),
            tipoIntervento: this.formElement.querySelector('#evento-tipo-intervento'),
            infezioneFields: this.formElement.querySelector('#infezione-fields'),
            agentePatogeno: this.formElement.querySelector('#evento-agente-patogeno'),
            messaggioContainer: this.formElement.querySelector('#evento-messaggio-container')
        };

        // Validate required elements
        const requiredElements = ['pazienteInput', 'tipoEvento', 'dataEvento'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required form element not found: ${elementName}`);
            }
        }
    }

    initializeComponents() {
        // Initialize CustomSelect components
        this.initCustomSelects();
        
        // Initialize CustomDatepicker
        this.initDatepickers();
    }

    initCustomSelects() {
        // Initialize event type select
        if (this.elements.tipoEvento) {
            const tipoEventoSelect = new CustomSelect(this.elements.tipoEvento);
            this.customSelects.set('tipoEvento', tipoEventoSelect);
        }

        // Initialize intervention type select
        if (this.elements.tipoIntervento) {
            const tipoInterventoSelect = new CustomSelect(this.elements.tipoIntervento);
            this.customSelects.set('tipoIntervento', tipoInterventoSelect);
        }
    }

    initDatepickers() {
        // Initialize date picker for event date
        if (this.elements.dataEvento) {
            this.datepickers = initCustomDatepickers('#evento-data', {
                maxDate: 'today', // Events cannot be in the future
                allowInput: true,
                locale: {
                    firstDayOfWeek: 1 // Monday
                }
            });
        }
    }

    bindEvents() {
        // Event type change handler
        if (this.elements.tipoEvento) {
            this.elements.tipoEvento.addEventListener('change', (e) => {
                this.handleEventTypeChange(e.target.value);
            });
        }

        // Patient search handler
        if (this.elements.pazienteInput) {
            this.elements.pazienteInput.addEventListener('input', (e) => {
                this.handlePatientSearch(e.target.value);
            });

            this.elements.pazienteInput.addEventListener('blur', () => {
                // Hide search results after a delay to allow for clicks
                setTimeout(() => {
                    this.hidePatientSearchResults();
                }, 200);
            });
        }

        // Form submission handler
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Field change handlers for validation
        const fieldsToWatch = ['pazienteInput', 'tipoEvento', 'dataEvento'];
        fieldsToWatch.forEach(fieldName => {
            const element = this.elements[fieldName];
            if (element) {
                element.addEventListener('change', () => {
                    this.clearFieldError(element);
                    if (this.options.onFieldChange) {
                        this.options.onFieldChange(fieldName, element.value);
                    }
                });
            }
        });
    }

    setupValidation() {
        // Set up real-time validation rules
        this.validationRules = {
            paziente_id: {
                required: true,
                message: 'Seleziona un paziente'
            },
            tipo_evento: {
                required: true,
                message: 'Seleziona il tipo di evento'
            },
            data_evento: {
                required: true,
                validate: (value) => {
                    if (!value) return false;
                    const eventDate = this.parseDate(value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    return eventDate <= today;
                },
                message: 'Inserisci una data valida (non futura)'
            },
            tipo_intervento: {
                required: (formData) => formData.tipo_evento === 'intervento',
                message: 'Seleziona il tipo di intervento'
            }
        };
    }

    handleEventTypeChange(eventType) {
        this.currentEventType = eventType;
        this.showHideConditionalFields(eventType);
        this.updateFormValidation(eventType);
    }

    showHideConditionalFields(eventType) {
        // Hide all conditional fields first
        if (this.elements.interventoFields) {
            this.elements.interventoFields.style.display = 'none';
        }
        if (this.elements.infezioneFields) {
            this.elements.infezioneFields.style.display = 'none';
        }

        // Show relevant fields based on event type
        switch (eventType) {
            case 'intervento':
                if (this.elements.interventoFields) {
                    this.elements.interventoFields.style.display = 'block';
                }
                break;
            case 'infezione':
                if (this.elements.infezioneFields) {
                    this.elements.infezioneFields.style.display = 'block';
                }
                break;
        }

        // Clear values from hidden fields
        this.clearHiddenFieldValues(eventType);
    }

    clearHiddenFieldValues(eventType) {
        if (eventType !== 'intervento' && this.elements.tipoIntervento) {
            this.elements.tipoIntervento.value = '';
            const customSelect = this.customSelects.get('tipoIntervento');
            if (customSelect && typeof customSelect.setValue === 'function') {
                customSelect.setValue('');
            }
        }

        if (eventType !== 'infezione' && this.elements.agentePatogeno) {
            this.elements.agentePatogeno.value = '';
        }
    }

    updateFormValidation(eventType) {
        // Update required attributes based on event type
        if (this.elements.tipoIntervento) {
            this.elements.tipoIntervento.required = eventType === 'intervento';
        }
    }

    async handlePatientSearch(searchTerm) {
        // Clear previous timeout
        if (this.patientSearchTimeout) {
            clearTimeout(this.patientSearchTimeout);
        }

        // Hide results if search term is too short
        if (!searchTerm || searchTerm.length < 2) {
            this.hidePatientSearchResults();
            return;
        }

        // Debounce search
        this.patientSearchTimeout = setTimeout(async () => {
            try {
                await this.performPatientSearch(searchTerm);
            } catch (error) {
                window.appLogger?.error('Error performing patient search:', error);
                this.showError('Errore durante la ricerca pazienti');
            }
        }, 300);
    }

    async performPatientSearch(searchTerm) {
        // This method should be implemented to call the actual search API
        // For now, we'll emit an event that the parent component can handle
        const searchEvent = new CustomEvent('patientSearch', {
            detail: { searchTerm, callback: this.displayPatientSearchResults.bind(this) }
        });
        this.formElement.dispatchEvent(searchEvent);
    }

    displayPatientSearchResults(patients) {
        if (!this.elements.patientSearchResults) return;

        if (!patients || patients.length === 0) {
            this.hidePatientSearchResults();
            return;
        }

        const resultsHTML = patients.map(patient => `
            <div class="dropdown-item patient-search-result" data-patient-id="${patient.id}">
                <div class="d-flex justify-content-between">
                    <span><strong>${patient.nome} ${patient.cognome}</strong></span>
                    <small class="text-muted">${patient.codice_rad || ''}</small>
                </div>
                <small class="text-muted">
                    ${patient.data_nascita ? new Date(patient.data_nascita).toLocaleDateString('it-IT') : ''} - 
                    ${patient.reparto || 'N/A'}
                </small>
            </div>
        `).join('');

        this.elements.patientSearchResults.innerHTML = sanitizeHtml(resultsHTML);
        this.elements.patientSearchResults.style.display = 'block';

        // Bind click events to results
        this.elements.patientSearchResults.querySelectorAll('.patient-search-result').forEach(result => {
            result.addEventListener('click', (e) => {
                const patientId = e.currentTarget.dataset.patientId;
                const patient = patients.find(p => p.id === patientId);
                if (patient) {
                    this.selectPatient(patient);
                }
            });
        });
    }

    selectPatient(patient) {
        this.selectedPatient = patient;
        this.elements.pazienteInput.value = `${patient.nome} ${patient.cognome}`;
        this.elements.pazienteIdInput.value = patient.id;
        this.hidePatientSearchResults();
        this.clearFieldError(this.elements.pazienteInput);
    }

    hidePatientSearchResults() {
        if (this.elements.patientSearchResults) {
            this.elements.patientSearchResults.style.display = 'none';
        }
    }

    handleSubmit() {
        const formData = this.getFormData();
        const validationResult = this.validateForm(formData);

        if (!validationResult.isValid) {
            this.displayValidationErrors(validationResult.errors);
            if (this.options.onValidationError) {
                this.options.onValidationError(validationResult.errors);
            }
            return;
        }

        if (this.options.onSubmit) {
            this.options.onSubmit(formData);
        }
    }

    getFormData() {
        const formData = new FormData(this.elements.form);
        const data = {};

        // Get all form data
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Ensure patient ID is included
        if (this.elements.pazienteIdInput.value) {
            data.paziente_id = this.elements.pazienteIdInput.value;
        }

        // Convert date format
        if (data.data_evento) {
            data.data_evento = this.convertDateToISO(data.data_evento);
        }

        return data;
    }

    validateForm(formData) {
        const errors = [];

        for (const [field, rule] of Object.entries(this.validationRules)) {
            const value = formData[field];
            let isRequired = rule.required;

            // Handle conditional required fields
            if (typeof isRequired === 'function') {
                isRequired = isRequired(formData);
            }

            if (isRequired && (!value || value.trim() === '')) {
                errors.push({
                    field,
                    message: rule.message
                });
                continue;
            }

            // Run custom validation if value exists
            if (value && rule.validate && !rule.validate(value)) {
                errors.push({
                    field,
                    message: rule.message
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    displayValidationErrors(errors) {
        // Clear previous errors
        this.clearAllErrors();

        // Display field-specific errors
        errors.forEach(error => {
            this.showFieldError(error.field, error.message);
        });

        // Show general error message
        if (errors.length > 0) {
            this.showError('Correggi gli errori evidenziati prima di continuare');
        }
    }

    showFieldError(fieldName, message) {
        const fieldElement = this.getFieldElement(fieldName);
        if (!fieldElement) return;

        fieldElement.classList.add('is-invalid');
        
        // Create or update error message
        let errorElement = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            fieldElement.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(fieldElement) {
        if (!fieldElement) return;
        
        fieldElement.classList.remove('is-invalid');
        const errorElement = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }

    clearAllErrors() {
        // Clear field errors
        this.elements.form.querySelectorAll('.is-invalid').forEach(element => {
            this.clearFieldError(element);
        });

        // Clear general error message
        this.clearMessage();
    }

    getFieldElement(fieldName) {
        const fieldMap = {
            paziente_id: this.elements.pazienteInput,
            tipo_evento: this.elements.tipoEvento,
            data_evento: this.elements.dataEvento,
            tipo_intervento: this.elements.tipoIntervento
        };

        return fieldMap[fieldName] || this.elements.form.querySelector(`[name="${fieldName}"]`);
    }

    showError(message) {
        this.showMessage(message, 'danger');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        if (!this.elements.messaggioContainer) return;

        this.elements.messaggioContainer.innerHTML = sanitizeHtml(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${sanitizeHtml(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    }

    clearMessage() {
        if (this.elements.messaggioContainer) {
            this.elements.messaggioContainer.innerHTML = sanitizeHtml('');
        }
    }

    // Utility methods
    parseDate(dateString) {
        // Parse DD/MM/YYYY format
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    }

    convertDateToISO(dateString) {
        const date = this.parseDate(dateString);
        if (!date) return dateString;
        
        // Use UTC to avoid timezone issues
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Public methods for external control
    reset() {
        this.elements.form.reset();
        this.selectedPatient = null;
        this.currentEventType = '';
        this.hidePatientSearchResults();
        this.showHideConditionalFields('');
        this.clearAllErrors();

        // Reset custom selects
        this.customSelects.forEach(select => {
            if (typeof select.setValue === 'function') {
                select.setValue('');
            }
        });
    }

    setFormData(data) {
        try {
            // Set basic fields
            if (data.id && this.elements.eventoId) {
                this.elements.eventoId.value = data.id;
            }

            if (data.paziente_id && this.elements.pazienteIdInput) {
                this.elements.pazienteIdInput.value = data.paziente_id;
            }

            if (data.paziente_nome && this.elements.pazienteInput) {
                this.elements.pazienteInput.value = data.paziente_nome;
            }

            if (data.tipo_evento) {
                this.elements.tipoEvento.value = data.tipo_evento;
                const tipoEventoSelect = this.customSelects.get('tipoEvento');
                if (tipoEventoSelect && typeof tipoEventoSelect.setValue === 'function') {
                    tipoEventoSelect.setValue(data.tipo_evento);
                }
                this.handleEventTypeChange(data.tipo_evento);
            }

            if (data.data_evento && this.elements.dataEvento) {
                // Convert ISO date to DD/MM/YYYY format
                const date = new Date(data.data_evento);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                this.elements.dataEvento.value = formattedDate;
            }

            if (data.descrizione && this.elements.descrizione) {
                this.elements.descrizione.value = data.descrizione;
            }

            if (data.tipo_intervento && this.elements.tipoIntervento) {
                this.elements.tipoIntervento.value = data.tipo_intervento;
                const tipoInterventoSelect = this.customSelects.get('tipoIntervento');
                if (tipoInterventoSelect && typeof tipoInterventoSelect.setValue === 'function') {
                    tipoInterventoSelect.setValue(data.tipo_intervento);
                }
            }

            if (data.agente_patogeno && this.elements.agentePatogeno) {
                this.elements.agentePatogeno.value = data.agente_patogeno;
            }

            this.clearAllErrors();
        } catch (error) {
            window.appLogger?.error('Error setting form data:', error);
            throw error;
        }
    }

    destroy() {
        // Clear timeouts
        if (this.patientSearchTimeout) {
            clearTimeout(this.patientSearchTimeout);
        }

        // Destroy custom selects
        this.customSelects.forEach(select => {
            if (select.destroy) {
                select.destroy();
            }
        });
        this.customSelects.clear();

        // Destroy datepickers
        if (this.datepickers && this.datepickers.destroy) {
            this.datepickers.destroy();
        }

        // Remove event listeners (they will be removed when the form is removed from DOM)
        window.appLogger?.debug('EventiFormManager destroyed');
    }
}

export default EventiFormManager;