// src/features/patients/views/dimissione-ui.js
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { mostraMessaggio } from '../../../shared/utils/helpers.js';

let datepickerInstance = null;

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
    get messageContainer() { return document.getElementById('messaggio-container-dimissione'); }
};

/**
 * Inizializza i componenti della UI, come il datepicker.
 */
export function initializeUI() {
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
    });
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
        item.textContent = `${p.cognome} ${p.nome} (Ricovero: ${new Date(p.data_ricovero).toLocaleDateString()})`;
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
}

/**
 * Mostra un messaggio di feedback all'utente.
 * @param {string} message 
 * @param {'info'|'success'|'error'} type 
 */
export function showFeedback(message, type) {
    mostraMessaggio(message, type, 'messaggio-container-dimissione');
}