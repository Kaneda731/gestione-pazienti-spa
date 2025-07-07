// src/js/views/list.js
import { navigateTo } from '../router.js';
import { populateFilter } from '../utils.js';
import { state, domElements, cacheDOMElements, loadPersistedFilters, persistFilters, resetFilters } from './list-state.js';
import { fetchPazienti, exportPazientiToCSV, updatePazienteStatus, deletePaziente } from './list-api.js';
import { renderPazienti, showLoading, showError, updateSortIndicators } from './list-renderer.js';

async function fetchAndRender() {
    showLoading();
    try {
        const { data, count } = await fetchPazienti();
        renderPazienti(data, count);
    } catch (error) {
        showError(error);
    }
}

function setupEventListeners() {
    const handleFilterChange = () => {
        state.currentPage = 0;
        persistFilters();
        fetchAndRender();
    };

    domElements.filterContainer.addEventListener('input', e => {
        if (e.target.matches('input, select')) handleFilterChange();
    });
    
    domElements.filterContainer.addEventListener('change', e => {
        if (e.target.matches('input, select')) handleFilterChange();
    });

    domElements.resetButton.addEventListener('click', () => {
        resetFilters();
        fetchAndRender();
    });

    domElements.exportButton.addEventListener('click', exportPazientiToCSV);

    domElements.prevButton.addEventListener('click', () => {
        if (state.currentPage > 0) {
            state.currentPage--;
            persistFilters();
            fetchAndRender();
        }
    });

    domElements.nextButton.addEventListener('click', () => {
        state.currentPage++;
        persistFilters();
        fetchAndRender();
    });

    domElements.tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const newSortColumn = header.dataset.sort;
            if (state.sortColumn === newSortColumn) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortColumn = newSortColumn;
                state.sortDirection = 'asc';
            }
            state.currentPage = 0;
            persistFilters();
            fetchAndRender();
        });
    });

    const handleAction = (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        const { action, id } = button.dataset;
        handlePatientAction(action, id);
    };

    document.getElementById('pazienti-table-body').addEventListener('click', handleAction);
    document.getElementById('pazienti-cards-container').addEventListener('click', handleAction);

    domElements.backButton.addEventListener('click', () => {
        sessionStorage.removeItem('listFilters');
        navigateTo('home');
    });
    
    window.removeEventListener('resize', updateSortIndicators);
    window.addEventListener('resize', updateSortIndicators);
}

async function handlePatientAction(action, id) {
    switch (action) {
        case 'edit':
            sessionStorage.setItem('editPazienteId', id);
            navigateTo('inserimento');
            break;
        case 'delete':
            const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
            const confirmBtn = document.getElementById('confirm-delete-btn');
            confirmBtn.onclick = async () => {
                await deletePaziente(id);
                fetchAndRender();
                deleteModal.hide();
            };
            deleteModal.show();
            break;
        case 'dimetti':
            await updatePazienteStatus(id, true);
            fetchAndRender();
            break;
        case 'riattiva':
            await updatePazienteStatus(id, false);
            fetchAndRender();
            break;
    }
}

export async function initListView(urlParams) {
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    // 1. Popola i filtri prima di fare qualsiasi altra cosa
    await Promise.all([
        populateFilter('reparto_appartenenza', document.getElementById('list-filter-reparto')),
        populateFilter('diagnosi', document.getElementById('list-filter-diagnosi'))
    ]);

    // 2. Inizializza i custom select
    if (window.initCustomSelects) {
            window.initCustomSelects('#list-filter-reparto, #list-filter-diagnosi, #list-filter-stato');
        }

    // 3. Ora che tutti gli elementi sono pronti, fai la cache
    cacheDOMElements(viewContainer);

    // 4. Carica i filtri salvati (da URL o sessionStorage)
    loadPersistedFilters(urlParams);

    // 5. Imposta gli event listener
    setupEventListeners();
    
    // 6. Esegui il fetch e il render iniziali
    fetchAndRender();
    
    // 7. Aggiorna gli indicatori di ordinamento e la vista
    updateSortIndicators();
}