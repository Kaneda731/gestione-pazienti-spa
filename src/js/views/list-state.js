// src/js/views/list-state.js

export const state = {
    currentPage: 0,
    sortColumn: 'cognome',
    sortDirection: 'asc',
    filters: {
        search: '',
        reparto: '',
        diagnosi: '',
        stato: '',
    },
};

export const domElements = {};

// Funzione helper per aggiornare il DOM dallo stato
function updateDOMFromState() {
    if (domElements.searchInput) domElements.searchInput.value = state.filters.search;
    if (domElements.repartoFilter) domElements.repartoFilter.value = state.filters.reparto;
    if (domElements.diagnosiFilter) domElements.diagnosiFilter.value = state.filters.diagnosi;
    if (domElements.statoFilter) domElements.statoFilter.value = state.filters.stato;

    // Aggiorna i custom select se esistono
    if (domElements.repartoFilter?.customSelectInstance) {
        domElements.repartoFilter.customSelectInstance.setValue(state.filters.reparto);
    }
    if (domElements.diagnosiFilter?.customSelectInstance) {
        domElements.diagnosiFilter.customSelectInstance.setValue(state.filters.diagnosi);
    }
    if (domElements.statoFilter?.customSelectInstance) {
        domElements.statoFilter.customSelectInstance.setValue(state.filters.stato);
    }
}

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
    // Resetta lo stato logico
    state.currentPage = 0;
    state.sortColumn = 'cognome';
    state.sortDirection = 'asc';
    state.filters = {
        search: '',
        reparto: '',
        diagnosi: '',
        stato: '',
    };
    
    // Aggiorna il DOM per riflettere lo stato resettato
    updateDOMFromState();
    
    // Pulisce i filtri salvati e l'URL
    persistFilters();
}

export function loadPersistedFilters(urlParams) {
    const urlHasParams = urlParams.toString() !== '';
    let loadedState = {};

    if (urlHasParams) {
        loadedState = {
            filters: {
                search: urlParams.get('search') || '',
                reparto: urlParams.get('reparto') || '',
                diagnosi: urlParams.get('diagnosi') || '',
                stato: urlParams.get('stato') || '',
            },
            currentPage: parseInt(urlParams.get('page') || '0', 10),
            sortColumn: urlParams.get('sort') || 'cognome',
            sortDirection: urlParams.get('dir') || 'asc',
        };
        sessionStorage.setItem('listFilters', JSON.stringify(loadedState));
    } else {
        const fromSession = sessionStorage.getItem('listFilters');
        if (fromSession) {
            loadedState = JSON.parse(fromSession);
        }
    }

    // Applica lo stato caricato allo stato globale
    Object.assign(state, loadedState);

    // Aggiorna il DOM per riflettere lo stato caricato
    updateDOMFromState();
}

export function persistFilters() {
    const stateToPersist = {
        currentPage: state.currentPage,
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        filters: state.filters,
    };

    sessionStorage.setItem('listFilters', JSON.stringify(stateToPersist));

    const params = new URLSearchParams();
    if (state.filters.search) params.set('search', state.filters.search);
    if (state.filters.reparto) params.set('reparto', state.filters.reparto);
    if (state.filters.diagnosi) params.set('diagnosi', state.filters.diagnosi);
    if (state.filters.stato) params.set('stato', state.filters.stato);
    if (state.currentPage > 0) params.set('page', state.currentPage);
    if (state.sortColumn !== 'cognome') params.set('sort', state.sortColumn);
    if (state.sortDirection !== 'asc') params.set('dir', state.sortDirection);

    const queryString = params.toString();
    const newUrl = queryString ? `#list?${queryString}` : '#list';
    
    // Evita di manipolare la history in ambiente di test
    if (typeof window.history.replaceState === 'function') {
        history.replaceState(null, '', newUrl);
    }
}
