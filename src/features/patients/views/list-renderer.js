// src/features/patients/views/list-renderer.js
import { domElements, state } from './list-state-migrated.js';
import { currentUser } from '../../../core/auth/authService.js';

const ITEMS_PER_PAGE = 10;

/**
 * Genera un badge di stato migliorato che include informazioni di trasferimento
 */
function getEnhancedStatusBadge(patient) {
    if (!patient.data_dimissione) {
        return `<span class="badge bg-success">Attivo</span>`;
    }

    // Paziente dimesso/trasferito
    let badgeClass = 'bg-secondary';
    let badgeText = 'Dimesso';
    let badgeIcon = '';

    if (patient.tipo_dimissione) {
        switch (patient.tipo_dimissione) {
            case 'trasferimento_interno':
                badgeClass = 'bg-info';
                badgeText = 'Trasf. Interno';
                badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">swap_horiz</span>';
                break;
            case 'trasferimento_esterno':
                badgeClass = 'bg-warning text-dark';
                badgeText = 'Trasf. Esterno';
                badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">exit_to_app</span>';
                break;
            case 'dimissione':
                badgeClass = 'bg-secondary';
                badgeText = 'Dimesso';
                badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">home</span>';
                break;
        }
    }

    // Aggiungi codice dimissione se presente
    let dischargeCode = '';
    if (patient.codice_dimissione) {
        const codeText = patient.codice_dimissione === '3' ? 'Ord.' : patient.codice_dimissione === '6' ? 'Vol.' : patient.codice_dimissione;
        dischargeCode = ` <small>(${codeText})</small>`;
    }

    return `<span class="badge ${badgeClass}">${badgeIcon}${badgeText}${dischargeCode}</span>`;
}

/**
 * Genera informazioni di trasferimento per la colonna dedicata
 */
function getTransferInfo(patient) {
    if (!patient.data_dimissione || !patient.tipo_dimissione) {
        return '-';
    }

    switch (patient.tipo_dimissione) {
        case 'trasferimento_interno':
            return patient.reparto_destinazione ? 
                `<small class="text-info"><strong>→ ${patient.reparto_destinazione}</strong></small>` : 
                '<small class="text-muted">Interno</small>';
        
        case 'trasferimento_esterno':
            let externalInfo = '<small class="text-warning"><strong>Esterno</strong>';
            if (patient.clinica_destinazione) {
                externalInfo += `<br>→ ${patient.clinica_destinazione}`;
            }
            if (patient.codice_clinica) {
                const clinicName = patient.codice_clinica === '56' ? 'Riab. Cardiologica' : 
                                 patient.codice_clinica === '60' ? 'Riab. Generale' : 
                                 `Cod. ${patient.codice_clinica}`;
                externalInfo += `<br>(${clinicName})`;
            }
            externalInfo += '</small>';
            return externalInfo;
        
        case 'dimissione':
        default:
            return '<small class="text-muted">-</small>';
    }
}

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
        domElements.tableBody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border"></div></td></tr>';
    }
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div></div>';
    }
}

