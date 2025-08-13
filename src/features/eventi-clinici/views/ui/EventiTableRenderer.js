import { logger } from "../../../../core/services/logger/loggerService.js";
import { sanitizeHtml } from "../../../../shared/utils/sanitizeHtml.js";
import { formatDate } from "../../../../shared/utils/formatting.js";

/**
 * Classe per il rendering della tabella degli eventi clinici
 */
export class EventiTableRenderer {
  constructor(domElements, callbacks) {
    this.domElements = domElements;
    this.callbacks = callbacks;
  }

  /**
   * Renderizza la tabella degli eventi clinici
   * @param {Object} eventsData - Dati degli eventi con struttura {eventi: Array, pagination: Object}
   */
  renderTable(eventsData) {
    try {
      logger.log("🎨 Rendering tabella eventi:", eventsData);

      if (!this.domElements.tableBody) {
        logger.error("❌ Container table body non trovato");
        return;
      }

      this.clearTable();

      if (!eventsData.eventi || eventsData.eventi.length === 0) {
        this.renderEmptyState();
        this.updatePaginationControls(eventsData);
        return;
      }

      const rowsHtml = this.createTableRows(eventsData.eventi);

      // DEBUG: Verifica tableBody
      console.log("🔍 [TABLE RENDERER DEBUG]", {
        tableBody: !!this.domElements.tableBody,
        tableBodyId: this.domElements.tableBody?.id,
        rowsHtmlLength: rowsHtml.length,
        eventsCount: eventsData.eventi.length,
      });

      if (this.domElements.tableBody) {
        this.domElements.tableBody.innerHTML = rowsHtml;

        // Verifica che le righe siano state effettivamente aggiunte
        const actualRows = this.domElements.tableBody.children.length;
        console.log("🔍 [TABLE RENDERER DEBUG] Righe aggiunte:", actualRows);

        if (actualRows === 0 && eventsData.eventi.length > 0) {
          console.error(
            "❌ [TABLE RENDERER DEBUG] Righe non aggiunte nonostante ci siano eventi!"
          );
        }
      } else {
        console.error("❌ [TABLE RENDERER DEBUG] tableBody è null!");
      }

      this.updatePaginationControls(eventsData);

      logger.log("✅ Tabella renderizzata con successo");
    } catch (error) {
      logger.error("❌ Errore rendering tabella:", error);
      if (this.callbacks.showError) {
        this.callbacks.showError("Errore nel rendering della tabella");
      }
    }
  }

  /**
   * Pulisce il contenuto della tabella
   */
  clearTable() {
    if (this.domElements.tableBody) {
      this.domElements.tableBody.innerHTML = sanitizeHtml("");
    }
  }

  /**
   * Renderizza lo stato vuoto della tabella
   */
  renderEmptyState() {
    if (!this.domElements.tableBody) return;

    const row = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.className = "text-center text-muted";
    td.textContent = "Nessun evento trovato";
    row.appendChild(td);
    this.domElements.tableBody.appendChild(row);
  }

  /**
   * Crea le righe HTML per la tabella
   * @param {Array} eventi - Array degli eventi
   * @returns {string} HTML delle righe
   */
  createTableRows(eventi) {
    return eventi.map((evento) => this.createTableRow(evento)).join("");
  }

  /**
   * Crea una singola riga della tabella
   * @param {Object} evento - Dati dell'evento
   * @returns {string} HTML della riga
   */
  createTableRow(evento) {
    const patient = evento.pazienteInfo;
    const dettagli = this.getEventDetails(evento);
    const statoBadge = this.getStatusBadge(evento);
    const actionButtons = this.getActionButtons(evento);
    const tipoBadge = this.getTipoBadge(evento);

    return `
      <tr data-evento-id="${evento.id}" class="evento-row">
        <td>${evento.dataEventoFormatted || formatDate(evento.data_evento)}</td>
        <td>${tipoBadge}</td>
        <td>${patient ? sanitizeHtml(patient.nomeCompleto) : "-"}</td>
        <td>${patient ? sanitizeHtml(patient.reparto) : "-"}</td>
        <td><span class="clamp-3">${sanitizeHtml(dettagli)}</span></td>
        <td><span class="clamp-3">${
          evento.descrizione ? sanitizeHtml(evento.descrizione) : "-"
        }</span></td>
        <td>${statoBadge}</td>
        <td>${actionButtons}</td>
      </tr>
    `;
  }

  /**
   * Ottiene i dettagli specifici dell'evento
   * @param {Object} evento - Dati dell'evento
   * @returns {string} Dettagli formattati
   */
  getEventDetails(evento) {
    if (evento.tipo_evento === "intervento") {
      return evento.tipo_intervento || "-";
    } else {
      return evento.agente_patogeno || "-";
    }
  }

  /**
   * Ottiene il badge di stato per l'evento
   * @param {Object} evento - Dati dell'evento
   * @returns {string} HTML del badge di stato
   */
  getStatusBadge(evento) {
    if (evento.tipo_evento === "infezione") {
      if (evento.data_fine_evento) {
        return `<span class="badge bg-success" title="Risolta il ${evento.dataFineEventoFormatted}">Risolta</span>`;
      } else {
        return `<span class="badge bg-danger" title="Infezione attiva">Attiva</span>`;
      }
    }
    return "";
  }

