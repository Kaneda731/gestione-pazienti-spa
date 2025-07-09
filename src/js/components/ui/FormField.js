// src/js/components/ui/FormField.js

/**
 * Componente per renderizzare campi form standardizzati
 */
export class FormField {
    constructor(fieldConfig) {
        this.config = {
            type: 'text',
            required: false,
            disabled: false,
            readonly: false,
            placeholder: '',
            helpText: '',
            validation: null,
            ...fieldConfig
        };
        this.fieldId = this.config.id || `field-${Date.now()}`;
    }

    /**
     * Renderizza il campo form
     * @returns {string} HTML del campo form
     */
    render() {
        const inputHTML = this.renderInput();
        const labelHTML = this.renderLabel();
        const helpHTML = this.renderHelpText();
        const errorHTML = this.renderErrorPlaceholder();
        
        return `
            <div class="mb-3">
                ${labelHTML}
                ${inputHTML}
                ${helpHTML}
                ${errorHTML}
            </div>
        `;
    }

    /**
     * Renderizza l'input del campo
     * @returns {string} HTML dell'input
     */
    renderInput() {
        switch (this.config.type) {
            case 'select':
                return this.renderSelect();
            case 'textarea':
                return this.renderTextarea();
            case 'checkbox':
                return this.renderCheckbox();
            case 'radio':
                return this.renderRadio();
            default:
                return this.renderBasicInput();
        }
    }

    /**
     * Renderizza un input di base
     * @returns {string} HTML dell'input di base
     */
    renderBasicInput() {
        const attributes = this.getCommonAttributes();
        
        return `
            <input 
                type="${this.config.type}" 
                class="form-control ${this.config.className || ''}" 
                id="${this.fieldId}" 
                name="${this.config.name}" 
                value="${this.config.value || ''}"
                placeholder="${this.config.placeholder}"
                ${attributes}
            />
        `;
    }

    /**
     * Renderizza una select
     * @returns {string} HTML della select
     */
    renderSelect() {
        const attributes = this.getCommonAttributes();
        const optionsHTML = this.renderOptions();
        
        return `
            <select 
                class="form-select ${this.config.className || ''}" 
                id="${this.fieldId}" 
                name="${this.config.name}"
                ${attributes}
            >
                ${optionsHTML}
            </select>
        `;
    }

    /**
     * Renderizza una textarea
     * @returns {string} HTML della textarea
     */
    renderTextarea() {
        const attributes = this.getCommonAttributes();
        
        return `
            <textarea 
                class="form-control ${this.config.className || ''}" 
                id="${this.fieldId}" 
                name="${this.config.name}"
                rows="${this.config.rows || 3}"
                placeholder="${this.config.placeholder}"
                ${attributes}
            >${this.config.value || ''}</textarea>
        `;
    }

    /**
     * Renderizza una checkbox
     * @returns {string} HTML della checkbox
     */
    renderCheckbox() {
        const attributes = this.getCommonAttributes();
        const checked = this.config.value ? 'checked' : '';
        
        return `
            <div class="form-check">
                <input 
                    class="form-check-input ${this.config.className || ''}" 
                    type="checkbox" 
                    id="${this.fieldId}" 
                    name="${this.config.name}"
                    ${checked}
                    ${attributes}
                />
                <label class="form-check-label" for="${this.fieldId}">
                    ${this.config.label}
                </label>
            </div>
        `;
    }

    /**
     * Renderizza radio buttons
     * @returns {string} HTML dei radio buttons
     */
    renderRadio() {
        if (!this.config.options) return '';
        
        const radioButtons = this.config.options.map(option => {
            const checked = this.config.value === option.value ? 'checked' : '';
            const radioId = `${this.fieldId}-${option.value}`;
            
            return `
                <div class="form-check">
                    <input 
                        class="form-check-input" 
                        type="radio" 
                        name="${this.config.name}" 
                        id="${radioId}"
                        value="${option.value}"
                        ${checked}
                        ${this.config.required ? 'required' : ''}
                        ${this.config.disabled ? 'disabled' : ''}
                    />
                    <label class="form-check-label" for="${radioId}">
                        ${option.label}
                    </label>
                </div>
            `;
        }).join('');
        
        return `<div class="form-check-group">${radioButtons}</div>`;
    }

    /**
     * Renderizza le opzioni per la select
     * @returns {string} HTML delle opzioni
     */
    renderOptions() {
        if (!this.config.options) return '';
        
        let optionsHTML = '';
        
        if (this.config.placeholder) {
            optionsHTML += `<option value="">${this.config.placeholder}</option>`;
        }
        
        optionsHTML += this.config.options.map(option => {
            const selected = this.config.value === option.value ? 'selected' : '';
            return `<option value="${option.value}" ${selected}>${option.label}</option>`;
        }).join('');
        
        return optionsHTML;
    }

