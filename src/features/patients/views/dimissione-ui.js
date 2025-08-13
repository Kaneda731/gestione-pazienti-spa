// src/features/patients/views/dimissione-ui.js
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { notificationService } from '../../../core/services/notifications/notificationService.js';
import { attach as attachPatientAutocomplete } from '../../../shared/components/ui/PatientAutocomplete.js';


let datepickerInstance = null;
let autocompleteHandle = null;

// Contiene gli elementi del DOM per un accesso più facile
export const dom = {
    get searchInput() { return document.getElementById('search-paziente'); },
    get searchButton() { return document.getElementById('search-button'); },
    get resultsContainer() { return document.getElementById('search-results'); },
    get dischargeForm() { return document.getElementById('form-dimissione'); },
    get selectedPatientName() { return document.getElementById('selected-paziente-nome'); },
    get selectedPatientRicovero() { return document.getElementById('selected-paziente-ricovero'); },
    get dataDimissioneInput() { return document.getElementById('data_dimissione'); },
    get backButton() { return document.querySelector('.view[data-view-name="dimissione"] .btn-back-menu'); },
    get messageContainer() { return document.getElementById('messaggio-container-dimissione'); },
    // Enhanced discharge form elements
    get tipoDimissioneSelect() { return document.getElementById('tipo_dimissione'); },
    get repartoDestinazioneInput() { return document.getElementById('reparto_destinazione'); },
    get clinicaDestinazioneInput() { return document.getElementById('clinica_destinazione'); },
    get codiceClinicaSelect() { return document.getElementById('codice_clinica'); },
    get codiceDimissioneSelect() { return document.getElementById('codice_dimissione'); },
    get internalTransferFields() { return document.getElementById('internal-transfer-fields'); },
    get externalTransferFields() { return document.getElementById('external-transfer-fields'); }
};

function clearSearchResults() {
    if (dom.resultsContainer) {
        dom.resultsContainer.innerHTML = '';
    }
}

/**
 * Inizializza i componenti della UI, come il datepicker.
 */
export function initializeUI(onSelectPatient) {
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
    });

    // Inizializza i custom select per tutte le select con data-custom="true"
    initCustomSelects('.form-select[data-custom="true"]');

    // Autocomplete pazienti centralizzato (solo pazienti attivi)
    if (dom.searchInput && dom.resultsContainer) {
        const handle = attachPatientAutocomplete({
            input: dom.searchInput,
            resultsContainer: dom.resultsContainer,
            activeOnly: true,
            minChars: 2,
            debounceMs: 250,
            onSelect: (patient) => {
                onSelectPatient?.(patient);
            }
        });
        autocompleteHandle = handle;
    }
    
    // Inizializza i listener per i campi di trasferimento
    initializeTransferFieldListeners();
    
    resetView();
}

/**
 * Distrugge i componenti della UI per il cleanup.
 */
export function cleanupUI() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
    if (autocompleteHandle && typeof autocompleteHandle.destroy === 'function') {
        autocompleteHandle.destroy();
        autocompleteHandle = null;
    }
    
    // Distrugge tutti i custom select
    const customSelects = document.querySelectorAll('.form-select[data-custom="true"]');
    customSelects.forEach(select => {
        if (select.customSelectInstance) {
            select.customSelectInstance.destroy();
        }
    });
}

/**
 * Mostra i risultati della ricerca nella lista.
 * @param {Array<Object>} patients - La lista dei pazienti.
 * @param {function} onSelect - La callback da eseguire quando un paziente viene selezionato.
 */
export function renderSearchResults(patients, onSelect) {
    if (!dom.resultsContainer) return;
    
    dom.resultsContainer.innerHTML = '';
    if (patients.length === 0) {
        dom.resultsContainer.innerHTML = '<p class="text-center text-muted">Nessun paziente attivo trovato.</p>';
        return;
    }
    patients.forEach(p => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action';
        const radText = p.codice_rad ? ` (RAD: ${p.codice_rad})` : '';
        item.textContent = `${p.cognome} ${p.nome}${radText} (Ricovero: ${new Date(p.data_ricovero).toLocaleDateString()})`;
        item.onclick = () => onSelect(p);
        dom.resultsContainer.appendChild(item);
    });
}

