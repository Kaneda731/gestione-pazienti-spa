/**
 * Modulo Filters UI per Eventi Clinici
 * 
 * Gestisce tutte le funzionalità di filtro dell'interfaccia utente:
 * - Reset e applicazione filtri
 * - Raccolta filtri dalla UI
 * - Popolamento filtri dipartimento e avanzati
 * - Gestione stato filtri
 * 
 * @module EventiCliniciFiltersUI
 */

import { logger } from "../../../../core/services/logger/loggerService.js";
import { populateDepartmentFilterCore } from "../filters/populateDepartmentFilter.js";

/**
 * Elementi DOM necessari per il modulo filters
 * Vengono inizializzati dal modulo principale
 */
let domElements = null;

/**
 * Inizializza il modulo filters con gli elementi DOM
 * @param {Object} elements - Oggetto contenente i riferimenti agli elementi DOM
 */
export function initializeFilters(elements) {
  domElements = elements;
  logger.log("🎛️ Modulo Filters inizializzato");
}

/**
 * Resetta l'interfaccia dei filtri
 * Pulisce tutti i campi filtro riportandoli al valore iniziale
 */
export function resetFiltersUI() {
  if (!domElements) {
    logger.warn("⚠️ DOM elements non inizializzati per resetFiltersUI");
    return;
  }

  // Reset dei campi filtro base
  if (domElements.filterType) domElements.filterType.value = '';
  if (domElements.filterDateFrom) domElements.filterDateFrom.value = '';
  if (domElements.filterDateTo) domElements.filterDateTo.value = '';
  if (domElements.filterReparto) domElements.filterReparto.value = '';
  if (domElements.filterStato) domElements.filterStato.value = '';
  if (domElements.filterSortColumn) domElements.filterSortColumn.value = '';
  if (domElements.filterSortDirection) domElements.filterSortDirection.value = 'desc';
  if (domElements.filterStatus) domElements.filterStatus.value = '';
  if (domElements.searchPatientInput) domElements.searchPatientInput.value = '';

  // Reset filtri avanzati
  if (domElements.filterPriorityFrom) domElements.filterPriorityFrom.value = '';
  if (domElements.filterPriorityTo) domElements.filterPriorityTo.value = '';
  if (domElements.filterCreatedBy) domElements.filterCreatedBy.value = '';
  if (domElements.filterHasAllegati) domElements.filterHasAllegati.checked = false;

  logger.log("🧹 Filtri UI resettati");
}

/**
 * Applica i filtri all'interfaccia
 * @param {Object} filters - Oggetto contenente i valori dei filtri da applicare
 */
export function applyFiltersToUI(filters) {
  if (!domElements) {
    logger.warn("⚠️ DOM elements non inizializzati per applyFiltersToUI");
    return;
  }
  
  if (!filters) {
    logger.warn("⚠️ Nessun filtro fornito per applyFiltersToUI");
    return;
  }

  // Applica filtri base
  if (domElements.filterType && filters.tipo_evento) {
    domElements.filterType.value = filters.tipo_evento;
  }
  if (domElements.filterDateFrom && filters.data_da) {
    domElements.filterDateFrom.value = filters.data_da;
  }
  if (domElements.filterDateTo && filters.data_a) {
    domElements.filterDateTo.value = filters.data_a;
  }
  if (domElements.filterReparto && filters.reparto) {
    domElements.filterReparto.value = filters.reparto;
  }

  if (domElements.filterStato && filters.stato) {
    domElements.filterStato.value = filters.stato;
  }

  if (domElements.filterSortColumn && filters.sortColumn) {
    domElements.filterSortColumn.value = filters.sortColumn;
  }

  if (domElements.filterSortDirection && filters.sortDirection) {
    domElements.filterSortDirection.value = filters.sortDirection;
  }
  if (domElements.filterStatus && filters.status) {
    domElements.filterStatus.value = filters.status;
  }
  if (domElements.searchPatientInput && filters.paziente) {
    domElements.searchPatientInput.value = filters.paziente;
  }

  // Applica filtri avanzati
  if (domElements.filterPriorityFrom && filters.priorita_da) {
    domElements.filterPriorityFrom.value = filters.priorita_da;
  }
  if (domElements.filterPriorityTo && filters.priorita_a) {
    domElements.filterPriorityTo.value = filters.priorita_a;
  }
  if (domElements.filterCreatedBy && filters.creato_da) {
    domElements.filterCreatedBy.value = filters.creato_da;
  }
  if (domElements.filterHasAllegati && typeof filters.ha_allegati === 'boolean') {
    domElements.filterHasAllegati.checked = filters.ha_allegati;
  }

  logger.log("🎛️ Filtri applicati all'UI:", filters);
}

/**
 * Ottiene i filtri dall'interfaccia
 * @returns {Object} Oggetto contenente tutti i valori dei filtri correnti
 */
