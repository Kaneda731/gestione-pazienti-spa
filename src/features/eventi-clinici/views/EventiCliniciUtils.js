// src/features/eventi-clinici/views/EventiCliniciUtils.js

/**
 * Utility functions per la gestione degli eventi clinici
 */

/**
 * Utility function per debouncing
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Converte data da dd/mm/yyyy a yyyy-mm-dd
 */
export function convertDateToISO(dateString) {
  if (!dateString) {
    return null;
  }
  
  // Se è già in formato ISO, restituiscilo così com'è
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  if (!dateString.includes('/')) {
    throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
  }
  
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
  }
  
  const [day, month, year] = parts;
  
  // Validazione dei componenti della data
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    throw new Error('Formato data non valido. Utilizzare numeri validi');
  }
  
  if (dayNum < 1 || dayNum > 31) {
    throw new Error('Giorno non valido (1-31)');
  }
  
  if (monthNum < 1 || monthNum > 12) {
    throw new Error('Mese non valido (1-12)');
  }
  
  if (yearNum < 1900 || yearNum > 2100) {
    throw new Error('Anno non valido');
  }
  
  // Crea un oggetto Date per validare ulteriormente la data
  const dateObj = new Date(yearNum, monthNum - 1, dayNum);
  if (dateObj.getDate() !== dayNum || dateObj.getMonth() !== monthNum - 1 || dateObj.getFullYear() !== yearNum) {
    throw new Error('Data non valida (es. 31/02/2025)');
  }
  
  // Formatta sempre con zero padding
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Nasconde tutti i risultati di ricerca
 */
export function hideAllSearchResults() {
  hideSearchResults('patient-search-results');
  hideSearchResults('evento-patient-search-results');
}

/**
 * Nasconde i risultati di ricerca per un container specifico
 */
export function hideSearchResults(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.style.display = 'none';
  }
}

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