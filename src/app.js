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
    const protectedViews = ['inserimento', 'dimissione', 'grafico'];
    
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
            card.addEventListener('click', () => navigateTo(card.dataset.view));
        });
    } else if (viewToRender === 'inserimento') {
        initInserimentoView();
    } else if (viewToRender === 'dimissione') {
        initDimissioneView();
    } else if (viewToRender === 'grafico') {
        initGraficoView();
    } else if (viewToRender === 'loginRequired') {
        document.getElementById('login-prompt-button').addEventListener('click', () => {
            supabase.auth.signInWithOAuth({ provider: 'google' });
        });
    }
}

// --- FUNZIONI SPECIFICHE PER VISTA ---

function initInserimentoView() {
    const form = document.getElementById('form-inserimento');
    const backButton = form.closest('.card').querySelector('button[data-view="home"]');
    const today = new Date().toISOString().split('T')[0];
    form.querySelector('#data_ricovero').value = today;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            mostraMessaggio('Per favore, compila tutti i campi obbligatori.', 'error', 'messaggio-container');
            return;
        }
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...';
        mostraMessaggio('Salvataggio in corso...', 'info', 'messaggio-container');
        
        try {
            // --- MODIFICA CHIAVE ---
            // 1. Recupera l'utente corrente
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Utente non autenticato. Impossibile salvare.');
            }

            // 2. Prepara i dati del paziente dal modulo
            const paziente = Object.fromEntries(new FormData(form));
            
            // 3. Aggiungi esplicitamente l'ID dell'utente ai dati da salvare
            paziente.user_id = user.id;
            // --- FINE MODIFICA ---

            const { error } = await supabase.from('pazienti').insert([paziente]);
            
            if (error) {
                // Se c'è un errore, lo lanciamo per essere catturato dal blocco catch
                throw error;
            }

            mostraMessaggio('Paziente inserito con successo!', 'success', 'messaggio-container');
            form.reset();
            form.querySelector('#data_ricovero').value = today;
            setTimeout(() => navigateTo('home'), 2000);

        } catch (error) {
            console.error('Errore salvataggio paziente:', error);
            mostraMessaggio(`Errore nel salvataggio: ${error.message}`, 'error', 'messaggio-container');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Paziente';
        }
    });
    backButton.addEventListener('click', () => navigateTo('home'));
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
    const applyButton = document.getElementById('apply-filters-btn');
    const chartContainer = document.getElementById('chart-container');
    const backButton = chartContainer.closest('.card').querySelector('button[data-view="home"]');

    google.charts.load('current', { 'packages': ['corechart'] });

    // Funzione helper per popolare i filtri
    const populateFilter = async (columnName, selectElement) => {
        try {
            const { data, error } = await supabase.from('pazienti').select(columnName);
            if (error) throw error;
            
            const uniqueValues = [...new Set(data.map(item => item[columnName]))].sort();
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                if(value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    selectElement.appendChild(option);
                }
            });
        } catch (error) {
            console.error(`Errore caricamento filtro ${columnName}:`, error);
            selectElement.innerHTML = `<option value="">Errore</option>`;
        }
    };

    // Popola tutti i filtri in parallelo
    await Promise.all([
        populateFilter('reparto_appartenenza', repartoFilter),
        populateFilter('reparto_provenienza', provenienzaFilter),
        populateFilter('diagnosi', diagnosiFilter)
    ]);

    const drawChart = async () => {
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border"></div></div>';
        try {
            let query = supabase.from('pazienti').select('diagnosi');

            // Applica filtri dinamicamente
            if (repartoFilter.value) query = query.eq('reparto_appartenenza', repartoFilter.value);
            if (provenienzaFilter.value) query = query.eq('reparto_provenienza', provenienzaFilter.value);
            if (diagnosiFilter.value) query = query.eq('diagnosi', diagnosiFilter.value);
            if (assistenzaFilter.value) query = query.eq('livello_assistenza', assistenzaFilter.value);

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
                // La posizione 'labeled' disegna la legenda con linee che puntano alle fette.
                // È un ottimo compromesso tra leggibilità e spazio.
                legend: { position: 'labeled' },
                // Ottimizziamo l'area del grafico per dare spazio alla legenda.
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

function mostraMessaggio(message, type = 'info', containerId = 'messaggio-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const alertType = type === 'error' ? 'danger' : type;
    container.innerHTML = `<div class="alert alert-${alertType} d-flex align-items-center"><span class="material-icons me-2">${type === 'success' ? 'check_circle' : type}</span><div>${message}</div></div>`;
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
