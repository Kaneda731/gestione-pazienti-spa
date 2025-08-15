// src/features/eventi-clinici/views/eventi-clinici-ui.js

import { logger } from "../../../core/services/logger/loggerService.js";
import { formatDate } from "../../../shared/utils/formatting.js";
import { sanitizeHtml } from "../../../shared/utils/sanitizeHtml.js";
import { coreApplyResponsiveDesign } from "./responsive/applyResponsiveDesign.js";
import { debounce } from "./utils/debounce.js";
export { updateSearchResultsCount } from "./ui/results-info/updateResultsInfo.js";
import { populateDepartmentFilterCore } from "./filters/populateDepartmentFilter.js";
import { EventiTableRenderer } from "./ui/EventiTableRenderer.js";
import { EventiTimelineRenderer } from "./ui/EventiTimelineRenderer.js";
// Rimosso filtro Agente Patogeno (ridondante)

/**
 * UI renderer per la timeline degli eventi clinici
 * Gestisce il rendering cronologico degli eventi e l'interfaccia responsive
 */

// ============================================================================
// CONSTANTS & STATE
// ============================================================================

// DOM elements cache
let domElements = {};

// Renderers cache
let tableRenderer = null;
let timelineRenderer = null;

// Re-export per reset filtri dalla UI
export { resetCurrentFiltersToDefaults } from './eventi-clinici-api.js';

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
    filterReparto: document.getElementById("eventi-filter-reparto"),
    // filterAgentePatogeno rimosso
    filterSortColumn: document.getElementById("eventi-sort-column"),
    filterSortDirection: document.getElementById("eventi-sort-direction"),

    // Action buttons
    addEventBtn: document.getElementById("eventi-add-btn"),
    resetFiltersBtn: document.getElementById("eventi-reset-filters-btn"),
    exportBtn: document.getElementById("eventi-export-btn"),
    exportCsvBtn: document.getElementById("eventi-export-csv-btn"),
    exportJsonBtn: document.getElementById("eventi-export-json-btn"),
    saveFiltersBtn: document.getElementById("eventi-save-filters-btn"),
    loadFiltersBtn: document.getElementById("eventi-load-filters-btn"),
    
    // Advanced filters removed

    // Pagination
    paginationControls: document.getElementById("eventi-pagination-controls"),
    prevPageBtn: document.getElementById("eventi-prev-page-btn"),
    nextPageBtn: document.getElementById("eventi-next-page-btn"),
    pageInfo: document.getElementById("eventi-page-info"),

    // Modals
    eventFormModal: document.getElementById("evento-form-modal"),
    eventDetailModal: document.getElementById("evento-detail-modal"),

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
    infectionAgent: document.getElementById("evento-agente-patogeno"),

    // Modal elements
    modalTitle: document.getElementById("evento-modal-title"),
    modalIcon: document.getElementById("evento-modal-icon"),
    saveBtn: document.getElementById("evento-save-btn"),
    editBtn: document.getElementById("evento-edit-btn"),
    deleteBtn: document.getElementById("evento-delete-btn"),

    // Detail modal
    detailTitle: document.getElementById("evento-detail-title"),
    detailIcon: document.getElementById("evento-detail-icon"),
    detailContent: document.getElementById("evento-detail-content"),
    messageContainer: document.getElementById("evento-messaggio-container"),
  };

  logger.log("✅ DOM elements inizializzati per eventi clinici UI");
}

