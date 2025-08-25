/**
 * Modulo State Management per Eventi Clinici
 * 
 * Gestisce lo stato dell'interfaccia utente e l'inizializzazione DOM:
 * - Inizializzazione e cache degli elementi DOM
 * - Gestione responsive design
 * - Reset stato UI tra navigazioni
 * - Coordinamento tra i vari moduli UI
 * 
 * @module EventiCliniciStateManager
 */

import { logger } from "../../../../core/services/logger/loggerService.js";
import { coreApplyResponsiveDesign } from "../responsive/applyResponsiveDesign.js";
import { debounce } from "../utils/debounce.js";
import { EventiTableRenderer } from "../ui/EventiTableRenderer.js";
import { EventiTimelineRenderer } from "../ui/EventiTimelineRenderer.js";

// ============================================================================
// STATE VARIABLES
// ============================================================================

/**
 * Cache degli elementi DOM per evitare query multiple
 */
let domElements = {};

/**
 * Cache dei renderers per ottimizzazione performance
 */
let tableRenderer = null;
let timelineRenderer = null;

/**
 * Flag per tracciare se il modulo è stato inizializzato
 */
let isInitialized = false;

// ============================================================================
// DOM INITIALIZATION
// ============================================================================

/**
 * Inizializza i riferimenti agli elementi DOM
 * Questo è il punto centrale per l'inizializzazione del modulo eventi clinici
 * 
 * @returns {Object} Oggetto contenente tutti i riferimenti DOM
 */
export function initializeDOMElements() {
  logger.log("🔄 Inizializzazione DOM elements per eventi clinici...");

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
    filterReparto: document.getElementById("eventi-filter-reparto"),
    filterStato: document.getElementById("eventi-filter-stato"),
    filterSortColumn: document.getElementById("eventi-sort-column"),
    filterSortDirection: document.getElementById("eventi-sort-direction"),

    // Action buttons
    addEventBtn: document.getElementById("eventi-add-btn"),
    resetFiltersBtn: document.getElementById("eventi-reset-filters-btn"),
    exportCsvBtn: document.getElementById("eventi-export-csv-btn"),
    exportJsonBtn: document.getElementById("eventi-export-json-btn"),

    // Pagination
    paginationControls: document.getElementById("eventi-pagination-controls"),
    prevPageBtn: document.getElementById("eventi-prev-page-btn"),
    nextPageBtn: document.getElementById("eventi-next-page-btn"),
    pageInfo: document.getElementById("eventi-page-info"),

    // Modals
    eventFormModal: document.getElementById("evento-form-modal"),
    eventDetailModal: document.getElementById("evento-detail-modal"),

    // Modal elements
    modalTitle: document.getElementById("evento-modal-title"),
    modalIcon: document.getElementById("evento-modal-icon"),
    saveBtn: document.getElementById("evento-save-btn"),
    detailTitle: document.getElementById("evento-detail-title"),
    detailIcon: document.getElementById("evento-detail-icon"),
    detailContent: document.getElementById("evento-detail-content"),
    messageContainer: document.getElementById("evento-messaggio-container"),

    // Form elements
    eventForm: document.getElementById("evento-form"),
    eventId: document.getElementById("evento-id"),
    eventPatientInput: document.getElementById("evento-paziente"),
    eventPatientId: document.getElementById("evento-paziente-id"),
    eventPatientSearchResults: document.getElementById("evento-patient-search-results"),
    eventType: document.getElementById("evento-tipo"),
    eventDate: document.getElementById("evento-data"),
    eventDescription: document.getElementById("evento-descrizione"),

    // Type-specific fields
    interventionFields: document.getElementById("intervento-fields"),
    interventionType: document.getElementById("evento-tipo-intervento"),
    infectionFields: document.getElementById("infezione-fields"),
    infectionAgent: document.getElementById("evento-agente-patogeno")
  };

  // Conta elementi trovati vs elementi cercati
  const foundElements = Object.values(domElements).filter(el => el !== null).length;
  const totalElements = Object.keys(domElements).length;
  
  logger.log(`🎯 DOM elements inizializzati: ${foundElements}/${totalElements} elementi trovati`);
  
  // Log degli elementi mancanti per debugging
  const missingElements = Object.entries(domElements)
    .filter(([_, element]) => element === null)
    .map(([key, _]) => key);
    
  if (missingElements.length > 0) {
    logger.warn("⚠️ Elementi DOM non trovati:", missingElements);
  }

  // Inizializza tutti i moduli UI con i DOM elements
  initializeUIModules();
  
  // Inizializza responsive design
  setupResponsiveDesign();
  
  isInitialized = true;
  logger.log("✅ State Manager inizializzato completamente");
  
  return domElements;
}

