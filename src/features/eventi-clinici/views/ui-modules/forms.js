// src/features/eventi-clinici/views/ui-modules/forms.js
// Modulo per la gestione dei form degli eventi clinici

import { logger } from '../../../../core/services/logger/loggerService.js';
import { sanitizeHtml } from '../../../../shared/utils/sanitizeHtml.js';

// Variabile globale per i DOM elements (sarà inizializzata dal state module)
let domElements = null;

/**
 * Inizializza il forms manager con i DOM elements
 * @param {Object} elements - Oggetto con riferimenti DOM
 */
export function initializeForms(elements) {
  domElements = elements;
}

// ============================================================================
// FORM MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Popola il form di inserimento/modifica evento
 */
export function populateEventForm(evento) {
  if (!evento || !domElements.eventForm) return;

  // Campi base
  if (domElements.eventTypeSelect) domElements.eventTypeSelect.value = evento.tipo_evento || '';
  if (domElements.eventDateInput) domElements.eventDateInput.value = evento.data_evento ? evento.data_evento.split('T')[0] : '';
  if (domElements.eventDescriptionInput) domElements.eventDescriptionInput.value = evento.descrizione || '';
  if (domElements.eventNotesInput) domElements.eventNotesInput.value = evento.note || '';
  if (domElements.departmentSelect) domElements.departmentSelect.value = evento.reparto || '';
  if (domElements.prioritySelect) domElements.prioritySelect.value = evento.priorita || '';
  if (domElements.statusSelect) domElements.statusSelect.value = evento.status || '';

  // Paziente
  if (domElements.patientNameInput) {
    domElements.patientNameInput.value = evento.paziente_nome ? `${evento.paziente_nome} ${evento.paziente_cognome || ''}`.trim() : '';
    if (evento.paziente_id) {
      domElements.patientNameInput.dataset.patientId = evento.paziente_id;
    }
  }

  // Campi specifici per tipo evento
  toggleEventTypeFields(evento.tipo_evento);

  // Campi dimissione
  if (domElements.dischargeCodeSelect) domElements.dischargeCodeSelect.value = evento.codice_dimissione || '';
  if (domElements.dischargeDestinationSelect) domElements.dischargeDestinationSelect.value = evento.destinazione_dimissione || '';

  // Campi trasferimento
  if (domElements.transferSourceInput) domElements.transferSourceInput.value = evento.provenienza_trasferimento || '';
  if (domElements.transferDestinationInput) domElements.transferDestinationInput.value = evento.destinazione_trasferimento || '';

  logger.log("📝 Form popolato con evento:", evento.id);
}

/**
 * Resetta il form di inserimento/modifica evento
 */
export function resetEventForm() {
  if (!domElements.eventForm) return;

  domElements.eventForm.reset();
  
  // Reset dataset dei pazienti
  if (domElements.patientNameInput) {
    delete domElements.patientNameInput.dataset.patientId;
  }

  // Nasconde tutti i campi specifici
  toggleEventTypeFields('');
  
  clearFormMessages();
  
  logger.log("🧹 Form evento resettato");
}

/**
 * Mostra messaggio nel form
 */
export function showFormMessage(message, type = "danger") {
  const messageContainer = document.getElementById('form-message-container');
  if (!messageContainer) return;

  messageContainer.innerHTML = sanitizeHtml(`
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${sanitizeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `);
}

/**
 * Pulisce i messaggi del form
 */
export function clearFormMessages() {
  const messageContainer = document.getElementById('form-message-container');
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }
}

/**
 * Aggiorna il titolo del modal
 */
export function updateModalTitle(title, icon = "add") {
  const modalTitle = document.getElementById('evento-modal-title');
  const modalIcon = document.getElementById('evento-modal-icon');
  
  if (!modalTitle) return;

  // Aggiorna solo il testo del titolo
  modalTitle.textContent = title;
  
  // Aggiorna l'icona separatamente se l'elemento esiste
  if (modalIcon) {
    modalIcon.textContent = icon;
  }
}

/**
 * Mostra/nasconde campi specifici per tipo evento
 */
