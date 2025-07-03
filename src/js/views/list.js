// src/js/views/list.js
import { supabase } from '../supabase.js';
import { navigateTo } from '../router.js';
import { convertToCSV, populateFilter } from '../utils.js';

const ITEMS_PER_PAGE = 10;

// Oggetto per centralizzare lo stato della vista
const state = {
    currentPage: 0,
    sortColumn: 'cognome',
    sortDirection: 'asc',
};

// Oggetto per "caching" degli elementi del DOM
const domElements = {};

function updateSortIndicators() {
    domElements.tableHeaders.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (!indicator) return;

        if (header.dataset.sort === state.sortColumn) {
            indicator.textContent = state.sortDirection === 'asc' ? ' ▲' : ' ▼';
        } else {
            indicator.textContent = '';
        }
    });
}

function buildQuery() {
    let query = supabase.from('pazienti').select('*', { count: 'exact' });

    // Filtri
    const searchTerm = domElements.searchInput.value.trim();
    if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`);
    if (domElements.repartoFilter.value) query = query.eq('reparto_appartenenza', domElements.repartoFilter.value);
    if (domElements.diagnosiFilter.value) query = query.eq('diagnosi', domElements.diagnosiFilter.value);
    if (domElements.statoFilter.value === 'attivo') query = query.is('data_dimissione', null);
    else if (domElements.statoFilter.value === 'dimesso') query = query.not('data_dimissione', 'is', null);

    // Ordinamento e Paginazione
    const startIndex = state.currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    query = query.order(state.sortColumn, { ascending: state.sortDirection === 'asc' }).range(startIndex, endIndex);

    return query;
}

function applyFiltersFromURL(urlParams) {
    domElements.searchInput.value = urlParams.get('search') || '';
    domElements.repartoFilter.value = urlParams.get('reparto') || '';
    domElements.diagnosiFilter.value = urlParams.get('diagnosi') || '';
    domElements.statoFilter.value = urlParams.get('stato') || '';
    
    state.currentPage = parseInt(urlParams.get('page') || '0', 10);
    state.sortColumn = urlParams.get('sort') || 'cognome';
    state.sortDirection = urlParams.get('dir') || 'asc';
}

function updateURLWithFilters() {
    const params = new URLSearchParams();
    
    const searchTerm = domElements.searchInput.value.trim();
    if (searchTerm) params.set('search', searchTerm);

    const reparto = domElements.repartoFilter.value;
    if (reparto) params.set('reparto', reparto);

    const diagnosi = domElements.diagnosiFilter.value;
    if (diagnosi) params.set('diagnosi', diagnosi);

    const stato = domElements.statoFilter.value;
    if (stato) params.set('stato', stato);

    if (state.currentPage > 0) params.set('page', state.currentPage);
    if (state.sortColumn !== 'cognome') params.set('sort', state.sortColumn);
    if (state.sortDirection !== 'asc') params.set('dir', state.sortDirection);

    const queryString = params.toString();
    const newUrl = queryString ? `#list?${queryString}` : '#list';
    
    history.replaceState(null, '', newUrl);
}

async function fetchAndRenderPazienti() {
    if (!domElements.tableBody) return;

    domElements.tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div></td></tr>';
    
    try {
        const query = buildQuery();
        const { data, error, count } = await query;
        if (error) throw error;

        renderTable(data);
        updatePaginationControls(count);
        updateSortIndicators();

    } catch (error) {
        console.error('Errore dettagliato durante il fetch dei pazienti:', error);
        domElements.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`;
    }
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

        const actionButton = isDimesso
            ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente"><span class="material-icons" style="font-size: 1.1em;">undo</span></button>`
            : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente"><span class="material-icons" style="font-size: 1.1em;">event_available</span></button>`;

        return `
            <tr>
                <td>${p.cognome}</td>
                <td>${p.nome}</td>
                <td>${new Date(p.data_ricovero).toLocaleDateString()}</td>
                <td>${p.diagnosi}</td>
                <td>${p.reparto_appartenenza}</td>
                <td>${statusBadge}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}" title="Modifica"><span class="material-icons" style="font-size: 1.1em;">edit</span></button>
                    ${actionButton}
                    <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${p.id}" title="Elimina"><span class="material-icons" style="font-size: 1.1em;">delete</span></button>
                </td>
            </tr>
        `;
    }).join('');
    domElements.tableBody.innerHTML = rowsHtml;
}

function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    domElements.pageInfo.textContent = `Pagina ${state.currentPage + 1} di ${totalPages || 1}`;
    domElements.prevButton.disabled = state.currentPage === 0;
    domElements.nextButton.disabled = state.currentPage >= totalPages - 1;
}





