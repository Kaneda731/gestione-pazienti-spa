// --- CONFIGURAZIONE ---
const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

// --- INIZIALIZZAZIONE ---
if (!window.supabase) {
    alert('Errore critico: Libreria Supabase non trovata.');
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// --- ELEMENTI DOM ---
const appContainer = document.getElementById('app-container');
const authContainer = document.getElementById('auth-container');

// --- TEMPLATES ---
const templates = {
    home: document.getElementById('view-home'),
    inserimento: document.getElementById('view-inserimento'),
    dimissione: document.getElementById('view-dimissione'),
    grafico: document.getElementById('view-grafico'),
    list: document.getElementById('view-list'),
    loginRequired: document.getElementById('view-login-required'),
    login: document.getElementById('auth-login'),
    logout: document.getElementById('auth-logout'),
};

// --- ROUTER ---
function navigateTo(viewName) {
    window.location.hash = viewName;
}

async function renderView() {
    const requestedViewName = window.location.hash.substring(1) || 'home';
    const protectedViews = ['inserimento', 'dimissione', 'grafico', 'list'];
    
    const { data: { session } } = await supabase.auth.getSession();

    let viewToRender = requestedViewName;
    let template;

    if (protectedViews.includes(requestedViewName) && !session) {
        viewToRender = 'loginRequired';
        template = templates.loginRequired;
    } else {
        template = templates[requestedViewName] || templates.home;
        if (!templates[requestedViewName]) {
            viewToRender = 'home';
        }
    }

    appContainer.innerHTML = '';
    const viewContent = template.content.cloneNode(true);
    
    const viewDiv = viewContent.querySelector('.view');
    if (viewDiv) {
        viewDiv.classList.add('active');
    }
    
    appContainer.appendChild(viewContent);

    // Inizializza la logica specifica della vista in base a `viewToRender`
    if (viewToRender === 'home') {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const view = card.dataset.view;
                if (view === 'inserimento') {
                    // Pulisce lo stato di modifica prima di aprire un nuovo form
                    sessionStorage.removeItem('editPazienteId');
                }
                navigateTo(view);
            });
        });
    } else if (viewToRender === 'inserimento') {
        initInserimentoView();
    } else if (viewToRender === 'dimissione') {
        initDimissioneView();
    } else if (viewToRender === 'grafico') {
        initGraficoView();
    } else if (viewToRender === 'list') {
        initListView();
    } else if (viewToRender === 'loginRequired') {
        document.getElementById('login-prompt-button').addEventListener('click', () => {
            supabase.auth.signInWithOAuth({ provider: 'google' });
        });
    }
}

// --- FUNZIONI SPECIFICHE PER VISTA ---