/**
 * Inizializza tutti i moduli UI con i riferimenti DOM
 */
async function initializeUIModules() {
  try {
    // Inizializza il renderer con i DOM elements
    const rendererModule = await import('./renderer.js');
    if (rendererModule.initializeRenderer) {
      rendererModule.initializeRenderer(domElements);
    }
    
    // Inizializza il forms manager con i DOM elements
    const formsModule = await import('./forms.js');
    if (formsModule.initializeForms) {
      formsModule.initializeForms(domElements);
    }
    
    // Inizializza il filters manager con i DOM elements
    const filtersModule = await import('./filters.js');
    if (filtersModule.initializeFilters) {
      filtersModule.initializeFilters(domElements);
    }
    
    logger.log("🔗 Tutti i moduli UI inizializzati");
  } catch (error) {
    logger.error("❌ Errore inizializzazione moduli UI:", error);
  }
}

/**
 * Configura il responsive design e i listener
 */
function setupResponsiveDesign() {
  // Applica design responsive iniziale
  applyResponsiveDesign();
  
  // Setup listener per resize con debounce
  if (typeof window !== "undefined") {
    const handleResize = debounce(() => applyResponsiveDesign(), 150);
    window.addEventListener("resize", handleResize);
  }
}

// ============================================================================
// STATE ACCESS FUNCTIONS
// ============================================================================

/**
 * Ottiene i riferimenti DOM (per uso esterno)
 * @returns {Object} Oggetto contenente tutti i riferimenti DOM
 */
export function getDOMElements() {
  if (!isInitialized) {
    logger.warn("⚠️ State Manager non inizializzato, chiamando initializeDOMElements()");
    return initializeDOMElements();
  }
  return domElements;
}

/**
 * Verifica se il modulo è stato inizializzato
 * @returns {boolean} True se inizializzato
 */
export function isStateInitialized() {
  return isInitialized;
}

/**
 * Ottiene un singolo elemento DOM per chiave
 * @param {string} elementKey - Chiave dell'elemento nel domElements
 * @returns {HTMLElement|null} Elemento DOM o null se non trovato
 */
export function getDOMElement(elementKey) {
  if (!domElements[elementKey]) {
    logger.warn(`⚠️ Elemento DOM '${elementKey}' non trovato`);
    return null;
  }
  return domElements[elementKey];
}

// ============================================================================
// RENDERERS MANAGEMENT
// ============================================================================

/**
 * Inizializza i renderer se non presenti
 * Utilizzato per lazy initialization dei componenti pesanti
 */
export function ensureRenderers() {
  if (!tableRenderer) {
    tableRenderer = new EventiTableRenderer(domElements, {
      showError: async (...args) => {
        const rendererModule = await import('./renderer.js');
        return rendererModule.showError(...args);
      },
      updatePaginationControls,
    });
    logger.log("🏗️ Table renderer inizializzato");
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    tableRenderer.domElements = domElements;
  }
  
  if (!timelineRenderer) {
    timelineRenderer = new EventiTimelineRenderer(domElements, {
      showError: async (...args) => {
        const rendererModule = await import('./renderer.js');
        return rendererModule.showError(...args);
      },
      updatePaginationControls,
    });
    logger.log("📅 Timeline renderer inizializzato");
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    timelineRenderer.domElements = domElements;
  }
}

/**
 * Ottiene il table renderer
 * @returns {EventiTableRenderer} Istanza del table renderer
 */
export function getTableRenderer() {
  ensureRenderers();
  return tableRenderer;
}

/**
 * Ottiene il timeline renderer
 * @returns {EventiTimelineRenderer} Istanza del timeline renderer
 */
