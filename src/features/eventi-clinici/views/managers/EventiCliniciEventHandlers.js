// src/features/eventi-clinici/views/EventiCliniciEventHandlers.js

import { toggleEventTypeFields } from '../eventi-clinici-ui.js';
import { logger } from '../../../../core/services/logger/loggerService.js';
import { hideAllSearchResults } from '../utils/index.js';
import { attach as attachPatientAutocomplete } from '../../../../shared/components/ui/PatientAutocomplete.js';

/**
 * Gestione degli event handlers per gli eventi clinici
 */
export class EventiCliniciEventHandlers {
  constructor(state, domElements, filterManager, modalManager, dataManager) {
    this.state = state;
    this.domElements = domElements;
    this.filterManager = filterManager;
    this.modalManager = modalManager;
    this.dataManager = dataManager;
    this.cleanupFunctions = [];
  }

  /**
   * Configura tutti gli event listeners
   */
  async setupEventListeners() {
    // Main action buttons
    this.setupMainActionListeners();

    // Filter listeners
    this.setupFilterListeners();

    // Pagination listeners
    this.setupPaginationListeners();

    // Modal form listeners
    this.setupModalFormListeners();

    // Search listeners
    this.setupSearchListeners();

    // Window resize listener
    await this.setupWindowListeners();

    logger.log('✅ Event listeners configurati');
  }

  /**
   * Configura i listener per i bottoni principali
   */
  setupMainActionListeners() {
    // Add new event button
    if (this.domElements.addEventBtn) {
      const handler = () => this.modalManager.openEventModal();
      this.domElements.addEventBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.addEventBtn.removeEventListener('click', handler));
    }

