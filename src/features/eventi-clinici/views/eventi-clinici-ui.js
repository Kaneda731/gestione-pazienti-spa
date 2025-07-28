// src/features/eventi-clinici/views/eventi-clinici-ui.js

import { logger } from "../../../core/services/loggerService.js";
import { formatDate } from "../../../shared/utils/formatting.js";
import { sanitizeHtml } from "../../../shared/utils/sanitizeHtml.js";

/**
 * UI renderer per la timeline degli eventi clinici
 * Gestisce il rendering cronologico degli eventi e l'interfaccia responsive
 */

// DOM elements cache
let domElements = {};

/**
 * Inizializza i riferimenti agli elementi DOM
 */
export function initializeDOMElements() {
  domElements = {
    // Main containers
    timelineContainer: document.getElementById("eventi-timeline-container"),

    // Search and filters
    searchPatientInput: document.getElementById("eventi-search-patient"),
    patientSearchResults: document.getElementById("patient-search-results"),
    filterType: document.getElementById("eventi-filter-type"),
    filterDateFrom: document.getElementById("eventi-filter-date-from"),
    filterDateTo: document.getElementById("eventi-filter-date-to"),
    filterReparto: document.getElementById("eventi-filter-reparto"),
    filterAgentePatogeno: document.getElementById("eventi-filter-agente-patogeno"),
    filterTipoIntervento: document.getElementById("eventi-filter-tipo-intervento"),
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
    
    // Advanced filters
    advancedFiltersToggle: document.querySelector('[data-bs-target="#advanced-filters"]'),
    advancedFiltersContainer: document.getElementById("advanced-filters"),

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
    eventPatientSearchResults: document.getElementById(
      "evento-patient-search-results"
    ),
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

/**
 * Renderizza la timeline degli eventi clinici
 */
export function renderEventsTimeline(eventsData) {
  try {
    logger.log("🎨 Rendering timeline eventi:", eventsData);

    if (!domElements.timelineContainer) {
      logger.error("❌ Container timeline non trovato");
      return;
    }

    // Clear existing content
    domElements.timelineContainer.innerHTML = sanitizeHtml("");

    if (!eventsData.eventi || eventsData.eventi.length === 0) {
      renderEmptyState();
      return;
    }

    // Create timeline structure
    const timelineElement = createTimelineElement();

    // Group events by date for better visualization
    const eventsByDate = groupEventsByDate(eventsData.eventi);

    // Render each date group
    Object.keys(eventsByDate)
      .sort((a, b) => new Date(b) - new Date(a)) // Most recent first
      .forEach((date) => {
        const dateGroup = createDateGroup(date, eventsByDate[date]);
        timelineElement.appendChild(dateGroup);
      });

    domElements.timelineContainer.appendChild(timelineElement);

    // Update pagination
    updatePaginationControls(eventsData);

    logger.log("✅ Timeline renderizzata con successo");
  } catch (error) {
    logger.error("❌ Errore rendering timeline:", error);
    showError("Errore nel rendering della timeline");
  }
}

/**
 * Crea l'elemento timeline principale
 */
function createTimelineElement() {
  const timeline = document.createElement("div");
  timeline.className = "eventi-timeline";
  timeline.innerHTML = sanitizeHtml(`
    <div class="timeline-line"></div>
  `);
  return timeline;
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

  // Sort events by creation time for same-day events
  eventi.sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

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
  card.className = `timeline-event-card evento-${evento.tipo_evento}`;
  card.dataset.eventoId = evento.id;

  const cardContent = `
    <div class="event-card-header">
      <div class="event-type-indicator">
        <i class="${evento.tipoEventoIcon} text-${evento.tipoEventoColor}"></i>
        <span class="event-type-label">${evento.tipoEventoLabel}</span>
      </div>
      <div class="event-actions">
        <button class="btn btn-sm btn-outline-primary event-detail-btn" data-evento-id="${
          evento.id
        }">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary event-edit-btn" data-evento-id="${
          evento.id
        }">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger event-delete-btn" data-evento-id="${
          evento.id
        }">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    
    <div class="event-card-body">
      ${renderEventCardDetails(evento)}
    </div>
    
    ${
      evento.pazienteInfo
        ? `
      <div class="event-card-footer">
        <div class="patient-info">
          <i class="fas fa-user-injured me-1"></i>
          <span class="patient-name">${evento.pazienteInfo.nomeCompleto}</span>
          <span class="patient-department badge bg-secondary ms-2">${evento.pazienteInfo.reparto}</span>
        </div>
      </div>
    `
        : ""
    }
  `;

  card.innerHTML = sanitizeHtml(cardContent);

  // Add click handler for card expansion
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".event-actions")) {
      toggleEventCardExpansion(card);
    }
  });

  return card;
}

