// src/features/patients/views/list.js
import { navigateTo } from '../../../app/router.js';
import { getFilterOptions, populateSelectWithOptions } from '../../../shared/utils/index.js';
import { state, domElements, cacheDOMElements, loadPersistedFilters, persistFilters, resetFilters } from './list-state-migrated.js';
import { fetchPazienti, exportPazientiToCSV, updatePazienteStatus, deletePaziente } from './list-api.js';
import { renderPazienti, showLoading, showError, updateSortIndicators, ensureCorrectView } from './list-renderer.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { showDeleteConfirmModal } from '../../../shared/services/modalService.js';
import { supabase } from '../../../core/services/supabaseClient.js';

async function fetchAndRender() {
    console.log('🔄 Iniziando fetchAndRender...');
    
    // Debug: mostra i filtri correnti
    const currentFilters = getCurrentFilters();
    console.log('🔍 Filtri correnti:', currentFilters);
    
    showLoading();
    try {
        console.log('📡 Chiamando fetchPazienti...');
        const { data, count } = await fetchPazienti();
        console.log('✅ Dati ricevuti:', { dataLength: data?.length, count });
        
        // Se non ci sono risultati, proviamo a verificare se esistono pazienti senza filtri
        if (count === 0) {
            console.log('🔍 Nessun risultato con i filtri attuali, verificando se ci sono pazienti nel database...');
            const { count: totalCount } = await supabase.from('pazienti').select('*', { count: 'exact', head: true });
            console.log('🔍 Pazienti totali nel database:', totalCount);
            
            if (totalCount > 0) {
                console.log('⚠️ Ci sono pazienti ma i filtri li nascondono. Suggerimento: resetta i filtri.');
                console.log('🔍 Filtri che stanno bloccando:', currentFilters);
                
                // Mostra un messaggio specifico nella tabella
                if (domElements.tableBody) {
                    domElements.tableBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-warning">
                                <div class="py-4">
                                    <h5>Nessun risultato con i filtri attuali</h5>
                                    <p>Ci sono ${totalCount} pazienti nel database, ma i filtri li nascondono.</p>
                                    <button class="btn btn-primary" onclick="window.resetFiltersAndRefresh()">
                                        <span class="material-icons me-1">refresh</span>
                                        Resetta filtri e ricarica
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
        }
        
        console.log('🎨 Chiamando renderPazienti...');
        renderPazienti(data, count);
        console.log('✅ Rendering completato');
    } catch (error) {
        console.error('❌ Errore in fetchAndRender:', error);
        showError(error);
    }
}

/**
 * Aspetta che gli elementi DOM critici siano disponibili
 */
function waitForDOMElements(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let attempts = 0;
        
        function checkElements() {
            attempts++;
            const tableBody = document.getElementById('pazienti-table-body');
            const cardsContainer = document.getElementById('pazienti-cards-container');
            
            console.log(`Tentativo ${attempts}: Cercando elementi DOM...`, {
                tableBody: !!tableBody,
                cardsContainer: !!cardsContainer,
                appContainer: !!document.querySelector('#app-container'),
                viewContainer: !!document.querySelector('#app-container .view')
            });
            
            if (tableBody && cardsContainer) {
                console.log('Elementi DOM trovati dopo', attempts, 'tentativi');
                resolve();
            } else if (Date.now() - startTime > timeout) {
                console.error('Timeout dopo', attempts, 'tentativi. Elementi trovati:', {
                    tableBody: !!tableBody,
                    cardsContainer: !!cardsContainer
                });
                reject(new Error('Timeout: elementi DOM non trovati'));
            } else {
                // Riprova dopo un delay più lungo
                setTimeout(checkElements, 100);
            }
        }
        
        checkElements();
    });
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
    
    // Listener per il resize della finestra per gestire il layout
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

import { currentUser } from '../../../core/auth/authService.js'; // Importa lo stato utente
import { getCurrentFilters } from './list-state-migrated.js'; // Importa getCurrentFilters

// Funzione globale per resettare i filtri
window.resetFiltersAndRefresh = function() {
    console.log('🔄 Resettando filtri e ricaricando...');
    resetFilters();
    fetchAndRender();
};

// ... (altro codice del file) ...

export async function initListView(urlParams) {
    console.log('🏗️ Inizializzazione vista lista pazienti...', { urlParams });
    
    // CONTROLLO DI SICUREZZA: Se l'utente non è loggato, non fare nulla.
    // La vista 'login-required' verrà mostrata dal router.
    if (!currentUser.session) {
        console.log("❌ Accesso a #list bloccato: utente non autenticato.");
        return;
    }

    console.log('✅ Utente autenticato, continuando con l\'inizializzazione...');
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) {
        console.error('❌ View container non trovato');
        return;
    }

    console.log('✅ View container trovato:', viewContainer);
    
    // Controlla se gli elementi essenziali sono presenti nel DOM
    const tableBody = document.getElementById('pazienti-table-body');
    const cardsContainer = document.getElementById('pazienti-cards-container');
    
    console.log('🔍 Controllo elementi essenziali:', {
        tableBody: !!tableBody,
        cardsContainer: !!cardsContainer,
        tableBodyId: tableBody?.id,
        cardsContainerId: cardsContainer?.id
    });
    
    if (!tableBody || !cardsContainer) {
        console.error('❌ Elementi essenziali mancanti nel DOM');
        return;
    }

    console.log('✅ Elementi essenziali trovati, inizializzando...');
    try {
        // Aspetta che gli elementi DOM critici siano disponibili
        await waitForDOMElements();
        
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
        if (domElements.tableBody && domElements.cardsContainer) {
            console.log('🚀 Avviando fetchAndRender...');
            fetchAndRender();
        } else {
            console.error('Impossibile inizializzare la vista lista: elementi DOM mancanti');
        }
        
        // 8. Aggiorna gli indicatori di ordinamento e la vista
        updateSortIndicators();
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione della vista lista:', error);
    }
}