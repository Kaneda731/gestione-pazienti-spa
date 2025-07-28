// src/features/eventi-clinici/views/eventi-clinici.js

import { 
  fetchEventiClinici,
  fetchEventiByPaziente,
  createEventoClinico,
  updateEventoClinico,
  deleteEventoClinico,
  searchPazientiForEvents,
  getGiorniPostOperatori,
  clearSearchCache,
  searchEventiWithDebounce,
  applyEventTypeFilter,
  applyDateRangeFilter,
  applyDepartmentFilter,
  searchPatientsRealTime,
  applyPatientSearch,
  getCurrentFilters,
  resetAllFilters,
  getDepartmentsList,
  applyCombinedFilters,
  getSuggestedFilters,
  applySorting,
  exportFilteredEvents,
  saveFiltersToState,
  loadFiltersFromState,
  resetFiltersAndState,
  getFilterStats
} from './eventi-clinici-api.js';

import {
  initializeDOMElements,
  renderEventsTimeline,
  showLoading,
  showError,
  renderPatientSearchResults,
  toggleEventTypeFields,
  populateEventForm,
  resetEventForm,
  showFormMessage,
  clearFormMessages,
  updateModalTitle,
  renderEventDetails,
  applyResponsiveDesign,
  getDOMElements,
  populateDepartmentFilter,
  populateAdvancedFilters,
  applyFiltersToUI,
  resetFiltersUI,
  showActiveFiltersIndicator,
  showFilterStats,
  showSearchingState,
  hideSearchingState,
  updateSearchResultsCount,
  showExportProgress,
  showExportSuccess,
  getFiltersFromUI
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { initCustomDatepickers } from '../../../shared/components/forms/CustomDatepicker.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';

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

// DOM elements and modals
let domElements = {};
let eventFormModal = null;
let eventDetailModal = null;

// Event listeners cleanup functions
let cleanupFunctions = [];

/**
 * Inizializza la vista eventi clinici
 */
export async function initEventiCliniciView(urlParams) {
  try {
    logger.log('🚀 Inizializzazione vista eventi clinici');

    // Initialize DOM elements
    initializeDOMElements();
    domElements = getDOMElements();

    // Initialize Bootstrap modals
    await initializeModals();

    // Initialize form components
    initializeFormComponents();

    // Setup event listeners
    setupEventListeners();

    // Initialize advanced filters state
    initializeAdvancedFiltersState();

    // Apply responsive design
    applyResponsiveDesign();

    // Load filter suggestions and departments
    await loadFilterSuggestions();

    // Load saved filters from state
    await loadSavedFilters();

    // Load initial data
    await loadEventsData();

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
 * Inizializza i modali Bootstrap
 */
async function initializeModals() {
  try {
    // Dynamically import Bootstrap Modal
    const { Modal } = await import('bootstrap');

    const eventFormModalEl = domElements.eventFormModal;
    const eventDetailModalEl = domElements.eventDetailModal;

    if (eventFormModalEl) {
      eventFormModal = new Modal(eventFormModalEl, {
        backdrop: 'static',
        keyboard: false
      });
    }

    if (eventDetailModalEl) {
      eventDetailModal = new Modal(eventDetailModalEl);
    }

    logger.log('✅ Modali inizializzati');
  } catch (error) {
    logger.error('❌ Errore inizializzazione modali:', error);
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
 * Configura tutti gli event listeners
 */
function setupEventListeners() {
  // Main action buttons
  setupMainActionListeners();

  // Filter listeners
  setupFilterListeners();

  // Pagination listeners
  setupPaginationListeners();

  // Modal form listeners
  setupModalFormListeners();

  // Search listeners
  setupSearchListeners();

  // Window resize listener
  const resizeHandler = () => applyResponsiveDesign();
  window.addEventListener('resize', resizeHandler);
  cleanupFunctions.push(() => window.removeEventListener('resize', resizeHandler));

  logger.log('✅ Event listeners configurati');
}

/**
 * Configura i listener per i bottoni principali
 */
function setupMainActionListeners() {
  // Add new event button
  if (domElements.addEventBtn) {
    const handler = () => openEventModal();
    domElements.addEventBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.addEventBtn.removeEventListener('click', handler));
  }

  // Reset filters button
  if (domElements.resetFiltersBtn) {
    const handler = () => resetFilters();
    domElements.resetFiltersBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.resetFiltersBtn.removeEventListener('click', handler));
  }

  // Export buttons
  if (domElements.exportBtn) {
    const handler = () => exportEvents('csv');
    domElements.exportBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.exportBtn.removeEventListener('click', handler));
  }

  if (domElements.exportCsvBtn) {
    const handler = () => exportEvents('csv');
    domElements.exportCsvBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.exportCsvBtn.removeEventListener('click', handler));
  }

  if (domElements.exportJsonBtn) {
    const handler = () => exportEvents('json');
    domElements.exportJsonBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.exportJsonBtn.removeEventListener('click', handler));
  }

  // Filter management buttons
  if (domElements.saveFiltersBtn) {
    const handler = () => saveCurrentFilters();
    domElements.saveFiltersBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.saveFiltersBtn.removeEventListener('click', handler));
  }

  if (domElements.loadFiltersBtn) {
    const handler = () => loadSavedFilters();
    domElements.loadFiltersBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.loadFiltersBtn.removeEventListener('click', handler));
  }
}

