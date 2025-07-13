// src/features/patients/views/list.js
import { navigateTo } from '../../../app/router.js';
import { getFilterOptions, populateSelectWithOptions } from '../../../shared/utils/index.js';
import { state, domElements, cacheDOMElements, loadPersistedFilters, persistFilters, resetFilters } from './list-state-migrated.js';
import { fetchPazienti, exportPazientiToCSV, updatePazienteStatus, deletePaziente } from './list-api.js';
import { renderPazienti, showLoading, showError, updateSortIndicators, ensureCorrectView } from './list-renderer.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { showDeleteConfirmModal } from '../../../shared/services/modalService.js';
import { supabase } from '../../../core/services/supabaseClient.js';
import { currentUser } from '../../../core/auth/authService.js';
import { getCurrentFilters } from './list-state-migrated.js';

async function fetchAndRender() {
    showLoading();
    try {
        const { data, count } = await fetchPazienti();
        renderPazienti(data, count);
    } catch (error) {
        console.error('❌ Errore in fetchAndRender:', error);
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
    
    window.removeEventListener('resize', ensureCorrectView);
    window.addEventListener('resize', ensureCorrectView);
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

window.resetFiltersAndRefresh = function() {
    resetFilters();
    fetchAndRender();
};

export async function fetchListData() {
    console.log('📡 Inizio caricamento dati per la vista lista...');
    try {
        loadPersistedFilters();

        const [pazientiResult, repartoOptions, diagnosiOptions] = await Promise.all([
            fetchPazienti(),
            getFilterOptions('reparto_appartenenza'),
            getFilterOptions('diagnosi')
        ]);

        console.log('✅ Dati per la lista caricati con successo.');
        return {
            pazienti: pazientiResult.data,
            count: pazientiResult.count,
            repartoOptions,
            diagnosiOptions
        };
    } catch (error) {
        console.error('❌ Errore durante il caricamento dei dati per la lista:', error);
        throw error;
    }
}

export async function initListView(listData) {
    console.log('🏗️ Inizializzazione vista lista pazienti con dati pre-caricati...');
    
    if (!currentUser.session) {
        console.log("❌ Accesso a #list bloccato: utente non autenticato.");
        return;
    }

    const viewContainer = document.querySelector('#view-container .view');
    if (!viewContainer) {
        console.error('❌ View container non trovato');
        return;
    }

    try {
        cacheDOMElements(viewContainer);

        const { pazienti, count, repartoOptions, diagnosiOptions } = listData;

        populateSelectWithOptions(domElements.repartoFilter, repartoOptions);
        populateSelectWithOptions(domElements.diagnosiFilter, diagnosiOptions);
        
        const persistedFilters = JSON.parse(sessionStorage.getItem('listFilters')) || {};
        if (domElements.repartoFilter) domElements.repartoFilter.value = persistedFilters.reparto || '';
        if (domElements.diagnosiFilter) domElements.diagnosiFilter.value = persistedFilters.diagnosi || '';
        if (domElements.statoFilter) domElements.statoFilter.value = persistedFilters.stato || 'attivo';
        if (domElements.searchFilter) domElements.searchFilter.value = persistedFilters.searchTerm || '';

        initCustomSelects('#list-filter-reparto, #list-filter-diagnosi, #list-filter-stato');

        setupEventListeners();
        
        renderPazienti(pazienti, count);
        
        updateSortIndicators();
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione della vista lista:', error);
        showError(error);
    }
}