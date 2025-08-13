// src/features/eventi-clinici/views/eventi-clinici.js

import {
  getSuggestedFilters,
  getDepartmentsList,
} from "./eventi-clinici-api.js";
import { resetCurrentFiltersToDefaults } from "./eventi-clinici-api.js";

import {
  initializeDOMElements,
  getDOMElements,
  populateDepartmentFilter,
  populateAdvancedFilters,
  applyResponsiveDesign,
  resetFiltersUI,
  showError,
} from "./eventi-clinici-ui.js";

import { logger } from "../../../core/services/logger/loggerService.js";
import { initCustomSelects } from "../../../shared/components/forms/CustomSelect.js";
import { initCustomDatepickers } from "../../../shared/components/forms/CustomDatepicker.js";

// Import new modules
import { EventiCliniciDataManager } from "./EventiCliniciDataManager.js";
import { EventiCliniciFilterManager } from "./EventiCliniciFilterManager.js";
import { EventiCliniciModalManager } from "./EventiCliniciModalManager.js";
import { EventiCliniciEventHandlers } from "./EventiCliniciEventHandlers.js";
import { resolveInfezioneEvento } from "./eventi-clinici-api.js";

/**
 * Controller principale per la gestione degli eventi clinici
 * Versione semplificata che si concentra sulle funzionalità essenziali
 */

// State management
let currentState = {
  currentPage: 0,
  filters: {
    paziente_search: "",
    tipo_evento: "",
    data_da: "",
    data_a: "",
    reparto: "",
    agente_patogeno: "",
    tipo_intervento: "",
    sortColumn: "data_evento",
    sortDirection: "desc",
  },
  selectedPatientId: null,
  editingEventId: null,
  isLoading: false,
  filterStats: null,
};

// DOM elements
let domElements = {};

// Manager instances
let dataManager = null;
let filterManager = null;
let modalManager = null;
let eventHandlers = null;

/**
 * Inizializza gli elementi DOM con retry semplice
 */
