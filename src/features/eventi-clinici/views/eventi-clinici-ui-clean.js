// src/features/eventi-clinici/views/eventi-clinici-ui.js
// Barrel module per compatibilità durante refactoring

import { logger } from "../../../core/services/logger/loggerService.js";
import { formatDate } from "../../../shared/utils/formatting.js";
import { sanitizeHtml } from "../../../shared/utils/sanitizeHtml.js";
import { coreApplyResponsiveDesign } from "./responsive/applyResponsiveDesign.js";
import { debounce } from "./utils/debounce.js";
import { populateDepartmentFilterCore } from "./filters/populateDepartmentFilter.js";
import { EventiTableRenderer } from "./ui/EventiTableRenderer.js";
import { EventiTimelineRenderer } from "./ui/EventiTimelineRenderer.js";

// Re-export dal nuovo modulo renderer
export {
  renderEventsResponsive,
  renderEventsTimeline,
  renderEventsTable,
  showLoading,
  showError,
  showSearchingState,
  hideSearchingState,
  renderPatientSearchResults,
  renderEventDetails,
  showActiveFiltersIndicator,
  showFilterStats,
  showExportProgress,
  showExportSuccess,
  highlightSearchTerms,
  updateSearchResultsCount
} from './ui-modules/renderer.js';

// Re-export per reset filtri dalla UI
export { resetCurrentFiltersToDefaults } from '../api/eventi-clinici-api.js';

// ============================================================================
// CONSTANTS & STATE
// ============================================================================

// DOM elements cache
let domElements = {};

// Renderers cache
let tableRenderer = null;
let timelineRenderer = null;

// ============================================================================
// DOM INITIALIZATION
// ============================================================================

/**
 * Inizializza i riferimenti agli elementi DOM
 */
export function initializeDOMElements() {
  domElements = {
    // Main containers
    timelineContainer: document.getElementById("eventi-timeline-container"),
    tableContainer: document.getElementById("eventi-table-container"),
    tableBody: document.getElementById("eventi-table-body"),

    // Search and filters
    searchPatientInput: document.getElementById("eventi-search-patient"),
    patientSearchResults: document.getElementById("patient-search-results"),
    filterType: document.getElementById("eventi-filter-type"),
    filterDateFrom: document.getElementById("eventi-filter-date-from"),
    filterDateTo: document.getElementById("eventi-filter-date-to"),
    filterDepartment: document.getElementById("eventi-filter-department"),
    filterStatus: document.getElementById("eventi-filter-status"),
    searchResultsInfo: document.getElementById("search-results-info"),

    // Buttons
    addEventBtn: document.getElementById("eventi-add-btn"),
    resetFiltersBtn: document.getElementById("eventi-reset-filters-btn"),
    exportBtn: document.getElementById("eventi-export-btn"),
    exportCsvBtn: document.getElementById("eventi-export-csv-btn"),
    exportJsonBtn: document.getElementById("eventi-export-json-btn"),
    saveFiltersBtn: document.getElementById("eventi-save-filters-btn"),
    loadFiltersBtn: document.getElementById("eventi-load-filters-btn"),

    // Pagination
    paginationControls: document.getElementById("eventi-pagination-controls"),
    pageInfo: document.getElementById("eventi-page-info"),
    prevPageBtn: document.getElementById("eventi-prev-page-btn"),
    nextPageBtn: document.getElementById("eventi-next-page-btn"),

    // Advanced filters (if present)
    advancedFiltersToggle: document.getElementById("eventi-advanced-filters-toggle"),
    advancedFiltersPanel: document.getElementById("eventi-advanced-filters-panel"),
    filterPriorityFrom: document.getElementById("eventi-filter-priority-from"),
    filterPriorityTo: document.getElementById("eventi-filter-priority-to"),
    filterCreatedBy: document.getElementById("eventi-filter-created-by"),
    filterHasAllegati: document.getElementById("eventi-filter-has-allegati"),

    // Modal elements
    modal: document.getElementById("evento-modal"),
    modalTitle: document.getElementById("evento-modal-title"),
    modalBody: document.getElementById("evento-modal-body"),
    saveBtn: document.getElementById("evento-save-btn"),
    editBtn: document.getElementById("evento-edit-btn"),
    deleteBtn: document.getElementById("evento-delete-btn"),
    
    // Form elements
    eventForm: document.getElementById("evento-form"),
    eventTypeSelect: document.getElementById("evento-tipo"),
    eventDateInput: document.getElementById("evento-data"),
    eventDescriptionInput: document.getElementById("evento-descrizione"),
    eventNotesInput: document.getElementById("evento-note"),
    patientNameInput: document.getElementById("paziente-nome"),
    departmentSelect: document.getElementById("evento-reparto"),
    prioritySelect: document.getElementById("evento-priorita"),
    statusSelect: document.getElementById("evento-status"),
    
    // Additional fields for specific event types
    dischargeCodeSelect: document.getElementById("evento-codice-dimissione"),
    dischargeDestinationSelect: document.getElementById("evento-destinazione-dimissione"),
    transferSourceInput: document.getElementById("evento-provenienza-trasferimento"),
    transferDestinationInput: document.getElementById("evento-destinazione-trasferimento")
  };

  logger.log("🎯 DOM elements inizializzati:", Object.keys(domElements).length, "elementi");
  
  // Inizializza il renderer con i DOM elements
  import('./ui-modules/renderer.js').then(({ initializeRenderer }) => {
    initializeRenderer(domElements);
  });
  
  return domElements;
}

/**
 * Resetta lo stato UI locale per evitare riferimenti DOM stali tra navigazioni
 */