export function showError(error) {
    console.error('Errore dettagliato durante il fetch dei pazienti:', error);
    if (domElements.tableBody) {
        domElements.tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`;
    }
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="text-center text-danger p-4"><strong>Errore nel caricamento dei dati.</strong></div>';
    }
}

export function ensureCorrectView() {
    const tableContainer = document.querySelector('.table-responsive');
    const cardsContainer = document.getElementById('pazienti-cards-container');
    
    if (tableContainer && cardsContainer) {
        // Usa il breakpoint di Bootstrap 'lg' (992px) per lo switch
        if (window.matchMedia("(max-width: 991.98px)").matches) {
            tableContainer.style.display = 'none';
            cardsContainer.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            cardsContainer.style.display = 'none';
        }
    }
}

function renderTable(pazientiToRender) {
    const tableBody = document.getElementById('pazienti-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (pazientiToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nessun paziente trovato.</td></tr>';
        return;
    }
    
    const rowsHtml = pazientiToRender.map(p => {
        const isDimesso = p.data_dimissione;
        const statusBadge = getEnhancedStatusBadge(p);
        const transferInfo = getTransferInfo(p);
        const userRole = currentUser.profile?.role;
        const canEdit = userRole === 'admin' || userRole === 'editor';
        let actionButtons = '';

        if (canEdit) {
            const dimissioneButton = isDimesso
                ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">undo</span></button>`
                : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">event_available</span></button>`;
            
            actionButtons = `
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}" title="Modifica"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">edit</span></button>
                ${dimissioneButton}
                <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${p.id}" title="Elimina"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">delete</span></button>
            `;
        }

        return `
            <tr>
                <td data-label="Cognome" class="field-border-dark">${p.cognome}</td>
                <td data-label="Nome" class="field-border-dark">${p.nome}</td>
                <td data-label="Data Nascita" class="field-border-dark">${p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : '-'}</td>
                <td data-label="Data Ricovero" class="field-border-dark">${new Date(p.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${p.diagnosi}</td>
                <td data-label="Reparto">${p.reparto_appartenenza}</td>
                <td data-label="Stato">${statusBadge}</td>
                <td data-label="Trasferimento">${transferInfo}</td>
                <td class="text-nowrap">${actionButtons}</td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rowsHtml;
}

function renderCards(pazientiToRender) {
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (!cardsContainer) return;

    const userRole = currentUser.profile?.role;
    const canEdit = userRole === 'admin' || userRole === 'editor';

    if (window.matchMedia("(max-width: 767px)").matches) {
        const cardsHtml = pazientiToRender.map(p => {
            const isDimesso = p.data_dimissione;
            const statusBadge = getEnhancedStatusBadge(p);
            const transferInfo = getTransferInfo(p);
            let mobileActionButtons = '';
            if (canEdit) {
                const dimissioneButton = isDimesso
                    ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">undo</span></button>`
                    : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">event_available</span></button>`;
                mobileActionButtons = `
                    <div style="display: flex; width: 100%; margin-top: 0.75rem; gap: 0.75rem;">
                        <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${p.id}" title="Modifica" style="flex-grow: 1;"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">edit</span></button>
                        ${dimissioneButton}
                        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}" title="Elimina" style="flex-grow: 1;"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">delete</span></button>
                    </div>
                `;
            }

            // Aggiungi informazioni di trasferimento se presenti
            let transferInfoHtml = '';
            if (transferInfo !== '-') {
                transferInfoHtml = `<p class="card-text mb-1" style="font-size: 1.15rem;"><strong>Trasferimento:</strong> ${transferInfo}</p>`;
            }

            return `
                <div class="card mb-3 patient-card-mobile card-border-dark">
                    <div class="card-body">
                        <h5 class="card-title mb-2" style="font-size: 1.35rem;">${p.cognome} ${p.nome}</h5>
                        <p class="card-text mb-1 field-border-dark" style="font-size: 1.15rem;"><strong>Data di Nascita:</strong> ${p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : '-'}</p>
                        <p class="card-text mb-1 field-border-dark" style="font-size: 1.15rem;"><strong>Data Ricovero:</strong> ${new Date(p.data_ricovero).toLocaleDateString()}</p>
                        <p class="card-text mb-1 field-border-dark" style="font-size: 1.15rem;"><strong>Diagnosi:</strong> ${p.diagnosi}</p>
                        <p class="card-text mb-1" style="font-size: 1.15rem;"><strong>Stato:</strong> ${statusBadge}</p>
                        ${transferInfoHtml}
                        ${mobileActionButtons}
                    </div>
                </div>
            `;
        }).join('');
        cardsContainer.innerHTML = cardsHtml;
    } else {
        const cardsHtml = pazientiToRender.map(p => {
            const isDimesso = p.data_dimissione;
            const statusBadge = getEnhancedStatusBadge(p);
            const transferInfo = getTransferInfo(p);
            let desktopActionButtons = '';
            if (canEdit) {
                const dimissioneButton = isDimesso
                    ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente"><span class="material-icons me-1" style="font-size: 1em;">undo</span>Riattiva</button>`
                    : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente"><span class="material-icons me-1" style="font-size: 1em;">event_available</span>Dimetti</button>`;
                desktopActionButtons = `
                    <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}" title="Modifica"><span class="material-icons me-1" style="font-size: 1em;">edit</span>Modifica</button>
                    ${dimissioneButton}
                    <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${p.id}" title="Elimina"><span class="material-icons me-1" style="font-size: 1em;">delete</span></button>
                `;
            }

            // Aggiungi informazioni di trasferimento se presenti
            let transferInfoHtml = '';
            if (transferInfo !== '-') {
                transferInfoHtml = `<p class="card-text mb-1"><strong>Trasferimento:</strong> ${transferInfo}</p>`;
            }

            return `
                <div class="card mb-3 patient-card-desktop card-border-dark">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h5 class="card-title mb-2">${p.cognome} ${p.nome}</h5>
                                <div class="row">
                                    <div class="col-sm-6">
                                        <p class="card-text mb-1 field-border-dark"><strong>Cognome:</strong> ${p.cognome}</p>
                                        <p class="card-text mb-1 field-border-dark"><strong>Nome:</strong> ${p.nome}</p>
                                        <p class="card-text mb-1 field-border-dark"><strong>Data Nascita:</strong> ${p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : '-'}</p>
                                        <p class="card-text mb-1 field-border-dark"><strong>Data Ricovero:</strong> ${new Date(p.data_ricovero).toLocaleDateString()}</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="card-text mb-1 field-border-dark"><strong>Diagnosi:</strong> ${p.diagnosi}</p>
                                        <p class="card-text mb-1"><strong>Reparto:</strong> ${p.reparto_appartenenza}</p>
                                        <p class="card-text mb-1"><strong>Stato:</strong> ${statusBadge}</p>
                                        ${transferInfoHtml}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 d-flex align-items-center justify-content-end">
                                <div class="patient-actions">${desktopActionButtons}</div>
                            </div>
                        </div>
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