/**
 * Configura i listener per i filtri
 */
function setupFilterListeners() {
  // Event type filter with immediate UI update
  if (domElements.filterType) {
    const handler = async () => {
      showSearchingState();
      try {
        const result = await applyEventTypeFilter(domElements.filterType.value);
        renderEventsTimeline(result);
        setupEventCardListeners();
        updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
        showActiveFiltersIndicator(getCurrentFilters());
      } catch (error) {
        logger.error('❌ Errore applicazione filtro tipo evento:', error);
      } finally {
        hideSearchingState();
      }
    };
    domElements.filterType.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterType.removeEventListener('change', handler));
  }

  // Date filters with debouncing
  if (domElements.filterDateFrom) {
    const handler = debounce(async () => {
      await handleDateRangeFilter();
    }, 500);
    domElements.filterDateFrom.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterDateFrom.removeEventListener('change', handler));
  }

  if (domElements.filterDateTo) {
    const handler = debounce(async () => {
      await handleDateRangeFilter();
    }, 500);
    domElements.filterDateTo.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterDateTo.removeEventListener('change', handler));
  }

  // Department filter
  if (domElements.filterReparto) {
    const handler = async () => {
      await handleCombinedFiltersChange();
    };
    domElements.filterReparto.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterReparto.removeEventListener('change', handler));
  }

  // Advanced filters
  if (domElements.filterAgentePatogeno) {
    const handler = debounce(async () => {
      await handleCombinedFiltersChange();
    }, 500);
    domElements.filterAgentePatogeno.addEventListener('input', handler);
    cleanupFunctions.push(() => domElements.filterAgentePatogeno.removeEventListener('input', handler));
  }

  if (domElements.filterTipoIntervento) {
    const handler = debounce(async () => {
      await handleCombinedFiltersChange();
    }, 500);
    domElements.filterTipoIntervento.addEventListener('input', handler);
    cleanupFunctions.push(() => domElements.filterTipoIntervento.removeEventListener('input', handler));
  }

  // Sorting filters
  if (domElements.filterSortColumn) {
    const handler = async () => {
      await handleSortingChange();
    };
    domElements.filterSortColumn.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterSortColumn.removeEventListener('change', handler));
  }

  if (domElements.filterSortDirection) {
    const handler = async () => {
      await handleSortingChange();
    };
    domElements.filterSortDirection.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterSortDirection.removeEventListener('change', handler));
  }

  // Advanced filters toggle button
  if (domElements.advancedFiltersToggle && domElements.advancedFiltersContainer) {
    const handler = (event) => {
      // Previeni il comportamento di default di Bootstrap
      event.preventDefault();
      event.stopPropagation();
      
      const isExpanded = domElements.advancedFiltersContainer.classList.contains('show');
      
      // Toggle manuale del collapse
      if (isExpanded) {
        domElements.advancedFiltersContainer.classList.remove('show');
        domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'false');
      } else {
        domElements.advancedFiltersContainer.classList.add('show');
        domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'true');
      }
      
      // Aggiorna rotazione icona
      const icon = domElements.advancedFiltersToggle.querySelector('.material-icons');
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      
      logger.log(`🔧 Filtri avanzati ${isExpanded ? 'chiusi' : 'aperti'}`);
    };
    
    // Rimuovi gli attributi Bootstrap per evitare conflitti
    domElements.advancedFiltersToggle.removeAttribute('data-bs-toggle');
    domElements.advancedFiltersToggle.removeAttribute('data-bs-target');
    
    domElements.advancedFiltersToggle.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.advancedFiltersToggle.removeEventListener('click', handler));
  }
}