/**
 * Renderizza i dettagli specifici dell'evento per la card
 */
function renderEventCardDetails(evento) {
  let details = "";

  if (evento.descrizione) {
    details += `<p class="event-description">${sanitizeHtml(evento.descrizione)}</p>`;
  }

  // Type-specific details
  if (evento.tipo_evento === "intervento") {
    if (evento.tipo_intervento) {
      details += `
        <div class="event-detail-item">
          <strong>Tipo Intervento:</strong> ${sanitizeHtml(evento.tipo_intervento)}
        </div>
      `;
    }
  } else if (evento.tipo_evento === "infezione") {
    if (evento.agente_patogeno) {
      details += `
        <div class="event-detail-item">
          <strong>Agente Patogeno:</strong> ${sanitizeHtml(evento.agente_patogeno)}
        </div>
      `;
    }
  }

  return details || '<p class="text-muted">Nessun dettaglio aggiuntivo</p>';
}

/**
 * Toggle espansione card evento
 */
function toggleEventCardExpansion(card) {
  card.classList.toggle("expanded");

  const body = card.querySelector(".event-card-body");
  if (card.classList.contains("expanded")) {
    body.style.maxHeight = body.scrollHeight + "px";
  } else {
    body.style.maxHeight = "60px";
  }
}

/**
 * Renderizza lo stato vuoto
 */
function renderEmptyState() {
  // Creazione DOM sicura per empty state
  domElements.timelineContainer.innerHTML = sanitizeHtml('');
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state text-center py-5';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'empty-state-icon mb-3';
  iconDiv.innerHTML = sanitizeHtml('<i class="fas fa-calendar-times fa-3x text-muted"></i>');
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
  btn.innerHTML = sanitizeHtml('<i class="fas fa-plus me-1"></i> Aggiungi primo evento');
  emptyDiv.appendChild(btn);

  domElements.timelineContainer.appendChild(emptyDiv);

  // Add event listener for the add button
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
  if (!domElements.timelineContainer) return;

  domElements.timelineContainer.innerHTML = sanitizeHtml(`
    <div class="loading-state text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Caricamento...</span>
      </div>
      <p class="text-muted">Caricamento eventi clinici...</p>
    </div>
  `);
}

/**
 * Mostra errore
 */
export function showError(message = "Errore nel caricamento dei dati") {
  if (!domElements.timelineContainer) return;

  domElements.timelineContainer.innerHTML = sanitizeHtml(`
    <div class="error-state text-center py-5">
      <div class="error-state-icon mb-3">
        <i class="fas fa-exclamation-triangle fa-3x text-danger"></i>
      </div>
      <h4 class="text-danger">Errore</h4>
      <p class="text-muted">${sanitizeHtml(message)}</p>
      <button class="btn btn-outline-primary" onclick="location.reload()">
        <i class="fas fa-refresh me-1"></i>
        Riprova
      </button>
    </div>
  `);
}

/**
 * Aggiorna i controlli di paginazione
 */