/**
 * Mostra il form di dimissione per il paziente selezionato.
 * @param {Object} patient - Il paziente selezionato.
 */
export function displayDischargeForm(patient) {
    if (!dom.selectedPatientName || !dom.selectedPatientRicovero || !dom.dischargeForm || !dom.resultsContainer || !dom.searchInput || !dom.dataDimissioneInput) {
        console.error('Elementi DOM mancanti per displayDischargeForm');
        return;
    }
    
    dom.selectedPatientName.textContent = `${patient.cognome} ${patient.nome}`;
    dom.selectedPatientRicovero.textContent = new Date(patient.data_ricovero).toLocaleDateString();
    dom.dischargeForm.classList.remove('d-none');
    dom.resultsContainer.innerHTML = '';
    dom.searchInput.value = '';
    dom.dataDimissioneInput.focus();
}

/**
 * Mostra o nasconde l'indicatore di caricamento.
 * @param {boolean} isLoading
 */
export function setLoading(isLoading) {
    if (!dom.resultsContainer) return;
    
    if (isLoading) {
        dom.resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    } else {
        dom.resultsContainer.innerHTML = '';
    }
}

/**
 * Resetta la vista al suo stato iniziale.
 */
export function resetView() {
    if (dom.dischargeForm) {
        dom.dischargeForm.classList.add('d-none');
    }
    if (dom.resultsContainer) {
        dom.resultsContainer.innerHTML = '';
    }
    if (dom.searchInput) {
        dom.searchInput.value = '';
    }
    if (dom.dataDimissioneInput) {
        dom.dataDimissioneInput.value = '';
    }
    
    // Reset transfer fields
    if (dom.tipoDimissioneSelect) {
        dom.tipoDimissioneSelect.value = 'dimissione';
        if (dom.tipoDimissioneSelect.customSelectInstance) {
            dom.tipoDimissioneSelect.customSelectInstance.setValue('dimissione');
        }
    }
    if (dom.repartoDestinazioneInput) {
        dom.repartoDestinazioneInput.value = '';
    }
    if (dom.clinicaDestinazioneInput) {
        dom.clinicaDestinazioneInput.value = '';
    }
    if (dom.codiceClinicaSelect) {
        dom.codiceClinicaSelect.value = '';
        if (dom.codiceClinicaSelect.customSelectInstance) {
            dom.codiceClinicaSelect.customSelectInstance.setValue('');
        }
    }
    if (dom.codiceDimissioneSelect) {
        dom.codiceDimissioneSelect.value = '';
        if (dom.codiceDimissioneSelect.customSelectInstance) {
            dom.codiceDimissioneSelect.customSelectInstance.setValue('');
        }
    }
    
    // Reset transfer field visibility
    handleDischargeTypeChange('dimissione');
}

/**
 * Mostra un messaggio di feedback all'utente.
 * @param {string} message 
 * @param {'info'|'success'|'error'} type 
 */
export function showFeedback(message, type) {
    switch(type) {
        case 'success':
            notificationService.success(message);
            break;
        case 'error':
            notificationService.error(message);
            break;
        case 'warning':
            notificationService.warning(message);
            break;
        default:
            notificationService.info(message);
    }
}

/**
 * Gestisce la visualizzazione dinamica dei campi di trasferimento
 * @param {string} dischargeType - Il tipo di dimissione selezionato
 */
