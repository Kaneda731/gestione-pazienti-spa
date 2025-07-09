// src/js/views/list-state-migrated.js

/**
 * Versione migrata di list-state.js che usa stateService
 * Sostituisce la gestione frammentata dello stato con un approccio centralizzato
 */

import { stateService } from '../services/stateService.js';

// Cache degli elementi DOM
export const domElements = {};

/**
 * Inizializza lo stato della lista pazienti con stateService
 */
export function initListState() {
    // Assicurati che lo stato dei filtri sia inizializzato
    const currentFilters = stateService.getFilters();
    if (!currentFilters || Object.keys(currentFilters).length === 0) {
        stateService.resetFilters();
    }
}

/**
 * Caching degli elementi DOM della vista lista
 */
export function cacheDOMElements(viewContainer) {
    domElements.repartoFilter = document.getElementById('list-filter-reparto');
    domElements.diagnosiFilter = document.getElementById('list-filter-diagnosi');
    domElements.statoFilter = document.getElementById('list-filter-stato');
    domElements.searchInput = document.getElementById('list-search');
    domElements.resetButton = document.getElementById('reset-filters-btn');
    domElements.filterContainer = viewContainer.querySelector('.filters-container');
    domElements.tableBody = document.getElementById('pazienti-table-body');
    domElements.tableHeaders = viewContainer.querySelectorAll('th[data-sort]');
    domElements.prevButton = document.getElementById('prev-page-btn');
    domElements.nextButton = document.getElementById('next-page-btn');
    domElements.pageInfo = document.getElementById('page-info');
    domElements.backButton = viewContainer.querySelector('button[data-view="home"]');
    domElements.exportButton = document.getElementById('export-csv-btn');
}

/**
 * Carica lo stato persistente dei filtri
 * Ora usa stateService invece di sessionStorage direttamente
 */
export function loadPersistedFilters() {
    const filters = stateService.getFilters();
    
    // Applica i filtri agli elementi DOM
    if (domElements.repartoFilter && filters.reparto) {
        domElements.repartoFilter.value = filters.reparto;
    }
    if (domElements.diagnosiFilter && filters.diagnosi) {
        domElements.diagnosiFilter.value = filters.diagnosi;
    }
    if (domElements.statoFilter && filters.stato) {
        domElements.statoFilter.value = filters.stato;
    }
    if (domElements.searchInput && filters.search) {
        domElements.searchInput.value = filters.search;
    }
}

/**
 * Persiste i filtri correnti
 */
export function persistFilters() {
    const currentFilters = {
        reparto: domElements.repartoFilter?.value || '',
        diagnosi: domElements.diagnosiFilter?.value || '',
        stato: domElements.statoFilter?.value || '',
        search: domElements.searchInput?.value || '',
        page: stateService.getFilters().page || 0,
        sortColumn: stateService.getFilters().sortColumn || 'data_ricovero',
        sortDirection: stateService.getFilters().sortDirection || 'desc'
    };

    stateService.updateFilters(currentFilters);
}

/**
 * Resetta tutti i filtri
 */
export function resetFilters() {
    // Resetta nello stateService
    stateService.resetFilters();
    
    // Resetta anche nel DOM
    if (domElements.repartoFilter) domElements.repartoFilter.value = '';
    if (domElements.diagnosiFilter) domElements.diagnosiFilter.value = '';
    if (domElements.statoFilter) domElements.statoFilter.value = '';
    if (domElements.searchInput) domElements.searchInput.value = '';
    
    // Resetta custom select se presenti
    [domElements.repartoFilter, domElements.diagnosiFilter, domElements.statoFilter].forEach(element => {
        if (element?.customSelectInstance) {
            element.customSelectInstance.setValue('');
        }
    });
}

/**
 * Ottiene lo stato corrente dei filtri
 */
export function getCurrentFilters() {
    return stateService.getFilters();
}

/**
 * Aggiorna un singolo filtro
 */
export function updateFilter(key, value) {
    const currentFilters = stateService.getFilters();
    stateService.updateFilters({
        ...currentFilters,
        [key]: value
    });
}

/**
 * Gestione della paginazione
 */
export function setCurrentPage(page) {
    updateFilter('page', page);
}

export function getCurrentPage() {
    return stateService.getFilters().page || 0;
}

export function incrementPage() {
    const currentPage = getCurrentPage();
    setCurrentPage(currentPage + 1);
}

export function decrementPage() {
    const currentPage = getCurrentPage();
    if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
    }
}

/**
 * Gestione del sorting
 */
export function setSorting(column, direction) {
    stateService.updateFilters({
        ...stateService.getFilters(),
        sortColumn: column,
        sortDirection: direction
    });
}

export function getCurrentSorting() {
    const filters = stateService.getFilters();
    return {
        column: filters.sortColumn || 'data_ricovero',
        direction: filters.sortDirection || 'desc'
    };
}

/**
 * Sottoscrizione ai cambiamenti dei filtri
 * Permette alle viste di reagire automaticamente ai cambiamenti di stato
 */
export function subscribeToFilters(callback) {
    return stateService.subscribe('listFilters', (newState, oldState) => {
        callback(newState.listFilters, oldState.listFilters);
    });
}

/**
 * Utility per debug dello stato
 */
export function getStateDebugInfo() {
    return {
        filters: stateService.getFilters(),
        domElements: Object.keys(domElements),
        stateService: stateService.getState()
    };
}

// Esporta stato legacy per compatibilità con codice esistente
// TODO: Rimuovere quando tutta la migrazione è completa
export const state = {
    get currentPage() { return getCurrentPage(); },
    set currentPage(value) { setCurrentPage(value); },
    
    get sortColumn() { return getCurrentSorting().column; },
    set sortColumn(value) { setSorting(value, getCurrentSorting().direction); },
    
    get sortDirection() { return getCurrentSorting().direction; },
    set sortDirection(value) { setSorting(getCurrentSorting().column, value); }
};