export function toggleEventTypeFields(eventType) {
  const dischargeFields = document.getElementById('discharge-fields');
  const transferFields = document.getElementById('transfer-fields');
  const interventoFields = document.getElementById('intervento-fields');
  const infezioneFields = document.getElementById('infezione-fields');

  // Reset di tutti i campi
  if (dischargeFields) {
    dischargeFields.style.display = 'none';
  }
  if (transferFields) {
    transferFields.style.display = 'none';
  }
  if (interventoFields) {
    interventoFields.style.display = 'none';
  }
  if (infezioneFields) {
    infezioneFields.style.display = 'none';
  }

  // Pulisci i valori dei campi nascosti
  const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
  const agentePatogenoInput = document.getElementById('evento-agente-patogeno');
  
  if (tipoInterventoSelect) tipoInterventoSelect.value = '';
  if (agentePatogenoInput) agentePatogenoInput.value = '';

  // Mostra i campi appropriati in base al tipo di evento
  switch (eventType) {
    case 'dimissione':
      if (dischargeFields) {
        dischargeFields.style.display = 'block';
      }
      break;
    case 'trasferimento':
      if (transferFields) {
        transferFields.style.display = 'block';
      }
      break;
    case 'intervento':
      if (interventoFields) {
        interventoFields.style.display = 'block';
      }
      break;
    case 'infezione':
      if (infezioneFields) {
        infezioneFields.style.display = 'block';
      }
      break;
  }
}

// ============================================================================
// FORM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida i dati del form evento
 */