async function initInserimentoView() {
    const form = document.getElementById('form-inserimento');
    const backButton = form.closest('.card').querySelector('button[data-view="home"]');
    const title = document.getElementById('inserimento-title');
    const submitButton = form.querySelector('button[type="submit"]');
    const idInput = document.getElementById('paziente-id');

    const editId = sessionStorage.getItem('editPazienteId');

    if (editId) {
        // Modalità Modifica
        title.innerHTML = '<span class="material-icons me-2">edit</span>Modifica Paziente';
        submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Modifiche';

        try {
            const { data, error } = await supabase.from('pazienti').select('*').eq('id', editId).single();
            if (error) throw error;
            
            // Popola il form con i dati del paziente
            for (const key in data) {
                if (form.elements[key]) {
                    form.elements[key].value = data[key];
                }
            }
        } catch (error) {
            mostraMessaggio(`Errore nel caricamento dei dati: ${error.message}`, 'error');
        }

    } else {
        // Modalità Inserimento
        title.innerHTML = '<span class="material-icons me-2">person_add</span>Inserimento Nuovo Paziente';
        submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Paziente';
        form.reset(); // Assicura che il form sia pulito
        idInput.value = ''; // Assicura che l'ID sia vuoto
        form.querySelector('#data_ricovero').value = new Date().toISOString().split('T')[0];
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            mostraMessaggio('Per favore, compila tutti i campi obbligatori.', 'error');
            return;
        }
        
        submitButton.disabled = true;
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...';
        
        const formData = Object.fromEntries(new FormData(form));
        
        try {
            let error;
            if (editId) {
                // Logica di Update
                const { error: updateError } = await supabase.from('pazienti').update(formData).eq('id', editId);
                error = updateError;
            } else {
                // Logica di Insert
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Utente non autenticato.');
                formData.user_id = user.id;
                const { error: insertError } = await supabase.from('pazienti').insert([formData]);
                error = insertError;
            }

            if (error) throw error;

            mostraMessaggio('Dati salvati con successo!', 'success');
            form.reset();
            sessionStorage.removeItem('editPazienteId');
            setTimeout(() => navigateTo('list'), 1500);

        } catch (error) {
            mostraMessaggio(`Errore nel salvataggio: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    });

    backButton.addEventListener('click', () => {
        sessionStorage.removeItem('editPazienteId');
        navigateTo('list');
    });
}

function initDimissioneView() {
    const searchInput = document.getElementById('search-paziente');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('search-results');
    const dimissioneForm = document.getElementById('form-dimissione');
    const backButton = dimissioneForm.closest('.card').querySelector('button[data-view="home"]');
    let selectedPazienteId = null;

    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 2) {
            mostraMessaggio('Inserisci almeno 2 caratteri.', 'info', 'messaggio-container-dimissione');
            return;
        }
        resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
        try {
            const { data, error } = await supabase.from('pazienti').select('id, nome, cognome, data_ricovero').ilike('cognome', `%${searchTerm}%`).is('data_dimissione', null).order('cognome');
            if (error) throw error;
            resultsContainer.innerHTML = data.length === 0 ? '<p class="text-center text-muted">Nessun paziente trovato.</p>' : '';
            data.forEach(p => {
                const item = document.createElement('button');
                item.className = 'list-group-item list-group-item-action';
                item.textContent = `${p.cognome} ${p.nome} (Ricovero: ${new Date(p.data_ricovero).toLocaleDateString()})`;
                item.onclick = () => {
                    selectedPazienteId = p.id;
                    document.getElementById('selected-paziente-nome').textContent = `${p.cognome} ${p.nome}`;
                    document.getElementById('selected-paziente-ricovero').textContent = new Date(p.data_ricovero).toLocaleDateString();
                    dimissioneForm.classList.remove('d-none');
                    resultsContainer.innerHTML = '';
                    searchInput.value = '';
                };
                resultsContainer.appendChild(item);
            });
        } catch (error) {
            mostraMessaggio(`Errore nella ricerca: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    };

    searchInput.addEventListener('keypress', e => e.key === 'Enter' && (e.preventDefault(), handleSearch()));
    searchButton.addEventListener('click', handleSearch);

    dimissioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data_dimissione = document.getElementById('data_dimissione').value;
        if (!selectedPazienteId || !data_dimissione) return;
        try {
            const { error } = await supabase.from('pazienti').update({ data_dimissione }).eq('id', selectedPazienteId);
            if (error) throw error;
            mostraMessaggio('Paziente dimesso!', 'success', 'messaggio-container-dimissione');
            dimissioneForm.classList.add('d-none');
            setTimeout(() => navigateTo('home'), 2000);
        } catch (error) {
            mostraMessaggio(`Errore nella dimissione: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    });
    backButton.addEventListener('click', () => navigateTo('home'));
}

async function initGraficoView() {
    const repartoFilter = document.getElementById('filter-reparto');
    const provenienzaFilter = document.getElementById('filter-provenienza');
    const diagnosiFilter = document.getElementById('filter-diagnosi');
    const assistenzaFilter = document.getElementById('filter-assistenza');
    const startDateFilter = document.getElementById('filter-start-date');
    const endDateFilter = document.getElementById('filter-end-date');
    const applyButton = document.getElementById('apply-filters-btn');
    const chartContainer = document.getElementById('chart-container');
    const backButton = chartContainer.closest('.card').querySelector('button[data-view="home"]');

    google.charts.load('current', { 'packages': ['corechart'] });

    const populateFilter = async (columnName, selectElement) => {
        try {
            const { data, error } = await supabase.from('pazienti').select(columnName);
            if (error) throw error;
            const uniqueValues = [...new Set(data.map(item => item[columnName]))].sort();
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                if(value) selectElement.innerHTML += `<option value="${value}">${value}</option>`;
            });
        } catch (error) {
            console.error(`Errore caricamento filtro ${columnName}:`, error);
            selectElement.innerHTML = `<option value="">Errore</option>`;
        }
    };

    await Promise.all([
        populateFilter('reparto_appartenenza', repartoFilter),
        populateFilter('reparto_provenienza', provenienzaFilter),
        populateFilter('diagnosi', diagnosiFilter)
    ]);

    const drawChart = async () => {
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border"></div></div>';
        try {
            let query = supabase.from('pazienti').select('diagnosi');

            if (repartoFilter.value) query = query.eq('reparto_appartenenza', repartoFilter.value);
            if (provenienzaFilter.value) query = query.eq('reparto_provenienza', provenienzaFilter.value);
            if (diagnosiFilter.value) query = query.eq('diagnosi', diagnosiFilter.value);
            if (assistenzaFilter.value) query = query.eq('livello_assistenza', assistenzaFilter.value);
            if (startDateFilter.value) query = query.gte('data_ricovero', startDateFilter.value);
            if (endDateFilter.value) query = query.lte('data_ricovero', endDateFilter.value);

            const { data, error } = await query;
            if (error) throw error;

            if (data.length === 0) {
                chartContainer.innerHTML = '<p class="text-muted text-center mt-5">Nessun dato trovato per i filtri selezionati.</p>';
                return;
            }
            
            const counts = data.reduce((acc, { diagnosi }) => (acc[diagnosi] = (acc[diagnosi] || 0) + 1, acc), {});
            const dataTable = google.visualization.arrayToDataTable([['Diagnosi', 'Numero'], ...Object.entries(counts)]);
            const options = {
                pieHole: 0.4,
                legend: { position: 'labeled' },
                chartArea: { left: 10, top: 20, width: '90%', height: '85%' }
            };
            new google.visualization.PieChart(chartContainer).draw(dataTable, options);
        } catch (error) {
            chartContainer.innerHTML = `<div class="alert alert-danger">Errore: ${error.message}</div>`;
        }
    };

    applyButton.addEventListener('click', drawChart);
    backButton.addEventListener('click', () => navigateTo('home'));
}

async function initListView() {
    const tableBody = document.getElementById('pazienti-table-body');
    const searchInput = document.getElementById('list-search');
    const repartoFilter = document.getElementById('list-filter-reparto');
    const diagnosiFilter = document.getElementById('list-filter-diagnosi');
    const statoFilter = document.getElementById('list-filter-stato');
    const backButton = tableBody.closest('.card').querySelector('button[data-view="home"]');
    
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border"></div></td></tr>';

    try {
        const { data: pazienti, error } = await supabase
            .from('pazienti')
            .select('*')
            .order('cognome', { ascending: true });

        if (error) throw error;

        // Popola filtri
        const populateFilter = (columnName, selectElement) => {
            const uniqueValues = [...new Set(pazienti.map(p => p[columnName]))].sort();
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                if(value) selectElement.innerHTML += `<option value="${value}">${value}</option>`;
            });
        };
        populateFilter('reparto_appartenenza', repartoFilter);
        populateFilter('diagnosi', diagnosiFilter);

        const applyFilters = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const reparto = repartoFilter.value;
            const diagnosi = diagnosiFilter.value;
            const stato = statoFilter.value;

            const filteredPazienti = pazienti.filter(p => {
                const searchMatch = p.nome.toLowerCase().includes(searchTerm) || p.cognome.toLowerCase().includes(searchTerm);
                const repartoMatch = !reparto || p.reparto_appartenenza === reparto;
                const diagnosiMatch = !diagnosi || p.diagnosi === diagnosi;
                const statoMatch = !stato || (stato === 'attivo' && !p.data_dimissione) || (stato === 'dimesso' && p.data_dimissione);
                
                return searchMatch && repartoMatch && diagnosiMatch && statoMatch;
            });
            renderTable(filteredPazienti);
        };

        const renderTable = (pazientiToRender) => {
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
        };

        renderTable(pazienti);

        // Aggiungi event listeners ai filtri
        [searchInput, repartoFilter, diagnosiFilter, statoFilter].forEach(el => {
            el.addEventListener('input', applyFilters);
        });

        // Aggiungi event listener per i pulsanti di azione
        tableBody.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            if (!action || !id) return;

            if (action === 'edit') {
                sessionStorage.setItem('editPazienteId', id);
                navigateTo('inserimento');
            } else if (action === 'delete') {
                // Logica di eliminazione
                const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
                const confirmBtn = document.getElementById('confirm-delete-btn');
                
                const handleDelete = async () => {
                    try {
                        const { error } = await supabase.from('pazienti').delete().eq('id', id);
                        if (error) throw error;
                        
                        // Rimuovi la riga dalla tabella e ricarica i dati
                        initListView();

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

    } catch (error) {
        console.error('Errore caricamento elenco pazienti:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Errore: ${error.message}</td></tr>`;
    }

    backButton.addEventListener('click', () => navigateTo('home'));
}


/**
 * Mostra un messaggio all'utente.
 * @param {string} message - Il testo del messaggio.
 * @param {string} type - Il tipo di messaggio ('success', 'error', 'info').
 * @param {string} containerId - L'ID del contenitore del messaggio.
 */
function mostraMessaggio(message, type = 'info', containerId = 'messaggio-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertType = type === 'error' ? 'danger' : type; // Bootstrap usa 'danger' per gli errori
    const icon = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    }[type];

    container.innerHTML = `
        <div class="alert alert-${alertType} d-flex align-items-center" role="alert">
            <span class="material-icons me-2">${icon}</span>
            <div>${message}</div>
        </div>
    `;
}


// --- AUTENTICAZIONE ---
function updateAuthUI(session) {
    authContainer.innerHTML = '';
    const template = session ? templates.logout : templates.login;
    const content = template.content.cloneNode(true);
    if (session) {
        content.getElementById('user-email').textContent = session.user.email;
        content.getElementById('logout-button').addEventListener('click', () => supabase.auth.signOut());
    } else {
        content.getElementById('login-button').addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }));
    }
    authContainer.appendChild(content);
}

// --- EVENT LISTENERS ---
window.addEventListener('hashchange', renderView);
window.addEventListener('load', () => {
    supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
        renderView();
    });
});
