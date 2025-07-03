// src/js/views/list.js
import { supabase } from '../supabase.js';
import { navigateTo } from '../router.js';

const ITEMS_PER_PAGE = 10;
let currentPage = 0;
let sortColumn = 'cognome';
let sortDirection = 'asc';

function updateSortIndicators() {
    const tableHeaders = document.querySelectorAll('th[data-sort]');
    tableHeaders.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (!indicator) return;

        if (header.dataset.sort === sortColumn) {
            indicator.textContent = sortDirection === 'asc' ? ' ▲' : ' ▼';
        } else {
            indicator.textContent = '';
        }
    });
}

async function fetchAndRenderPazienti() {
    const tableBody = document.getElementById('pazienti-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div></td></tr>';
    
    try {
        const searchInput = document.getElementById('list-search');
        const repartoFilter = document.getElementById('list-filter-reparto');
        const diagnosiFilter = document.getElementById('list-filter-diagnosi');
        const statoFilter = document.getElementById('list-filter-stato');

        let query = supabase.from('pazienti').select('*', { count: 'exact' });

        // Filtri
        const searchTerm = searchInput.value.trim();
        if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`);
        if (repartoFilter.value) query = query.eq('reparto_appartenenza', repartoFilter.value);
        if (diagnosiFilter.value) query = query.eq('diagnosi', diagnosiFilter.value);
        if (statoFilter.value === 'attivo') query = query.is('data_dimissione', null);
        else if (statoFilter.value === 'dimesso') query = query.not('data_dimissione', 'is', null);

        // Ordinamento e Paginazione
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE - 1;
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' }).range(startIndex, endIndex);

        const { data, error, count } = await query;
        if (error) throw error;

        renderTable(data);
        updatePaginationControls(count);
        updateSortIndicators();

    } catch (error) {
        console.error('Errore dettagliato durante il fetch dei pazienti:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`;
    }
}

function renderTable(pazientiToRender) {
    const tableBody = document.getElementById('pazienti-table-body');
    tableBody.innerHTML = '';
    if (pazientiToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun paziente trovato.</td></tr>';
        return;
    }
    pazientiToRender.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.cognome}</td>
            <td>${p.nome}</td>
            <td>${new Date(p.data_ricovero).toLocaleDateString()}</td>
            <td>${p.diagnosi}</td>
            <td>${p.reparto_appartenenza}</td>
            <td>${p.data_dimissione ? `<span class="badge bg-secondary">Dimesso</span>` : `<span class="badge bg-success">Attivo</span>`}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}">Modifica</button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}">Elimina</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updatePaginationControls(totalItems) {
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page-btn');
    const nextButton = document.getElementById('next-page-btn');
    if (!pageInfo || !prevButton || !nextButton) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    pageInfo.textContent = `Pagina ${currentPage + 1} di ${totalPages || 1}`;
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1;
}

async function populateFilter(columnName, selectElement) {
    try {
        const { data, error } = await supabase.from('pazienti').select(columnName);
        if (error) throw error;
        const uniqueValues = [...new Set(data.map(item => item[columnName]).filter(Boolean))].sort();
        selectElement.innerHTML = `<option value="">Tutti</option>`;
        uniqueValues.forEach(value => {
            selectElement.innerHTML += `<option value="${value}">${value}</option>`;
        });
    } catch (error) {
        console.error(`Errore caricamento filtro ${columnName}:`, error);
    }
}

export async function initListView() {
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    const searchInput = document.getElementById('list-search');
    const repartoFilter = document.getElementById('list-filter-reparto');
    const diagnosiFilter = document.getElementById('list-filter-diagnosi');
    const statoFilter = document.getElementById('list-filter-stato');
    const backButton = viewContainer.querySelector('button[data-view="home"]');
    const prevButton = document.getElementById('prev-page-btn');
    const nextButton = document.getElementById('next-page-btn');
    const tableBody = document.getElementById('pazienti-table-body');

    await Promise.all([
        populateFilter('reparto_appartenenza', repartoFilter),
        populateFilter('diagnosi', diagnosiFilter)
    ]);
    
    fetchAndRenderPazienti();

    [searchInput, repartoFilter, diagnosiFilter, statoFilter].forEach(el => {
        el.addEventListener('input', () => {
            currentPage = 0;
            fetchAndRenderPazienti();
        });
    });

    prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            fetchAndRenderPazienti();
        }
    });

    nextButton.addEventListener('click', () => {
        currentPage++;
        fetchAndRenderPazienti();
    });

    tableBody.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        if (!action || !id) return;

        if (action === 'edit') {
            sessionStorage.setItem('editPazienteId', id);
            navigateTo('inserimento');
        } else if (action === 'delete') {
            const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
            const confirmBtn = document.getElementById('confirm-delete-btn');
            
            const handleDelete = async () => {
                try {
                    const { error } = await supabase.from('pazienti').delete().eq('id', id);
                    if (error) throw error;
                    fetchAndRenderPazienti();
                } catch (error) {
                    console.error('Errore eliminazione paziente:', error);
                    alert(`Errore: ${error.message}`);
                } finally {
                    deleteModal.hide();
                }
            };
            confirmBtn.onclick = handleDelete;
            deleteModal.show();
        }
    });

    // Event Delegation per l'ordinamento, agganciato all'intestazione della tabella
    const tableHeader = viewContainer.querySelector('thead');
    if (tableHeader) {
        tableHeader.addEventListener('click', (e) => {
            const header = e.target.closest('th');
            if (header && header.dataset.sort) {
                const newSortColumn = header.dataset.sort;
                if (sortColumn === newSortColumn) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = newSortColumn;
                    sortDirection = 'asc';
                }
                currentPage = 0;
                fetchAndRenderPazienti();
            }
        });
    }

    backButton.addEventListener('click', () => navigateTo('home'));
}
