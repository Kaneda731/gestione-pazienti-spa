// src/features/eventi-clinici/views/utils/form.js
// Implementazioni locali migrate dal legacy; API invariata
import { convertDateToISO } from './date.js';

/**
 * Ottiene i dati dal form
 */
export function getFormData(domElements) {
  const rawDate = domElements.eventDate?.value || '';
  let convertedDate = null;

  // Converti la data solo se presente
  if (rawDate && rawDate.trim() !== '') {
    try {
      convertedDate = convertDateToISO(rawDate.trim());
    } catch (error) {
      throw new Error(error.message || 'Formato data non valido. Utilizzare il formato gg/mm/aaaa');
    }
  }

  return {
    paziente_id: domElements.eventPatientId?.value || '',
    tipo_evento: domElements.eventType?.value || '',
    data_evento: convertedDate,
    descrizione: domElements.eventDescription?.value || '',
    tipo_intervento: domElements.interventionType?.value || '',
    agente_patogeno: domElements.infectionAgent?.value || ''
  };
}

/**
 * Valida i dati del form
 */
export function validateFormData(data) {
  const errors = [];

  if (!data.paziente_id) {
    errors.push('Seleziona un paziente');
  }

  if (!data.tipo_evento) {
    errors.push('Seleziona il tipo di evento');
  }

  if (!data.data_evento) {
    errors.push('Inserisci la data dell\'evento');
  }

  if (data.tipo_evento === 'intervento' && !data.tipo_intervento) {
    errors.push('Specifica il tipo di intervento');
  }

  if (errors.length > 0) {
    return { isValid: false, errors: errors.join('<br>') };
  }

  return { isValid: true, errors: null };
}