async function exportToCSV() {
    const originalBtnContent = domElements.exportButton.innerHTML;
    domElements.exportButton.disabled = true;
    domElements.exportButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Esportazione...`;

    try {
        let query = supabase.from('pazienti').select('*');
        const searchTerm = domElements.searchInput.value.trim();
        if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`);
        if (domElements.repartoFilter.value) query = query.eq('reparto_appartenenza', domElements.repartoFilter.value);
        if (domElements.diagnosiFilter.value) query = query.eq('diagnosi', domElements.diagnosiFilter.value);
        if (domElements.statoFilter.value === 'attivo') query = query.is('data_dimissione', null);
        else if (domElements.statoFilter.value === 'dimesso') query = query.not('data_dimissione', 'is', null);
        query = query.order(state.sortColumn, { ascending: state.sortDirection === 'asc' });

        const { data, error } = await query;
        if (error) throw error;
        if (data.length === 0) {
            alert('Nessun dato da esportare per i filtri selezionati.');
            return;
        }

        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'esportazione_pazienti.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Errore durante l\'esportazione CSV:', error);
        alert(`Errore durante l\'esportazione: ${error.message}`);
    } finally {
        domElements.exportButton.disabled = false;
        domElements.exportButton.innerHTML = originalBtnContent;
    }
}

function cacheDOMElements(viewContainer) {
    domElements.repartoFilter = document.getElementById('list-filter-reparto');
    domElements.diagnosiFilter = document.getElementById('list-filter-diagnosi');
    domElements.statoFilter = document.getElementById('list-filter-stato');
    domElements.searchInput = document.getElementById('list-search');
    domElements.filterContainer = viewContainer.querySelector('.filters-container');
    domElements.tableBody = document.getElementById('pazienti-table-body');
    domElements.tableHeaders = viewContainer.querySelectorAll('th[data-sort]');
    domElements.prevButton = document.getElementById('prev-page-btn');
    domElements.nextButton = document.getElementById('next-page-btn');
    domElements.pageInfo = document.getElementById('page-info');
    domElements.backButton = viewContainer.querySelector('button[data-view="home"]');
    domElements.exportButton = document.getElementById('export-csv-btn');
}

async function handleStatusChange(pazienteId, isDimissione) {
    const updateData = {
        data_dimissione: isDimissione ? new Date().toISOString().split('T')[0] : null
    };
    try {
        const { error } = await supabase.from('pazienti').update(updateData).eq('id', pazienteId);
        if (error) throw error;
        fetchAndRenderPazienti(); // Ricarica la tabella per mostrare lo stato aggiornato
    } catch (error) {
        console.error('Errore durante l\'aggiornamento dello stato del paziente:', error);
        alert(`Errore: ${error.message}`);
    }
}

function setupEventListeners() {
    const handleFilterChange = () => {
        state.currentPage = 0;
        updateURLWithFilters();
        fetchAndRenderPazienti();
    };

    domElements.filterContainer.addEventListener('input', e => {
        if (e.target.matches('input, select')) handleFilterChange();
    });

    domElements.exportButton.addEventListener('click', exportToCSV);

    domElements.prevButton.addEventListener('click', () => {
        if (state.currentPage > 0) {
            state.currentPage--;
            updateURLWithFilters();
            fetchAndRenderPazienti();
        }
    });

    domElements.nextButton.addEventListener('click', () => {
        state.currentPage++;
        updateURLWithFilters();
        fetchAndRenderPazienti();
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
            updateURLWithFilters();
            fetchAndRenderPazienti();
        });
    });

    domElements.tableBody.addEventListener('click', e => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        const { action, id } = button.dataset;

        switch (action) {
            case 'edit':
                sessionStorage.setItem('editPazienteId', id);
                navigateTo('inserimento');
                break;
            case 'delete':
                const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
                const confirmBtn = document.getElementById('confirm-delete-btn');
                confirmBtn.onclick = async () => {
                    try {
                        await supabase.from('pazienti').delete().eq('id', id);
                        fetchAndRenderPazienti();
                    } catch (error) {
                        console.error('Errore eliminazione paziente:', error);
                        alert(`Errore: ${error.message}`);
                    } finally {
                        deleteModal.hide();
                    }
                };
                deleteModal.show();
                break;
            case 'dimetti':
                handleStatusChange(id, true);
                break;
            case 'riattiva':
                handleStatusChange(id, false);
                break;
        }
    });

    domElements.backButton.addEventListener('click', () => navigateTo('home'));
}

export async function initListView(urlParams) {
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    cacheDOMElements(viewContainer);

    await Promise.all([
        populateFilter('reparto_appartenenza', domElements.repartoFilter),
        populateFilter('diagnosi', domElements.diagnosiFilter)
    ]);

    applyFiltersFromURL(urlParams);
    fetchAndRenderPazienti();
    setupEventListeners();
}

