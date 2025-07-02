// --- CONFIGURAZIONE ---
const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

// --- INIZIALIZZAZIONE ---
if (!window.supabase) {
    alert('Errore critico: Libreria Supabase non trovata.');
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: sessionStorage, // Usa sessionStorage per memorizzare lo stato di login
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
    login: document.getElementById('auth-login'),
    logout: document.getElementById('auth-logout'),
};

// --- ROUTER ---
function navigateTo(viewName) {
    window.location.hash = viewName;
}

function renderView() {
    const viewName = window.location.hash.substring(1) || 'home';
    const template = templates[viewName] || templates.home;

    appContainer.innerHTML = '';
    const viewContent = template.content.cloneNode(true);
    appContainer.appendChild(viewContent);

    // Aggiungi event listener per le card del menu se siamo nella home
    if (viewName === 'home') {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => navigateTo(card.dataset.view));
        });
    }
    
    // Qui in futuro chiameremo le funzioni di inizializzazione per ogni vista
    if (viewName === 'inserimento') initInserimentoView();
    if (viewName === 'dimissione') initDimissioneView();
    if (viewName === 'grafico') initGraficoView();
}

// --- FUNZIONI SPECIFICHE PER VISTA ---

/**
 * Inizializza la logica per il modulo di inserimento paziente.
 */
function initInserimentoView() {
    const form = document.getElementById('form-inserimento');
    const backButton = form.closest('.card').querySelector('button[data-view="home"]');

    // Imposta la data di oggi come default
    const today = new Date().toISOString().split('T')[0];
    form.querySelector('#data_ricovero').value = today;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Validazione base (HTML5 required attribute fa il grosso)
        if (!form.checkValidity()) {
            mostraMessaggio('Per favore, compila tutti i campi obbligatori.', 'error', 'messaggio-container');
            return;
        }

        const formData = new FormData(form);
        const paziente = Object.fromEntries(formData.entries());

        // Disabilita il pulsante e mostra lo spinner
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvataggio...';
        mostraMessaggio('Salvataggio in corso...', 'info', 'messaggio-container');

        try {
            const { error } = await supabase.from('pazienti').insert([paziente]);

            if (error) {
                throw error;
            }

            mostraMessaggio('Paziente inserito con successo!', 'success', 'messaggio-container');
            form.reset();
            form.querySelector('#data_ricovero').value = today; // Reimposta la data
            setTimeout(() => navigateTo('home'), 2000); // Torna al menu dopo 2 secondi

        } catch (error) {
            console.error('Errore salvataggio paziente:', error);
            mostraMessaggio(`Errore nel salvataggio: ${error.message}`, 'error', 'messaggio-container');
        } finally {
            // Riabilita il pulsante
            submitButton.disabled = false;
            submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Paziente';
        }
    });

    backButton.addEventListener('click', () => navigateTo('home'));
}

/**
 * Inizializza la logica per la vista di dimissione paziente.
 */
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
            mostraMessaggio('Inserisci almeno 2 caratteri per la ricerca.', 'info', 'messaggio-container-dimissione');
            return;
        }

        resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        try {
            const { data, error } = await supabase
                .from('pazienti')
                .select('id, nome, cognome, data_ricovero')
                .ilike('cognome', `%${searchTerm}%`) // Cerca cognomi che contengono il termine
                .is('data_dimissione', null) // Cerca solo pazienti non ancora dimessi
                .order('cognome');

            if (error) throw error;

            resultsContainer.innerHTML = '';
            if (data.length === 0) {
                resultsContainer.innerHTML = '<p class="text-center text-muted">Nessun paziente trovato.</p>';
                return;
            }

            data.forEach(paziente => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = `${paziente.cognome} ${paziente.nome} (Ricovero: ${new Date(paziente.data_ricovero).toLocaleDateString()})`;
                item.addEventListener('click', () => {
                    selectedPazienteId = paziente.id;
                    document.getElementById('selected-paziente-nome').textContent = `${paziente.cognome} ${paziente.nome}`;
                    document.getElementById('selected-paziente-ricovero').textContent = new Date(paziente.data_ricovero).toLocaleDateString();
                    dimissioneForm.classList.remove('d-none');
                    resultsContainer.innerHTML = ''; // Pulisce i risultati
                    searchInput.value = ''; // Pulisce la ricerca
                });
                resultsContainer.appendChild(item);
            });

        } catch (error) {
            console.error('Errore ricerca paziente:', error);
            mostraMessaggio(`Errore nella ricerca: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    };

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    searchButton.addEventListener('click', handleSearch);

    dimissioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataDimissione = document.getElementById('data_dimissione').value;
        if (!selectedPazienteId || !dataDimissione) {
            mostraMessaggio('Seleziona un paziente e una data di dimissione.', 'error', 'messaggio-container-dimissione');
            return;
        }

        try {
            const { error } = await supabase
                .from('pazienti')
                .update({ data_dimissione: dataDimissione })
                .eq('id', selectedPazienteId);

            if (error) throw error;

            mostraMessaggio('Paziente dimesso con successo!', 'success', 'messaggio-container-dimissione');
            dimissioneForm.classList.add('d-none');
            setTimeout(() => navigateTo('home'), 2000);

        } catch (error) {
            console.error('Errore dimissione paziente:', error);
            mostraMessaggio(`Errore nella dimissione: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    });

    backButton.addEventListener('click', () => navigateTo('home'));
}

