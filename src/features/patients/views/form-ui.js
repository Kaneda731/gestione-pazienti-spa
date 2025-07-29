// src/features/patients/views/form-ui.js
import { initCustomSelects, updateCustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { InfectionEventModal } from '../../eventi-clinici/components/InfectionEventModal.js';
import { initEventiCliniciTab, setCurrentPatient, cleanupEventiCliniciTab } from './eventi-clinici-tab.js';
import { sanitizeHtml } from '../../../shared/utils/domSecurity.js';

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

    // Aggiungi event listener per la gestione condizionale dei campi
    setupConditionalFieldsLogic();
    
    // Inizializza il tab degli eventi clinici
    initEventiCliniciTab();
}

/**
 * Configura la logica per mostrare/nascondere campi condizionalmente.
 */
function setupConditionalFieldsLogic() {
    const tipoDimissioneSelect = document.getElementById('tipo_dimissione');
    if (tipoDimissioneSelect) {
        tipoDimissioneSelect.addEventListener('change', (e) => {
            handleTipoDimissioneChange(e.target.value);
        });
    }

    const infettoCheckbox = document.getElementById('infetto');
    if (infettoCheckbox) {
        infettoCheckbox.addEventListener('change', async (e) => {
            await handleInfettoChange(e);
        });
    }

    // Listener per aggiornare il titolo quando nome/cognome cambiano
    const nomeInput = document.getElementById('nome');
    const cognomeInput = document.getElementById('cognome');
    
    if (nomeInput && cognomeInput) {
        [nomeInput, cognomeInput].forEach(input => {
            input.addEventListener('input', updatePatientTitle);
        });
    }
}

/**
 * Gestisce la visualizzazione condizionale dei campi basata sul tipo dimissione.
 * @param {string} tipoDimissione - Il tipo di dimissione selezionato.
 */
export function handleTipoDimissioneChange(tipoDimissione) {
    const repartoContainer = document.getElementById('reparto-destinazione-container');
    const clinicaContainer = document.getElementById('clinica-destinazione-container');
    const codiceClinicaContainer = document.getElementById('codice-clinica-container');

    // Nascondi tutti i campi condizionali
    repartoContainer.style.display = 'none';
    clinicaContainer.style.display = 'none';
    codiceClinicaContainer.style.display = 'none';

    // Pulisci i valori dei campi nascosti
    document.getElementById('reparto_destinazione').value = '';
    document.getElementById('clinica_destinazione').value = '';
    document.getElementById('codice_clinica').value = '';

    // Mostra i campi appropriati basati sulla selezione
    switch (tipoDimissione) {
        case 'trasferimento_interno':
            repartoContainer.style.display = 'block';
            break;
        case 'trasferimento_esterno':
            clinicaContainer.style.display = 'block';
            codiceClinicaContainer.style.display = 'block';
            break;
        case 'dimissione':
            // Nessun campo aggiuntivo necessario per dimissione semplice
            break;
    }

    // Inizializza i custom select per i campi appena mostrati
    // Usa setTimeout per assicurarsi che il DOM sia aggiornato dopo il cambio di display
    setTimeout(() => {
        if (tipoDimissione === 'trasferimento_interno') {
            const repartoSelect = document.getElementById('reparto_destinazione');
            if (repartoSelect && !repartoSelect.customSelectInstance) {
                initCustomSelects('#reparto_destinazione');
            }
        } else if (tipoDimissione === 'trasferimento_esterno') {
            const codiceClinicaSelect = document.getElementById('codice_clinica');
            if (codiceClinicaSelect && !codiceClinicaSelect.customSelectInstance) {
                initCustomSelects('#codice_clinica');
            }
        }
    }, 50); // Piccolo delay per permettere al CSS di applicare le transizioni
}

/**
 * Gestisce l'interazione dell'utente con la checkbox "Infetto", aprendo il modal.
 * @param {Event} event - L'evento change della checkbox.
 */