/**
 * Inizializza lo stato dei filtri avanzati
 */
function initializeAdvancedFiltersState() {
  if (domElements.advancedFiltersToggle && domElements.advancedFiltersContainer) {
    // Assicurati che i filtri siano nascosti inizialmente
    domElements.advancedFiltersContainer.classList.remove('show');
    domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'false');
    
    // Imposta l'icona nello stato iniziale
    const icon = domElements.advancedFiltersToggle.querySelector('.material-icons');
    if (icon) {
      icon.style.transform = 'rotate(0deg)';
      icon.style.transition = 'transform 0.3s ease';
    }
    
    logger.log('✅ Stato iniziale filtri avanzati impostato (nascosti)');
  }
}

/**
 * Configura i listener per la paginazione
 */
function setupPaginationListeners() {
  if (domElements.prevPageBtn) {
    const handler = () => changePage(currentState.currentPage - 1);
    domElements.prevPageBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.prevPageBtn.removeEventListener('click', handler));
  }

  if (domElements.nextPageBtn) {
    const handler = () => changePage(currentState.currentPage + 1);
    domElements.nextPageBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.nextPageBtn.removeEventListener('click', handler));
  }
}

/**
 * Configura i listener per il modal del form
 */
function setupModalFormListeners() {
  // Save button
  if (domElements.saveBtn) {
    const handler = () => handleSaveEvent();
    domElements.saveBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.saveBtn.removeEventListener('click', handler));
  }

  // Event type change
  if (domElements.eventType) {
    const handler = (e) => toggleEventTypeFields(e.target.value);
    domElements.eventType.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.eventType.removeEventListener('change', handler));
  }

  // Detail modal buttons
  if (domElements.editBtn) {
    const handler = () => handleEditEvent();
    domElements.editBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.editBtn.removeEventListener('click', handler));
  }

  if (domElements.deleteBtn) {
    const handler = () => handleDeleteEvent();
    domElements.deleteBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.deleteBtn.removeEventListener('click', handler));
  }
}

/**
 * Configura i listener per la ricerca
 */
