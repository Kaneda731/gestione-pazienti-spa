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

// Re-export functions from modular components  
export * from './ui-modules/renderer.js';
export * from './ui-modules/forms.js';
export * from './ui-modules/filters.js';

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
  
  // Inizializza il forms manager con i DOM elements
  import('./ui-modules/forms.js').then(({ initializeForms }) => {
    initializeForms(domElements);
  });
  
  // Inizializza il filters manager con i DOM elements
  import('./ui-modules/filters.js').then(({ initializeFilters }) => {
    initializeFilters(domElements);
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