export async function handleInfettoChange(event) {
    const checkbox = event.target;
    if (checkbox.checked) {
        const patientName = `${document.getElementById('nome').value} ${document.getElementById('cognome').value}`.trim();
        const modal = new InfectionEventModal({ patientName });
        const eventData = await modal.show();

        if (eventData) {
            // L'utente ha confermato, popoliamo i campi nascosti e aggiorniamo la UI
            const [year, month, day] = eventData.data_evento.split('-');
            document.getElementById('data_infezione').value = `${day}/${month}/${year}`;
            document.getElementById('agente_patogeno_hidden').value = eventData.agente_patogeno;
            document.getElementById('descrizione_hidden').value = eventData.descrizione;
            updateInfectionUI(true);
        } else {
            // L'utente ha annullato, deseleziona la checkbox
            checkbox.checked = false;
            updateInfectionUI(false);
        }
    } else {
        // L'utente ha deselezionato la checkbox, pulisci i dati e nascondi la UI
        updateInfectionUI(false);
    }
}

/**
 * Aggiorna la UI relativa all'infezione (mostra/nasconde campo data e pulisce i dati).
 * @param {boolean} isInfetto - Se il paziente è considerato infetto.
 */
function updateInfectionUI(isInfetto) {
    const dataInfezioneContainer = document.getElementById('data-infezione-container');
    if (isInfetto) {
        dataInfezioneContainer.style.display = 'block';
    } else {
        document.getElementById('data-infezione-container').style.display = 'none';
        document.getElementById('data_infezione').value = '';
        document.getElementById('agente_patogeno_hidden').value = '';
        document.getElementById('descrizione_hidden').value = '';
    }
}

/**
 * Aggiorna il titolo della pagina con il nome del paziente corrente.
 */
function updatePatientTitle() {
    const titleElement = document.getElementById('inserimento-title');
    if (!titleElement) return;

    const nomeInput = document.getElementById('nome');
    const cognomeInput = document.getElementById('cognome');
    const pazienteIdInput = document.getElementById('paziente-id');
    
    // Verifica se siamo in modalità modifica (c'è un ID paziente)
    const isEditMode = pazienteIdInput && pazienteIdInput.value;
    
    if (isEditMode) {
        const nome = nomeInput ? nomeInput.value.trim() : '';
        const cognome = cognomeInput ? cognomeInput.value.trim() : '';
        const patientName = `${nome} ${cognome}`.trim();
        
        const titleHTML = patientName 
            ? `<span class="material-icons me-2">edit</span><span class="patient-name">${patientName}</span>`
            : '<span class="material-icons me-2">edit</span>Modifica Paziente';
        titleElement.innerHTML = sanitizeHtml(titleHTML);
    } else {
        // Modalità inserimento - titolo standard
        titleElement.innerHTML = sanitizeHtml('<span class="material-icons me-2">person_add</span>Inserimento Nuovo Paziente');
    }
}

/**
 * Distrugge le istanze dei componenti per evitare memory leak.
 */