function setupSearchListeners() {
  // Main patient search with real-time filtering
  if (domElements.searchPatientInput) {
    const searchHandler = debounce(async (e) => {
      const searchTerm = e.target.value;
      
      // Show patient search results
      if (searchTerm && searchTerm.length >= 2) {
        try {
          const patients = await searchPatientsRealTime(searchTerm);
          renderPatientSearchResults(patients, 'patient-search-results');
        } catch (error) {
          logger.error('❌ Errore ricerca pazienti:', error);
        }
      } else {
        hideSearchResults('patient-search-results');
      }
      
      // Apply patient filter to events
      await handlePatientSearchFilter(searchTerm);
    }, 300);
    
    domElements.searchPatientInput.addEventListener('input', searchHandler);
    cleanupFunctions.push(() => domElements.searchPatientInput.removeEventListener('input', searchHandler));
  }

  // Modal patient search
  if (domElements.eventPatientInput) {
    const handler = debounce((e) => handleModalPatientSearch(e.target.value), 300);
    domElements.eventPatientInput.addEventListener('input', handler);
    cleanupFunctions.push(() => domElements.eventPatientInput.removeEventListener('input', handler));
  }

  // Hide search results when clicking outside
  const clickHandler = (e) => {
    if (!e.target.closest('.position-relative')) {
      hideAllSearchResults();
    }
  };
  document.addEventListener('click', clickHandler);
  cleanupFunctions.push(() => document.removeEventListener('click', clickHandler));
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
 * Carica i dati degli eventi
 */
async function loadEventsData() {
  if (currentState.isLoading) return;

  try {
    currentState.isLoading = true;
    showLoading();

    logger.log('📊 Caricamento eventi con filtri:', currentState.filters);

    const result = await fetchEventiClinici(currentState.filters, currentState.currentPage);

    renderEventsTimeline(result);
    setupEventCardListeners();
    
    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    showActiveFiltersIndicator(getCurrentFilters());

    // Update filter stats
    await updateFilterStats();

    logger.log('✅ Eventi caricati:', result.eventi.length);

  } catch (error) {
    logger.error('❌ Errore caricamento eventi:', error);
    showError('Errore nel caricamento degli eventi clinici');
  } finally {
    currentState.isLoading = false;
  }
}

/**
 * Configura i listener per le card degli eventi
 */
function setupEventCardListeners() {
  // Event detail buttons
  document.querySelectorAll('.event-detail-btn').forEach(btn => {
    const handler = (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.eventoId;
      showEventDetail(eventId);
    };
    btn.addEventListener('click', handler);
  });

  // Event edit buttons
  document.querySelectorAll('.event-edit-btn').forEach(btn => {
    const handler = (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.eventoId;
      editEvent(eventId);
    };
    btn.addEventListener('click', handler);
  });

  // Event delete buttons
  document.querySelectorAll('.event-delete-btn').forEach(btn => {
    const handler = (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.eventoId;
      confirmDeleteEvent(eventId);
    };
    btn.addEventListener('click', handler);
  });
}

/**
 * Gestisce il filtro di ricerca pazienti con debouncing
 */
async function handlePatientSearchFilter(searchTerm) {
  try {
    showSearchingState();
    
    const result = await applyPatientSearch(searchTerm);
    renderEventsTimeline(result);
    setupEventCardListeners();
    
    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    showActiveFiltersIndicator(getCurrentFilters());
    
  } catch (error) {
    logger.error('❌ Errore filtro ricerca pazienti:', error);
  } finally {
    hideSearchingState();
  }
}

/**
 * Gestisce il filtro per range di date
 */
async function handleDateRangeFilter() {
  try {
    showSearchingState();
    
    const dataDa = domElements.filterDateFrom?.value || '';
    const dataA = domElements.filterDateTo?.value || '';
    
    const result = await applyDateRangeFilter(dataDa, dataA);
    renderEventsTimeline(result);
    setupEventCardListeners();
    
    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    showActiveFiltersIndicator(getCurrentFilters());
    
  } catch (error) {
    logger.error('❌ Errore filtro range date:', error);
    if (error.message.includes('data di inizio')) {
      notificationService.error(error.message);
    }
  } finally {
    hideSearchingState();
  }
}

/**
 * Gestisce la ricerca pazienti nel modal
 */
async function handleModalPatientSearch(searchTerm) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      hideSearchResults('evento-patient-search-results');
      return;
    }

    const patients = await searchPazientiForEvents(searchTerm);
    renderPatientSearchResults(patients, 'evento-patient-search-results');

  } catch (error) {
    logger.error('❌ Errore ricerca pazienti modal:', error);
  }
}

/**
 * Gestisce i cambiamenti nei filtri
 */