  /**
   * Ottiene il badge del tipo evento
   * @param {Object} evento - Dati dell'evento
   * @returns {string} HTML del badge tipo
   */
  getTipoBadge(evento) {
    // Determina colore e label basati su tipo evento e proprietà custom
    let tipoColor, tipoLabel;

    if (evento.tipoEventoColor && evento.tipoEventoLabel) {
      // Usa proprietà custom se disponibili
      tipoColor = evento.tipoEventoColor;
      tipoLabel = evento.tipoEventoLabel;
    } else if (evento.tipo_evento === "intervento") {
      // Default per interventi
      tipoColor = "primary";
      tipoLabel = "Intervento";
    } else if (evento.tipo_evento === "infezione") {
      // Default per infezioni
      tipoColor = "warning";
      tipoLabel = "Infezione";
    } else if (evento.tipo_evento) {
      // Tipo evento sconosciuto
      tipoColor = "secondary";
      tipoLabel = `Tipo: ${evento.tipo_evento}`;
    } else {
      // Nessun tipo evento
      tipoColor = "secondary";
      tipoLabel = "Sconosciuto";
    }

    const tipoIcon = this.renderEventIcon(
      evento.tipoEventoIcon,
      evento.tipo_evento,
      "white",
      "me-1 align-middle fs-6"
    );

    const result = `
      <span class="badge bg-${tipoColor}">
        ${tipoIcon}
        ${tipoLabel}
      </span>
    `.trim();

    return result;
  }

  /**
   * Ottiene i bottoni di azione per l'evento
   * @param {Object} evento - Dati dell'evento
   * @returns {string} HTML dei bottoni di azione
   */
  getActionButtons(evento) {
    const resolveButton =
      evento.tipo_evento === "infezione" && !evento.data_fine_evento
        ? `<button class="btn btn-outline-success event-resolve-btn" data-evento-id="${evento.id}" title="Risolvi">
           <span class="material-icons">check_circle</span>
         </button>`
        : "";

    return `
      <div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-primary event-detail-btn" data-evento-id="${evento.id}" title="Dettagli">
          <span class="material-icons">visibility</span>
        </button>
        <button class="btn btn-outline-secondary event-edit-btn" data-evento-id="${evento.id}" title="Modifica">
          <span class="material-icons">edit</span>
        </button>
        ${resolveButton}
        <button class="btn btn-outline-danger event-delete-btn" data-evento-id="${evento.id}" title="Elimina">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;
  }

  /**
   * Renderizza l'icona dell'evento
   * @param {string} iconValue - Valore dell'icona
   * @param {string} tipo - Tipo di evento
   * @param {string} color - Colore dell'icona
   * @param {string} extraClass - Classi CSS aggiuntive
   * @returns {string} HTML dell'icona
   */
  renderEventIcon(iconValue, tipo, color = "", extraClass = "") {
    // Ignora icone Font Awesome e usa sempre Material Icons
    if (!iconValue || iconValue.includes("fa-") || iconValue.includes("fas ")) {
      iconValue = tipo === "intervento" ? "medical_services" : "coronavirus";
    }

    const colorClass = color ? `text-${color}` : "";
    const classes = [colorClass, extraClass].filter(Boolean).join(" ");

    return `<span class="material-icons ${classes}">${iconValue}</span>`;
  }

  /**
   * Aggiorna i controlli di paginazione
   * @param {Object} eventsData - Dati degli eventi con informazioni di paginazione
   */
  updatePaginationControls(eventsData) {
    if (!this.domElements.paginationControls) return;

    const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } =
      eventsData;

    // Update buttons state
    if (this.domElements.prevPageBtn) {
      this.domElements.prevPageBtn.disabled = !hasPrevPage;
    }

    if (this.domElements.nextPageBtn) {
      this.domElements.nextPageBtn.disabled = !hasNextPage;
    }

    // Update page info
    if (this.domElements.pageInfo) {
      const startItem = currentPage * 10 + 1;
      const endItem = Math.min((currentPage + 1) * 10, totalCount);
      this.domElements.pageInfo.textContent = `${startItem}-${endItem} di ${totalCount} eventi (Pagina ${
        currentPage + 1
      } di ${totalPages})`;
    }

    // Show/hide pagination if needed
    this.domElements.paginationControls.style.display =
      totalPages > 1 ? "flex" : "none";
  }

  /**
   * Aggiorna una singola riga della tabella
   * @param {Object} evento - Dati dell'evento aggiornato
   */
  updateTableRow(evento) {
    try {
      const existingRow = this.domElements.tableBody.querySelector(
        `[data-evento-id="${evento.id}"]`
      );
      if (!existingRow) {
        logger.warn(`⚠️ Riga evento ${evento.id} non trovata nella tabella`);
        return;
      }

      const newRowHtml = this.createTableRow(evento);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newRowHtml;
      const newRow = tempDiv.firstElementChild;

      existingRow.replaceWith(newRow);

      logger.log(`✅ Riga evento ${evento.id} aggiornata nella tabella`);
    } catch (error) {
      logger.error("❌ Errore aggiornamento riga tabella:", error);
    }
  }
}