export function handleDischargeTypeChange(dischargeType) {
    const internalFields = dom.internalTransferFields;
    const externalFields = dom.externalTransferFields;
    
    if (!internalFields || !externalFields) {
        console.warn('Transfer fields containers not found');
        return;
    }
    
    // Nascondi tutti i campi di trasferimento inizialmente
    internalFields.classList.add('d-none');
    externalFields.classList.add('d-none');
    
    // Rimuovi i requisiti required da tutti i campi di trasferimento
    clearTransferFieldRequirements();
    
    // Mostra i campi appropriati in base al tipo di dimissione
    switch (dischargeType) {
        case 'trasferimento_interno':
            internalFields.classList.remove('d-none');
            if (dom.repartoDestinazioneInput) {
                dom.repartoDestinazioneInput.required = true;
            }
            break;
        case 'trasferimento_esterno':
            externalFields.classList.remove('d-none');
            if (dom.clinicaDestinazioneInput) {
                dom.clinicaDestinazioneInput.required = true;
            }
            if (dom.codiceClinicaSelect) {
                dom.codiceClinicaSelect.required = true;
            }
            break;
        case 'dimissione':
        default:
            // Nessun campo aggiuntivo richiesto per dimissione normale
            break;
    }
    
    // Il codice dimissione è sempre richiesto
    if (dom.codiceDimissioneSelect) {
        dom.codiceDimissioneSelect.required = true;
    }
}

/**
 * Rimuove i requisiti required dai campi di trasferimento
 */
function clearTransferFieldRequirements() {
    const transferFields = [
        dom.repartoDestinazioneInput,
        dom.clinicaDestinazioneInput,
        dom.codiceClinicaSelect
    ];
    
    transferFields.forEach(field => {
        if (field) {
            field.required = false;
            field.value = '';
        }
    });
}

/**
 * Inizializza i listener per i campi di trasferimento
 */
export function initializeTransferFieldListeners() {
    if (dom.tipoDimissioneSelect) {
        dom.tipoDimissioneSelect.addEventListener('change', (e) => {
            handleDischargeTypeChange(e.target.value);
        });
        
        // Inizializza con il valore corrente
        handleDischargeTypeChange(dom.tipoDimissioneSelect.value);
    }
}

/**
 * Valida i dati del form di dimissione/trasferimento
 * @returns {Object} Oggetto con isValid e errors
 */
export function validateDischargeForm() {
    const errors = [];
    const dischargeDate = dom.dataDimissioneInput?.value;
    const dischargeType = dom.tipoDimissioneSelect?.value;
    const dischargeCode = dom.codiceDimissioneSelect?.value;
    
    // Validazione data dimissione
    if (!dischargeDate) {
        errors.push('La data di dimissione è obbligatoria');
    }
    
    // Validazione tipo dimissione
    if (!dischargeType) {
        errors.push('Il tipo di dimissione è obbligatorio');
    }
    
    // Validazione codice dimissione
    if (!dischargeCode) {
        errors.push('Il codice dimissione è obbligatorio');
    }
    
    // Validazioni specifiche per tipo di dimissione
    if (dischargeType === 'trasferimento_interno') {
        const reparto = dom.repartoDestinazioneInput?.value;
        if (!reparto || reparto.trim() === '') {
            errors.push('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
        }
    } else if (dischargeType === 'trasferimento_esterno') {
        const clinica = dom.clinicaDestinazioneInput?.value;
        const codiceClinica = dom.codiceClinicaSelect?.value;
        
        if (!clinica || clinica.trim() === '') {
            errors.push('La clinica di destinazione è obbligatoria per i trasferimenti esterni');
        }
        if (!codiceClinica) {
            errors.push('Il codice clinica è obbligatorio per i trasferimenti esterni');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Raccoglie tutti i dati del form di dimissione/trasferimento
 * @returns {Object} Oggetto con tutti i dati del form
 */
export function getDischargeFormData() {
    const formData = {
        data_dimissione: dom.dataDimissioneInput?.value,
        tipo_dimissione: dom.tipoDimissioneSelect?.value,
        codice_dimissione: dom.codiceDimissioneSelect?.value
    };
    
    // Aggiungi campi specifici in base al tipo di dimissione
    const dischargeType = formData.tipo_dimissione;
    
    if (dischargeType === 'trasferimento_interno') {
        formData.reparto_destinazione = dom.repartoDestinazioneInput?.value;
    } else if (dischargeType === 'trasferimento_esterno') {
        formData.clinica_destinazione = dom.clinicaDestinazioneInput?.value;
        formData.codice_clinica = dom.codiceClinicaSelect?.value;
    }
    
    return formData;
}