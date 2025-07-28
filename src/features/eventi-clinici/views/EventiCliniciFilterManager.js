// src/features/eventi-clinici/views/EventiCliniciFilterManager.js

import {
  applyEventTypeFilter,
  applyDateRangeFilter,
  applyPatientSearch,
  applyCombinedFilters,
  applySorting,
  getCurrentFilters,
  resetFiltersAndState,
  saveFiltersToState,
  loadFiltersFromState,
  searchPatientsRealTime
} from './eventi-clinici-api.js';

import {
  renderEventsTimeline,
  renderPatientSearchResults,
  resetFiltersUI,
  applyFiltersToUI,
  showActiveFiltersIndicator,
  updateSearchResultsCount,
  showSearchingState,
  hideSearchingState,
  getFiltersFromUI
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { hideAllSearchResults, hideSearchResults, debounce } from './EventiCliniciUtils.js';

/**
 * Gestione dei filtri per gli eventi clinici
 */
export class EventiCliniciFilterManager {
  constructor(state, setupEventCardListenersCallback, updateFilterStatsCallback) {
    this.state = state;
    this.setupEventCardListenersCallback = setupEventCardListenersCallback;
    this.updateFilterStatsCallback = updateFilterStatsCallback;
  }

  /**
   * Gestisce il filtro di ricerca pazienti con debouncing
   */
  async handlePatientSearchFilter(searchTerm) {
    try {
      showSearchingState();
      
      const result = await applyPatientSearch(searchTerm);
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();
      
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
  async handleDateRangeFilter(domElements) {
    try {
      showSearchingState();
      
      const dataDa = domElements.filterDateFrom?.value || '';
      const dataA = domElements.filterDateTo?.value || '';
      
      const result = await applyDateRangeFilter(dataDa, dataA);
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();
      
      // Update UI indicators
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      showActiveFiltersIndicator(getCurrentFilters());
      
    } catch (error) {
      logger.error('❌ Errore filtro range date:', error);
      if (error.message.includes('data di inizio')) {
        // Temporarily commented out to prevent notification flood
        // notificationService.error(error.message);
      }
    } finally {
      hideSearchingState();
    }
  }

  /**
   * Gestisce i cambiamenti nei filtri di tipo evento
   */
  async handleEventTypeFilter(eventType) {
    try {
      showSearchingState();
      
      const result = await applyEventTypeFilter(eventType);
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      showActiveFiltersIndicator(getCurrentFilters());
      
    } catch (error) {
      logger.error('❌ Errore applicazione filtro tipo evento:', error);
    } finally {
      hideSearchingState();
    }
  }

  /**
   * Gestisce i cambiamenti nei filtri combinati
   */
  async handleCombinedFiltersChange() {
    try {
      showSearchingState();

      // Get current filters from UI
      const uiFilters = getFiltersFromUI();
      
      // Apply combined filters
      const result = await applyCombinedFilters(uiFilters);
      
      // Update local state
      this.state.filters = { ...this.state.filters, ...uiFilters };
      this.state.currentPage = 0;

      // Render results
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();

      // Update UI indicators
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      showActiveFiltersIndicator(getCurrentFilters());
      await this.updateFilterStatsCallback();

      // Auto-save filters
      saveFiltersToState();

    } catch (error) {
      logger.error('❌ Errore applicazione filtri combinati:', error);
      // La notifica di errore è già gestita a livello API/Service.
      // Logghiamo qui per debug.
    } finally {
      hideSearchingState();
    }
  }

  /**
   * Gestisce i cambiamenti nell'ordinamento
   */
  async handleSortingChange(domElements) {
    try {
      showSearchingState();

      const sortColumn = domElements.filterSortColumn?.value || 'data_evento';
      const sortDirection = domElements.filterSortDirection?.value || 'desc';

      const result = await applySorting(sortColumn, sortDirection);

      // Update local state
      this.state.filters.sortColumn = sortColumn;
      this.state.filters.sortDirection = sortDirection;

      // Render results
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();

      // Update UI indicators
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      await this.updateFilterStatsCallback();

      // Auto-save filters
      saveFiltersToState();

    } catch (error) {
      logger.error('❌ Errore applicazione ordinamento:', error);
      // La notifica di errore è già gestita a livello API/Service.
      // Logghiamo qui per debug.
    } finally {
      hideSearchingState();
    }
  }

  /**
   * Gestisce la ricerca pazienti in tempo reale
   */
  async handlePatientSearch(searchTerm, resultContainerId) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        hideSearchResults(resultContainerId);
        return;
      }

      const patients = await searchPatientsRealTime(searchTerm);
      renderPatientSearchResults(patients, resultContainerId);

    } catch (error) {
      logger.error('❌ Errore ricerca pazienti:', error);
    }
  }

  /**
   * Resetta tutti i filtri
   */
  async resetFilters() {
    try {
      showSearchingState();

      // Reset using API function that also clears persistent state
      const result = await resetFiltersAndState();

      // Reset UI
      resetFiltersUI();

      // Reset local state
      this.state.filters = {
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
      this.state.currentPage = 0;
      this.state.selectedPatientId = null;

      // Hide search results
      hideAllSearchResults();

      // Render results
      renderEventsTimeline(result);
      this.setupEventCardListenersCallback();

      // Update UI indicators
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      showActiveFiltersIndicator(getCurrentFilters());
      await this.updateFilterStatsCallback();

    } catch (error) {
      logger.error('❌ Errore reset filtri:', error);
      // La notifica di errore è già gestita dalla funzione resetFiltersAndState.
    } finally {
      hideSearchingState();
    }
  }

  /**
   * Salva i filtri correnti nello stato persistente
   */
  async saveCurrentFilters() {
    try {
      await saveFiltersToState();
    } catch (error) {
      logger.error('❌ Errore salvataggio filtri:', error);
      // La notifica di errore è già gestita dalla funzione saveFiltersToState.
    }
  }

  /**
   * Carica i filtri salvati dallo stato persistente
   */
  async loadSavedFilters() {
    try {
      const savedFilters = await loadFiltersFromState();
      
      if (savedFilters) {
        // Update local state
        this.state.filters = { ...this.state.filters, ...savedFilters };
        
        // Apply to UI
        applyFiltersToUI(savedFilters);
        
        logger.log('✅ Filtri caricati dallo stato:', savedFilters);
      }
      return savedFilters;
    } catch (error) {
      logger.error('❌ Errore caricamento filtri salvati:', error);
      return null;
    }
  }

  /**
   * Crea handler per ricerca pazienti con debouncing
   */
  createPatientSearchHandler(searchTerm, onFilter) {
    return debounce(async (e) => {
      const searchValue = e.target.value;
      
      // Show patient search results
      if (searchValue && searchValue.length >= 2) {
        await this.handlePatientSearch(searchValue, 'patient-search-results');
      } else {
        hideSearchResults('patient-search-results');
      }
      
      // Apply patient filter to events
      if (onFilter) {
        await onFilter(searchValue);
      }
    }, 300);
  }

  /**
   * Crea handler per filtri con debouncing
   */
  createDebouncedFilterHandler(filterFunction, delay = 500) {
    return debounce(filterFunction, delay);
  }
}