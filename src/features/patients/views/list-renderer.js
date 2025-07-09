// src/js/views/list-renderer.js
import { domElements, state } from './list-state.js';
import { currentUser } from '../services/authService.js';

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
    renderTable(data);
    renderCards(data);
    updatePaginationControls(count);
    updateSortIndicators();
    ensureCorrectView();
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
    const tableContainer = document.querySelector('.table-responsive');
    const cardsContainer = document.getElementById('pazienti-cards-container');
    
    if (tableContainer && cardsContainer) {
        if (window.innerWidth < 1500) {
            tableContainer.style.display = 'none';
            cardsContainer.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            cardsContainer.style.display = 'none';
        }
    }
    
    document.body.style.overflowX = 'hidden';
    document.body.style.maxWidth = '100vw';
}

function renderTable(pazientiToRender) {
    domElements.tableBody.innerHTML = '';
    if (pazientiToRender.length === 0) {
        domElements.tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun paziente trovato.</td></tr>';
        return;
    }
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
    domElements.tableBody.innerHTML = rowsHtml;
}

function renderCards(pazientiToRender) {
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    if (pazientiToRender.length === 0) {
        cardsContainer.innerHTML = '<div class="text-center text-muted p-4">Nessun paziente trovato.</div>';
        return;
    }
    
    const isMobile = window.innerWidth <= 767;
    
    // Logica per i permessi
    const userRole = currentUser.profile?.role;
    const canEdit = userRole === 'admin' || userRole === 'editor';

    if (isMobile) {
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
        
        cardsContainer.innerHTML = cardsHtml;
        
        if (window.MobileCardManager) {
            window.MobileCardManager.initTouchOptimizations();
        }
        
    } else {
        const cardsHtml = pazientiToRender.map(p => {
            const isDimesso = p.data_dimissione;
            const statusClass = isDimesso ? 'dimesso' : 'attivo';
            const statusText = isDimesso ? 'Dimesso' : 'Attivo';
            
            let actionButtons = '';
            if (canEdit) {
                const dimissioneButton = isDimesso
                    ? `<button class="btn btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente">
                         <span class="material-icons me-1" style="font-size: 1em;">undo</span>Riattiva
                       </button>`
                    : `<button class="btn btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente">
                         <span class="material-icons me-1" style="font-size: 1em;">event_available</span>Dimetti
                       </button>`;

                actionButtons = `
                    <button class="btn btn-outline-primary" data-action="edit" data-id="${p.id}">
                        <span class="material-icons me-1" style="font-size: 1em;">edit</span>Modifica
                    </button>
                    ${dimissioneButton}
                    <button class="btn btn-outline-danger" data-action="delete" data-id="${p.id}">
                        <span class="material-icons me-1" style="font-size: 1em;">delete</span>Elimina
                    </button>
                `;
            }

            return `
                <div class="patient-card">
                    <div class="patient-card-header">
                        <h6 class="patient-name">${p.cognome} ${p.nome}</h6>
                        <span class="patient-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="patient-details">
                        <div class="patient-detail">
                            <span class="patient-detail-label">Data Ricovero</span>
                            <span class="patient-detail-value">${new Date(p.data_ricovero).toLocaleDateString()}</span>
                        </div>
                        <div class="patient-detail">
                            <span class="patient-detail-label">Diagnosi</span>
                            <span class="patient-detail-value">${p.diagnosi}</span>
                        </div>
                        <div class="patient-detail">
                            <span class="patient-detail-label">Reparto</span>
                            <span class="patient-detail-value">${p.reparto_appartenenza}</span>
                        </div>
                        <div class="patient-detail">
                            <span class="patient-detail-label">Livello</span>
                            <span class="patient-detail-value">${p.livello_assistenza}</span>
                        </div>
                    </div>
                    <div class="patient-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
        cardsContainer.innerHTML = cardsHtml;
    }
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
