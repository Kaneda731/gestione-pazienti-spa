// src/features/patients/views/list-renderer.js
import { domElements, state } from './list-state-migrated.js';
import { currentUser } from '../../../core/auth/authService.js';

const ITEMS_PER_PAGE = 10;

export function updateSortIndicators() {
    if (!domElements.tableHeaders || domElements.tableHeaders.length === 0) return;
    
    domElements.tableHeaders.forEach(header => {
        if (!header) return;
        const indicator = header.querySelector('.sort-indicator');
        if (!indicator) return;

        if (header.dataset.sort === state.sortColumn) {
            indicator.textContent = state.sortDirection === 'asc' ? ' ▲' : ' ▼';
        } else {
            indicator.textContent = '';
        }
    });
}

export function renderPazienti(data, count) {
    console.log('🎨 Iniziando renderPazienti...', { dataLength: data?.length, count });
    
    console.log('🎨 Chiamando renderTable...');
    renderTable(data);
    
    console.log('🎨 Chiamando renderCards...');
    renderCards(data);
    
    console.log('🎨 Aggiornando controlli paginazione...');
    updatePaginationControls(count);
    
    console.log('🎨 Aggiornando indicatori ordinamento...');
    updateSortIndicators();
    
    console.log('🎨 Assicurando vista corretta...');
    ensureCorrectView();
    
    console.log('✅ renderPazienti completato');
}

export function showLoading() {
    if (domElements.tableBody) {
        domElements.tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div></td></tr>';
    }
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div></div>';
    }
}