export function getFiltersFromUI() {
  if (!domElements) {
    logger.warn("⚠️ DOM elements non inizializzati per getFiltersFromUI");
    return {};
  }

  const filters = {
    paziente_search: domElements.searchPatientInput?.value || '',
    tipo_evento: domElements.filterType?.value || '',
    data_da: domElements.filterDateFrom?.value || '',
    data_a: domElements.filterDateTo?.value || '',
    reparto: domElements.filterReparto?.value || '',
    stato: domElements.filterStato?.value || '',
    sortColumn: domElements.filterSortColumn?.value || '',
    sortDirection: domElements.filterSortDirection?.value || 'desc'
  };

  logger.log("📊 Filtri raccolti dalla UI:", filters);
  return filters;
}

/**
 * Popola il filtro reparto
 * @param {Array} departments - Array dei reparti disponibili
 * @returns {*} Risultato del popolamento filtro reparto
 */
export function populateDepartmentFilter(departments) {
  if (!domElements.filterReparto) {
    logger.warn("⚠️ DOM elements non inizializzati per populateDepartmentFilter");
    return;
  }

  if (!departments || !Array.isArray(departments)) {
    logger.warn("⚠️ Lista departments non valida:", departments);
    return;
  }

  return populateDepartmentFilterCore(departments, domElements.filterReparto);
}

/**
 * Popola i filtri avanzati
 * @param {Object} config - Configurazione per i filtri avanzati
 */
export function populateAdvancedFilters(config) {
  if (!domElements) {
    logger.warn("⚠️ DOM elements non inizializzati per populateAdvancedFilters");
    return;
  }

  // Implementazione placeholder - sarà completata nelle prossime iterazioni
  logger.log("🔧 Popolamento filtri avanzati:", config);
  
  // Qui verrebbe implementata la logica per:
  // - Popolamento dropdown priorità
  // - Popolamento filtro creato da
  // - Configurazione filtri personalizzati
  // - Setup di filtri dinamici basati sui dati
}

/**
 * Valida i filtri correnti
 * @returns {Object} Oggetto con risultato validazione e messaggi errore
 */
export function validateFilters() {
  const filters = getFiltersFromUI();
  const errors = [];

  // Validazione date
  if (filters.data_da && filters.data_a) {
    const dateFrom = new Date(filters.data_da);
    const dateTo = new Date(filters.data_a);
    
    if (dateFrom > dateTo) {
      errors.push("La data di inizio deve essere precedente alla data di fine");
    }
  }

  // Validazione priorità
  if (filters.priorita_da && filters.priorita_a) {
    const priorityFrom = parseInt(filters.priorita_da);
    const priorityTo = parseInt(filters.priorita_a);
    
    if (priorityFrom > priorityTo) {
      errors.push("La priorità minima deve essere inferiore alla priorità massima");
    }
  }

  const isValid = errors.length === 0;
  logger.log(isValid ? "✅ Filtri validi" : "❌ Errori validazione filtri:", errors);

  return {
    isValid,
    errors
  };
}

/**
 * Conta i filtri attivi
 * @returns {number} Numero di filtri con valori non vuoti
 */
export function getActiveFiltersCount() {
  const filters = getFiltersFromUI();
  let count = 0;

  // Conta filtri base
  if (filters.tipo_evento) count++;
  if (filters.data_da) count++;
  if (filters.data_a) count++;
  if (filters.reparto) count++;
  if (filters.status) count++;
  if (filters.paziente) count++;

  // Conta filtri avanzati
  if (filters.priorita_da) count++;
  if (filters.priorita_a) count++;
  if (filters.creato_da) count++;
  if (filters.ha_allegati) count++;

  logger.log(`📊 Filtri attivi: ${count}`);
  return count;
}

/**
 * Salva i filtri correnti nel localStorage
 * @param {string} key - Chiave per salvare i filtri
 */
export function saveFiltersToStorage(key = 'eventi-clinici-filters') {
  try {
    const filters = getFiltersFromUI();
    localStorage.setItem(key, JSON.stringify(filters));
    logger.log("💾 Filtri salvati nel localStorage:", key);
  } catch (error) {
    logger.error("❌ Errore salvataggio filtri:", error);
  }
}

/**
 * Carica i filtri dal localStorage
 * @param {string} key - Chiave per caricare i filtri
 * @returns {Object|null} Filtri caricati o null se non trovati
 */
export function loadFiltersFromStorage(key = 'eventi-clinici-filters') {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const filters = JSON.parse(saved);
      logger.log("📂 Filtri caricati dal localStorage:", key);
      return filters;
    }
  } catch (error) {
    logger.error("❌ Errore caricamento filtri:", error);
  }
  return null;
}

/**
 * Applica filtri salvati se presenti
 * @param {string} key - Chiave dei filtri salvati
 */
export function restoreSavedFilters(key = 'eventi-clinici-filters') {
  const savedFilters = loadFiltersFromStorage(key);
  if (savedFilters) {
    applyFiltersToUI(savedFilters);
    logger.log("🔄 Filtri salvati ripristinati");
  }
}

/**
 * Pulisce i filtri salvati
 * @param {string} key - Chiave dei filtri da pulire
 */
export function clearSavedFilters(key = 'eventi-clinici-filters') {
  try {
    localStorage.removeItem(key);
    logger.log("🧹 Filtri salvati rimossi:", key);
  } catch (error) {
    logger.error("❌ Errore rimozione filtri salvati:", error);
  }
}
