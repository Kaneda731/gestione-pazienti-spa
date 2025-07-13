// src/features/patients/views/form-ui.js
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { mostraMessaggio } from '../../../shared/utils/helpers.js';

let datepickerInstance = null;

/**
 * Inizializza i componenti del form come datepicker e custom selects.
 */
export function initializeFormComponents() {
    initCustomSelects('#form-inserimento [data-custom="true"]');
    
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
        allowInput: true,
    });
}

/**
 * Distrugge le istanze dei componenti per evitare memory leak.
 */
export function cleanupFormComponents() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
}

/**
 * Popola i campi del form con i dati di un paziente esistente.
 * @param {Object} patient - I dati del paziente.
 */
export function populateForm(patient) {
    if (!patient) return;

    document.getElementById('paziente-id').value = patient.id || '';
    document.getElementById('nome').value = patient.nome || '';
    document.getElementById('cognome').value = patient.cognome || '';
    document.getElementById('data_ricovero').value = patient.data_ricovero || '';
    document.getElementById('data_dimissione').value = patient.data_dimissione || '';
    document.getElementById('diagnosi').value = patient.diagnosi || '';
    document.getElementById('reparto_appartenenza').value = patient.reparto_appartenenza || '';
    document.getElementById('reparto_provenienza').value = patient.reparto_provenienza || '';
    document.getElementById('livello_assistenza').value = patient.livello_assistenza || '';
    document.getElementById('codice_rad').value = patient.codice_rad || '';
    document.getElementById('infetto').checked = patient.infetto || false;

    // Aggiorna il titolo e il pulsante per la modalità modifica
    document.getElementById('inserimento-title').innerHTML = '<span class="material-icons me-2">edit</span>Modifica Paziente';
    document.getElementById('save-patient-btn').innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Aggiorna Paziente';
}

/**
 * Popola il select delle diagnosi con le opzioni caricate.
 * @param {Array} options - La lista delle opzioni di diagnosi.
 */
export function renderDiagnosiOptions(options) {
    const diagnosiSelect = document.getElementById('diagnosi');
    if (!diagnosiSelect) return;

    diagnosiSelect.innerHTML = '<option value="">Seleziona diagnosi...</option>';
    options.forEach(diagnosi => {
        const option = document.createElement('option');
        option.value = diagnosi.nome;
        option.textContent = diagnosi.nome;
        diagnosiSelect.appendChild(option);
    });
}

/**
 * Legge i dati correnti dal form.
 * @returns {Object} I dati del form.
 */
export function getFormData() {
    const form = document.getElementById('form-inserimento');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Gestisci la checkbox, che non viene inviata se non è spuntata
    data.infetto = form.querySelector('#infetto').checked;

    return data;
}

/**
 * Mostra un messaggio di feedback all'utente.
 * @param {string} message - Il messaggio da mostrare.
 * @param {('success'|'danger')} type - Il tipo di messaggio.
 */
export function showFeedbackMessage(message, type) {
    mostraMessaggio(message, type);
}