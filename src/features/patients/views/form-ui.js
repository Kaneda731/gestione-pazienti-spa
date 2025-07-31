// src/features/patients/views/form-ui.js
import { initCustomSelects, updateCustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { initEventiCliniciTab, setCurrentPatient, cleanupEventiCliniciTab, isPatientCurrentlyInfected } from './eventi-clinici-tab.js';
import { sanitizeHtml } from '../../../shared/utils/domSecurity.js';
import { InfectionEventModal } from '../../eventi-clinici/components/InfectionEventModal.js';
import infectionDataManager from '../services/infectionDataManager.js';

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
    
    // Inizializza la gestione del flag infezione
    setupInfectionFlagHandler();
    
    // Inizializza il tab degli eventi clinici, passando la funzione di callback per aggiornare la UI
    initEventiCliniciTab(updateInfectionStatusFromEvents);
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
 * Aggiorna lo stato del checkbox 'infetto' in base agli eventi clinici.
 * Gestisce la logica di abilitazione/disabilitazione del checkbox.
 * Questa funzione viene chiamata dalla logica della tab eventi clinici.
 */
function updateInfectionStatusFromEvents() {
    const infettoCheckbox = document.getElementById('infetto');
    const infettoHelper = document.getElementById('infetto-helper-text');
    if (!infettoCheckbox || !infettoHelper) return;

    const isInfetto = isPatientCurrentlyInfected();
    const hasNewInfectionData = infectionDataManager.hasValidInfectionData();

    if (isInfetto) {
        // Se ci sono eventi di infezione attivi, il checkbox è gestito dagli eventi
        infettoCheckbox.checked = true;
        infettoCheckbox.disabled = true;
        infettoHelper.textContent = 'Stato gestito dagli eventi di infezione attivi.';
        infettoHelper.style.display = 'block';
        
        // Pulisci i dati temporanei se ci sono eventi attivi
        if (hasNewInfectionData) {
            infectionDataManager.clearInfectionData();
            updateInfectionIndicator();
        }
    } else {
        // Se non ci sono eventi attivi, abilita il checkbox per nuovi inserimenti
        infettoCheckbox.disabled = false;
        infettoCheckbox.checked = hasNewInfectionData;
        infettoHelper.style.display = 'none';
        
        // Aggiorna l'indicatore visivo
        updateInfectionIndicator();
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
            ? `<span class="material-icons text-primary me-2">person</span><span class="patient-name fw-bold">${patientName}</span>`
            : '<span class="material-icons text-primary me-2">person</span>Nome Cognome';
        titleElement.innerHTML = sanitizeHtml(titleHTML);
    } else {
        // Modalità inserimento - titolo standard
        titleElement.innerHTML = sanitizeHtml('<span class="material-icons me-2">person_add</span>Inserimento Nuovo Paziente');
    }
}

/**
 * Configura l'event listener per il checkbox "infetto" per gestire la modal di infezione
 */
export function setupInfectionFlagHandler() {
    const infettoCheckbox = document.getElementById('infetto');
    const infettoLabel = document.querySelector('label[for="infetto"]');
    
    if (!infettoCheckbox || !infettoLabel) return;

    // Aggiungi event listener per il toggle del checkbox
    infettoCheckbox.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        
        if (isChecked) {
            // Se il checkbox viene selezionato, mostra la modal per i dati di infezione
            const infectionData = await showInfectionModal();
            
            if (infectionData) {
                // Salva i dati temporaneamente
                infectionDataManager.setInfectionData(infectionData);
                updateInfectionIndicator();
            } else {
                // Se l'utente annulla, deseleziona il checkbox
                e.target.checked = false;
                infectionDataManager.clearInfectionData();
                updateInfectionIndicator();
            }
        } else {
            // Se il checkbox viene deselezionato, pulisci i dati
            clearInfectionData();
        }
    });

    // Aggiungi indicatore visivo iniziale
    updateInfectionIndicator();
}

/**
 * Mostra la modal per raccogliere i dati di infezione
 * @returns {Promise<Object|null>} Promise che si risolve con i dati dell'infezione o null se annullato
 */
export async function showInfectionModal() {
    const nomeInput = document.getElementById('nome');
    const cognomeInput = document.getElementById('cognome');
    const patientName = nomeInput && cognomeInput 
        ? `${nomeInput.value.trim()} ${cognomeInput.value.trim()}`.trim()
        : '';

    // Usa i dati esistenti se disponibili
    const existingData = infectionDataManager.getInfectionData();
    
    const modal = new InfectionEventModal({
        title: 'Dati Infezione Paziente',
        patientName: patientName || 'Nuovo Paziente',
        defaultDate: existingData?.data_evento || new Date().toISOString().split('T')[0]
    });

    try {
        const result = await modal.show();
        return result;
    } catch (error) {
        console.error('Errore nella modal di infezione:', error);
        notificationService.error('Errore nell\'apertura della modal di infezione');
        return null;
    }
}

/**
 * Restituisce i dati di infezione correnti
 * @returns {Object|null} Dati di infezione o null se non presenti
 */
export function getInfectionData() {
    return infectionDataManager.getInfectionData();
}

/**
 * Pulisce i dati temporanei di infezione
 */
export function clearInfectionData() {
    infectionDataManager.clearInfectionData();
    updateInfectionIndicator();
    
    // Deseleziona il checkbox se necessario
    const infettoCheckbox = document.getElementById('infetto');
    if (infettoCheckbox && infettoCheckbox.checked) {
        infettoCheckbox.checked = false;
    }
}