export function showError(error) {
    console.error('Errore dettagliato durante il fetch dei pazienti:', error);
    if (domElements.tableBody) {
        domElements.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`;
    }
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="text-center text-danger p-4"><strong>Errore nel caricamento dei dati.</strong></div>';
    }
}

function ensureCorrectView() {
    // La logica di visibilità è ora gestita interamente dal CSS tramite media queries.
    // Questa funzione assicura solo che gli stili di overflow siano corretti.
    document.body.style.overflowX = 'hidden';
    document.body.style.maxWidth = '100vw';
    console.log('✅ Stili di overflow assicurati');
}

function renderTable(pazientiToRender) {
    console.log('📋 Iniziando renderTable con', pazientiToRender?.length, 'pazienti');
    
    let tableBody = document.getElementById('pazienti-table-body');
    
    if (!tableBody) {
        console.error('❌ Element pazienti-table-body non trovato nel DOM');
        console.log('🔍 Contenuto attuale del DOM:', {
            appContainer: !!document.querySelector('#app-container'),
            viewContainer: !!document.querySelector('#app-container .view'),
            allTablesInDOM: document.querySelectorAll('table').length,
            allTbodyInDOM: document.querySelectorAll('tbody').length,
            listHtml: document.querySelector('#app-container .view')?.innerHTML?.substring(0, 500) + '...'
        });
        
        // Prova a cercare di nuovo dopo un breve delay
        setTimeout(() => {
            tableBody = document.getElementById('pazienti-table-body');
            if (tableBody) {
                console.log('✅ Elemento trovato al secondo tentativo');
                renderTableContent(tableBody, pazientiToRender);
            } else {
                console.error('❌ Elemento ancora non trovato al secondo tentativo');
            }
        }, 200);
        return;
    }
    
    console.log('✅ Elemento pazienti-table-body trovato, renderizzando contenuto...');
    renderTableContent(tableBody, pazientiToRender);
}

function renderTableContent(tableBody, pazientiToRender) {
    console.log('📋 Renderizzando contenuto tabella per', pazientiToRender?.length, 'pazienti');
    
    tableBody.innerHTML = '';
    if (pazientiToRender.length === 0) {
        console.log('ℹ️ Nessun paziente da visualizzare');
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun paziente trovato.</td></tr>';
        return;
    }
    
    console.log('🔄 Generando HTML per le righe...');
    const rowsHtml = pazientiToRender.map(p => {
        const isDimesso = p.data_dimissione;
        const statusBadge = isDimesso
            ? `<span class="badge bg-secondary">Dimesso</span>`
            : `<span class="badge bg-success">Attivo</span>`;

        // Logica per i pulsanti basata sui permessi
        const userRole = currentUser.profile?.role;
        const canEdit = userRole === 'admin' || userRole === 'editor';
        let actionButtons = '';

        if (canEdit) {
            const actionButton = isDimesso
                ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">undo</span></button>`
                : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">event_available</span></button>`;
            
            actionButtons = `
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}" title="Modifica"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">edit</span></button>
                ${actionButton}
                <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${p.id}" title="Elimina"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">delete</span></button>
            `;
        }

        return `
            <tr>
                <td data-label="Cognome">${p.cognome}</td>
                <td data-label="Nome">${p.nome}</td>
                <td data-label="Data Ricovero">${new Date(p.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${p.diagnosi}</td>
                <td data-label="Reparto">${p.reparto_appartenenza}</td>
                <td data-label="Stato">${statusBadge}</td>
                <td class="text-nowrap">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ HTML generato, impostando innerHTML...');
    tableBody.innerHTML = rowsHtml;
    console.log('✅ Contenuto tabella renderizzato con successo');
}

function renderCards(pazientiToRender) {
    console.log('📱 Iniziando renderCards con', pazientiToRender?.length, 'pazienti');
    
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (!cardsContainer) {
        console.error('❌ Element pazienti-cards-container non trovato nel DOM');
        return;
    }
    
    console.log('✅ Elemento pazienti-cards-container trovato');
    cardsContainer.innerHTML = '';
    if (pazientiToRender.length === 0) {
        console.log('ℹ️ Nessun paziente da visualizzare nelle card');
        cardsContainer.innerHTML = '<div class="text-center text-muted p-4">Nessun paziente trovato.</div>';
        return;
    }
    
    // Logica per i permessi
    const userRole = currentUser.profile?.role;
    const canEdit = userRole === 'admin' || userRole === 'editor';

    const cardsHtml = pazientiToRender.map(p => {
        const isDimesso = p.data_dimissione;
        const statusClass = isDimesso ? 'error' : 'success';
        
        let actionButtons = '';
        if (canEdit) {
            const dimissioneButton = isDimesso
                ? `<button class="btn btn-sm btn-outline-success mobile-compact" data-action="riattiva" data-id="${p.id}" title="Riattiva">
                     <span class="material-icons mobile-text-xs">undo</span>
                   </button>`
                : `<button class="btn btn-sm btn-outline-warning mobile-compact" data-action="dimetti" data-id="${p.id}" title="Dimetti">
                     <span class="material-icons mobile-text-xs">event_available</span>
                   </button>`;
            
            actionButtons = `
                <button class="btn btn-sm btn-outline-primary mobile-compact" data-action="edit" data-id="${p.id}" title="Modifica">
                    <span class="material-icons mobile-text-xs">edit</span>
                </button>
                ${dimissioneButton}
                <button class="btn btn-sm btn-outline-danger mobile-compact" data-action="delete" data-id="${p.id}" title="Elimina">
                    <span class="material-icons mobile-text-xs">delete</span>
                </button>
            `;
        }

        return `
            <div class="card card-list-compact status-${statusClass}">
                <div class="card-body">
                    <div>
                        <div class="card-title">${p.cognome} ${p.nome}</div>
                        <div class="card-meta mobile-text-sm">
                            ${p.diagnosi} • ${p.reparto_appartenenza}
                        </div>
                    </div>
                    <div class="mobile-horizontal" style="gap: 0.25rem;">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('📱 Generando HTML per', pazientiToRender.length, 'card');
    cardsContainer.innerHTML = cardsHtml;
    
    if (window.MobileCardManager) {
        window.MobileCardManager.initTouchOptimizations();
    }
    
    console.log('✅ renderCards completato con successo');
}

function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (domElements.pageInfo) {
        domElements.pageInfo.textContent = `Pagina ${state.currentPage + 1} di ${totalPages || 1}`;
    }
    if (domElements.prevButton) {
        domElements.prevButton.disabled = state.currentPage === 0;
    }
    if (domElements.nextButton) {
        domElements.nextButton.disabled = state.currentPage >= totalPages - 1;
    }
}