export function resetUIState() {
  try {
    tableRenderer = null;
    timelineRenderer = null;
    domElements = {};
    logger.log("🧹 UI state reset: renderers e domElements azzerati");
  } catch (err) {
    logger.warn("⚠️ Errore durante resetUIState:", err);
  }
}

/**
 * Ottiene i riferimenti DOM (per uso esterno)
 */
export function getDOMElements() {
  return domElements;
}

/**
 * Inizializza i renderer se non presenti
 */
function ensureRenderers() {
  if (!tableRenderer) {
    tableRenderer = new EventiTableRenderer(domElements, {
      showError: (...args) => import('./ui-modules/renderer.js').then(({ showError }) => showError(...args)),
      updatePaginationControls,
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    tableRenderer.domElements = domElements;
  }
  if (!timelineRenderer) {
    timelineRenderer = new EventiTimelineRenderer(domElements, {
      showError: (...args) => import('./ui-modules/renderer.js').then(({ showError }) => showError(...args)),
      updatePaginationControls,
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    timelineRenderer.domElements = domElements;
  }
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
  if (!modalTitle) return;

  modalTitle.innerHTML = sanitizeHtml(`
    <span class="material-icons me-2">${icon}</span>
    ${sanitizeHtml(title)}
  `);
}

/**
 * Mostra/nasconde campi specifici per tipo evento
 */
export function toggleEventTypeFields(eventType) {
  const dischargeFields = document.getElementById('discharge-fields');
  const transferFields = document.getElementById('transfer-fields');

  if (dischargeFields) {
    dischargeFields.style.display = eventType === 'dimissione' ? 'block' : 'none';
  }

  if (transferFields) {
    transferFields.style.display = eventType === 'trasferimento' ? 'block' : 'none';
  }
}

// ============================================================================
// FILTER UI FUNCTIONS
// ============================================================================

/**
 * Resetta l'interfaccia dei filtri
 */
export function resetFiltersUI() {
  if (!domElements) return;

  // Reset dei campi filtro
  if (domElements.filterType) domElements.filterType.value = '';
  if (domElements.filterDateFrom) domElements.filterDateFrom.value = '';
  if (domElements.filterDateTo) domElements.filterDateTo.value = '';
  if (domElements.filterDepartment) domElements.filterDepartment.value = '';
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
 */
export function applyFiltersToUI(filters) {
  if (!domElements || !filters) return;

  if (domElements.filterType && filters.tipo_evento) {
    domElements.filterType.value = filters.tipo_evento;
  }
  if (domElements.filterDateFrom && filters.data_da) {
    domElements.filterDateFrom.value = filters.data_da;
  }
  if (domElements.filterDateTo && filters.data_a) {
    domElements.filterDateTo.value = filters.data_a;
  }
  if (domElements.filterDepartment && filters.reparto) {
    domElements.filterDepartment.value = filters.reparto;
  }
  if (domElements.filterStatus && filters.status) {
    domElements.filterStatus.value = filters.status;
  }
  if (domElements.searchPatientInput && filters.paziente) {
    domElements.searchPatientInput.value = filters.paziente;
  }

  logger.log("🎛️ Filtri applicati all'UI:", filters);
}

/**
 * Ottiene i filtri dall'interfaccia
 */
export function getFiltersFromUI() {
  if (!domElements) return {};

  return {
    tipo_evento: domElements.filterType?.value || '',
    data_da: domElements.filterDateFrom?.value || '',
    data_a: domElements.filterDateTo?.value || '',
    reparto: domElements.filterDepartment?.value || '',
    status: domElements.filterStatus?.value || '',
    paziente: domElements.searchPatientInput?.value || '',
    priorita_da: domElements.filterPriorityFrom?.value || '',
    priorita_a: domElements.filterPriorityTo?.value || '',
    creato_da: domElements.filterCreatedBy?.value || '',
    ha_allegati: domElements.filterHasAllegati?.checked || false
  };
}

/**
 * Popola il filtro reparto
 */
export function populateDepartmentFilter(departments) {
  return populateDepartmentFilterCore(departments, domElements.filterDepartment);
}

/**
 * Popola i filtri avanzati
 */
export function populateAdvancedFilters(config) {
  // Implementazione placeholder - sarà completata nelle prossime iterazioni
  logger.log("🔧 Popolamento filtri avanzati:", config);
}

// ============================================================================
// RESPONSIVE DESIGN
// ============================================================================

/**
 * Applica il design responsive
 */
export function applyResponsiveDesign() {
  try {
    coreApplyResponsiveDesign();
    logger.log("📱 Design responsive applicato");
  } catch (error) {
    logger.warn("⚠️ Errore applicazione design responsive:", error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Aggiorna i controlli di paginazione
 */
function updatePaginationControls(eventsData) {
  if (!domElements.paginationControls) return;

  const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = eventsData;

  if (domElements.prevPageBtn) {
    domElements.prevPageBtn.disabled = !hasPrevPage;
  }

  if (domElements.nextPageBtn) {
    domElements.nextPageBtn.disabled = !hasNextPage;
  }

  if (domElements.pageInfo) {
    const startItem = currentPage * 10 + 1;
    const endItem = Math.min((currentPage + 1) * 10, totalCount);
    domElements.pageInfo.textContent = `${startItem}-${endItem} di ${totalCount} eventi (Pagina ${currentPage + 1} di ${totalPages})`;
  }

  domElements.paginationControls.style.display = totalPages > 1 ? "flex" : "none";
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Initialize responsive design on window resize
if (typeof window !== "undefined") {
  const handleResize = debounce(() => applyResponsiveDesign(), 150);
  window.addEventListener("resize", handleResize);
}
