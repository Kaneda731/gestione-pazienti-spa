// src/js/views/list-state.js

export const state = {
    currentPage: 0,
    sortColumn: 'cognome',
    sortDirection: 'asc',
};

export const domElements = {};

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

export function resetFilters() {
    // Resetta i valori degli elementi del DOM
    domElements.searchInput.value = '';
    domElements.repartoFilter.value = '';
    domElements.diagnosiFilter.value = '';
    domElements.statoFilter.value = '';
    
    // Resetta lo stato della paginazione e dell'ordinamento
    state.currentPage = 0;
    state.sortColumn = 'cognome';
    state.sortDirection = 'asc';

    // Resetta esplicitamente i CustomSelect per aggiornare la UI
    if (domElements.repartoFilter.customSelectInstance) {
        domElements.repartoFilter.customSelectInstance.setValue('');
    }
    if (domElements.diagnosiFilter.customSelectInstance) {
        domElements.diagnosiFilter.customSelectInstance.setValue('');
    }
    if (domElements.statoFilter.customSelectInstance) {
        domElements.statoFilter.customSelectInstance.setValue('');
    }

    // Pulisce i filtri salvati e l'URL
    persistFilters();
}

export function loadPersistedFilters(urlParams) {
    let filters = {};
    const urlHasParams = urlParams.toString() !== '';
    
    if (urlHasParams) {
        filters = {
            search: urlParams.get('search') || '',
            reparto: urlParams.get('reparto') || '',
            diagnosi: urlParams.get('diagnosi') || '',
            stato: urlParams.get('stato') || '',
            page: parseInt(urlParams.get('page') || '0', 10),
            sort: urlParams.get('sort') || 'cognome',
            dir: urlParams.get('dir') || 'asc',
        };
        // Salva i filtri dall'URL a sessionStorage per coerenza
        sessionStorage.setItem('listFilters', JSON.stringify(filters));
    } else {
        // Se non ci sono parametri URL, resetta tutto
        sessionStorage.removeItem('listFilters');
        filters = {
            search: '',
            reparto: '',
            diagnosi: '',
            stato: '',
            page: 0,
            sort: 'cognome',
            dir: 'asc',
        };
    }

    domElements.searchInput.value = filters.search || '';
    domElements.repartoFilter.value = filters.reparto || '';
    domElements.diagnosiFilter.value = filters.diagnosi || '';
    domElements.statoFilter.value = filters.stato || '';
    
    state.currentPage = filters.page || 0;
    state.sortColumn = filters.sort || 'cognome';
    state.sortDirection = filters.dir || 'asc';
}

export function persistFilters() {
    const filterState = {
        search: domElements.searchInput.value.trim(),
        reparto: domElements.repartoFilter.value,
        diagnosi: domElements.diagnosiFilter.value,
        stato: domElements.statoFilter.value,
        page: state.currentPage,
        sort: state.sortColumn,
        dir: state.sortDirection,
    };

    sessionStorage.setItem('listFilters', JSON.stringify(filterState));

    const params = new URLSearchParams();
    if (filterState.search) params.set('search', filterState.search);
    if (filterState.reparto) params.set('reparto', filterState.reparto);
    if (filterState.diagnosi) params.set('diagnosi', filterState.diagnosi);
    if (filterState.stato) params.set('stato', filterState.stato);
    if (filterState.page > 0) params.set('page', filterState.page);
    if (filterState.sort !== 'cognome') params.set('sort', filterState.sort);
    if (filterState.dir !== 'asc') params.set('dir', filterState.dir);

    const queryString = params.toString();
    const newUrl = queryString ? `#list?${queryString}` : '#list';
    history.replaceState(null, '', newUrl);
}