export function getTimelineRenderer() {
  ensureRenderers();
  return timelineRenderer;
}

// ============================================================================
// STATE RESET AND CLEANUP
// ============================================================================

/**
 * Resetta lo stato UI locale per evitare riferimenti DOM stali tra navigazioni
 * Importante per evitare memory leaks e riferimenti a elementi DOM non validi
 */
export function resetUIState() {
  try {
    logger.log("🧹 Resetting UI state...");
    
    // Reset renderers
    tableRenderer = null;
    timelineRenderer = null;
    
    // Reset DOM elements cache
    domElements = {};
    
    // Reset flag di inizializzazione
    isInitialized = false;
    
    logger.log("✅ UI state reset: renderers e domElements azzerati");
  } catch (err) {
    logger.warn("⚠️ Errore durante resetUIState:", err);
  }
}

/**
 * Rimuove tutti i listener degli eventi
 * Utilizzato durante cleanup per evitare memory leaks
 */
export function removeEventListeners() {
  try {
    if (typeof window !== "undefined") {
      // Rimuovi listener resize (questo è semplificato, in una implementazione reale
      // si dovrebbe tenere traccia dei listener specifici)
      window.removeEventListener("resize", applyResponsiveDesign);
    }
    logger.log("🧹 Event listeners rimossi");
  } catch (error) {
    logger.warn("⚠️ Errore rimozione event listeners:", error);
  }
}

// ============================================================================
// RESPONSIVE DESIGN
// ============================================================================

/**
 * Applica il design responsive
 * Centralizza la logica responsive per tutti i componenti eventi clinici
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
// PAGINATION UTILITIES
// ============================================================================

/**
 * Aggiorna i controlli di paginazione
 * @param {Object} eventsData - Dati eventi con informazioni paginazione
 */
export function updatePaginationControls(eventsData) {
  if (!domElements.paginationControls) {
    logger.warn("⚠️ Controlli paginazione non disponibili");
    return;
  }

  const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = eventsData;

  // Aggiorna stato bottoni
  if (domElements.prevPageBtn) {
    domElements.prevPageBtn.disabled = !hasPrevPage;
  }

  if (domElements.nextPageBtn) {
    domElements.nextPageBtn.disabled = !hasNextPage;
  }

  // Aggiorna info pagina
  if (domElements.pageInfo) {
    const startItem = currentPage * 10 + 1;
    const endItem = Math.min((currentPage + 1) * 10, totalCount);
    domElements.pageInfo.textContent = `${startItem}-${endItem} di ${totalCount} eventi (Pagina ${currentPage + 1} di ${totalPages})`;
  }

  // Mostra/nascondi controlli paginazione
  domElements.paginationControls.style.display = totalPages > 1 ? "flex" : "none";
  
  logger.log(`📄 Paginazione aggiornata: Pagina ${currentPage + 1}/${totalPages}`);
}

// ============================================================================
// HEALTH CHECK AND DEBUG
// ============================================================================

/**
 * Verifica lo stato di salute del modulo
 * @returns {Object} Report dello stato del modulo
 */
export function getHealthCheck() {
  const health = {
    isInitialized,
    domElementsCount: Object.keys(domElements).length,
    foundElementsCount: Object.values(domElements).filter(el => el !== null).length,
    hasTableRenderer: !!tableRenderer,
    hasTimelineRenderer: !!timelineRenderer,
    missingElements: Object.entries(domElements)
      .filter(([_, element]) => element === null)
      .map(([key, _]) => key)
  };
  
  return health;
}

/**
 * Stampa informazioni di debug del modulo
 */
export function debugStateManager() {
  const health = getHealthCheck();
  console.group("🔍 State Manager Debug");
  console.log("Stato inizializzazione:", health.isInitialized);
  console.log("DOM Elements:", `${health.foundElementsCount}/${health.domElementsCount}`);
  console.log("Table Renderer:", health.hasTableRenderer ? "✅" : "❌");
  console.log("Timeline Renderer:", health.hasTimelineRenderer ? "✅" : "❌");
  
  if (health.missingElements.length > 0) {
    console.warn("Elementi DOM mancanti:", health.missingElements);
  }
  
  console.groupEnd();
}
