// src/features/eventi-clinici/views/eventi-clinici.js

import { getSuggestedFilters, getDepartmentsList } from './eventi-clinici-api.js';

import {
  initializeDOMElements,
  getDOMElements,
  populateDepartmentFilter,
  populateAdvancedFilters,
  applyResponsiveDesign,
  showError
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/loggerService.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { initCustomDatepickers } from '../../../shared/components/forms/CustomDatepicker.js';

// Import new modules
import { EventiCliniciDataManager } from './EventiCliniciDataManager.js';
import { EventiCliniciFilterManager } from './EventiCliniciFilterManager.js';
import { EventiCliniciModalManager } from './EventiCliniciModalManager.js';
import { EventiCliniciEventHandlers } from './EventiCliniciEventHandlers.js';

/**
 * Controller principale per la gestione degli eventi clinici
 * Coordina API, UI e gestisce la logica di business
 */

// State management
let currentState = {
  currentPage: 0,
  filters: {
    paziente_search: '',
    tipo_evento: '',
    data_da: '',
    data_a: '',
    reparto: '',
    agente_patogeno: '',
    tipo_intervento: '',
    sortColumn: 'data_evento',
    sortDirection: 'desc'
  },
  selectedPatientId: null,
  editingEventId: null,
  isLoading: false,
  filterStats: null
};

// DOM elements
let domElements = {};

// Manager instances
let dataManager = null;
let filterManager = null;
let modalManager = null;
let eventHandlers = null;

/**
 * Inizializza la vista eventi clinici
 */
export async function initEventiCliniciView(urlParams) {
  try {
    logger.log('🚀 Inizializzazione vista eventi clinici');

    // Initialize DOM elements
    initializeDOMElements();
    domElements = getDOMElements();

    // Initialize managers
    await initializeManagers();

    // Initialize form components
    initializeFormComponents();

    // Setup event handlers
    await setupEventHandlers();

    // Apply responsive design
    applyResponsiveDesign();

    // Load filter suggestions and departments
    await loadFilterSuggestions();

    // Load saved filters from state
    await filterManager.loadSavedFilters();

    // Load initial data
    await dataManager.loadEventsData();

    // Handle URL parameters
    handleUrlParameters(urlParams);

    logger.log('✅ Vista eventi clinici inizializzata con successo');

    // Return cleanup function
    return cleanup;

  } catch (error) {
    logger.error('❌ Errore inizializzazione vista eventi clinici:', error);
    showError('Errore nel caricamento della vista eventi clinici');
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
      document.querySelectorAll('.event-detail-btn').forEach(btn => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.showEventDetail(eventId);
        };
        btn.addEventListener('click', handler);
      });

      // Event edit buttons
      document.querySelectorAll('.event-edit-btn').forEach(btn => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.editEvent(eventId);
        };
        btn.addEventListener('click', handler);
      });

      // Event delete buttons
      document.querySelectorAll('.event-delete-btn').forEach(btn => {
        const handler = (e) => {
          e.stopPropagation();
          const eventId = btn.dataset.eventoId;
          modalManager.confirmDeleteEvent(eventId);
        };
        btn.addEventListener('click', handler);
      });
    };

    // Initialize data manager
    dataManager = new EventiCliniciDataManager(currentState, setupEventCardListeners);

    // Initialize filter manager with updateFilterStats
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

    logger.log('✅ Manager inizializzati');
  } catch (error) {
    logger.error('❌ Errore inizializzazione manager:', error);
  }
}

/**
 * Inizializza i componenti del form
 */
function initializeFormComponents() {
  try {
    // Initialize custom selects
    initCustomSelects();

    // Initialize date pickers with correct selector
    initCustomDatepickers('[data-datepicker]');

    logger.log('✅ Componenti form inizializzati');
  } catch (error) {
    logger.error('❌ Errore inizializzazione componenti form:', error);
  }
}

/**
 * Configura gli event handlers
 */
async function setupEventHandlers() {
  // Setup event listeners through the event handlers manager
  await eventHandlers.setupEventListeners();

  // Initialize advanced filters state
  eventHandlers.initializeAdvancedFiltersState();

  logger.log('✅ Event handlers configurati');
}

/**
 * Carica i suggerimenti per i filtri
 */
async function loadFilterSuggestions() {
  try {
    const [suggestions, reparti] = await Promise.all([
      getSuggestedFilters(),
      getDepartmentsList()
    ]);

    await populateDepartmentFilter(reparti);
    await populateAdvancedFilters(suggestions);

    logger.log('✅ Suggerimenti filtri caricati:', { suggestions, reparti: reparti.length });
  } catch (error) {
    logger.error('❌ Errore caricamento suggerimenti filtri:', error);
  }
}

/**
 * Gestisce i parametri URL
 */
function handleUrlParameters(urlParams) {
  if (!urlParams) return;

  // Handle patient ID parameter
  const patientId = urlParams.get('patient');
  if (patientId) {
    currentState.selectedPatientId = patientId;
    currentState.filters.paziente_search = patientId;
  }

  // Handle event type parameter
  const eventType = urlParams.get('type');
  if (eventType && domElements.filterType) {
    domElements.filterType.value = eventType;
    currentState.filters.tipo_evento = eventType;
  }
}

/**
 * Funzione di cleanup
 */
function cleanup() {
  logger.log('🧹 Cleanup vista eventi clinici');

  // Cleanup managers
  if (eventHandlers) {
    eventHandlers.cleanup();
  }

  if (modalManager) {
    modalManager.cleanup();
  }

  if (dataManager) {
    dataManager.clearCache();
  }

  // Reset state
  currentState = {
    currentPage: 0,
    filters: {
      paziente_search: '',
      tipo_evento: '',
      data_da: '',
      data_a: '',
      reparto: '',
      agente_patogeno: '',
      tipo_intervento: '',
      sortColumn: 'data_evento',
      sortDirection: 'desc'
    },
    selectedPatientId: null,
    editingEventId: null,
    isLoading: false,
    filterStats: null
  };

  // Reset manager instances
  dataManager = null;
  filterManager = null;
  modalManager = null;
  eventHandlers = null;

  logger.log('✅ Cleanup completato');
}