// =========================================================================
// UI RESET FUNCTION
// =========================================================================

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
      showError,
      updatePaginationControls,
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    tableRenderer.domElements = domElements;
  }
  if (!timelineRenderer) {
    timelineRenderer = new EventiTimelineRenderer(domElements, {
      showError,
      updatePaginationControls,
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    timelineRenderer.domElements = domElements;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Rende un'icona Material coerente anche se l'API fornisce classi FA
 */
function renderEventIcon(iconValue, tipo, color, extraClass = '') {
  const mapTipoToMaterial = (t) => {
    if (t === 'intervento') return 'local_hospital';
    if (t === 'infezione') return 'bug_report';
    return 'event';
  };
  
  const isFa = typeof iconValue === 'string' && /\bfa[srldb]?\b|fa-/.test(iconValue);
  const material = isFa ? mapTipoToMaterial(tipo) : (iconValue || mapTipoToMaterial(tipo));
  const colorClass = color === 'white' ? 'text-white' : (color ? `text-${color}` : '');
  const classes = [`material-icons`, colorClass, extraClass].filter(Boolean).join(' ');
  
  return `<span class="${classes}">${material}</span>`;
}
/**
 * Raggruppa eventi per data
 */
function groupEventsByDate(eventi) {
  return eventi.reduce((groups, evento) => {
    const date = evento.data_evento;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(evento);
    return groups;
  }, {});
}

// ============================================================================
// MAIN RENDERING FUNCTIONS
// ============================================================================

/**
 * Rendering responsive: tabella su desktop, timeline su mobile/tablet
 */
export function renderEventsResponsive(eventsData) {
  logger.log('🎨 renderEventsResponsive chiamata con:', eventsData);
  
  if (!domElements || Object.keys(domElements).length === 0) {
    logger.error('❌ domElements non inizializzati in renderEventsResponsive');
    return;
  }
  
  const useTable = window.innerWidth >= 1200;
  logger.log('📱 useTable:', useTable, 'window.innerWidth:', window.innerWidth);

  if (domElements.tableContainer) {
    domElements.tableContainer.style.display = useTable ? 'block' : 'none';
  } else {
    logger.warn('⚠️ tableContainer non trovato');
  }
  
  if (domElements.timelineContainer) {
    domElements.timelineContainer.style.display = useTable ? 'none' : 'block';
  } else {
    logger.warn('⚠️ timelineContainer non trovato');
  }

  // Delega ai renderer modulari
  ensureRenderers();
  if (useTable) {
    logger.log('🔧 Rendering tabella (renderer)');
    tableRenderer.renderTable(eventsData);
  } else {
    logger.log('🔧 Rendering timeline (renderer)');
    timelineRenderer.renderTimeline(eventsData);
  }
}

/**
 * Renderizza la timeline degli eventi clinici
 */
export function renderEventsTimeline(eventsData) {
  try {
    logger.log("🎨 Rendering timeline (renderer):", eventsData);
    ensureRenderers();
    timelineRenderer.renderTimeline(eventsData);
  } catch (error) {
    logger.error("❌ Errore rendering timeline:", error);
    showError("Errore nel rendering della timeline");
  }
}

/**
 * Renderizza la tabella eventi (vista desktop)
 */
export function renderEventsTable(eventsData) {
  try {
    logger.log("🎨 Rendering tabella (renderer):", eventsData);
    ensureRenderers();
    tableRenderer.renderTable(eventsData);
  } catch (error) {
    logger.error('❌ Errore rendering tabella eventi:', error);
    showError('Errore nel rendering della tabella');
  }
}

// ============================================================================
// TIMELINE COMPONENTS
// ============================================================================

/**
 * Crea l'elemento timeline principale
 */
function createTimelineElement() {
  const timeline = document.createElement("div");
  timeline.className = "eventi-timeline";
  timeline.innerHTML = sanitizeHtml(`<div class="timeline-line"></div>`);
  return timeline;
}

/**
 * Crea un gruppo di eventi per una data specifica
 */
function createDateGroup(date, eventi) {
  const dateGroup = document.createElement("div");
  dateGroup.className = "timeline-date-group";

  const dateHeader = document.createElement("div");
  dateHeader.className = "timeline-date-header";
  const marker = document.createElement('div');
  marker.className = 'timeline-date-marker';
  
  const title = document.createElement('h5');
  title.className = 'timeline-date-title';
  title.textContent = formatDate(date);
  
  dateHeader.appendChild(marker);
  dateHeader.appendChild(title);
  dateGroup.appendChild(dateHeader);

  eventi.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  eventi.forEach((evento) => {
    const eventCard = createEventCard(evento);
    dateGroup.appendChild(eventCard);
  });

  return dateGroup;
}

/**
 * Crea una card per un singolo evento
 */
function createEventCard(evento) {
  const card = document.createElement("div");
  const isInfezione = evento.tipo_evento === 'infezione';
  const isAttiva = isInfezione && !evento.data_fine_evento;
  const statusClass = isInfezione
    ? (isAttiva ? 'status-infected' : 'status-error')
    : 'status-success';
  
  card.className = `card card-list-compact timeline-event-card ${statusClass} evento-${evento.tipo_evento}`;
  card.dataset.eventoId = evento.id;

  const cardContent = createEventCardContent(evento);
  card.innerHTML = sanitizeHtml(cardContent);

  setupEventCardHandlers(card, evento);
  return card;
}

/**
 * Crea il contenuto HTML per una card evento
 */
function createEventCardContent(evento) {
  const isInfezione = evento.tipo_evento === 'infezione';
  const tipoIcon = evento.tipoEventoIcon || (evento.tipo_evento === 'intervento' ? 'medical_services' : 'warning');
  const tipoColor = evento.tipoEventoColor || (evento.tipo_evento === 'intervento' ? 'primary' : 'warning');
  const tipoLabel = evento.tipoEventoLabel || (evento.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione');
  
  const statoBadge = isInfezione
    ? (evento.data_fine_evento
        ? '<span class="badge bg-success ms-1" style="font-size:0.7em;">Risolta</span>'
        : '<span class="badge bg-warning text-dark ms-1" style="font-size:0.7em;"><span class="material-icons" style="font-size:0.8em;vertical-align:middle;">warning</span> Attiva</span>')
    : '';

  const dettagliBrevi = evento.tipo_evento === 'intervento'
    ? (evento.tipo_intervento || '-')
    : (evento.agente_patogeno || (evento.data_fine_evento ? 'Infezione risolta' : 'Infezione attiva'));

  const pazienteInfo = evento.pazienteInfo
    ? `<div class="card-meta mobile-text-sm mt-1">
         <span class="material-icons me-1" style="font-size:1em;vertical-align:middle;">person</span>
         ${sanitizeHtml(evento.pazienteInfo.nomeCompleto)} • <span class="badge bg-secondary">${sanitizeHtml(evento.pazienteInfo.reparto)}</span>
       </div>`
    : '';

  const detailsSection = renderEventCardDetails(evento);

  return `
    <div class="card-body">
      <div class="card-info">
        <div class="card-title d-flex align-items-center gap-2">
          ${renderEventIcon(tipoIcon, evento.tipo_evento, tipoColor)}
          <span class="fw-bold">${tipoLabel}</span>
          ${statoBadge}
        </div>
        <div class="card-meta mobile-text-sm">
          ${formatDate(evento.data_evento)} • ${sanitizeHtml(dettagliBrevi)}
        </div>
        ${pazienteInfo}
      </div>
      <div class="event-card-body mt-2 mobile-text-sm text-muted">
        ${detailsSection}
      </div>
      <div class="mt-2 text-end">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary event-detail-btn" data-evento-id="${evento.id}" title="Apri dettagli evento" aria-label="Apri dettagli evento">
            <span class="material-icons align-middle me-1">visibility</span>
            <span class="btn-text align-middle">Dettagli</span>
          </button>
          <!-- Pulsante Risolvi rimosso nella card mobile; disponibile nella modal Dettagli -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Configura gli event handlers per una card evento
 */
function setupEventCardHandlers(card, evento) {
  // Nessuna azione di modal: i pulsanti inline gestiscono le azioni tramite delegation globale
}

/**
 * Renderizza i dettagli specifici dell'evento per la card
 */
function renderEventCardDetails(evento) {
  let details = "";

  if (evento.descrizione) {
    details += `<p class="event-description">${sanitizeHtml(evento.descrizione)}</p>`;
  }

  if (evento.tipo_evento === "intervento" && evento.tipo_intervento) {
    details += `
      <div class="event-detail-item">
        <strong>Tipo Intervento:</strong> ${sanitizeHtml(evento.tipo_intervento)}
      </div>
    `;
  } else if (evento.tipo_evento === "infezione" && evento.agente_patogeno) {
    details += `
      <div class="event-detail-item">
        <strong>Agente Patogeno:</strong> ${sanitizeHtml(evento.agente_patogeno)}
      </div>
    `;
  }

  return details || '<p class="text-muted">Nessun dettaglio aggiuntivo</p>';
}

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

/**
 * Crea una riga della tabella per un evento
 */
function createTableRow(ev) {
  const patient = ev.pazienteInfo;
  const dettagli = ev.tipo_evento === 'intervento'
    ? (ev.tipo_intervento || '-')
    : (ev.agente_patogeno || '-');
  
  const statoBadge = ev.tipo_evento === 'infezione'
    ? (ev.data_fine_evento
        ? `<span class="badge bg-success" title="Risolta il ${ev.dataFineEventoFormatted}">Risolta</span>`
        : `<span class="badge bg-danger" title="Infezione attiva">Attiva</span>`)
    : '';

  const actionButtons = createActionButtons(ev);

  return `
    <tr data-evento-id="${ev.id}">
      <td>${ev.dataEventoFormatted || formatDate(ev.data_evento)}</td>
      <td>
        <span class="badge bg-${ev.tipoEventoColor || (ev.tipo_evento === 'intervento' ? 'primary' : 'warning')}">
          ${renderEventIcon(ev.tipoEventoIcon, ev.tipo_evento, 'white', 'me-1 align-middle fs-6')}
          ${ev.tipoEventoLabel || (ev.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione')}
        </span>
      </td>
      <td>${patient ? sanitizeHtml(patient.nomeCompleto) : '-'}</td>
      <td>${patient ? sanitizeHtml(patient.reparto) : '-'}</td>
      <td><span class="clamp-3">${sanitizeHtml(dettagli)}</span></td>
      <td><span class="clamp-3">${ev.descrizione ? sanitizeHtml(ev.descrizione) : '-'}</span></td>
      <td>${statoBadge}</td>
      <td>${actionButtons}</td>
    </tr>
  `;
}

/**
 * Crea i pulsanti di azione per la tabella
 */
function createActionButtons(ev) {
  const showResolve = ev.tipo_evento === 'infezione' && !ev.data_fine_evento;
  const resolveBtn = showResolve
    ? `
      <button class="btn btn-sm btn-outline-success event-resolve-btn" data-evento-id="${ev.id}" title="Risolvi infezione" aria-label="Risolvi infezione">
        <span class="material-icons align-middle me-1">check_circle</span>
        <span class="btn-text align-middle">Risolvi</span>
      </button>
    `
    : '';

  return `
    <div class="btn-group btn-group-sm" role="group">
      <button class="btn btn-sm btn-outline-primary event-detail-btn" data-evento-id="${ev.id}" title="Apri dettagli evento" aria-label="Apri dettagli evento">
        <span class="material-icons align-middle me-1">visibility</span>
        <span class="btn-text align-middle">Dettagli</span>
      </button>
      ${resolveBtn}
    </div>
  `;
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Crea la modal Azioni (se non esiste) e la restituisce
 */
// Modal azioni rimossa: pulsanti inline nelle card gestiscono le azioni

// ============================================================================
// STATE RENDERING FUNCTIONS
// ============================================================================

/**
 * Renderizza lo stato vuoto
 */
function renderEmptyState() {
  domElements.timelineContainer.innerHTML = sanitizeHtml('');
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state text-center py-5';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'empty-state-icon mb-3';
  iconDiv.innerHTML = sanitizeHtml('<span class="material-icons text-muted" style="font-size:48px;">event_busy</span>');
  emptyDiv.appendChild(iconDiv);

  const h4 = document.createElement('h4');
  h4.className = 'text-muted';
  h4.textContent = 'Nessun evento trovato';
  emptyDiv.appendChild(h4);

  const p = document.createElement('p');
  p.className = 'text-muted';
  p.textContent = 'Non ci sono eventi clinici che corrispondono ai filtri selezionati.';
  emptyDiv.appendChild(p);

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.id = 'add-first-event-btn';
  btn.innerHTML = sanitizeHtml('<span class="material-icons me-1">add</span> Aggiungi primo evento');
  emptyDiv.appendChild(btn);

  domElements.timelineContainer.appendChild(emptyDiv);

  btn.addEventListener('click', () => {
    if (domElements.addEventBtn) {
      domElements.addEventBtn.click();
    }
  });
}

/**
 * Mostra stato di caricamento
 */
export function showLoading() {
  if (domElements.timelineContainer) {
    domElements.timelineContainer.innerHTML = sanitizeHtml(`
      <div class="loading-state text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Caricamento...</span>
        </div>
        <p class="text-muted">Caricamento eventi clinici...</p>
      </div>
    `);
  }

  if (domElements.tableBody) {
    domElements.tableBody.innerHTML = sanitizeHtml(`
      <tr>
        <td colspan="8" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Caricamento...</span>
          </div>
        </td>
      </tr>
    `);
  }
}

/**
 * Mostra errore
 */
export function showError(message = "Errore nel caricamento dei dati") {
  if (domElements.timelineContainer) {
    domElements.timelineContainer.innerHTML = sanitizeHtml(`
      <div class="error-state text-center py-5">
        <div class="error-state-icon mb-3">
          <span class="material-icons text-danger" style="font-size:48px;">warning</span>
        </div>
        <h4 class="text-danger">Errore</h4>
        <p class="text-muted">${sanitizeHtml(message)}</p>
        <button class="btn btn-outline-primary" onclick="location.reload()">
          <span class="material-icons me-1">refresh</span>
          Riprova
        </button>
      </div>
    `);
  }

  if (domElements.tableBody) {
    domElements.tableBody.innerHTML = sanitizeHtml(`
      <tr>
        <td colspan="8" class="text-center text-danger">
          <strong>${sanitizeHtml(message)}</strong>
        </td>
      </tr>
    `);
  }
}

/**
 * Mostra stato di ricerca in corso
 */
export function showSearchingState() {
  if (!domElements.timelineContainer) return;

  const searchingHTML = `
    <div class="searching-state text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
        <span class="visually-hidden">Ricerca in corso...</span>
      </div>
      <span class="text-muted">Ricerca in corso...</span>
    </div>
  `;

  const existingContent = domElements.timelineContainer.innerHTML;
  domElements.timelineContainer.innerHTML = sanitizeHtml(searchingHTML) + existingContent;
}

/**
 * Rimuove stato di ricerca in corso
 */
export function hideSearchingState() {
  const searchingState = document.querySelector('.searching-state');
  if (searchingState) {
    searchingState.remove();
  }
}

// ============================================================================
// PAGINATION FUNCTIONS
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
// PATIENT SEARCH FUNCTIONS
// ============================================================================

/**
 * Renderizza i risultati di ricerca pazienti
 */
export function renderPatientSearchResults(patients, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!patients || patients.length === 0) {
    container.style.display = "none";
    return;
  }

  const resultsHTML = patients.map(patient => createPatientSearchResult(patient)).join("");
  container.innerHTML = sanitizeHtml(resultsHTML);
  container.style.display = "block";

  setupPatientSearchHandlers(container, containerId);
}

/**
 * Crea il risultato di ricerca per un paziente
 */
function createPatientSearchResult(patient) {
  return `
    <div class="dropdown-item patient-search-result" data-patient-id="${patient.id}">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${patient.nomeCompleto}</strong>
          <br>
          <small class="text-muted">
            ${patient.reparto_appartenenza} • Ricovero: ${patient.dataRicoveroFormatted}
            ${patient.isActive
              ? '<span class="badge bg-success ms-1">Attivo</span>'
              : '<span class="badge bg-secondary ms-1">Dimesso</span>'
            }
          </small>
        </div>
        <span class="material-icons text-muted">chevron_right</span>
      </div>
    </div>
  `;
}

/**
 * Configura gli handler per i risultati di ricerca pazienti
 */
function setupPatientSearchHandlers(container, containerId) {
  container.querySelectorAll(".patient-search-result").forEach((item) => {
    item.addEventListener("click", () => {
      const patientId = item.dataset.patientId;
      const patientName = item.querySelector("strong").textContent;
      selectPatient(patientId, patientName, containerId);
    });
  });
}

/**
 * Seleziona un paziente dai risultati di ricerca
 */
function selectPatient(patientId, patientName, containerId) {
  const container = document.getElementById(containerId);

  if (containerId === "patient-search-results") {
    if (domElements.searchPatientInput) {
      domElements.searchPatientInput.value = patientName;
      domElements.searchPatientInput.dataset.patientId = patientId;
    }
  } else if (containerId === "evento-patient-search-results") {
    if (domElements.eventPatientInput) {
      domElements.eventPatientInput.value = patientName;
    }
    if (domElements.eventPatientId) {
      domElements.eventPatientId.value = patientId;
    }
  }

  container.style.display = "none";
}

// ============================================================================
// FORM FUNCTIONS
// ============================================================================

/**
 * Mostra/nasconde campi specifici per tipo evento
 */
export function toggleEventTypeFields(eventType) {
  if (!domElements.interventionFields || !domElements.infectionFields) return;

  const isIntervention = eventType === "intervento";
  const isInfection = eventType === "infezione";

  domElements.interventionFields.style.display = isIntervention ? "block" : "none";
  domElements.infectionFields.style.display = isInfection ? "block" : "none";

  if (domElements.interventionType) {
    domElements.interventionType.required = isIntervention;
  }
  if (domElements.infectionAgent) {
    domElements.infectionAgent.required = false; // Always optional
  }
}

/**
 * Popola il form con i dati dell'evento per modifica
 */
export function populateEventForm(evento) {
  if (!domElements.eventForm) return;

  // Basic fields
  if (domElements.eventId) domElements.eventId.value = evento.id || "";
  if (domElements.eventType) domElements.eventType.value = evento.tipo_evento || "";
  if (domElements.eventDate) domElements.eventDate.value = evento.dataEventoFormatted || "";
  if (domElements.eventDescription) domElements.eventDescription.value = evento.descrizione || "";

  // Patient info
  if (evento.pazienteInfo) {
    if (domElements.eventPatientInput) {
      domElements.eventPatientInput.value = evento.pazienteInfo.nomeCompleto;
    }
    if (domElements.eventPatientId) {
      domElements.eventPatientId.value = evento.pazienteInfo.id;
    }
  }

  // Type-specific fields
  if (evento.tipo_evento === "intervento" && domElements.interventionType) {
    domElements.interventionType.value = evento.tipo_intervento || "";
  } else if (evento.tipo_evento === "infezione" && domElements.infectionAgent) {
    domElements.infectionAgent.value = evento.agente_patogeno || "";
  }

  toggleEventTypeFields(evento.tipo_evento);
}

/**
 * Resetta il form eventi
 */
export function resetEventForm() {
  if (!domElements.eventForm) return;

  domElements.eventForm.reset();

  if (domElements.eventId) domElements.eventId.value = "";
  if (domElements.eventPatientId) domElements.eventPatientId.value = "";

  toggleEventTypeFields("");

  if (domElements.eventPatientSearchResults) {
    domElements.eventPatientSearchResults.style.display = "none";
  }

  clearFormMessages();
}

/**
 * Mostra messaggio nel form
 */
export function showFormMessage(message, type = "danger") {
  if (!domElements.messageContainer) return;

  domElements.messageContainer.innerHTML = sanitizeHtml(`
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
  if (domElements.messageContainer) {
    domElements.messageContainer.innerHTML = sanitizeHtml("");
  }
}

/**
 * Aggiorna il titolo e l'icona del modal
 */
export function updateModalTitle(title, icon = "add") {
  if (domElements.modalTitle) {
    domElements.modalTitle.textContent = title;
  }
  if (domElements.modalIcon) {
    domElements.modalIcon.textContent = icon;
  }
}

/**
 * Renderizza i dettagli dell'evento nel modal di dettaglio
 */
export function renderEventDetails(evento) {
  if (!domElements.detailContent) return;

  const detailsHTML = createEventDetailsHTML(evento);
  domElements.detailContent.innerHTML = sanitizeHtml(detailsHTML);

  // Rimuovi eventuali duplicati dei pulsanti Modifica/Elimina dal footer della modal dettagli
  try {
    const modalEl = domElements.eventDetailModal;
    if (modalEl) {
      const footer = modalEl.querySelector('.modal-footer');
      if (footer) {
        footer.querySelectorAll('.event-edit-btn, .event-delete-btn').forEach((btn) => btn.remove());
        // Se il footer resta vuoto (o solo con spazi), rimuovi eventuali nodi di testo vuoti
        if (!footer.querySelector('*') || footer.textContent.trim() === '') {
          footer.classList.add('d-none');
        }
      }
    }
  } catch (err) {
    logger.warn('Footer cleanup dettagli evento non riuscito:', err);
  }
}

/**
 * Crea l'HTML per i dettagli dell'evento
 */
function createEventDetailsHTML(evento) {
  const isInfezione = evento.tipo_evento === 'infezione';
  const isAttiva = isInfezione && !evento.data_fine_evento;

  const statusSection = evento.tipo_evento === 'infezione'
    ? `<div class="col-md-6">
         <strong>Stato:</strong>
         <div class="mt-1">
           ${evento.data_fine_evento 
             ? `<span class="badge bg-success">Risolta il ${formatDate(evento.data_fine_evento)}</span>` 
             : `<span class="badge bg-danger">Attiva</span>`
           }
         </div>
       </div>`
    : '';

  const patientSection = evento.pazienteInfo
    ? `<div class="col-12">
         <strong>Paziente:</strong>
         <div class="mt-1">
           <span class="material-icons me-1">person</span>
           ${evento.pazienteInfo.nomeCompleto}
           <span class="badge bg-secondary ms-2">${evento.pazienteInfo.reparto}</span>
         </div>
       </div>`
    : "";

  const descriptionSection = evento.descrizione
    ? `<div class="col-12">
         <strong>Descrizione:</strong>
         <div class="mt-1">${evento.descrizione}</div>
       </div>`
    : "";

  const typeSpecificSection = createTypeSpecificSection(evento);
  const timestampSection = createTimestampSection(evento);

  // Azioni nella scheda dettagli: Modifica, Elimina, e Risolvi (solo infezione attiva)
  const resolveBtn = isAttiva
    ? `<button class="btn btn-success btn-sm event-resolve-btn" data-evento-id="${evento.id}" title="Risolvi">
         <span class="material-icons align-middle me-1">check_circle</span>
         Risolvi
       </button>`
    : '';

  const actionsToolbar = `
    <div class="event-detail-actions d-flex flex-wrap gap-2 justify-content-end mb-3">
      <button class="btn btn-outline-secondary btn-sm event-edit-btn" data-evento-id="${evento.id}" title="Modifica">
        <span class="material-icons align-middle me-1">edit</span>
        Modifica
      </button>
      <button class="btn btn-outline-danger btn-sm event-delete-btn" data-evento-id="${evento.id}" title="Elimina">
        <span class="material-icons align-middle me-1">delete</span>
        Elimina
      </button>
      ${resolveBtn}
    </div>`;

  return `
    <div class="event-details">
      ${actionsToolbar}
      <div class="row g-3">
        <div class="col-md-6">
          <strong>Tipo Evento:</strong>
          <div class="d-flex align-items-center mt-1">
            ${renderEventIcon(evento.tipoEventoIcon, evento.tipo_evento, evento.tipoEventoColor, 'me-2')}
            ${evento.tipoEventoLabel}
          </div>
        </div>
        <div class="col-md-6">
          <strong>Data Evento:</strong>
          <div class="mt-1">${evento.dataEventoFormatted}</div>
        </div>
        ${statusSection}
        ${patientSection}
        ${descriptionSection}
        ${typeSpecificSection}
        ${timestampSection}
      </div>
    </div>
  `;
}

/**
 * Crea la sezione specifica per tipo di evento
 */
function createTypeSpecificSection(evento) {
  if (evento.tipo_evento === "intervento" && evento.tipo_intervento) {
    return `
      <div class="col-12">
        <strong>Tipo Intervento:</strong>
        <div class="mt-1">${evento.tipo_intervento}</div>
      </div>
    `;
  } else if (evento.tipo_evento === "infezione" && evento.agente_patogeno) {
    return `
      <div class="col-12">
        <strong>Agente Patogeno:</strong>
        <div class="mt-1">${evento.agente_patogeno}</div>
      </div>
    `;
  }
  return "";
}

/**
 * Crea la sezione timestamp
 */
function createTimestampSection(evento) {
  const updatedSection = evento.updated_at && evento.updated_at !== evento.created_at
    ? `<div class="col-md-6">
         <strong>Modificato il:</strong>
         <div class="mt-1 text-muted">${formatDate(evento.updated_at)}</div>
       </div>`
    : "";

  return `
    <div class="col-md-6">
      <strong>Creato il:</strong>
      <div class="mt-1 text-muted">${formatDate(evento.created_at)}</div>
    </div>
    ${updatedSection}
  `;
}

// ============================================================================
// RESPONSIVE DESIGN FUNCTIONS
// ============================================================================

/**
 * Applica responsive design basato sulla dimensione dello schermo
 */
export function applyResponsiveDesign() {
  // Delegates to core responsive function operating on cached domElements
  coreApplyResponsiveDesign(domElements);
}

// ============================================================================
// FILTER FUNCTIONS
// ============================================================================

/**
 * Popola il filtro reparti con le opzioni disponibili
 */
export async function populateDepartmentFilter(reparti) {
  await populateDepartmentFilterCore(domElements.filterReparto, reparti, logger);
}

/**
 * Popola i filtri avanzati con i valori suggeriti
 */
export async function populateAdvancedFilters(suggestions) {
  try {
    // Nessun filtro avanzato da popolare (agente patogeno rimosso)
    logger.log('✅ Filtri popolati: nessun filtro avanzato attivo');
  } catch (error) {
    logger.error('❌ Errore popolamento filtri:', error);
  }
}

/**
 * Applica filtri attivi all'interfaccia
 */
export function applyFiltersToUI(filters) {
  if (!filters) return;

  const filterMappings = [
    { element: domElements.searchPatientInput, key: 'paziente_search' },
    { element: domElements.filterType, key: 'tipo_evento' },
    { element: domElements.filterDateFrom, key: 'data_da' },
    { element: domElements.filterDateTo, key: 'data_a' },
    { element: domElements.filterReparto, key: 'reparto' },
    { element: domElements.filterSortColumn, key: 'sortColumn' },
    { element: domElements.filterSortDirection, key: 'sortDirection' }
  ];

  filterMappings.forEach(({ element, key }) => {
    if (element && Object.prototype.hasOwnProperty.call(filters, key)) {
      element.value = filters[key];
      // Se è un CustomSelect, sincronizza anche l'etichetta
      if (element.customSelectInstance && typeof element.customSelectInstance.setValue === 'function') {
        try {
          element.customSelectInstance.setValue(element.value, true); // silent
        } catch (e) {
          // fallback: aggiorna le opzioni e l'etichetta
          if (typeof element.customSelectInstance.updateOptions === 'function') {
            element.customSelectInstance.updateOptions();
          }
        }
      }
    }
  });

  logger.log('✅ Filtri applicati all\'interfaccia:', filters);
}

/**
 * Resetta tutti i filtri nell'interfaccia
 */
export function resetFiltersUI() {
  const resetMappings = [
    { element: domElements.searchPatientInput, value: '' },
    { element: domElements.filterType, value: '' },
    { element: domElements.filterDateFrom, value: '' },
    { element: domElements.filterDateTo, value: '' },
    { element: domElements.filterReparto, value: '' },
    { element: domElements.filterSortColumn, value: '' },
    { element: domElements.filterSortDirection, value: 'desc' }
  ];

  resetMappings.forEach(({ element, value }) => {
    if (element) {
      element.value = value;
      // Se è un CustomSelect, sincronizza anche l'etichetta verso il placeholder/valore
      if (element.customSelectInstance && typeof element.customSelectInstance.setValue === 'function') {
        try {
          element.customSelectInstance.setValue(value, true); // silent
        } catch (e) {
          if (typeof element.customSelectInstance.updateOptions === 'function') {
            element.customSelectInstance.updateOptions();
          }
        }
      }
    }
  });

  if (domElements.searchPatientInput) {
    domElements.searchPatientInput.removeAttribute('data-patient-id');
  }

  if (domElements.patientSearchResults) {
    domElements.patientSearchResults.style.display = 'none';
  }

  logger.log('✅ Filtri UI resettati');
}

/**
 * Ottiene i filtri correnti dall'interfaccia
 */
export function getFiltersFromUI() {
  return {
    paziente_search: domElements.searchPatientInput?.value || '',
    tipo_evento: domElements.filterType?.value || '',
    data_da: domElements.filterDateFrom?.value || '',
    data_a: domElements.filterDateTo?.value || '',
    reparto: domElements.filterReparto?.value || '',
    sortColumn: domElements.filterSortColumn?.value || '',
    sortDirection: domElements.filterSortDirection?.value || 'desc'
  };
}

/**
 * Mostra indicatori di filtri attivi
 */
export function showActiveFiltersIndicator(filters) {
  const filterableKeys = Object.keys(filters).filter(key => 
    !['sortColumn', 'sortDirection'].includes(key)
  );
  
  const activeFiltersCount = filterableKeys.filter(key => {
    const value = filters[key];
    return value && value.toString().trim() !== '';
  }).length;

  let indicator = document.getElementById('active-filters-indicator');
  
  if (activeFiltersCount > 0) {
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.id = 'active-filters-indicator';
      indicator.className = 'badge bg-primary ms-2';
      
      const resetBtn = domElements.resetFiltersBtn;
      if (resetBtn) {
        resetBtn.appendChild(indicator);
      }
    }
    
    indicator.textContent = `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 'i' : ''} attivo${activeFiltersCount > 1 ? 'i' : ''}`;
    indicator.style.display = 'inline';
  } else if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Mostra statistiche sui filtri
 */
export function showFilterStats(stats) {
  let statsContainer = document.getElementById('filter-stats-container');
  
  if (!statsContainer) {
    statsContainer = document.createElement('div');
    statsContainer.id = 'filter-stats-container';
    statsContainer.className = 'filter-stats alert alert-info mt-2';
    
    const filtersSection = document.querySelector('.eventi-filters-section');
    if (filtersSection) {
      filtersSection.appendChild(statsContainer);
    }
  }

  if (stats.activeFiltersCount > 0) {
    statsContainer.innerHTML = sanitizeHtml(`
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <span class="material-icons me-2">bar_chart</span>
          <strong>${stats.filteredEvents}</strong> di <strong>${stats.totalEvents}</strong> eventi
          ${stats.filterEfficiency > 0 ? `(${stats.filterEfficiency}% filtrati)` : ''}
        </div>
        <div class="text-muted small">
          ${stats.activeFiltersCount} filtro${stats.activeFiltersCount > 1 ? 'i' : ''} attivo${stats.activeFiltersCount > 1 ? 'i' : ''}
        </div>
      </div>
    `);
    statsContainer.style.display = 'block';
  } else {
    statsContainer.style.display = 'none';
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Mostra stato di esportazione
 */
export function showExportProgress(isExporting = false) {
  const exportButtons = [
    domElements.exportBtn,
    domElements.exportCsvBtn,
    domElements.exportJsonBtn
  ].filter(btn => btn);

  exportButtons.forEach(btn => {
    if (isExporting) {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.dataset.originalText = originalText;
      btn.innerHTML = sanitizeHtml('<span class="spinner-border spinner-border-sm me-1"></span>Esportando...');
    } else {
      btn.disabled = false;
      const originalText = btn.dataset.originalText;
      if (originalText) {
        btn.textContent = originalText;
        delete btn.dataset.originalText;
      }
    }
  });
}

/**
 * Mostra toast di successo per esportazione
 */
export function showExportSuccess(result) {
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = sanitizeHtml(`
    <div class="d-flex">
      <div class="toast-body">
        <span class="material-icons me-2">download</span>
        Esportati ${result.count} eventi in ${sanitizeHtml(result.filename)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `);

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  toastContainer.appendChild(toast);

  import('bootstrap').then(({ Toast }) => {
    const bsToast = new Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  });
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Evidenzia termini di ricerca nei risultati
 */
export function highlightSearchTerms(content, searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return content;

  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  return content.replace(regex, '<mark>$1</mark>');
}

/**
 * Aggiorna contatore risultati ricerca
 */
 

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Initialize responsive design on window resize
if (typeof window !== "undefined") {
  const handleResize = debounce(() => applyResponsiveDesign(), 150);
  window.addEventListener("resize", handleResize);
}