async function initializeDOMElementsWithRetry(maxRetries = 5, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Verifica che gli elementi critici siano presenti nel DOM
      const criticalElements = [
        "eventi-table-container",
        "eventi-timeline-container",
        "eventi-add-btn",
        "eventi-reset-filters-btn",
      ];

      const missingElements = criticalElements.filter(
        (id) => !document.getElementById(id)
      );

      if (missingElements.length === 0) {
        logger.log(
          `✅ Tutti gli elementi DOM critici trovati al tentativo ${i + 1}`
        );
        initializeDOMElements();
        return;
      }

      logger.log(
        `⚠️ Tentativo ${i + 1}: elementi DOM mancanti:`,
        missingElements
      );

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      logger.error(`❌ Errore tentativo ${i + 1} inizializzazione DOM:`, error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(
    "❌ Impossibile trovare tutti gli elementi DOM critici dopo",
    maxRetries,
    "tentativi"
  );
  throw new Error("Template DOM non completamente caricato");
}

/**
 * Inizializza la vista eventi clinici
 */
export async function initEventiCliniciView(urlParams) {
  try {
    logger.log("🚀 Inizializzazione vista eventi clinici - START");

    // Initialize DOM elements
    logger.log("📝 Step 1: Inizializzazione DOM elements");
    await initializeDOMElementsWithRetry();
    domElements = getDOMElements();
    logger.log("✅ DOM elements inizializzati");

    // Initialize managers
    logger.log("📝 Step 2: Inizializzazione managers");
    await initializeManagers();
    logger.log("✅ Managers inizializzati");

    // Initialize form components
    logger.log("� Stepi 3: Inizializzazione form components");
    initializeFormComponents();
    logger.log("✅ Form components inizializzati");

    // Setup event handlers
    logger.log("📝 Step 4: Setup event handlers");
    await setupEventHandlers();
    logger.log("✅ Event handlers configurati");

    // Load filter suggestions and departments
    logger.log("📝 Step 5: Caricamento filtri suggeriti");
    await loadFilterSuggestions();
    logger.log("✅ Filtri suggeriti caricati");

    // Reset filtri all'avvio
    logger.log("📝 Step 6: Reset filtri");
    resetCurrentFiltersToDefaults();
    resetFiltersUI();
    logger.log("✅ Filtri resettati");

    // Load initial data
    logger.log("📝 Step 7: Caricamento dati iniziali");
    try {
      // Test diretto senza manager
      logger.log("🧪 Test caricamento diretto...");
      const { fetchEventiClinici } = await import("./eventi-clinici-api.js");
      const testResult = await fetchEventiClinici({}, 0);
      logger.log("🧪 Test result:", testResult);

      const result = await dataManager.loadEventsData();
      logger.log("✅ Dati iniziali caricati:", result);
    } catch (error) {
      logger.error("❌ ERRORE caricamento dati iniziali:", error);
      throw error;
    }

    // Apply responsive design
    logger.log("📝 Step 8: Applicazione responsive design");
    applyResponsiveDesign();
    logger.log("✅ Responsive design applicato");

    // Handle URL parameters
    logger.log("📝 Step 9: Gestione parametri URL");
    handleUrlParameters(urlParams);
    logger.log("✅ Parametri URL gestiti");

    logger.log("🎉 Vista eventi clinici inizializzata con successo");

    // Return cleanup function
    return cleanup;
  } catch (error) {
    logger.error(
      "💥 ERRORE CRITICO inizializzazione vista eventi clinici:",
      error
    );

    // Mostra messaggio di errore
    try {
      showError(
        "Errore nel caricamento della vista eventi clinici. Ricaricare la pagina."
      );
    } catch (uiError) {
      console.error("❌ Impossibile mostrare errore UI:", uiError);
      alert("Errore critico nel caricamento. Ricaricare la pagina.");
    }

    throw error;
  }
}

/**
 * Inizializza i manager
 */
async function initializeManagers() {
  try {
    // Setup event card listeners function
    const setupEventCardListeners = () => {
      // Event detail buttons
      document.querySelectorAll(".event-detail-btn").forEach((btn) => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.showEventDetail(eventId);
        };
        btn.addEventListener("click", handler);
      });

      // Event edit buttons
      document.querySelectorAll(".event-edit-btn").forEach((btn) => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.editEvent(eventId);
        };
        btn.addEventListener("click", handler);
      });

      // Event delete buttons
      document.querySelectorAll(".event-delete-btn").forEach((btn) => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.confirmDeleteEvent(eventId);
        };
        btn.addEventListener("click", handler);
      });

      // Resolve infection buttons
      document.querySelectorAll(".event-resolve-btn").forEach((btn) => {
        const handler = async (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          try {
            const { ResolveInfectionModal } = await import(
              "../components/ResolveInfectionModal.js"
            );
            const resolver = new ResolveInfectionModal({ eventoId: eventId });
            const dataFine = await resolver.show();
            if (dataFine) {
              await resolveInfezioneEvento(eventId, dataFine);
              await dataManager.loadEventsData();
            }
          } catch (err) {
            logger.error("Errore nella risoluzione infezione:", err);
          }
        };
        btn.addEventListener("click", handler);
      });
    };

    // Initialize data manager
    dataManager = new EventiCliniciDataManager(
      currentState,
      setupEventCardListeners
    );

    // Initialize filter manager
    filterManager = new EventiCliniciFilterManager(
      currentState,
      setupEventCardListeners,
      () => dataManager.updateFilterStats()
    );

    // Initialize modal manager
    modalManager = new EventiCliniciModalManager(currentState, domElements);
    await modalManager.initializeModals();

    // Initialize event handlers
    eventHandlers = new EventiCliniciEventHandlers(
      currentState,
      domElements,
      filterManager,
      modalManager,
      dataManager
    );

    logger.log("✅ Manager inizializzati");
  } catch (error) {
    logger.error("❌ Errore inizializzazione manager:", error);
  }
}

/**
 * Inizializza i componenti del form
 */