    /**
     * Renderizza la label del campo
     * @returns {string} HTML della label
     */
    renderLabel() {
        if (!this.config.label || this.config.type === 'checkbox') return '';
        
        const requiredIndicator = this.config.required ? ' <span class="text-danger">*</span>' : '';
        
        return `
            <label for="${this.fieldId}" class="form-label">
                ${this.config.label}${requiredIndicator}
            </label>
        `;
    }

    /**
     * Renderizza il testo di aiuto
     * @returns {string} HTML del testo di aiuto
     */
    renderHelpText() {
        if (!this.config.helpText) return '';
        
        return `
            <div class="form-text">
                ${this.config.helpText}
            </div>
        `;
    }

    /**
     * Renderizza il placeholder per messaggi di errore
     * @returns {string} HTML del placeholder per errori
     */
    renderErrorPlaceholder() {
        return `<div class="field-error text-danger small" id="${this.fieldId}-error" style="display: none;"></div>`;
    }

    /**
     * Ottiene gli attributi comuni
     * @returns {string} Attributi HTML
     */
    getCommonAttributes() {
        const attributes = [];
        
        if (this.config.required) attributes.push('required');
        if (this.config.disabled) attributes.push('disabled');
        if (this.config.readonly) attributes.push('readonly');
        if (this.config.min) attributes.push(`min="${this.config.min}"`);
        if (this.config.max) attributes.push(`max="${this.config.max}"`);
        if (this.config.step) attributes.push(`step="${this.config.step}"`);
        if (this.config.pattern) attributes.push(`pattern="${this.config.pattern}"`);
        if (this.config.maxlength) attributes.push(`maxlength="${this.config.maxlength}"`);
        
        return attributes.join(' ');
    }

    /**
     * Valida il campo
     * @param {string} value - Valore da validare
     * @returns {Object} Risultato della validazione
     */
    validate(value) {
        const result = {
            isValid: true,
            errors: []
        };
        
        // Validazione richiesto
        if (this.config.required && (!value || value.trim() === '')) {
            result.isValid = false;
            result.errors.push('Questo campo è obbligatorio');
        }
        
        // Validazione personalizzata
        if (this.config.validation && value) {
            const customResult = this.config.validation(value);
            if (!customResult.isValid) {
                result.isValid = false;
                result.errors.push(...customResult.errors);
            }
        }
        
        return result;
    }

    /**
     * Mostra un errore nel campo
     * @param {string} message - Messaggio di errore
     */
    showError(message) {
        const fieldElement = document.getElementById(this.fieldId);
        const errorElement = document.getElementById(`${this.fieldId}-error`);
        
        if (fieldElement) {
            fieldElement.classList.add('is-invalid');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Nasconde l'errore nel campo
     */
    hideError() {
        const fieldElement = document.getElementById(this.fieldId);
        const errorElement = document.getElementById(`${this.fieldId}-error`);
        
        if (fieldElement) {
            fieldElement.classList.remove('is-invalid');
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Crea un campo nome
     * @param {string} value - Valore iniziale
     * @param {boolean} required - Se è obbligatorio
     * @returns {FormField} Istanza del componente
     */
    static createNameField(value = '', required = true) {
        return new FormField({
            type: 'text',
            name: 'nome',
            label: 'Nome',
            value: value,
            required: required,
            placeholder: 'Inserisci il nome del paziente'
        });
    }

    /**
     * Crea un campo cognome
     * @param {string} value - Valore iniziale
     * @param {boolean} required - Se è obbligatorio
     * @returns {FormField} Istanza del componente
     */
    static createSurnameField(value = '', required = true) {
        return new FormField({
            type: 'text',
            name: 'cognome',
            label: 'Cognome',
            value: value,
            required: required,
            placeholder: 'Inserisci il cognome del paziente'
        });
    }

    /**
     * Crea un campo data
     * @param {string} name - Nome del campo
     * @param {string} label - Etichetta del campo
     * @param {string} value - Valore iniziale
     * @param {boolean} required - Se è obbligatorio
     * @returns {FormField} Istanza del componente
     */
    static createDateField(name, label, value = '', required = true) {
        return new FormField({
            type: 'date',
            name: name,
            label: label,
            value: value,
            required: required
        });
    }

    /**
     * Crea un campo select per diagnosi
     * @param {Array} options - Opzioni disponibili
     * @param {string} value - Valore selezionato
     * @returns {FormField} Istanza del componente
     */
    static createDiagnosisSelect(options = [], value = '') {
        return new FormField({
            type: 'select',
            name: 'diagnosi',
            label: 'Diagnosi',
            value: value,
            required: true,
            options: options,
            placeholder: 'Seleziona diagnosi...'
        });
    }
}