export function cleanupFormComponents() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
    
    // Cleanup del tab eventi clinici
    cleanupEventiCliniciTab();
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
    
    // Converti le date da yyyy-mm-dd a dd/mm/yyyy per il datepicker
    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };
    
    document.getElementById('data_nascita').value = formatDateForDisplay(patient.data_nascita || '');
    document.getElementById('data_ricovero').value = formatDateForDisplay(patient.data_ricovero || '');
    document.getElementById('data_dimissione').value = formatDateForDisplay(patient.data_dimissione || '');
    document.getElementById('diagnosi').value = patient.diagnosi || '';
    document.getElementById('reparto_appartenenza').value = patient.reparto_appartenenza || '';
    document.getElementById('reparto_provenienza').value = patient.reparto_provenienza || '';
    document.getElementById('livello_assistenza').value = patient.livello_assistenza || '';
    document.getElementById('codice_rad').value = patient.codice_rad || '';
    document.getElementById('infetto').checked = patient.infetto || false;
    document.getElementById('data_infezione').value = formatDateForDisplay(patient.data_infezione || '');

    // Popola i nuovi campi per dimissione/trasferimento
    document.getElementById('tipo_dimissione').value = patient.tipo_dimissione || '';
    document.getElementById('reparto_destinazione').value = patient.reparto_destinazione || '';
    document.getElementById('clinica_destinazione').value = patient.clinica_destinazione || '';
    document.getElementById('codice_clinica').value = patient.codice_clinica || '';
    document.getElementById('codice_dimissione').value = patient.codice_dimissione || '';

    // Mostra/nascondi campi condizionali basati sul tipo dimissione e stato infetto
    const isInfetto = patient.infetto || false;
    document.getElementById('infetto').checked = isInfetto;
    handleTipoDimissioneChange(patient.tipo_dimissione || '');
    updateInfectionUI(isInfetto); // Usa la nuova funzione che non apre il modal

    // Imposta il paziente corrente per il tab eventi clinici
    setCurrentPatient(patient.id);

    // Aggiorna il titolo e il pulsante per la modalità modifica
    const patientName = `${patient.nome || ''} ${patient.cognome || ''}`.trim();
    const titleHTML = patientName 
        ? `<span class="material-icons me-2">edit</span><span class="patient-name">${patientName}</span>`
        : '<span class="material-icons me-2">edit</span>Modifica Paziente';
    document.getElementById('inserimento-title').innerHTML = sanitizeHtml(titleHTML);
    document.getElementById('save-patient-btn').innerHTML = sanitizeHtml('<span class="material-icons me-1" style="vertical-align: middle;">save</span>Aggiorna Paziente');
    
    // Forza l'aggiornamento di tutti i custom select per mostrare i valori corretti
    updateCustomSelect('#form-inserimento [data-custom="true"]');
}

/**
 * Popola il select delle diagnosi con le opzioni caricate.
 * @param {Array} options - La lista delle opzioni di diagnosi.
 */
export function renderDiagnosiOptions(options) {
    const diagnosiSelect = document.getElementById('diagnosi');
    if (!diagnosiSelect) return;

    diagnosiSelect.innerHTML = sanitizeHtml('<option value="">Seleziona diagnosi...</option>');
    options.forEach(diagnosi => {
        const option = document.createElement('option');
        option.value = diagnosi.nome;
        option.textContent = diagnosi.nome;
        diagnosiSelect.appendChild(option);
    });

    // Forza l'aggiornamento del select specifico
    updateCustomSelect('#diagnosi');
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
    
    // Raccogli i dati dall'evento di infezione (se presenti)
    data.agente_patogeno = form.querySelector('#agente_patogeno_hidden').value || null;
    data.descrizione_infezione = form.querySelector('#descrizione_hidden').value || null;

    // Converti le date dal formato dd/mm/yyyy a yyyy-mm-dd per Supabase
    const dateFields = ['data_nascita', 'data_ricovero', 'data_dimissione', 'data_infezione', 'data_evento'];
    dateFields.forEach(field => {
        if (data[field] && data[field].includes('/')) {
            const [day, month, year] = data[field].split('/');
            data[field] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    });

    // Pulisci i campi vuoti per evitare di inviare stringhe vuote
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === null || data[key] === undefined) {
            data[key] = null;
        }
    });

    // Gestisci i campi condizionali - se il tipo dimissione non li richiede, impostali a null
    const tipoDimissione = data.tipo_dimissione;
    if (tipoDimissione !== 'trasferimento_interno') {
        data.reparto_destinazione = null;
    }
    if (tipoDimissione !== 'trasferimento_esterno') {
        data.clinica_destinazione = null;
        data.codice_clinica = null;
    }

    // Se il paziente non è infetto, rimuovi la data infezione
    if (!data.infetto) {
        data.data_infezione = null;
    }

    return data;
}

/**
 * Mostra un messaggio di feedback all'utente.
 * @param {string} message - Il messaggio da mostrare.
 * @param {('success'|'danger')} type - Il tipo di messaggio.
 */
export function showFeedbackMessage(message, type) {
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