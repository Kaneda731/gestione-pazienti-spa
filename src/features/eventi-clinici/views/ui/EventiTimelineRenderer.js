/**
 * EventiTimelineRenderer - Modulo per il rendering della timeline degli eventi clinici
 * Gestisce la visualizzazione cronologica degli eventi in formato timeline
 */

import { logger } from "../../../../core/services/logger/loggerService.js";
import { sanitizeHtml } from "../../../../shared/utils/sanitizeHtml.js";
import { formatDate } from "../../../../shared/utils/formatting.js";

/**
 * Classe per il rendering della timeline degli eventi clinici
 */
export class EventiTimelineRenderer {
  constructor(domElements, callbacks) {
    this.domElements = domElements;
    this.callbacks = callbacks;
  }

  /**
   * Renderizza la timeline degli eventi clinici
   * @param {Object} eventsData - Dati degli eventi con struttura {eventi: Array, pagination: Object}
   */
  renderTimeline(eventsData) {
    try {
      logger.log("🎨 Rendering timeline eventi:", eventsData);
      
      const timelineContainer = this.domElements.timelineContainer;
      if (!timelineContainer) {
        logger.error("❌ Container timeline non trovato");
        return;
      }

      // Clear existing content
      this.clearTimeline();

      if (!eventsData.eventi || eventsData.eventi.length === 0) {
        this.renderEmptyState();
        return;
      }

      // Create timeline structure
      const timelineElement = this.createTimelineElement();

      // Group events by date for better visualization
      const eventsByDate = this.groupEventsByDate(eventsData.eventi);

      // Render each date group
      Object.keys(eventsByDate)
        .sort((a, b) => new Date(b) - new Date(a)) // Most recent first
        .forEach((date) => {
          const dateGroup = this.createDateGroup(date, eventsByDate[date], this.callbacks.showActionsModal);
          timelineElement.appendChild(dateGroup);
        });

      timelineContainer.appendChild(timelineElement);

      // Update pagination
      if (this.callbacks.updatePaginationControls) {
        this.callbacks.updatePaginationControls(eventsData);
      }

      logger.log("✅ Timeline renderizzata con successo");
    } catch (error) {
      logger.error("❌ Errore rendering timeline:", error);
      if (this.callbacks.showError) {
        this.callbacks.showError("Errore nel rendering della timeline");
      }
    }
  }

  /**
   * Aggiorna un singolo elemento della timeline
   * @param {Object} evento - Dati dell'evento da aggiornare
   */
  updateTimelineItem(evento) {
    try {
      const existingCard = this.domElements.timelineContainer.querySelector(`[data-evento-id="${evento.id}"]`);
      if (!existingCard) {
        logger.warn(`⚠️ Evento ${evento.id} non trovato nella timeline`);
        return;
      }

      const newCard = this.createEventCard(evento, this.callbacks.showActionsModal);
      existingCard.replaceWith(newCard);
      
      logger.log(`✅ Evento ${evento.id} aggiornato nella timeline`);
    } catch (error) {
      logger.error("❌ Errore aggiornamento timeline item:", error);
    }
  }

  /**
   * Pulisce il contenuto della timeline
   */
  clearTimeline() {
    const timelineContainer = this.domElements.timelineContainer;
    if (timelineContainer) {
      timelineContainer.innerHTML = sanitizeHtml("");
    }
  }

  /**
   * Crea l'elemento timeline principale
   * @returns {HTMLElement} Elemento timeline
   */
  createTimelineElement() {
    const timeline = document.createElement("div");
    timeline.className = "eventi-timeline";
    timeline.innerHTML = sanitizeHtml(`
      <div class="timeline-line"></div>
    `);
    return timeline;
  }

  /**
   * Raggruppa eventi per data
   * @param {Array} eventi - Array degli eventi
   * @returns {Object} Oggetto con eventi raggruppati per data
   */
  groupEventsByDate(eventi) {
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
   * @param {string} date - Data del gruppo
   * @param {Array} eventi - Eventi per quella data
   * @param {Function} showActionsModalCallback - Callback per mostrare la modal delle azioni
   * @returns {HTMLElement} Elemento del gruppo data
   */
  createDateGroup(date, eventi, showActionsModalCallback) {
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
      const eventCard = this.createEventCard(evento, showActionsModalCallback);
      dateGroup.appendChild(eventCard);
    });

