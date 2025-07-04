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
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div></div>';
    }
    
    try {
        const query = buildQuery();
        const { data, error, count } = await query;
        if (error) throw error;

        // Renderizza sia tabella che card
        renderTable(data);
        renderCards(data);
        updatePaginationControls(count);
        updateSortIndicators();
        
        // Forza la visibilità corretta basata sulla dimensione dello schermo
        ensureCorrectView();

    } catch (error) {
        console.error('Errore dettagliato durante il fetch dei pazienti:', error);
        domElements.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><strong>Errore nel caricamento dei dati.</strong><br>Controlla la console per i dettagli.</td></tr>`;
        if (cardsContainer) {
            cardsContainer.innerHTML = '<div class="text-center text-danger p-4"><strong>Errore nel caricamento dei dati.</strong></div>';
        }
    }
}

function ensureCorrectView() {
    const tableContainer = document.querySelector('.table-responsive');
    const cardsContainer = document.getElementById('pazienti-cards-container');
    
    if (tableContainer && cardsContainer) {
        // SOLUZIONE RADICALE: Card per tutti i dispositivi sotto 1500px
        if (window.innerWidth < 1500) {
            // Schermi piccoli/medi: FORZA nascondere tabella, mostra card
            tableContainer.style.display = 'none';
            tableContainer.style.visibility = 'hidden';
            tableContainer.style.opacity = '0';
            tableContainer.style.width = '0';
            tableContainer.style.height = '0';
            tableContainer.style.overflow = 'hidden';
            tableContainer.classList.add('d-none');
            tableContainer.classList.remove('d-xl-block');
            
            cardsContainer.style.display = 'block';
            cardsContainer.style.visibility = 'visible';
            cardsContainer.style.opacity = '1';
            cardsContainer.style.width = '100%';
            cardsContainer.style.maxWidth = '100%';
            cardsContainer.classList.remove('d-xl-none');
            cardsContainer.classList.add('d-block');
        } else {
            // Solo schermi molto grandi (1500px+): mostra tabella, nascondi card
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.style.opacity = '1';
            tableContainer.style.width = 'auto';
            tableContainer.style.height = 'auto';
            tableContainer.style.overflow = 'auto';
            tableContainer.classList.remove('d-none');
            tableContainer.classList.add('d-xl-block');
            
            cardsContainer.style.display = 'none';
            cardsContainer.style.visibility = 'hidden';
            cardsContainer.style.opacity = '0';
            cardsContainer.classList.add('d-xl-none');
            cardsContainer.classList.remove('d-block');
        }
    }
    
    // SICUREZZA EXTRA: forza l'overflow nascosto sul body
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

        const actionButton = isDimesso
            ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">undo</span></button>`
            : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">event_available</span></button>`;

        return `
            <tr>
                <td data-label="Cognome">${p.cognome}</td>
                <td data-label="Nome">${p.nome}</td>
                <td data-label="Data Ricovero">${new Date(p.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${p.diagnosi}</td>
                <td data-label="Reparto">${p.reparto_appartenenza}</td>
                <td data-label="Stato">${statusBadge}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}" title="Modifica"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">edit</span></button>
                    ${actionButton}
                    <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${p.id}" title="Elimina"><span class="material-icons" style="font-size: 1.1em; pointer-events: none;">delete</span></button>
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
    
    const cardsHtml = pazientiToRender.map(p => {
        const isDimesso = p.data_dimissione;
        const statusClass = isDimesso ? 'dimesso' : 'attivo';
        const statusText = isDimesso ? 'Dimesso' : 'Attivo';
        
        const actionButton = isDimesso
            ? `<button class="btn btn-outline-success" data-action="riattiva" data-id="${p.id}" title="Riattiva Paziente">
                 <span class="material-icons me-1" style="font-size: 1em;">undo</span>Riattiva
               </button>`
            : `<button class="btn btn-outline-warning" data-action="dimetti" data-id="${p.id}" title="Dimetti Paziente">
                 <span class="material-icons me-1" style="font-size: 1em;">event_available</span>Dimetti
               </button>`;

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
                    <button class="btn btn-outline-primary" data-action="edit" data-id="${p.id}">
                        <span class="material-icons me-1" style="font-size: 1em;">edit</span>Modifica
                    </button>
                    ${actionButton}
                    <button class="btn btn-outline-danger" data-action="delete" data-id="${p.id}">
                        <span class="material-icons me-1" style="font-size: 1em;">delete</span>Elimina
                    </button>
                </div>
            </div>
        `;
    }).join('');
    cardsContainer.innerHTML = cardsHtml;
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
        // Aggiungendo .select() alla fine, chiediamo a Supabase di restituire i dati aggiornati.
        // Questo ci permette di verificare se l'operazione ha avuto successo.
        const { data, error } = await supabase
            .from('pazienti')
            .update(updateData)
            .eq('id', pazienteId)
            .select(); // <-- CHIAVE DELLA DIAGNOSI

        if (error) {
            // Gestisce errori di rete o violazioni di policy esplicite
            throw error;
        }

        if (!data || data.length === 0) {
            // Questo accade se l'ID non viene trovato o se le policy RLS (Row Level Security)
            // impediscono l'update, ma senza generare un errore esplicito.
            alert('Operazione non riuscita. Il paziente non è stato trovato o non si hanno i permessi per modificarlo.');
            console.warn('Nessuna riga modificata per l-ID:', pazienteId);
            return;
        }
        
        // Se tutto va bene, ricarica la tabella
        fetchAndRenderPazienti(); 
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
        handlePatientAction(action, id);
    });

    // Event listener per le card (mobile)
    const cardsContainer = document.getElementById('pazienti-cards-container');
    if (cardsContainer) {
        cardsContainer.addEventListener('click', e => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            const { action, id } = button.dataset;
            handlePatientAction(action, id);
        });
    }

    domElements.backButton.addEventListener('click', () => navigateTo('home'));
    
    // Event listener per ridimensionamento finestra
    window.addEventListener('resize', ensureCorrectView);
}

function handlePatientAction(action, id) {
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
}

export async function initListView(urlParams) {
    const viewContainer = document.querySelector('#app-container .view');
    if (!viewContainer) return;

    cacheDOMElements(viewContainer);
    
    // FORZA la vista corretta immediatamente al caricamento
    ensureCorrectView();
    
    // Seconda chiamata dopo un breve delay per assicurarsi che tutto sia renderizzato
    setTimeout(ensureCorrectView, 100);

    await Promise.all([
        populateFilter('reparto_appartenenza', domElements.repartoFilter),
        populateFilter('diagnosi', domElements.diagnosiFilter)
    ]);

    // Inizializza i custom select dopo aver caricato le opzioni
    setTimeout(() => {
        if (window.initCustomSelects) {
            window.initCustomSelects();
        }
    }, 100);

    applyFiltersFromURL(urlParams);
    fetchAndRenderPazienti();
    setupEventListeners();
    
    // Terza chiamata dopo il rendering dei dati
    setTimeout(ensureCorrectView, 200);
}