    // Reset filters button
    if (this.domElements.resetFiltersBtn) {
      const handler = () => this.filterManager.resetFilters();
      this.domElements.resetFiltersBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.resetFiltersBtn.removeEventListener('click', handler));
    }

    // Export buttons
    if (this.domElements.exportBtn) {
      const handler = () => this.dataManager.exportEvents('csv');
      this.domElements.exportBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.exportBtn.removeEventListener('click', handler));
    }

    if (this.domElements.exportCsvBtn) {
      const handler = () => this.dataManager.exportEvents('csv');
      this.domElements.exportCsvBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.exportCsvBtn.removeEventListener('click', handler));
    }

    if (this.domElements.exportJsonBtn) {
      const handler = () => this.dataManager.exportEvents('json');
      this.domElements.exportJsonBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.exportJsonBtn.removeEventListener('click', handler));
    }

    // Filter management buttons
    if (this.domElements.saveFiltersBtn) {
      const handler = () => this.filterManager.saveCurrentFilters();
      this.domElements.saveFiltersBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.saveFiltersBtn.removeEventListener('click', handler));
    }

    if (this.domElements.loadFiltersBtn) {
      const handler = () => this.filterManager.loadSavedFilters();
      this.domElements.loadFiltersBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.loadFiltersBtn.removeEventListener('click', handler));
    }
  }

  /**
   * Configura i listener per i filtri
   */
  setupFilterListeners() {
    // Event type filter with immediate UI update
    if (this.domElements.filterType) {
      const handler = async () => {
        await this.filterManager.handleEventTypeFilter(this.domElements.filterType.value);
      };
      this.domElements.filterType.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterType.removeEventListener('change', handler));
    }

    // Date filters with debouncing
    if (this.domElements.filterDateFrom) {
      const handler = this.filterManager.createDebouncedFilterHandler(async () => {
        await this.filterManager.handleDateRangeFilter(this.domElements);
      }, 500);
      this.domElements.filterDateFrom.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterDateFrom.removeEventListener('change', handler));
    }

    if (this.domElements.filterDateTo) {
      const handler = this.filterManager.createDebouncedFilterHandler(async () => {
        await this.filterManager.handleDateRangeFilter(this.domElements);
      }, 500);
      this.domElements.filterDateTo.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterDateTo.removeEventListener('change', handler));
    }

    // Department filter
    if (this.domElements.filterReparto) {
      const handler = async () => {
        await this.filterManager.handleCombinedFiltersChange();
      };
      this.domElements.filterReparto.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterReparto.removeEventListener('change', handler));
    }

    // Patient status filter
    if (this.domElements.filterStato) {
      const handler = async () => {
        await this.filterManager.handlePatientStatusFilter(this.domElements.filterStato.value);
      };
      this.domElements.filterStato.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterStato.removeEventListener('change', handler));
    }

    // Filtro Agente Patogeno rimosso

    if (this.domElements.filterTipoIntervento) {
      const handler = this.filterManager.createDebouncedFilterHandler(async () => {
        await this.filterManager.handleCombinedFiltersChange();
      }, 500);
      this.domElements.filterTipoIntervento.addEventListener('input', handler);
      this.cleanupFunctions.push(() => this.domElements.filterTipoIntervento.removeEventListener('input', handler));
    }

    // Sorting filters
    if (this.domElements.filterSortColumn) {
      const handler = async () => {
        await this.filterManager.handleSortingChange(this.domElements);
      };
      this.domElements.filterSortColumn.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterSortColumn.removeEventListener('change', handler));
    }

    if (this.domElements.filterSortDirection) {
      const handler = async () => {
        await this.filterManager.handleSortingChange(this.domElements);
      };
      this.domElements.filterSortDirection.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.filterSortDirection.removeEventListener('change', handler));
    }

    // Advanced filters toggle button
    this.setupAdvancedFiltersToggle();
  }

  /**
   * Configura il toggle per i filtri avanzati
   */
  setupAdvancedFiltersToggle() {
    if (this.domElements.advancedFiltersToggle && this.domElements.advancedFiltersContainer) {
      const handler = (event) => {
        // Previeni il comportamento di default di Bootstrap
        event.preventDefault();
        event.stopPropagation();
        
        const isExpanded = this.domElements.advancedFiltersContainer.classList.contains('show');
        
        // Toggle manuale del collapse
        if (isExpanded) {
          this.domElements.advancedFiltersContainer.classList.remove('show');
          this.domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'false');
        } else {
          this.domElements.advancedFiltersContainer.classList.add('show');
          this.domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'true');
        }
        
        // Aggiorna rotazione icona
        const icon = this.domElements.advancedFiltersToggle.querySelector('.material-icons');
        if (icon) {
          icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
        
        logger.log(`🔧 Filtri avanzati ${isExpanded ? 'chiusi' : 'aperti'}`);
      };
      
      // Rimuovi gli attributi Bootstrap per evitare conflitti
      this.domElements.advancedFiltersToggle.removeAttribute('data-bs-toggle');
      this.domElements.advancedFiltersToggle.removeAttribute('data-bs-target');
      
      this.domElements.advancedFiltersToggle.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.advancedFiltersToggle.removeEventListener('click', handler));
    }
  }

  /**
   * Configura i listener per la paginazione
   */
  setupPaginationListeners() {
    if (this.domElements.prevPageBtn) {
      const handler = () => this.dataManager.changePage(this.state.currentPage - 1);
      this.domElements.prevPageBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.prevPageBtn.removeEventListener('click', handler));
    }

    if (this.domElements.nextPageBtn) {
      const handler = () => this.dataManager.changePage(this.state.currentPage + 1);
      this.domElements.nextPageBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.nextPageBtn.removeEventListener('click', handler));
    }
  }

  /**
   * Configura i listener per il modal del form
   */
  setupModalFormListeners() {
    // Save button
    if (this.domElements.saveBtn) {
      const handler = () => this.modalManager.handleSaveEvent(() => this.dataManager.loadEventsData());
      this.domElements.saveBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.saveBtn.removeEventListener('click', handler));
    }

    // Event type change
    if (this.domElements.eventType) {
      const handler = (e) => toggleEventTypeFields(e.target.value);
      this.domElements.eventType.addEventListener('change', handler);
      this.cleanupFunctions.push(() => this.domElements.eventType.removeEventListener('change', handler));
    }

    // Detail modal buttons
    if (this.domElements.editBtn) {
      const handler = () => this.modalManager.handleEditEvent();
      this.domElements.editBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.editBtn.removeEventListener('click', handler));
    }

    if (this.domElements.deleteBtn) {
      const handler = () => this.modalManager.handleDeleteEvent();
      this.domElements.deleteBtn.addEventListener('click', handler);
      this.cleanupFunctions.push(() => this.domElements.deleteBtn.removeEventListener('click', handler));
    }
  }

  /**
   * Configura i listener per la ricerca
   */
  setupSearchListeners() {
    // Main patient search using shared PatientAutocomplete
    if (this.domElements.searchPatientInput && this.domElements.patientSearchResults) {
      const { destroy } = attachPatientAutocomplete({
        input: this.domElements.searchPatientInput,
        resultsContainer: this.domElements.patientSearchResults,
        activeOnly: true,
        onSelect: (patient) => this.filterManager.handlePatientSearchFilter(this.domElements.searchPatientInput.value, patient?.id),
      });
      this.cleanupFunctions.push(() => destroy && destroy());
    }

    // Modal patient search using shared PatientAutocomplete
    if (this.domElements.eventPatientInput && this.domElements.eventPatientSearchResults) {
      const { destroy } = attachPatientAutocomplete({
        input: this.domElements.eventPatientInput,
        resultsContainer: this.domElements.eventPatientSearchResults,
        activeOnly: true,
        onSelect: (patient) => {
          if (this.domElements.eventPatientId) {
            this.domElements.eventPatientId.value = patient.id;
          }
        },
      });
      this.cleanupFunctions.push(() => destroy && destroy());
    }

    // Hide search results when clicking outside
    const clickHandler = (e) => {
      if (!e.target.closest('.position-relative')) {
        hideAllSearchResults();
      }
    };
    document.addEventListener('click', clickHandler);
    this.cleanupFunctions.push(() => document.removeEventListener('click', clickHandler));
  }

  /**
   * Configura i listener per la finestra
   */
  async setupWindowListeners() {
    const { applyResponsiveDesign } = await import('../eventi-clinici-ui.js');
    const resizeHandler = () => applyResponsiveDesign();
    window.addEventListener('resize', resizeHandler);
    this.cleanupFunctions.push(() => window.removeEventListener('resize', resizeHandler));
  }

  /**
   * Inizializza lo stato dei filtri avanzati
   */
  initializeAdvancedFiltersState() {
    if (this.domElements.advancedFiltersToggle && this.domElements.advancedFiltersContainer) {
      // Assicurati che i filtri siano nascosti inizialmente
      this.domElements.advancedFiltersContainer.classList.remove('show');
      this.domElements.advancedFiltersToggle.setAttribute('aria-expanded', 'false');
      
      // Imposta l'icona nello stato iniziale
      const icon = this.domElements.advancedFiltersToggle.querySelector('.material-icons');
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
        icon.style.transition = 'transform 0.3s ease';
      }
      
      logger.log('✅ Stato iniziale filtri avanzati impostato (nascosti)');
    }
  }

  /**
   * Pulisce tutti gli event listeners
   */
  cleanup() {
    logger.log('🧹 Cleanup event listeners');

    // Execute all cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        logger.error('❌ Errore durante cleanup listener:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}