/**
 * Verifica se ci sono dati di infezione validi
 * @returns {boolean} True se ci sono dati validi
 */
export function hasValidInfectionData() {
    return infectionDataManager.hasValidInfectionData();
}

/**
 * Verifica se ci sono dati di infezione (anche se non validi)
 * @returns {boolean} True se ci sono dati presenti
 */
export function hasInfectionData() {
    return infectionDataManager.hasInfectionData();
}

/**
 * Aggiorna l'indicatore visivo per la presenza di dati di infezione
 */
function updateInfectionIndicator() {
    const infettoLabel = document.querySelector('label[for="infetto"]');
    const infettoCheckbox = document.getElementById('infetto');
    
    if (!infettoLabel || !infettoCheckbox) return;

    // Rimuovi indicatori esistenti
    const existingBadge = infettoLabel.querySelector('.infection-data-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    // Se ci sono dati di infezione, aggiungi un badge
    if (infectionDataManager.hasInfectionData()) {
        const isValid = infectionDataManager.hasValidInfectionData();
        const badge = document.createElement('span');
        badge.className = `badge ms-2 infection-data-badge ${isValid ? 'bg-success' : 'bg-warning'}`;
        badge.innerHTML = isValid 
            ? '<span class="material-icons" style="font-size: 12px;">check_circle</span> Dati inseriti'
            : '<span class="material-icons" style="font-size: 12px;">warning</span> Dati incompleti';
        
        infettoLabel.appendChild(badge);

        // Aggiungi tooltip con dettagli
        const infectionData = infectionDataManager.getInfectionData();
        if (infectionData) {
            badge.title = `Data: ${infectionData.data_evento || 'Non specificata'}\nAgente: ${infectionData.agente_patogeno || 'Non specificato'}`;
        }

        // Aggiungi click handler per riaprire la modal
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const updatedData = await showInfectionModal();
            if (updatedData) {
                infectionDataManager.setInfectionData(updatedData);
                updateInfectionIndicator();
            }
        });
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
    
    // Cleanup dei dati temporanei di infezione
    infectionDataManager.clearInfectionData();
    
    // Cleanup del tab eventi clinici
    cleanupEventiCliniciTab();
}

/**
 * Popola i campi del form con i dati di un paziente esistente.
 * @param {Object} patient - I dati del paziente.
 */
export function populateForm(patient) {
    if (!patient) return;

    // Funzione helper per impostare il valore di un elemento in modo sicuro
    const setElementValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value || '';
            }
        } else {
            console.warn(`Elemento con ID '${id}' non trovato durante populateForm`);
        }
    };

    // Converti le date da yyyy-mm-dd a dd/mm/yyyy per il datepicker
    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };
    
    // Popola tutti i campi usando la funzione helper
    setElementValue('paziente-id', patient.id);
    setElementValue('nome', patient.nome);
    setElementValue('cognome', patient.cognome);
    setElementValue('data_nascita', formatDateForDisplay(patient.data_nascita));
    setElementValue('data_ricovero', formatDateForDisplay(patient.data_ricovero));
    setElementValue('data_dimissione', formatDateForDisplay(patient.data_dimissione));
    setElementValue('diagnosi', patient.diagnosi);
    setElementValue('reparto_appartenenza', patient.reparto_appartenenza);
    setElementValue('reparto_provenienza', patient.reparto_provenienza);
    setElementValue('livello_assistenza', patient.livello_assistenza);
    setElementValue('codice_rad', patient.codice_rad);
    setElementValue('infetto', patient.infetto);

    // Popola i nuovi campi per dimissione/trasferimento
    setElementValue('tipo_dimissione', patient.tipo_dimissione);
    setElementValue('reparto_destinazione', patient.reparto_destinazione);
    setElementValue('clinica_destinazione', patient.clinica_destinazione);
    setElementValue('codice_clinica', patient.codice_clinica);
    setElementValue('codice_dimissione', patient.codice_dimissione);

    // Mostra/nascondi campi condizionali basati sul tipo dimissione e stato infetto
    handleTipoDimissioneChange(patient.tipo_dimissione || '');
    
    // Pulisci i dati temporanei di infezione quando si carica un paziente esistente
    infectionDataManager.clearInfectionData();
    updateInfectionIndicator();
    
    // Imposta il paziente corrente per il tab eventi clinici
    setCurrentPatient(patient.id);

    // Aggiorna il titolo e il pulsante per la modalità modifica
    const patientName = `${patient.nome || ''} ${patient.cognome || ''}`.trim();
    const titleHTML = patientName 
        ? `<span class="patient-name fw-bold">${patientName}</span>`
        : '<span class="patient-name fw-bold">Nome Cognome</span>';
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

    // Determina lo stato infetto: se ci sono eventi clinici attivi, usa quello stato
    // altrimenti usa il flag del checkbox se ci sono dati di infezione validi
    const hasActiveInfection = isPatientCurrentlyInfected();
    const hasNewInfectionData = infectionDataManager.hasValidInfectionData();
    
    data.infetto = hasActiveInfection || hasNewInfectionData;

    // Aggiungi i dati di infezione se presenti e validi
    if (hasNewInfectionData && !hasActiveInfection) {
        const infectionData = infectionDataManager.getInfectionData();
        data._hasInfectionData = true;
        data._infectionData = infectionData;
        data._requiresInfectionEvent = true;
    }

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