async function handleFilterChange() {
  // Update filters from form
  if (domElements.filterType) {
    currentState.filters.tipo_evento = domElements.filterType.value;
  }
  if (domElements.filterDateFrom) {
    currentState.filters.data_da = domElements.filterDateFrom.value;
  }
  if (domElements.filterDateTo) {
    currentState.filters.data_a = domElements.filterDateTo.value;
  }

  // Reset to first page
  currentState.currentPage = 0;

  // Reload data
  await loadEventsData();
}

/**
 * Resetta tutti i filtri
 */
async function resetFilters() {
  try {
    showSearchingState();

    // Reset using API function that also clears persistent state
    const result = await resetFiltersAndState();

    // Reset UI
    resetFiltersUI();

    // Reset local state
    currentState.filters = {
      paziente_search: '',
      tipo_evento: '',
      data_da: '',
      data_a: '',
      reparto: '',
      agente_patogeno: '',
      tipo_intervento: '',
      sortColumn: 'data_evento',
      sortDirection: 'desc'
    };
    currentState.currentPage = 0;
    currentState.selectedPatientId = null;

    // Hide search results
    hideAllSearchResults();

    // Render results
    renderEventsTimeline(result);
    setupEventCardListeners();

    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    showActiveFiltersIndicator(getCurrentFilters());
    await updateFilterStats();

    notificationService.success('Filtri resettati');

  } catch (error) {
    logger.error('❌ Errore reset filtri:', error);
    notificationService.error('Errore nel reset dei filtri');
  } finally {
    hideSearchingState();
  }
}

/**
 * Cambia pagina
 */
async function changePage(newPage) {
  if (newPage < 0 || currentState.isLoading) return;

  currentState.currentPage = newPage;
  await loadEventsData();
}

/**
 * Apre il modal per nuovo evento
 */
function openEventModal(eventData = null) {
  try {

    // Reset form
    resetEventForm();
    clearFormMessages();

    if (eventData) {
      // Edit mode
      currentState.editingEventId = eventData.id;
      updateModalTitle('Modifica Evento Clinico', 'edit');
      populateEventForm(eventData);
    } else {
      // Create mode
      currentState.editingEventId = null;
      updateModalTitle('Nuovo Evento Clinico', 'add');
    }

    // Forza la reinizializzazione del datepicker per il modal
    setTimeout(() => {
      const eventDateInput = document.getElementById('evento-data');
      if (eventDateInput && eventDateInput._flatpickrInstance) {
        // L'istanza esiste già, assicuriamoci che sia funzionante
        eventDateInput._flatpickrInstance.redraw();
      } else {
        // Inizializza ex-novo se non esiste
        import('../../../shared/components/forms/CustomDatepicker.js').then(({ initCustomDatepickers }) => {
          initCustomDatepickers('[data-datepicker]', {
            maxDate: 'today',
            allowInput: true,
            locale: { firstDayOfWeek: 1 }
          });
        });
      }
    }, 100);

    if (eventFormModal) {
      eventFormModal.show();
    }

  } catch (error) {
    logger.error('❌ Errore apertura modal evento:', error);
    notificationService.error('Errore nell\'apertura del form');
  }
}

/**
 * Gestisce il salvataggio dell'evento
 */
async function handleSaveEvent() {
  try {
    // Get form data
    const formData = getFormData();

    // Validate form
    if (!validateFormData(formData)) {
      return;
    }

    // Show loading state
    if (domElements.saveBtn) {
      domElements.saveBtn.disabled = true;
      domElements.saveBtn.innerHTML = sanitizeHtml('<span class="spinner-border spinner-border-sm me-1"></span>Salvando...');
    }

    let result;
    if (currentState.editingEventId) {
      // Update existing event
      result = await updateEventoClinico(currentState.editingEventId, formData);
    } else {
      // Create new event
      result = await createEventoClinico(formData);
    }

    // Close modal and reload data
    if (eventFormModal) {
      eventFormModal.hide();
    }

    await loadEventsData();

    const action = currentState.editingEventId ? 'aggiornato' : 'creato';
    notificationService.success(`Evento clinico ${action} con successo`);

  } catch (error) {
    logger.error('❌ Errore salvataggio evento:', error);
    showFormMessage(error.message || 'Errore nel salvataggio dell\'evento');
  } finally {
    // Reset button state
    if (domElements.saveBtn) {
      domElements.saveBtn.disabled = false;
      domElements.saveBtn.innerHTML = sanitizeHtml('<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Evento');
    }
  }
}

