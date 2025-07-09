// src/features/patients/views/list.js
import { navigateTo } from '../../../app/router.js';
import { getFilterOptions, populateSelectWithOptions } from '../../../shared/utils/index.js';
import { state, domElements, cacheDOMElements, loadPersistedFilters, persistFilters, resetFilters } from './list-state-migrated.js';
import { fetchPazienti, exportPazientiToCSV, updatePazienteStatus, deletePaziente } from './list-api.js';
import { renderPazienti, showLoading, showError, updateSortIndicators } from './list-renderer.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { showDeleteConfirmModal } from '../../../shared/services/modalService.js';

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
            await showDeleteConfirmModal(async () => {
                await deletePaziente(id);
                fetchAndRender();
            });
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

import { currentUser } from '../../../core/auth/authService.js'; // Importa lo stato utente

// ... (altro codice del file) ...

export async function initListView(urlParams) {
    // CONTROLLO DI SICUREZZA: Se l'utente non è loggato, non fare nulla.
    // La vista 'login-required' verrà mostrata dal router.
    if (!currentUser.session) {
        console.log("Accesso a #list bloccato: utente non autenticato.");
        return;
    }

    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    // 1. Esegui la cache degli elementi DOM statici
    cacheDOMElements(viewContainer);

    // 2. Recupera i dati per i filtri in parallelo
    const [repartoOptions, diagnosiOptions] = await Promise.all([
        getFilterOptions('reparto_appartenenza'),
        getFilterOptions('diagnosi')
    ]);

    // 3. Popola i select con i dati ottenuti
    populateSelectWithOptions(domElements.repartoFilter, repartoOptions);
    populateSelectWithOptions(domElements.diagnosiFilter, diagnosiOptions);

    // 4. Carica i filtri salvati (da URL o sessionStorage)
    loadPersistedFilters(urlParams);

    // 5. Ora che il DOM è stabile e popolato, inizializza i custom select
    initCustomSelects('#list-filter-reparto, #list-filter-diagnosi, #list-filter-stato');

    // 6. Imposta gli event listener
    setupEventListeners();
    
    // 7. Esegui il fetch e il render iniziali (solo se gli elementi sono disponibili)
    if (domElements.tableBody) {
        fetchAndRender();
    } else {
        console.error('Impossibile inizializzare la vista lista: elementi DOM mancanti');
    }
    
    // 8. Aggiorna gli indicatori di ordinamento e la vista
    updateSortIndicators();
}