function updatePaginationControls(eventsData) {
  if (!domElements.paginationControls) return;

  const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } =
    eventsData;

  // Update buttons state
  if (domElements.prevPageBtn) {
    domElements.prevPageBtn.disabled = !hasPrevPage;
  }

  if (domElements.nextPageBtn) {
    domElements.nextPageBtn.disabled = !hasNextPage;
  }

  // Update page info
  if (domElements.pageInfo) {
    const startItem = currentPage * 10 + 1;
    const endItem = Math.min((currentPage + 1) * 10, totalCount);
    domElements.pageInfo.textContent = `${startItem}-${endItem} di ${totalCount} eventi (Pagina ${
      currentPage + 1
    } di ${totalPages})`;
  }

  // Show/hide pagination if needed
  domElements.paginationControls.style.display =
    totalPages > 1 ? "flex" : "none";
}

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

  const resultsHTML = patients
    .map(
      (patient) => `
    <div class="dropdown-item patient-search-result" data-patient-id="${
      patient.id
    }">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${patient.nomeCompleto}</strong>
          <br>
          <small class="text-muted">
            ${patient.reparto_appartenenza} • Ricovero: ${
        patient.dataRicoveroFormatted
      }
            ${
              patient.isActive
                ? '<span class="badge bg-success ms-1">Attivo</span>'
                : '<span class="badge bg-secondary ms-1">Dimesso</span>'
            }
          </small>
        </div>
        <i class="fas fa-chevron-right text-muted"></i>
      </div>
    </div>
  `
    )
    .join("");

  container.innerHTML = sanitizeHtml(resultsHTML);
  container.style.display = "block";

  // Add click handlers
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
    // Main search - trigger filter
    if (domElements.searchPatientInput) {
      domElements.searchPatientInput.value = patientName;
      domElements.searchPatientInput.dataset.patientId = patientId;
    }
  } else if (containerId === "evento-patient-search-results") {
    // Form search - populate form
    if (domElements.eventPatientInput) {
      domElements.eventPatientInput.value = patientName;
    }
    if (domElements.eventPatientId) {
      domElements.eventPatientId.value = patientId;
    }
  }

  container.style.display = "none";
}

/**
 * Mostra/nasconde campi specifici per tipo evento
 */
export function toggleEventTypeFields(eventType) {
  if (!domElements.interventionFields || !domElements.infectionFields) return;

  if (eventType === "intervento") {
    domElements.interventionFields.style.display = "block";
    domElements.infectionFields.style.display = "none";

    // Make intervention type required
    if (domElements.interventionType) {
      domElements.interventionType.required = true;
    }
    if (domElements.infectionAgent) {
      domElements.infectionAgent.required = false;
    }
  } else if (eventType === "infezione") {
    domElements.interventionFields.style.display = "none";
    domElements.infectionFields.style.display = "block";

    // Make infection agent recommended
    if (domElements.interventionType) {
      domElements.interventionType.required = false;
    }
    if (domElements.infectionAgent) {
      domElements.infectionAgent.required = false;
    }
  } else {
    domElements.interventionFields.style.display = "none";
    domElements.infectionFields.style.display = "none";

    if (domElements.interventionType) {
      domElements.interventionType.required = false;
    }
    if (domElements.infectionAgent) {
      domElements.infectionAgent.required = false;
    }
  }
}

/**
 * Popola il form con i dati dell'evento per modifica
 */
export function populateEventForm(evento) {
  if (!domElements.eventForm) return;

  // Basic fields
  if (domElements.eventId) domElements.eventId.value = evento.id || "";
  if (domElements.eventType)
    domElements.eventType.value = evento.tipo_evento || "";
  if (domElements.eventDate)
    domElements.eventDate.value = evento.dataEventoFormatted || "";
  if (domElements.eventDescription)
    domElements.eventDescription.value = evento.descrizione || "";

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
  if (evento.tipo_evento === "intervento") {
    if (domElements.interventionType) {
      domElements.interventionType.value = evento.tipo_intervento || "";
    }
  } else if (evento.tipo_evento === "infezione") {
    if (domElements.infectionAgent) {
      domElements.infectionAgent.value = evento.agente_patogeno || "";
    }
  }

  // Show appropriate fields
  toggleEventTypeFields(evento.tipo_evento);
}

