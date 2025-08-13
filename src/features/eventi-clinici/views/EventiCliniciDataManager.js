// src/features/eventi-clinici/views/EventiCliniciDataManager.js

import { 
  fetchEventiClinici,
  exportFilteredEvents,
  getFilterStats,
  getCurrentFilters,
  clearSearchCache
} from './eventi-clinici-api.js';

import {
  renderEventsResponsive,
  showLoading,
  showError,
  updateSearchResultsCount,
  showActiveFiltersIndicator,
  showFilterStats,
  showExportProgress,
  showExportSuccess
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/logger/loggerService.js';
import { notificationService } from '../../../core/services/notifications/notificationService.js';

/**
 * Gestione dei dati e operazioni per gli eventi clinici
 */
export class EventiCliniciDataManager {
  constructor(state, setupEventCardListenersCallback) {
    this.state = state;
    this.setupEventCardListenersCallback = setupEventCardListenersCallback;
  }

  /**
   * Carica i dati degli eventi
   */
  async loadEventsData() {
    if (this.state.isLoading) return;

    try {
      this.state.isLoading = true;
      showLoading();

      logger.log('📊 Caricamento eventi con filtri:', this.state.filters);

      const result = await fetchEventiClinici(this.state.filters, this.state.currentPage);
      logger.log('🔍 Risultato fetchEventiClinici:', result);

      renderEventsResponsive(result);
      logger.log('🎨 renderEventsResponsive completato');
      this.setupEventCardListeners();
      
      // Update UI indicators
      updateSearchResultsCount(result.eventi.length, result.totalCount, getCurrentFilters());
      showActiveFiltersIndicator(getCurrentFilters());

      // Update filter stats
      await this.updateFilterStats();

      logger.log('✅ Eventi caricati:', result.eventi.length);
      return result;

    } catch (error) {
      logger.error('❌ Errore caricamento eventi:', error);
      showError('Errore nel caricamento degli eventi clinici');
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Configura i listener per le card degli eventi
   */
  setupEventCardListeners() {
    // Usa la funzione passata dal costruttore
    if (this.setupEventCardListenersCallback) {
      this.setupEventCardListenersCallback();
    }
  }

  /**
   * Cambia pagina
   */
  async changePage(newPage) {
    if (newPage < 0 || this.state.isLoading) return;

    this.state.currentPage = newPage;
    await this.loadEventsData();
  }

  /**
   * Esporta gli eventi
   */
  async exportEvents(format = 'csv') {
    try {
      showExportProgress(true);

      const result = await exportFilteredEvents(format);
      
      // Mostra il feedback UI solo se l'esportazione ha avuto successo
      if (result && result.success) {
        showExportSuccess(result);
      }

    } catch (error) {
      // Le notifiche di errore e warning sono già gestite da exportFilteredEvents.
      logger.error('❌ Errore export eventi catturato nel DataManager:', error);
    } finally {
      showExportProgress(false);
    }
  }

  /**
   * Aggiorna le statistiche dei filtri
   */
  async updateFilterStats() {
    try {
      const stats = await getFilterStats();
      this.state.filterStats = stats;
      showFilterStats(stats);
    } catch (error) {
      logger.error('❌ Errore aggiornamento statistiche filtri:', error);
    }
  }

  /**
   * Pulisce la cache di ricerca
   */
  clearCache() {
    clearSearchCache();
  }

  /**
   * Callback per mostrare dettagli evento - da implementare nel controller
   */
  onShowEventDetail(eventId) {
    // Implementato nel controller principale
  }

  /**
   * Callback per modificare evento - da implementare nel controller
   */
  onEditEvent(eventId) {
    // Implementato nel controller principale
  }

  /**
   * Callback per eliminare evento - da implementare nel controller
   */
  onDeleteEvent(eventId) {
    // Implementato nel controller principale
  }
}