    return dateGroup;
  }

  /**
   * Crea una card per un singolo evento
   * @param {Object} evento - Dati dell'evento
   * @param {Function} showActionsModalCallback - Callback per mostrare la modal delle azioni
   * @returns {HTMLElement} Elemento card dell'evento
   */
  createEventCard(evento, showActionsModalCallback) {
    const card = document.createElement("div");
    // Mappa stati evento su classi card mobile riusate dalla lista pazienti
    const isInfezione = evento.tipo_evento === 'infezione';
    const isAttiva = isInfezione && !evento.data_fine_evento;
    const statusClass = isInfezione
      ? (isAttiva ? 'status-infected' : 'status-error')
      : 'status-success';
    // Usa la stessa struttura card mobile per uniformità con la vista "list"
    card.className = `card card-list-compact timeline-event-card ${statusClass} evento-${evento.tipo_evento}`;
    card.dataset.eventoId = evento.id;

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
      ? `
          <div class="card-meta mobile-text-sm mt-1">
            <span class="material-icons me-1" style="font-size:1em;vertical-align:middle;">person</span>
            ${sanitizeHtml(evento.pazienteInfo.nomeCompleto)} • <span class="badge bg-secondary">${sanitizeHtml(evento.pazienteInfo.reparto)}</span>
          </div>
        `
      : '';

    const detailsSection = this.renderEventCardDetails(evento);
    const cardContent = `
        <div class="card-body">
          <div class="card-info">
            <div class="card-title d-flex align-items-center gap-2">
              ${this.renderEventIcon(tipoIcon, evento.tipo_evento, tipoColor)}
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
            <button class="btn btn-outline-secondary btn-sm open-actions-modal">
              <span class="material-icons align-middle me-1" style="font-size:1.05em;">more_horiz</span>
              Azioni
            </button>
          </div>
        </div>
    `;

    card.innerHTML = sanitizeHtml(cardContent);

    // Apertura modal azioni: al click sulla card o sul bottone dedicato
    const openModal = (e) => {
      // Evita doppi trigger da elementi interattivi interni
      if (e && (e.target.closest('button') || e.target.closest('a'))) return;
      if (showActionsModalCallback) {
        showActionsModalCallback(evento);
      }
    };

    // Click sull'intera card apre le azioni
    card.addEventListener('click', openModal);
    // Click sul bottone "Azioni" esplicito
    const explicitBtn = card.querySelector('.open-actions-modal');
    if (explicitBtn) {
      explicitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (showActionsModalCallback) {
          showActionsModalCallback(evento);
        }
      });
    }

    return card;
  }

  /**
   * Renderizza i dettagli specifici dell'evento per la card
   * @param {Object} evento - Dati dell'evento
   * @returns {string} HTML dei dettagli dell'evento
   */
  renderEventCardDetails(evento) {
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
   * Renderizza l'icona dell'evento
   * @param {string} iconValue - Valore dell'icona
   * @param {string} tipo - Tipo dell'evento
   * @param {string} color - Colore dell'icona
   * @param {string} extraClass - Classi CSS aggiuntive
   * @returns {string} HTML dell'icona
   */
  renderEventIcon(iconValue, tipo, color, extraClass = '') {
    const icon = iconValue || (tipo === 'intervento' ? 'medical_services' : 'warning');
    const iconColor = color || (tipo === 'intervento' ? 'primary' : 'warning');
    
    return `<span class="material-icons text-${iconColor} ${extraClass}">${icon}</span>`;
  }

  /**
   * Renderizza lo stato vuoto della timeline
   */
  renderEmptyState() {
    const timelineContainer = this.domElements.timelineContainer;
    if (!timelineContainer) return;

    timelineContainer.innerHTML = sanitizeHtml('');
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

    timelineContainer.appendChild(emptyDiv);

    // Add event listener for the add button
    btn.addEventListener('click', () => {
      const addEventBtn = this.domElements.addEventBtn;
      if (addEventBtn) {
        addEventBtn.click();
      }
    });
  }
}

// Funzione factory per compatibilità con il codice esistente
export function createTimelineRenderer(domElementsCache) {
  return new EventiTimelineRenderer(domElementsCache);
}
