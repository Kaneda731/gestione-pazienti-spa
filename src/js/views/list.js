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

function buildQuery() {
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

    return query;
}

function applyFiltersFromURL(urlParams) {
    document.getElementById('list-search').value = urlParams.get('search') || '';
    document.getElementById('list-filter-reparto').value = urlParams.get('reparto') || '';
    document.getElementById('list-filter-diagnosi').value = urlParams.get('diagnosi') || '';
    document.getElementById('list-filter-stato').value = urlParams.get('stato') || '';
    
    currentPage = parseInt(urlParams.get('page') || '0', 10);
    sortColumn = urlParams.get('sort') || 'cognome';
    sortDirection = urlParams.get('dir') || 'asc';
}

function updateURLWithFilters() {
    const params = new URLSearchParams();
    
    const searchTerm = document.getElementById('list-search').value.trim();
    if (searchTerm) params.set('search', searchTerm);

    const reparto = document.getElementById('list-filter-reparto').value;
    if (reparto) params.set('reparto', reparto);

    const diagnosi = document.getElementById('list-filter-diagnosi').value;
    if (diagnosi) params.set('diagnosi', diagnosi);

    const stato = document.getElementById('list-filter-stato').value;
    if (stato) params.set('stato', stato);

    if (currentPage > 0) params.set('page', currentPage);
    if (sortColumn !== 'cognome') params.set('sort', sortColumn);
    if (sortDirection !== 'asc') params.set('dir', sortDirection);

    const queryString = params.toString();
    const newUrl = queryString ? `#list?${queryString}` : '#list';
    
    // Usa replaceState per non intasare la cronologia del browser
    history.replaceState(null, '', newUrl);
}


async function fetchAndRenderPazienti() {
    const tableBody = document.getElementById('pazienti-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div></td></tr>';
    
    try {
        const query = buildQuery();
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

export async function initListView(urlParams) {
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    // --- Elementi DOM ---
    const repartoFilter = document.getElementById('list-filter-reparto');
    const diagnosiFilter = document.getElementById('list-filter-diagnosi');
    const filterContainer = viewContainer.querySelector('.filters-container');
    const tableBody = document.getElementById('pazienti-table-body');
    const tableHeader = viewContainer.querySelector('thead');
    const prevButton = document.getElementById('prev-page-btn');
    const nextButton = document.getElementById('next-page-btn');
    const backButton = viewContainer.querySelector('button[data-view="home"]');

    // --- Inizializzazione ---
    await Promise.all([
        populateFilter('reparto_appartenenza', repartoFilter),
        populateFilter('diagnosi', diagnosiFilter)
    ]);

    applyFiltersFromURL(urlParams);
    
    fetchAndRenderPazienti();

    // --- Gestori di Eventi ---

    const handleFilterChange = () => {
        currentPage = 0;
        updateURLWithFilters();
        fetchAndRenderPazienti();
    };

    // Filtri
    filterContainer.addEventListener('input', (e) => {
        if (e.target.matches('input, select')) {
            handleFilterChange();
        }
    });

    // Paginazione
    prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            updateURLWithFilters();
            fetchAndRenderPazienti();
        }
    });

    nextButton.addEventListener('click', () => {
        currentPage++;
        updateURLWithFilters();
        fetchAndRenderPazienti();
    });

    // Ordinamento Tabella
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
                updateURLWithFilters();
                fetchAndRenderPazienti();
            }
        });
    }

    // Azioni sulla tabella (Modifica/Elimina)
    tableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

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
                    fetchAndRenderPazienti(); // Ricarica i dati dopo l'eliminazione
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

    // Navigazione
    backButton.addEventListener('click', () => navigateTo('home'));
}