/**
 * Resetta il form eventi
 */
export function resetEventForm() {
  if (!domElements.eventForm) return;

  domElements.eventForm.reset();

  // Clear hidden fields
  if (domElements.eventId) domElements.eventId.value = "";
  if (domElements.eventPatientId) domElements.eventPatientId.value = "";

  // Hide type-specific fields
  toggleEventTypeFields("");

  // Clear search results
  if (domElements.eventPatientSearchResults) {
    domElements.eventPatientSearchResults.style.display = "none";
  }

  // Clear messages
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

  const detailsHTML = `
    <div class="event-details">
      <div class="row g-3">
        <div class="col-md-6">
          <strong>Tipo Evento:</strong>
          <div class="d-flex align-items-center mt-1">
            <i class="${evento.tipoEventoIcon} text-${
    evento.tipoEventoColor
  } me-2"></i>
            ${evento.tipoEventoLabel}
          </div>
        </div>
        <div class="col-md-6">
          <strong>Data Evento:</strong>
          <div class="mt-1">${evento.dataEventoFormatted}</div>
        </div>
        
        ${
          evento.pazienteInfo
            ? `
          <div class="col-12">
            <strong>Paziente:</strong>
            <div class="mt-1">
              <i class="fas fa-user-injured me-1"></i>
              ${evento.pazienteInfo.nomeCompleto}
              <span class="badge bg-secondary ms-2">${evento.pazienteInfo.reparto}</span>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          evento.descrizione
            ? `
          <div class="col-12">
            <strong>Descrizione:</strong>
            <div class="mt-1">${evento.descrizione}</div>
          </div>
        `
            : ""
        }
        
        ${
          evento.tipo_evento === "intervento" && evento.tipo_intervento
            ? `
          <div class="col-12">
            <strong>Tipo Intervento:</strong>
            <div class="mt-1">${evento.tipo_intervento}</div>
          </div>
        `
            : ""
        }
        
        ${
          evento.tipo_evento === "infezione" && evento.agente_patogeno
            ? `
          <div class="col-12">
            <strong>Agente Patogeno:</strong>
            <div class="mt-1">${evento.agente_patogeno}</div>
          </div>
        `
            : ""
        }
        
        <div class="col-md-6">
          <strong>Creato il:</strong>
          <div class="mt-1 text-muted">${formatDate(evento.created_at)}</div>
        </div>
        
        ${
          evento.updated_at && evento.updated_at !== evento.created_at
            ? `
          <div class="col-md-6">
            <strong>Modificato il:</strong>
            <div class="mt-1 text-muted">${formatDate(evento.updated_at)}</div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  domElements.detailContent.innerHTML = sanitizeHtml(detailsHTML);
}

/**
 * Applica responsive design basato sulla dimensione dello schermo
 */
export function applyResponsiveDesign() {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  if (domElements.timelineContainer) {
    domElements.timelineContainer.classList.toggle("mobile-layout", isMobile);
    domElements.timelineContainer.classList.toggle("tablet-layout", isTablet);
  }

  // Adjust card layouts
  const eventCards = document.querySelectorAll(".timeline-event-card");
  eventCards.forEach((card) => {
    card.classList.toggle("mobile-card", isMobile);
    card.classList.toggle("tablet-card", isTablet);
  });
}

/**
 * Popola il filtro reparti con le opzioni disponibili
 */
export async function populateDepartmentFilter(reparti) {
  if (!domElements.filterReparto) return;

  // Clear existing options except the first one
  const firstOption = domElements.filterReparto.querySelector('option[value=""]');
  domElements.filterReparto.innerHTML = sanitizeHtml('');
  if (firstOption) {
    domElements.filterReparto.appendChild(firstOption);
  }

  // Add department options
  reparti.forEach(reparto => {
    const option = document.createElement('option');
    option.value = reparto;
    option.textContent = reparto;
    domElements.filterReparto.appendChild(option);
  });

  logger.log('✅ Filtro reparti popolato con', reparti.length, 'opzioni');
}

/**
 * Popola i filtri avanzati con i valori suggeriti
 */
export async function populateAdvancedFilters(suggestions) {
  try {
    // Populate intervention types filter
    if (domElements.filterTipoIntervento && suggestions.tipiIntervento) {
      populateSelectOptions(domElements.filterTipoIntervento, suggestions.tipiIntervento);
    }

    // Populate pathogen agents filter
    if (domElements.filterAgentePatogeno && suggestions.agentiPatogeni) {
      populateSelectOptions(domElements.filterAgentePatogeno, suggestions.agentiPatogeni);
    }

    logger.log('✅ Filtri avanzati popolati:', suggestions);
  } catch (error) {
    logger.error('❌ Errore popolamento filtri avanzati:', error);
  }
}

/**
 * Utility per popolare opzioni di select
 */
function populateSelectOptions(selectElement, options) {
  // Clear existing options except the first one
  const firstOption = selectElement.querySelector('option[value=""]');
  selectElement.innerHTML = sanitizeHtml('');
  if (firstOption) {
    selectElement.appendChild(firstOption);
  }

  // Add new options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
}

/**
 * Applica filtri attivi all'interfaccia
 */
export function applyFiltersToUI(filters) {
  if (!filters) return;

  // Patient search
  if (domElements.searchPatientInput && filters.paziente_search) {
    domElements.searchPatientInput.value = filters.paziente_search;
  }

  // Event type filter
  if (domElements.filterType && filters.tipo_evento) {
    domElements.filterType.value = filters.tipo_evento;
  }

  // Date filters
  if (domElements.filterDateFrom && filters.data_da) {
    domElements.filterDateFrom.value = filters.data_da;
  }

  if (domElements.filterDateTo && filters.data_a) {
    domElements.filterDateTo.value = filters.data_a;
  }

  // Department filter
  if (domElements.filterReparto && filters.reparto) {
    domElements.filterReparto.value = filters.reparto;
  }

  // Advanced filters
  if (domElements.filterAgentePatogeno && filters.agente_patogeno) {
    domElements.filterAgentePatogeno.value = filters.agente_patogeno;
  }

  if (domElements.filterTipoIntervento && filters.tipo_intervento) {
    domElements.filterTipoIntervento.value = filters.tipo_intervento;
  }

  // Sorting
  if (domElements.filterSortColumn && filters.sortColumn) {
    domElements.filterSortColumn.value = filters.sortColumn;
  }

  if (domElements.filterSortDirection && filters.sortDirection) {
    domElements.filterSortDirection.value = filters.sortDirection;
  }

  logger.log('✅ Filtri applicati all\'interfaccia:', filters);
}

/**
 * Resetta tutti i filtri nell'interfaccia
 */
export function resetFiltersUI() {
  if (domElements.searchPatientInput) {
    domElements.searchPatientInput.value = '';
    domElements.searchPatientInput.removeAttribute('data-patient-id');
  }

  if (domElements.filterType) {
    domElements.filterType.value = '';
  }

  if (domElements.filterDateFrom) {
    domElements.filterDateFrom.value = '';
  }

  if (domElements.filterDateTo) {
    domElements.filterDateTo.value = '';
  }

  if (domElements.filterReparto) {
    domElements.filterReparto.value = '';
  }

  // Advanced filters
  if (domElements.filterAgentePatogeno) {
    domElements.filterAgentePatogeno.value = '';
  }

  if (domElements.filterTipoIntervento) {
    domElements.filterTipoIntervento.value = '';
  }

  // Sorting
  if (domElements.filterSortColumn) {
    domElements.filterSortColumn.value = 'data_evento';
  }

  if (domElements.filterSortDirection) {
    domElements.filterSortDirection.value = 'desc';
  }

  // Hide patient search results
  if (domElements.patientSearchResults) {
    domElements.patientSearchResults.style.display = 'none';
  }

  logger.log('✅ Filtri UI resettati');
}

/**
 * Mostra indicatori di filtri attivi
 */
export function showActiveFiltersIndicator(filters) {
  // Exclude sorting from active filters count
  const filterableKeys = Object.keys(filters).filter(key => 
    !['sortColumn', 'sortDirection'].includes(key)
  );
  
  const activeFiltersCount = filterableKeys.filter(key => {
    const value = filters[key];
    return value && value.toString().trim() !== '';
  }).length;

  // Find or create filter indicator
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
    
    // Insert after filters section
    const filtersSection = document.querySelector('.eventi-filters-section');
    if (filtersSection) {
      filtersSection.appendChild(statsContainer);
    }
  }

  if (stats.activeFiltersCount > 0) {
    statsContainer.innerHTML = sanitizeHtml(`
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <i class="fas fa-chart-bar me-2"></i>
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
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = sanitizeHtml(`
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-download me-2"></i>
        Esportati ${result.count} eventi in ${sanitizeHtml(result.filename)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `);

  // Add to toast container or create one
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  toastContainer.appendChild(toast);

  // Show toast using Bootstrap
  import('bootstrap').then(({ Toast }) => {
    const bsToast = new Toast(toast);
    bsToast.show();
    
    // Remove after hiding
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  });
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
    agente_patogeno: domElements.filterAgentePatogeno?.value || '',
    tipo_intervento: domElements.filterTipoIntervento?.value || '',
    sortColumn: domElements.filterSortColumn?.value || 'data_evento',
    sortDirection: domElements.filterSortDirection?.value || 'desc'
  };
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

  // Add searching indicator to existing content
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

