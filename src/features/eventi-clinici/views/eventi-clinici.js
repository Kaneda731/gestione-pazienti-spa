// src/features/eventi-clinici/views/eventi-clinici.js

import { 
  fetchEventiClinici,
  fetchEventiByPaziente,
  createEventoClinico,
  updateEventoClinico,
  deleteEventoClinico,
  searchPazientiForEvents,
  getGiorniPostOperatori,
  clearSearchCache
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
  getDOMElements
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { initCustomDatepickers } from '../../../shared/components/forms/CustomDatepicker.js';

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
    reparto: ''
  },
  selectedPatientId: null,
  editingEventId: null,
  isLoading: false
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

    // Apply responsive design
    applyResponsiveDesign();

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

    // Initialize date pickers
    initCustomDatepickers();

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

  // Export button
  if (domElements.exportBtn) {
    const handler = () => exportEvents();
    domElements.exportBtn.addEventListener('click', handler);
    cleanupFunctions.push(() => domElements.exportBtn.removeEventListener('click', handler));
  }
}

/**
 * Configura i listener per i filtri
 */
function setupFilterListeners() {
  // Event type filter
  if (domElements.filterType) {
    const handler = () => handleFilterChange();
    domElements.filterType.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterType.removeEventListener('change', handler));
  }

  // Date filters
  if (domElements.filterDateFrom) {
    const handler = () => handleFilterChange();
    domElements.filterDateFrom.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterDateFrom.removeEventListener('change', handler));
  }

  if (domElements.filterDateTo) {
    const handler = () => handleFilterChange();
    domElements.filterDateTo.addEventListener('change', handler);
    cleanupFunctions.push(() => domElements.filterDateTo.removeEventListener('change', handler));
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
  // Main patient search
  if (domElements.searchPatientInput) {
    const handler = debounce((e) => handlePatientSearch(e.target.value), 300);
    domElements.searchPatientInput.addEventListener('input', handler);
    cleanupFunctions.push(() => domElements.searchPatientInput.removeEventListener('input', handler));
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
 * Gestisce la ricerca pazienti nel filtro principale
 */
async function handlePatientSearch(searchTerm) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      hideSearchResults('patient-search-results');
      currentState.filters.paziente_search = '';
      await loadEventsData();
      return;
    }

    const patients = await searchPazientiForEvents(searchTerm);
    renderPatientSearchResults(patients, 'patient-search-results');

    // Update filter and reload if a specific patient is selected
    if (domElements.searchPatientInput.dataset.patientId) {
      currentState.selectedPatientId = domElements.searchPatientInput.dataset.patientId;
      currentState.filters.paziente_search = searchTerm;
      await loadEventsData();
    }

  } catch (error) {
    logger.error('❌ Errore ricerca pazienti:', error);
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
  // Clear form fields
  if (domElements.searchPatientInput) {
    domElements.searchPatientInput.value = '';
    delete domElements.searchPatientInput.dataset.patientId;
  }
  if (domElements.filterType) domElements.filterType.value = '';
  if (domElements.filterDateFrom) domElements.filterDateFrom.value = '';
  if (domElements.filterDateTo) domElements.filterDateTo.value = '';

  // Reset state
  currentState.filters = {
    paziente_search: '',
    tipo_evento: '',
    data_da: '',
    data_a: '',
    reparto: ''
  };
  currentState.currentPage = 0;
  currentState.selectedPatientId = null;

  // Hide search results
  hideAllSearchResults();

  // Clear search cache
  clearSearchCache();

  // Reload data
  await loadEventsData();

  notificationService.success('Filtri resettati');
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
      domElements.saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando...';
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
      domElements.saveBtn.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Evento';
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
function confirmDeleteEvent(eventId) {
  if (confirm('Sei sicuro di voler eliminare questo evento clinico? L\'operazione non può essere annullata.')) {
    deleteEvent(eventId);
  }
}

/**
 * Gestisce l'eliminazione evento dal detail modal
 */
function handleDeleteEvent() {
  if (currentState.editingEventId) {
    confirmDeleteEvent(currentState.editingEventId);
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
async function exportEvents() {
  try {
    notificationService.info('Funzionalità di export in sviluppo');
    // TODO: Implement export functionality
  } catch (error) {
    logger.error('❌ Errore export eventi:', error);
    notificationService.error('Errore nell\'esportazione');
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
 * Ottiene i dati dal form
 */
function getFormData() {
  return {
    paziente_id: domElements.eventPatientId?.value || '',
    tipo_evento: domElements.eventType?.value || '',
    data_evento: domElements.eventDate?.value || '',
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
      reparto: ''
    },
    selectedPatientId: null,
    editingEventId: null,
    isLoading: false
  };

  // Clear search cache
  clearSearchCache();

  logger.log('✅ Cleanup completato');
}