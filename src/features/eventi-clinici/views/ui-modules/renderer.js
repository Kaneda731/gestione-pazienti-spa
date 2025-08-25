// src/features/eventi-clinici/views/ui-modules/renderer.js
// Modulo per le funzioni di rendering UI degli eventi clinici

import { logger } from '../../../../core/services/logger/loggerService.js';
import { sanitizeHtml } from '../../../../shared/utils/sanitizeHtml.js';
import { formatDate } from '../../../../shared/utils/formatting.js';

// Import componenti UI esistenti
import { updateSearchResultsCount } from '../ui/results-info/updateResultsInfo.js';
import { EventiTableRenderer } from '../ui/EventiTableRenderer.js';
import { EventiTimelineRenderer } from '../ui/EventiTimelineRenderer.js';

// Variabile globale per i DOM elements (sarà inizializzata dal state module)
let domElements = null;
let tableRenderer = null;
let timelineRenderer = null;

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
 * Inizializza il renderer con i DOM elements
 * @param {Object} elements - Oggetto con riferimenti DOM
 */
export function initializeRenderer(elements) {
  domElements = elements;
}

/**
 * Inizializza i renderer se non presenti
 */
function ensureRenderers() {
  if (!tableRenderer) {
    tableRenderer = new EventiTableRenderer(domElements, {
      showError,
      updatePaginationControls: () => {} // Placeholder
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    tableRenderer.domElements = domElements;
  }
  if (!timelineRenderer) {
    timelineRenderer = new EventiTimelineRenderer(domElements, {
      showError,
      updatePaginationControls: () => {} // Placeholder
    });
  } else {
    // Riallinea i riferimenti DOM al re-ingresso
    timelineRenderer.domElements = domElements;
  }
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

  // Re-applica le classi responsive dopo ogni re-render per coprire nuovi nodi
  try {
    applyResponsiveDesign();
  } catch (e) {
    logger.warn('⚠️ applyResponsiveDesign fallita dopo renderEventsResponsive:', e);
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
// STATE RENDERING FUNCTIONS
// ============================================================================

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
// PATIENT SEARCH RENDERING
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
      <div class="d-flex align-items-center">
        <div class="flex-grow-1">
          <div class="fw-bold">${sanitizeHtml(patient.nome)} ${sanitizeHtml(patient.cognome)}</div>
          <div class="text-muted small">
            CF: ${sanitizeHtml(patient.codice_fiscale)} | 
            ${patient.data_nascita ? new Date(patient.data_nascita).toLocaleDateString('it-IT') : 'N/A'}
          </div>
        </div>
        <small class="text-muted">${sanitizeHtml(patient.status || 'Attivo')}</small>
      </div>
    </div>
  `;
}

/**
 * Configura i gestori eventi per i risultati di ricerca pazienti
 */
function setupPatientSearchHandlers(container, containerId) {
  const results = container.querySelectorAll('.patient-search-result');
  results.forEach(result => {
    result.addEventListener('click', function() {
      const patientId = this.dataset.patientId;
      const patientName = this.querySelector('.fw-bold').textContent;
      
      // Aggiorna il campo input corrispondente
      if (containerId === 'patient-search-results') {
        const input = document.getElementById('paziente-nome');
        if (input) {
          input.value = patientName;
          input.dataset.patientId = patientId;
        }
      }
      
      // Nasconde i risultati
      container.style.display = 'none';
    });
  });
}

// ============================================================================
// EVENT DETAILS RENDERING
// ============================================================================

/**
 * Renderizza i dettagli dell'evento nel modal di dettaglio
 */
export function renderEventDetails(evento) {
  if (!domElements || !domElements.detailContent) return;

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

// ============================================================================
// FILTER & STATISTICS RENDERING
// ============================================================================

/**
 * Mostra indicatore filtri attivi
 */
export function showActiveFiltersIndicator(filtersCount) {
  const indicator = document.getElementById('active-filters-indicator');
  if (!indicator) return;

  if (filtersCount > 0) {
    indicator.innerHTML = sanitizeHtml(`
      <span class="badge bg-primary me-2">
        <span class="material-icons" style="font-size: 14px;">filter_list</span>
        ${filtersCount} filtri attivi
      </span>
    `);
    indicator.style.display = 'block';
  } else {
    indicator.style.display = 'none';
  }
}

/**
 * Mostra statistiche filtri
 */
export function showFilterStats(stats) {
  const statsContainer = document.getElementById('filter-stats');
  if (!statsContainer) return;

  if (!stats) {
    statsContainer.style.display = 'none';
    return;
  }

  const statsHTML = `
    <div class="filter-stats-content">
      <div class="stats-item">
        <span class="material-icons">event</span>
        <span>${stats.totalEvents || 0} eventi totali</span>
      </div>
      <div class="stats-item">
        <span class="material-icons">visibility</span>
        <span>${stats.filteredEvents || 0} eventi visualizzati</span>
      </div>
      <div class="stats-item">
        <span class="material-icons">date_range</span>
        <span>${stats.dateRange || 'Tutto il periodo'}</span>
      </div>
    </div>
  `;

  statsContainer.innerHTML = sanitizeHtml(statsHTML);
  statsContainer.style.display = 'block';
}

/**
 * Mostra progresso esportazione
 */
export function showExportProgress(message = "Esportazione in corso...") {
  const progressContainer = document.getElementById('export-progress');
  if (!progressContainer) return;

  progressContainer.innerHTML = sanitizeHtml(`
    <div class="export-progress-content">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Esportazione...</span>
      </div>
      <span>${sanitizeHtml(message)}</span>
    </div>
  `);
  progressContainer.style.display = 'block';
}

/**
 * Mostra successo esportazione
 */
export function showExportSuccess(result) {
  const progressContainer = document.getElementById('export-progress');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  // Crea toast di successo
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
// SEARCH UTILITY FUNCTIONS
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

// Re-export della funzione updateSearchResultsCount
export { updateSearchResultsCount };

// Temporary function to handle applyResponsiveDesign dependency
// This will be moved to the state module in Task 5
function applyResponsiveDesign() {
  // Placeholder - will be replaced with proper import from state module
  if (typeof window !== 'undefined' && window.applyResponsiveDesign) {
    window.applyResponsiveDesign();
  }
}

// ============================================================================
// MODAL DETAIL FUNCTIONS (MISSING FROM REFACTOR)
// ============================================================================

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