/**
 * Mostra i dettagli di un evento
 */
async function showEventDetail(eventId) {
  try {
    // Find event in current data or fetch it
    const eventsData = await fetchEventiClinici({ ...currentState.filters }, 0);
    const evento = eventsData.eventi.find(e => e.id === eventId);

    if (!evento) {
      notificationService.error('Evento non trovato');
      return;
    }

    // Populate detail modal
    renderEventDetails(evento);

    // Store current event ID for edit/delete actions
    currentState.editingEventId = eventId;

    // Show modal
    if (eventDetailModal) {
      eventDetailModal.show();
    }

  } catch (error) {
    logger.error('❌ Errore visualizzazione dettagli evento:', error);
    notificationService.error('Errore nel caricamento dei dettagli');
  }
}

/**
 * Modifica un evento
 */
async function editEvent(eventId) {
  try {
    // Find event data
    const eventsData = await fetchEventiClinici({ ...currentState.filters }, 0);
    const evento = eventsData.eventi.find(e => e.id === eventId);

    if (!evento) {
      notificationService.error('Evento non trovato');
      return;
    }

    // Close detail modal if open
    if (eventDetailModal) {
      eventDetailModal.hide();
    }

    // Open edit modal
    openEventModal(evento);

  } catch (error) {
    logger.error('❌ Errore modifica evento:', error);
    notificationService.error('Errore nell\'apertura del form di modifica');
  }
}

/**
 * Gestisce la modifica evento dal detail modal
 */
function handleEditEvent() {
  if (currentState.editingEventId) {
    editEvent(currentState.editingEventId);
  }
}

/**
 * Conferma eliminazione evento
 */
async function confirmDeleteEvent(eventId) {
  const { ConfirmModal } = await import('../../../shared/components/ui/ConfirmModal.js');
  
  const modal = ConfirmModal.forClinicalEventDeletion();
  const confirmed = await modal.show();
  
  if (confirmed) {
    deleteEvent(eventId);
  }
}

/**
 * Gestisce l'eliminazione evento dal detail modal
 */
async function handleDeleteEvent() {
  if (currentState.editingEventId) {
    await confirmDeleteEvent(currentState.editingEventId);
  }
}

/**
 * Elimina un evento
 */
async function deleteEvent(eventId) {
  try {
    await deleteEventoClinico(eventId);

    // Close detail modal if open
    if (eventDetailModal) {
      eventDetailModal.hide();
    }

    // Reload data
    await loadEventsData();

    notificationService.success('Evento clinico eliminato con successo');

  } catch (error) {
    logger.error('❌ Errore eliminazione evento:', error);
    notificationService.error('Errore nell\'eliminazione dell\'evento');
  }
}

/**
 * Esporta gli eventi
 */
