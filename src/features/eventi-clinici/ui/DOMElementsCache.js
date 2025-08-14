/**
 * Cache semplificata per gli elementi DOM della feature eventi-clinici
 * Versione minimalista che si concentra solo sugli elementi essenziali
 */

import { logger } from "../../../core/services/logger/loggerService.js";

/**
 * Classe semplificata per la gestione degli elementi DOM
 */
export class DOMElementsCache {
  static _instance = null;

  constructor() {
    if (DOMElementsCache._instance) {
      throw new Error("Use DOMElementsCache.getInstance() instead");
    }
    this.elements = {};
    this._initialized = false;
  }

  /**
   * Restituisce l'istanza singleton
   */
  static getInstance() {
    if (!DOMElementsCache._instance) {
      DOMElementsCache._instance = new DOMElementsCache();
    }
    return DOMElementsCache._instance;
  }

  /**
   * Getter per verificare lo stato di inizializzazione
   */
  get isInitialized() {
    return this._initialized;
  }

  /**
   * Inizializza solo gli elementi DOM essenziali
   */
  initialize() {
    if (this._initialized) {
      logger.log("⚠️ DOMElementsCache già inizializzato, verifico validità elementi...");
      
      // Verifica se gli elementi sono ancora validi
      const tableContainer = document.getElementById("eventi-table-container");
      const currentTableContainer = this.elements.tableContainer;
      
      if (tableContainer && currentTableContainer && tableContainer !== currentTableContainer) {
        logger.log("🔄 Elementi DOM cambiati, reinizializzo cache...");
        this._initialized = false;
        this.elements = {};
        // Continua con l'inizializzazione
      } else {
        return this;
      }
    }

    // Verifica che gli elementi critici esistano
    const criticalIds = ["eventi-table-container", "eventi-timeline-container"];
    const missing = criticalIds.filter((id) => !document.getElementById(id));

    if (missing.length > 0) {
      logger.warn("⚠️ Elementi DOM critici mancanti:", missing);
      throw new Error(`Elementi DOM critici mancanti: ${missing.join(", ")}`);
    }

    // DEBUG: Verifica elementi critici prima dell'inizializzazione
    const tableContainer = document.getElementById("eventi-table-container");
    const timelineContainer = document.getElementById(
      "eventi-timeline-container"
    );
    const tableBody = document.getElementById("eventi-table-body");

    console.log("🔍 [DEBUG CACHE] Elementi critici:", {
      tableContainer: !!tableContainer,
      timelineContainer: !!timelineContainer,
      tableBody: !!tableBody,
    });

    // Inizializza solo gli elementi essenziali
    this.elements = {
      // Containers principali
      tableContainer,
      timelineContainer,
      tableBody,

      // Filtri essenziali
      searchPatientInput: document.getElementById("eventi-search-patient"),
      patientSearchResults: document.getElementById("patient-search-results"),
      filterType: document.getElementById("eventi-filter-type"),
      filterDateFrom: document.getElementById("eventi-filter-date-from"),
      filterDateTo: document.getElementById("eventi-filter-date-to"),
      filterReparto: document.getElementById("eventi-filter-reparto"),
      filterTipoIntervento: document.getElementById(
        "eventi-filter-tipo-intervento"
      ),
      filterSortColumn: document.getElementById("eventi-sort-column"),
      filterSortDirection: document.getElementById("eventi-sort-direction"),

      // Bottoni essenziali
      addEventBtn: document.getElementById("eventi-add-btn"),
      resetFiltersBtn: document.getElementById("eventi-reset-filters-btn"),
      exportCsvBtn: document.getElementById("eventi-export-csv-btn"),
      exportJsonBtn: document.getElementById("eventi-export-json-btn"),

      // Paginazione
      paginationControls: document.getElementById("eventi-pagination-controls"),
      prevPageBtn: document.getElementById("eventi-prev-page-btn"),
      nextPageBtn: document.getElementById("eventi-next-page-btn"),
      pageInfo: document.getElementById("eventi-page-info"),

      // Modal essenziali
      eventFormModal: document.getElementById("evento-form-modal"),
      eventDetailModal: document.getElementById("evento-detail-modal"),

      // Form elementi essenziali
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

      // Campi specifici per tipo
      interventionFields: document.getElementById("intervento-fields"),
      interventionType: document.getElementById("evento-tipo-intervento"),
      infectionFields: document.getElementById("infezione-fields"),
      infectionAgent: document.getElementById("evento-agente-patogeno"),

      // Modal elementi
      modalTitle: document.getElementById("evento-modal-title"),
      modalIcon: document.getElementById("evento-modal-icon"),
      saveBtn: document.getElementById("evento-save-btn"),
      detailContent: document.getElementById("evento-detail-content"),
      messageContainer: document.getElementById("evento-messaggio-container"),
    };

    // Rimuovi elementi null
    Object.keys(this.elements).forEach((key) => {
      if (this.elements[key] === null) {
        delete this.elements[key];
      }
    });

    this._initialized = true;
    logger.log(
      "✅ DOMElementsCache inizializzato con",
      Object.keys(this.elements).length,
      "elementi"
    );

    return this;
  }

  /**
   * Ottiene un elemento specifico dalla cache
   */
  get(elementName) {
    if (!this._initialized) {
      logger.warn("⚠️ DOMElementsCache non inizializzato");
      return null;
    }

    return this.elements[elementName] || null;
  }

  /**
   * Verifica se un elemento esiste nella cache
   */
  has(elementName) {
    if (!this._initialized) {
      return false;
    }

    return elementName in this.elements && this.elements[elementName] !== null;
  }

  /**
   * Ottiene tutti gli elementi della cache
   */
  getAll() {
    if (!this._initialized) {
      logger.warn("⚠️ DOMElementsCache non inizializzato");
      return {};
    }

    return { ...this.elements };
  }

  /**
   * Pulisce la cache
   */
  clear() {
    this.elements = {};
    this._initialized = false;
    logger.log("🧹 DOMElementsCache pulito");
  }

  /**
   * Reinizializza la cache
   */
  reinitialize() {
    this.clear();
    return this.initialize();
  }
}

/**
 * Funzione di compatibilità per inizializzare gli elementi DOM
 */
export function initializeDOMElements() {
  const cache = DOMElementsCache.getInstance();
  cache.initialize();
  return cache;
}

/**
 * Funzione helper per ottenere gli elementi DOM
 */
export function getDOMElements() {
  const cache = DOMElementsCache.getInstance();
  if (!cache.isInitialized) {
    cache.initialize();
  }
  return cache.getAll();
}
