// src/features/patients/views/list.js
import { navigateTo } from '../../../app/router.js';
import { getFilterOptions, populateSelectWithOptions } from '../../../shared/utils/index.js';
import { state, domElements, cacheDOMElements, loadPersistedFilters, persistFilters, resetFilters } from './list-state-migrated.js';
import { fetchPazienti, exportPazientiToCSV, updatePazienteStatus, deletePaziente } from './list-api.js';
import { renderPazienti, showLoading, showError, updateSortIndicators, ensureCorrectView } from './list-renderer.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
// Rimosso import del vecchio modalService
import { supabase } from '../../../core/services/supabaseClient.js';
import { currentUser } from '../../../core/auth/authService.js';
import { getCurrentFilters } from './list-state-migrated.js';
import { logger } from '../../../core/services/loggerService.js';
import { stateService } from '../../../core/services/stateService.js';

let currentPazienti = [];

async function fetchAndRender() {
    showLoading();
    try {
        const { data, count } = await fetchPazienti();
        currentPazienti = data || [];
        renderPazienti(currentPazienti, count);
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
        if (button) {
            const { action, id } = button.dataset;
            handlePatientAction(action, id);
            return;
        }

        // Handle clinical events quick actions
        const clinicalButton = e.target.closest('button[class*="btn-add-"], button[class*="btn-view-"]');
        if (clinicalButton) {
            const patientId = clinicalButton.dataset.patientId;
            if (clinicalButton.classList.contains('btn-add-intervention')) {
                handleClinicalEventAction('add-intervention', patientId);
            } else if (clinicalButton.classList.contains('btn-add-infection')) {
                handleClinicalEventAction('add-infection', patientId);
            } else if (clinicalButton.classList.contains('btn-view-events')) {
                handleClinicalEventAction('view-events', patientId);
            }
        }
    };

    document.getElementById('pazienti-table-body').addEventListener('click', handleAction);
    document.getElementById('pazienti-cards-container').addEventListener('click', handleAction);

    domElements.backButton.addEventListener('click', () => {
        // Non rimuovere i filtri quando si torna alla home, mantieni lo stato
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
            const { ConfirmModal } = await import('../../../shared/components/ui/ConfirmModal.js');
            const modal = ConfirmModal.forDeletion('questo paziente');
            const confirmed = await modal.show();
            if (confirmed) {
                await deletePaziente(id);
                fetchAndRender();
            }
            break;
        case 'dimetti':
            const { ConfirmModal: ConfirmModalDimetti } = await import('../../../shared/components/ui/ConfirmModal.js');
            // Trova il paziente per ottenere il nome
            const pazienteDimetti = currentPazienti.find(p => p.id === id);
            const nomeCompletoDimetti = pazienteDimetti ? `${pazienteDimetti.nome} ${pazienteDimetti.cognome}` : 'il paziente';
            const modalDimetti = ConfirmModalDimetti.forDismissal(nomeCompletoDimetti);
            const confirmedDimetti = await modalDimetti.show();
            if (confirmedDimetti) {
                await updatePazienteStatus(id, true);
                await fetchAndRender();
            }
            break;
        case 'riattiva':
            const { ConfirmModal: ConfirmModalRiattiva } = await import('../../../shared/components/ui/ConfirmModal.js');
            // Trova il paziente per ottenere il nome
            const pazienteRiattiva = currentPazienti.find(p => p.id === id);
            const nomeCompletoRiattiva = pazienteRiattiva ? `${pazienteRiattiva.nome} ${pazienteRiattiva.cognome}` : 'il paziente';
            const modalRiattiva = ConfirmModalRiattiva.forReactivation(nomeCompletoRiattiva);
            const confirmedRiattiva = await modalRiattiva.show();
            if (confirmedRiattiva) {
                await updatePazienteStatus(id, false);
                await fetchAndRender();
            }
            break;
    }
}

async function handleClinicalEventAction(action, patientId) {
    switch (action) {
        case 'add-intervention':
            // Navigate to clinical events view with pre-filled intervention form
            navigateTo(`eventi-clinici?action=add&type=intervento&paziente=${patientId}`);
            break;
        case 'add-infection':
            // Navigate to clinical events view with pre-filled infection form
            navigateTo(`eventi-clinici?action=add&type=infezione&paziente=${patientId}`);
            break;
        case 'view-events':
            // Navigate to clinical events view filtered by patient
            navigateTo(`eventi-clinici?paziente=${patientId}`);
            break;
    }
}

window.resetFiltersAndRefresh = function() {
    resetFilters();
    fetchAndRender();
};

export async function fetchListData() {
    logger.log('📡 Inizio caricamento dati per la vista lista...');
    try {
        loadPersistedFilters();

        const [pazientiResult, repartoOptions, diagnosiOptions] = await Promise.all([
            fetchPazienti(),
            getFilterOptions('reparto_appartenenza'),
            getFilterOptions('diagnosi')
        ]);

        logger.log('✅ Dati per la lista caricati con successo.');
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
    logger.log('🏗️ Inizializzazione vista lista pazienti con dati pre-caricati...');
    
    if (!currentUser.session) {
        logger.log("❌ Accesso a #list bloccato: utente non autenticato.");
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
        currentPazienti = pazienti || [];

        populateSelectWithOptions(domElements.repartoFilter, repartoOptions);
        populateSelectWithOptions(domElements.diagnosiFilter, diagnosiOptions);
        
        // Usa stateService invece di sessionStorage diretto per coerenza
        const persistedFilters = stateService.getFilters();
        if (domElements.repartoFilter) domElements.repartoFilter.value = persistedFilters.reparto || '';
        if (domElements.diagnosiFilter) domElements.diagnosiFilter.value = persistedFilters.diagnosi || '';
        if (domElements.statoFilter) domElements.statoFilter.value = persistedFilters.stato || '';
        if (domElements.infettoFilter) domElements.infettoFilter.value = persistedFilters.infetto || '';
        if (domElements.trasferimentoFilter) domElements.trasferimentoFilter.value = persistedFilters.trasferimento || '';
        if (domElements.searchInput) domElements.searchInput.value = persistedFilters.search || '';

        initCustomSelects('#list-filter-reparto, #list-filter-diagnosi, #list-filter-stato, #list-filter-infetto, #list-filter-trasferimento');

        setupEventListeners();
        
        renderPazienti(currentPazienti, count);
        
        updateSortIndicators();
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione della vista lista:', error);
        showError(error);
    }


}