/**
 * Evidenzia termini di ricerca nei risultati
 */
export function highlightSearchTerms(content, searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return content;

  // Escape special regex characters to prevent ReDoS attacks
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  return content.replace(regex, '<mark>$1</mark>');
}

/**
 * Aggiorna contatore risultati ricerca
 */
export function updateSearchResultsCount(count, totalCount, filters) {
  let resultsInfo = document.getElementById('search-results-info');
  
  if (!resultsInfo) {
    resultsInfo = document.createElement('div');
    resultsInfo.id = 'search-results-info';
    resultsInfo.className = 'search-results-info text-muted mb-3';
    
    const timelineContainer = domElements.timelineContainer;
    if (timelineContainer && timelineContainer.parentNode) {
      timelineContainer.parentNode.insertBefore(resultsInfo, timelineContainer);
    }
  }

  const hasActiveFilters = Object.values(filters || {}).some(value => 
    value && value.toString().trim() !== ''
  );

  if (hasActiveFilters) {
    resultsInfo.innerHTML = sanitizeHtml(`
      <i class="fas fa-filter me-1"></i>
      Trovati <strong>${count}</strong> eventi su ${totalCount} totali
      ${filters.paziente_search ? `per "${sanitizeHtml(filters.paziente_search)}"` : ''}
    `);
    resultsInfo.style.display = 'block';
  } else {
    resultsInfo.style.display = 'none';
  }
}

/**
 * Ottiene i riferimenti DOM (per uso esterno)
 */
export function getDOMElements() {
  return domElements;
}

// Initialize responsive design on window resize
if (typeof window !== "undefined") {
  window.addEventListener("resize", applyResponsiveDesign);
}