export function validateEventForm() {
  if (!domElements.eventForm) return { isValid: false, errors: ['Form non trovato'] };

  const errors = [];

  // Validazione campi obbligatori
  if (!domElements.eventTypeSelect?.value) {
    errors.push('Tipo evento è obbligatorio');
  }

  if (!domElements.eventDateInput?.value) {
    errors.push('Data evento è obbligatoria');
  }

  if (!domElements.eventDescriptionInput?.value?.trim()) {
    errors.push('Descrizione è obbligatoria');
  }

  if (!domElements.patientNameInput?.dataset?.patientId) {
    errors.push('Selezionare un paziente valido');
  }

  // Validazione data evento (non può essere nel futuro)
  if (domElements.eventDateInput?.value) {
    const eventDate = new Date(domElements.eventDateInput.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fine della giornata

    if (eventDate > today) {
      errors.push('La data evento non può essere nel futuro');
    }
  }

  // Validazioni specifiche per tipo evento
  const eventType = domElements.eventTypeSelect?.value;
  if (eventType === 'dimissione') {
    if (!domElements.dischargeCodeSelect?.value) {
      errors.push('Codice dimissione è obbligatorio per le dimissioni');
    }
    if (!domElements.dischargeDestinationSelect?.value) {
      errors.push('Destinazione dimissione è obbligatoria per le dimissioni');
    }
  }

  if (eventType === 'trasferimento') {
    if (!domElements.transferSourceInput?.value?.trim()) {
      errors.push('Provenienza è obbligatoria per i trasferimenti');
    }
    if (!domElements.transferDestinationInput?.value?.trim()) {
      errors.push('Destinazione è obbligatoria per i trasferimenti');
    }
  }

  if (eventType === 'intervento') {
    const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
    if (!tipoInterventoSelect?.value) {
      errors.push('Tipo intervento è obbligatorio per gli interventi');
    }
  }

  if (eventType === 'infezione') {
    const agentePatogenoInput = document.getElementById('evento-agente-patogeno');
    if (!agentePatogenoInput?.value?.trim()) {
      errors.push('Agente patogeno è obbligatorio per le infezioni');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Ottiene i dati dal form
 */
export function getFormData() {
  if (!domElements.eventForm) return null;

  const formData = {
    tipo_evento: domElements.eventTypeSelect?.value || '',
    data_evento: domElements.eventDateInput?.value || '',
    descrizione: domElements.eventDescriptionInput?.value?.trim() || '',
    note: domElements.eventNotesInput?.value?.trim() || '',
    reparto: domElements.departmentSelect?.value || '',
    priorita: domElements.prioritySelect?.value || '',
    status: domElements.statusSelect?.value || 'attivo',
    paziente_id: domElements.patientNameInput?.dataset?.patientId || null
  };

  // Campi specifici per tipo evento
  const eventType = formData.tipo_evento;
  if (eventType === 'dimissione') {
    formData.codice_dimissione = domElements.dischargeCodeSelect?.value || '';
    formData.destinazione_dimissione = domElements.dischargeDestinationSelect?.value || '';
  }

  if (eventType === 'trasferimento') {
    formData.provenienza_trasferimento = domElements.transferSourceInput?.value?.trim() || '';
    formData.destinazione_trasferimento = domElements.transferDestinationInput?.value?.trim() || '';
  }

  if (eventType === 'intervento') {
    const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
    formData.tipo_intervento = tipoInterventoSelect?.value || '';
  }

  if (eventType === 'infezione') {
    const agentePatogenoInput = document.getElementById('evento-agente-patogeno');
    formData.agente_patogeno = agentePatogenoInput?.value?.trim() || '';
  }

  return formData;
}

// ============================================================================
// FORM STATE MANAGEMENT
// ============================================================================

/**
 * Abilita/disabilita il form
 */
export function setFormEnabled(enabled) {
  if (!domElements.eventForm) return;

  const formElements = domElements.eventForm.querySelectorAll('input, select, textarea, button');
  formElements.forEach(element => {
    element.disabled = !enabled;
  });

  logger.log(`📝 Form ${enabled ? 'abilitato' : 'disabilitato'}`);
}

/**
 * Mostra/nasconde il loading nel form
 */
export function setFormLoading(isLoading, message = 'Salvataggio in corso...') {
  const saveBtn = domElements.saveBtn;
  if (!saveBtn) return;

  if (isLoading) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = sanitizeHtml(`
      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      ${sanitizeHtml(message)}
    `);
  } else {
    saveBtn.disabled = false;
    saveBtn.innerHTML = sanitizeHtml(`
      <span class="material-icons me-1">save</span>
      Salva
    `);
  }
}

/**
 * Evidenzia i campi con errori
 */
export function highlightFormErrors(errors) {
  if (!Array.isArray(errors)) return;

  // Reset previous errors
  const errorElements = domElements.eventForm?.querySelectorAll('.is-invalid');
  errorElements?.forEach(el => el.classList.remove('is-invalid'));

  // Mappa degli errori ai campi
  const errorFieldMap = {
    'Tipo evento è obbligatorio': domElements.eventTypeSelect,
    'Data evento è obbligatoria': domElements.eventDateInput,
    'Descrizione è obbligatoria': domElements.eventDescriptionInput,
    'Selezionare un paziente valido': domElements.patientNameInput,
    'Codice dimissione è obbligatorio per le dimissioni': domElements.dischargeCodeSelect,
    'Destinazione dimissione è obbligatoria per le dimissioni': domElements.dischargeDestinationSelect,
    'Provenienza è obbligatoria per i trasferimenti': domElements.transferSourceInput,
    'Destinazione è obbligatoria per i trasferimenti': domElements.transferDestinationInput
  };

  // Applica classi di errore
  errors.forEach(error => {
    const field = errorFieldMap[error];
    if (field) {
      field.classList.add('is-invalid');
    }
  });
}

// ============================================================================
// FORM AUTO-SAVE FUNCTIONALITY
// ============================================================================

let autoSaveTimeout = null;

/**
 * Salva automaticamente i dati del form
 */
export function enableAutoSave(saveCallback, delay = 3000) {
  if (!domElements.eventForm) return;

  const handleInput = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
      const formData = getFormData();
      const validation = validateEventForm();
      
      if (validation.isValid && formData.descrizione) {
        saveCallback(formData, true); // true = is auto-save
        logger.log('💾 Auto-save eseguito');
      }
    }, delay);
  };

  // Aggiungi listener agli input principali
  const inputElements = domElements.eventForm.querySelectorAll('input, select, textarea');
  inputElements.forEach(element => {
    element.addEventListener('input', handleInput);
    element.addEventListener('change', handleInput);
  });

  logger.log('💾 Auto-save abilitato con delay di', delay, 'ms');
}

/**
 * Disabilita l'auto-save
 */
export function disableAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }

  logger.log('💾 Auto-save disabilitato');
}
