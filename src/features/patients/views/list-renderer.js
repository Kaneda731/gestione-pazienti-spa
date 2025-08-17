// src/features/patients/views/list-renderer.js
import { domElements, state } from "./list-state-migrated.js";
import { PatientCard } from "../../../shared/components/ui/PatientCard.js";
import { sanitizeHtml } from "../../../shared/utils/sanitizeHtml.js";
import DOMPurify from "dompurify";

const ITEMS_PER_PAGE = 10;

/**
 * Genera un badge di stato migliorato che include informazioni di trasferimento
 */
function getEnhancedStatusBadge(patient) {
  if (!patient.data_dimissione) {
    return `<span class="badge bg-success">Attivo</span>`;
  }

  // Paziente dimesso/trasferito
  let badgeClass = "bg-secondary";
  let badgeText = "Dimesso";
  let badgeIcon = "";

  if (patient.tipo_dimissione) {
    switch (patient.tipo_dimissione) {
      case "trasferimento_interno":
        badgeClass = "bg-info";
        badgeText = "Trasf. Interno";
        badgeIcon =
          '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">swap_horiz</span>';
        break;
      case "trasferimento_esterno":
        badgeClass = "bg-warning text-dark";
        badgeText = "Trasf. Esterno";
        badgeIcon =
          '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">exit_to_app</span>';
        break;
      case "dimissione":
        badgeClass = "bg-secondary";
        badgeText = "Dimesso";
        badgeIcon =
          '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">home</span>';
        break;
    }
  }

  // Aggiungi codice dimissione se presente
  let dischargeCode = "";
  if (patient.codice_dimissione) {
    const codeText =
      patient.codice_dimissione === "6"
        ? "Dimissione ordinaria"
        : patient.codice_dimissione === "3"
        ? "Trasferimento"
        : patient.codice_dimissione;
    dischargeCode = ` <small>(${codeText})</small>`;
  }

  return `<span class="badge ${badgeClass}">${badgeIcon}${badgeText}${dischargeCode}</span>`;
}

/**
 * Genera informazioni di trasferimento per la colonna dedicata
 */
function getTransferInfo(patient) {
  if (!patient.data_dimissione || !patient.tipo_dimissione) {
    return "-";
  }

  switch (patient.tipo_dimissione) {
    case "trasferimento_interno":
      return patient.reparto_destinazione
        ? `<small class="text-info"><strong>→ ${patient.reparto_destinazione}</strong></small>`
        : '<small class="text-muted">Interno</small>';

    case "trasferimento_esterno":
      let externalInfo = '<small class="text-warning"><strong>Esterno</strong>';
      if (patient.clinica_destinazione) {
        externalInfo += `<br>→ ${patient.clinica_destinazione}`;
      }
      if (patient.codice_clinica) {
        const clinicName =
          patient.codice_clinica === "56"
            ? "Riab. Motoria"
            : patient.codice_clinica === "60"
            ? "Lunga Degenza"
            : `Cod. ${patient.codice_clinica}`;
        externalInfo += `<br>(${clinicName})`;
      }
      externalInfo += "</small>";
      return externalInfo;

    case "dimissione":
    default:
      return '<small class="text-muted">-</small>';
  }
}

export function updateSortIndicators() {
  if (!domElements.tableHeaders || domElements.tableHeaders.length === 0)
    return;

  domElements.tableHeaders.forEach((header) => {
    if (!header) return;
    const indicator = header.querySelector(".sort-indicator");
    if (!indicator) return;

    if (header.dataset.sort === state.sortColumn) {
      indicator.textContent = state.sortDirection === "asc" ? " ▲" : " ▼";
    } else {
      indicator.textContent = "";
    }
  });
}

export function renderPazienti(data, count) {
  renderTable(data);
  renderCards(data);
  updatePaginationControls(count);
  updateSortIndicators();
  ensureCorrectView();
}

export function showLoading() {
  if (domElements.tableBody) {
    domElements.tableBody.innerHTML = sanitizeHtml(
      '<tr><td colspan="10" class="text-center"><div class="spinner-border"></div></td></tr>'
    );
  }
  const cardsContainer = document.getElementById("pazienti-cards-container");
  if (cardsContainer) {
    cardsContainer.innerHTML = sanitizeHtml(
      '<div class="text-center p-4"><div class="spinner-border"></div></div>'
    );
  }
}

export function showError(error) {
  console.error("Errore dettagliato durante il fetch dei pazienti:", error);
  if (domElements.tableBody) {
    domElements.tableBody.innerHTML = sanitizeHtml(
      `<tr><td colspan="10" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`
    );
  }
  const cardsContainer = document.getElementById("pazienti-cards-container");
  if (cardsContainer) {
    cardsContainer.innerHTML = sanitizeHtml(
      '<div class="text-center text-danger p-4"><strong>Errore nel caricamento dei dati.</strong></div>'
    );
  }
}

export function ensureCorrectView() {
  const tableContainer = document.querySelector(".table-responsive");
  const cardsContainer = document.getElementById("pazienti-cards-container");

  if (tableContainer && cardsContainer) {
    // Use Bootstrap 'xl' breakpoint (1200px) for the switch
    // Desktop (>= 1200px): show table
    // Tablet/Mobile (< 1200px): show cards
    if (window.innerWidth >= 1200) {
      tableContainer.style.display = "block";
      cardsContainer.style.display = "none";
    } else {
      tableContainer.style.display = "none";
      cardsContainer.style.display = "block";
    }
  }
}

function renderTable(pazientiToRender) {
  const tableBody = document.getElementById("pazienti-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  if (pazientiToRender.length === 0) {
    const row = tableBody.insertRow();
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "text-center text-muted";
    td.textContent = "Nessun paziente trovato.";
    row.appendChild(td);
    return;
  }

  const rowsHtml = pazientiToRender
    .map((p) => {
      const patientCard = new PatientCard(p, {
        showActions: true,
        showPostOperativeDays: true,
      });
      return patientCard.renderTableRow();
    })
    .join("");

  // Set innerHTML directly since the HTML is generated internally and safe
  tableBody.innerHTML = rowsHtml;
}

function renderCards(pazientiToRender) {
  const cardsContainer = document.getElementById("pazienti-cards-container");
  if (!cardsContainer) return;

  if (pazientiToRender.length === 0) {
    cardsContainer.innerHTML = "";
    const div = document.createElement("div");
    div.className = "text-center text-muted p-4";
    div.textContent = "Nessun paziente trovato.";
    cardsContainer.appendChild(div);
    return;
  }

  const cardsHtml = pazientiToRender
    .map((p) => {
      // Use mobile card style only for actual mobile devices (≤ 767px)
      // This matches the CSS breakpoint in mobile-buttons.scss
      const isMobile = window.innerWidth <= 767;
      const patientCard = new PatientCard(p, {
        showActions: true,
        showPostOperativeDays: true,
        showClinicalEvents: true,
        isMobile: isMobile,
      });
      return patientCard.render();
    })
    .join("");

  cardsContainer.innerHTML = sanitizeHtml(cardsHtml);
}

function updatePaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (domElements.pageInfo) {
    domElements.pageInfo.textContent = `Pagina ${state.currentPage + 1} di ${
      totalPages || 1
    }`;
  }
  if (domElements.prevButton) {
    domElements.prevButton.disabled = state.currentPage === 0;
  }
  if (domElements.nextButton) {
    domElements.nextButton.disabled = state.currentPage >= totalPages - 1;
  }
}