/**
 * Inizializza la logica per la vista del grafico.
 */
async function initGraficoView() {
    const repartoFilter = document.getElementById('filter-reparto');
    const assistenzaFilter = document.getElementById('filter-assistenza');
    const applyButton = document.getElementById('apply-filters-btn');
    const chartContainer = document.getElementById('chart-container');
    const backButton = chartContainer.closest('.card').querySelector('button[data-view="home"]');

    // Carica Google Charts
    google.charts.load('current', { 'packages': ['corechart'] });

    // Popola il filtro dei reparti
    try {
        const { data, error } = await supabase.from('pazienti').select('reparto_appartenenza');
        if (error) throw error;
        
        const reparti = [...new Set(data.map(item => item.reparto_appartenenza))].sort();
        repartoFilter.innerHTML = '<option value="">Tutti</option>';
        reparti.forEach(reparto => {
            if(reparto) {
                const option = document.createElement('option');
                option.value = reparto;
                option.textContent = reparto;
                repartoFilter.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Errore caricamento reparti:', error);
        mostraMessaggio('Impossibile caricare i filtri dei reparti.', 'error');
    }

    const drawChart = async () => {
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        try {
            let query = supabase.from('pazienti').select('diagnosi');

            // Applica filtri
            if (repartoFilter.value) {
                query = query.eq('reparto_appartenenza', repartoFilter.value);
            }
            if (assistenzaFilter.value) {
                query = query.eq('livello_assistenza', assistenzaFilter.value);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data.length === 0) {
                chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><p class="text-muted">Nessun dato trovato per i filtri selezionati.</p></div>';
                return;
            }

            // Aggrega i dati per diagnosi
            const counts = data.reduce((acc, { diagnosi }) => {
                acc[diagnosi] = (acc[diagnosi] || 0) + 1;
                return acc;
            }, {});

            const dataArray = [['Diagnosi', 'Numero Pazienti'], ...Object.entries(counts)];
            const dataTable = google.visualization.arrayToDataTable(dataArray);
            const options = {
                title: 'Distribuzione Diagnosi',
                pieHole: 0.4,
                chartArea: { width: '90%', height: '80%' },
                legend: { position: 'bottom' }
            };
            const chart = new google.visualization.PieChart(chartContainer);
            chart.draw(dataTable, options);

        } catch (error) {
            console.error('Errore disegno grafico:', error);
            chartContainer.innerHTML = `<div class="alert alert-danger">Errore durante il caricamento del grafico: ${error.message}</div>`;
        }
    };

    applyButton.addEventListener('click', drawChart);
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
    if (session) {
        const logoutContent = templates.logout.content.cloneNode(true);
        logoutContent.getElementById('user-email').textContent = session.user.email;
        logoutContent.getElementById('logout-button').addEventListener('click', () => {
            supabase.auth.signOut();
        });
        authContainer.appendChild(logoutContent);
    } else {
        const loginContent = templates.login.content.cloneNode(true);
        loginContent.getElementById('login-button').addEventListener('click', () => {
            supabase.auth.signInWithOAuth({ provider: 'google' });
        });
        authContainer.appendChild(loginContent);
    }
}

// --- EVENT LISTENERS ---
window.addEventListener('hashchange', renderView);
window.addEventListener('load', () => {
    // Gestisce il cambio di stato dell'autenticazione
    supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
        renderView(); // Renderizza la vista corretta dopo il login/logout
    });
});