function initializeFormComponents() {
  try {
    // Initialize custom selects
    initCustomSelects();

    // Initialize date pickers
    initCustomDatepickers("[data-datepicker]");

    logger.log("✅ Componenti form inizializzati");
  } catch (error) {
    logger.error("❌ Errore inizializzazione componenti form:", error);
  }
}

/**
 * Configura gli event handlers
 */
async function setupEventHandlers() {
  try {
    // Setup event listeners through the event handlers manager
    await eventHandlers.setupEventListeners();

    // Initialize advanced filters state
    eventHandlers.initializeAdvancedFiltersState();

    logger.log("✅ Event handlers configurati");
  } catch (error) {
    logger.error("❌ Errore setup event handlers:", error);
  }
}

/**
 * Carica i suggerimenti per i filtri
 */
async function loadFilterSuggestions() {
  try {
    // Wait a bit to ensure CustomSelects are fully initialized
    await new Promise((resolve) => setTimeout(resolve, 100));

    const [suggestions, reparti] = await Promise.all([
      getSuggestedFilters(),
      getDepartmentsList(),
    ]);

    logger.log("🔧 Popolamento filtri con:", {
      reparti: reparti.length,
      tipiIntervento: suggestions.tipiIntervento?.length || 0,
      agentiPatogeni: suggestions.agentiPatogeni?.length || 0,
    });

    await populateDepartmentFilter(reparti);
    await populateAdvancedFilters(suggestions);

    // Force refresh of all CustomSelects after population
    setTimeout(() => {
      document
        .querySelectorAll('select[data-custom="true"]')
        .forEach((select) => {
          logger.log(
            "🔧 Checking CustomSelect:",
            select.id,
            "has instance?",
            !!select._customSelect
          );
          if (
            select._customSelect &&
            typeof select._customSelect.refresh === "function"
          ) {
            logger.log("🔧 Refreshing CustomSelect:", select.id);
            select._customSelect.refresh();
          }
        });
    }, 50);

    // Additional refresh after more time
    setTimeout(() => {
      const repartoSelect = document.getElementById("eventi-filter-reparto");
      if (repartoSelect && repartoSelect._customSelect) {
        logger.log("🔧 Final refresh of reparto CustomSelect");
        repartoSelect._customSelect.refresh();
      }
    }, 500);

    logger.log("✅ Suggerimenti filtri caricati:", {
      suggestions,
      reparti: reparti.length,
    });
  } catch (error) {
    logger.error("❌ Errore caricamento suggerimenti filtri:", error);
  }
}

/**
 * Gestisce i parametri URL
 */
function handleUrlParameters(urlParams) {
  if (!urlParams) return;

  // Handle patient ID parameter
  const patientId = urlParams.get("patient");
  if (patientId) {
    currentState.selectedPatientId = patientId;
    currentState.filters.paziente_search = patientId;
  }

  // Handle event type parameter
  const eventType = urlParams.get("type");
  if (eventType && domElements.filterType) {
    domElements.filterType.value = eventType;
    currentState.filters.tipo_evento = eventType;
  }
}

/**
 * Funzione di cleanup
 */
function cleanup() {
  logger.log("🧹 Cleanup vista eventi clinici");

  // Cleanup managers
  if (eventHandlers && typeof eventHandlers.cleanup === "function") {
    eventHandlers.cleanup();
  }

  if (modalManager && typeof modalManager.cleanup === "function") {
    modalManager.cleanup();
  }

  if (dataManager && typeof dataManager.clearCache === "function") {
    dataManager.clearCache();
  }

  // Reset state
  currentState = {
    currentPage: 0,
    filters: {
      paziente_search: "",
      tipo_evento: "",
      data_da: "",
      data_a: "",
      reparto: "",
      agente_patogeno: "",
      tipo_intervento: "",
      sortColumn: "data_evento",
      sortDirection: "desc",
    },
    selectedPatientId: null,
    editingEventId: null,
    isLoading: false,
    filterStats: null,
  };

  // Reset manager instances
  dataManager = null;
  filterManager = null;
  modalManager = null;
  eventHandlers = null;

  logger.log("✅ Cleanup completato");
}