async function exportEvents(format = 'csv') {
  try {
    showExportProgress(true);

    const result = await exportFilteredEvents(format);
    showExportSuccess(result);

    notificationService.success(`Eventi esportati con successo in formato ${format.toUpperCase()}`);

  } catch (error) {
    logger.error('❌ Errore export eventi:', error);
    notificationService.error(error.message || 'Errore nell\'esportazione');
  } finally {
    showExportProgress(false);
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
 * Converte data da dd/mm/yyyy a yyyy-mm-dd
 */
function convertDateToISO(dateString) {
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
 * Ottiene i dati dal form
 */
function getFormData() {
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
function validateFormData(data) {
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
    showFormMessage(errors.join('<br>'));
    return false;
  }

  return true;
}

/**
 * Nasconde tutti i risultati di ricerca
 */
function hideAllSearchResults() {
  hideSearchResults('patient-search-results');
  hideSearchResults('evento-patient-search-results');
}

/**
 * Nasconde i risultati di ricerca per un container specifico
 */
function hideSearchResults(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.style.display = 'none';
  }
}

/**
 * Utility function per debouncing
 */
function debounce(func, wait) {
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
 * Gestisce i cambiamenti nei filtri combinati
 */
async function handleCombinedFiltersChange() {
  try {
    showSearchingState();

    // Get current filters from UI
    const uiFilters = getFiltersFromUI();
    
    // Apply combined filters
    const result = await applyCombinedFilters(uiFilters);
    
    // Update local state
    currentState.filters = { ...currentState.filters, ...uiFilters };
    currentState.currentPage = 0;

    // Render results
    renderEventsTimeline(result);
    setupEventCardListeners();

    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    showActiveFiltersIndicator(getCurrentFilters());
    await updateFilterStats();

    // Auto-save filters
    saveFiltersToState();

  } catch (error) {
    logger.error('❌ Errore applicazione filtri combinati:', error);
    notificationService.error(error.message || 'Errore nell\'applicazione dei filtri');
  } finally {
    hideSearchingState();
  }
}

/**
 * Gestisce i cambiamenti nell'ordinamento
 */
async function handleSortingChange() {
  try {
    showSearchingState();

    const sortColumn = domElements.filterSortColumn?.value || 'data_evento';
    const sortDirection = domElements.filterSortDirection?.value || 'desc';

    const result = await applySorting(sortColumn, sortDirection);

    // Update local state
    currentState.filters.sortColumn = sortColumn;
    currentState.filters.sortDirection = sortDirection;

    // Render results
    renderEventsTimeline(result);
    setupEventCardListeners();

    // Update UI indicators
    updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
    await updateFilterStats();

    // Auto-save filters
    saveFiltersToState();

  } catch (error) {
    logger.error('❌ Errore applicazione ordinamento:', error);
    notificationService.error(error.message || 'Errore nell\'ordinamento');
  } finally {
    hideSearchingState();
  }
}

/**
 * Salva i filtri correnti nello stato persistente
 */
async function saveCurrentFilters() {
  try {
    saveFiltersToState();
    notificationService.success('Filtri salvati');
  } catch (error) {
    logger.error('❌ Errore salvataggio filtri:', error);
    notificationService.error('Errore nel salvataggio dei filtri');
  }
}

/**
 * Carica i filtri salvati dallo stato persistente
 */
async function loadSavedFilters() {
  try {
    const savedFilters = await loadFiltersFromState();
    
    if (savedFilters) {
      // Update local state
      currentState.filters = { ...currentState.filters, ...savedFilters };
      
      // Apply to UI
      applyFiltersToUI(savedFilters);
      
      logger.log('✅ Filtri caricati dallo stato:', savedFilters);
    }
  } catch (error) {
    logger.error('❌ Errore caricamento filtri salvati:', error);
  }
}

/**
 * Aggiorna le statistiche dei filtri
 */
async function updateFilterStats() {
  try {
    const stats = await getFilterStats();
    currentState.filterStats = stats;
    showFilterStats(stats);
  } catch (error) {
    logger.error('❌ Errore aggiornamento statistiche filtri:', error);
  }
}

/**
 * Funzione di cleanup
 */
function cleanup() {
  logger.log('🧹 Cleanup vista eventi clinici');

  // Execute all cleanup functions
  cleanupFunctions.forEach(fn => {
    try {
      fn();
    } catch (error) {
      logger.error('❌ Errore durante cleanup:', error);
    }
  });
  cleanupFunctions = [];

  // Close modals
  if (eventFormModal) {
    eventFormModal.hide();
    eventFormModal = null;
  }

  if (eventDetailModal) {
    eventDetailModal.hide();
    eventDetailModal = null;
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

  // Clear search cache
  clearSearchCache();

  logger.log('✅ Cleanup completato');
}