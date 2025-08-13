import { supabase } from '../core/services/supabase/supabaseClient.js';
import { currentUser } from '../core/auth/authService.js';
import { logger } from '../core/services/logger/loggerService.js';
import { isDevelopment } from './config/environment.js';
import { sanitizeHtml } from '../shared/utils/sanitizeHtml.js';

let currentViewCleanup = null;
let isNavigating = false;

// Utility per retry di import dinamici con backoff esponenziale
async function retryImport(importFn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await importFn();
        } catch (error) {
            lastError = error;
            logger.warn(`Tentativo ${attempt}/${maxRetries} fallito per import dinamico:`, error.message);
            
            // Se è l'ultimo tentativo, rilancia l'errore
            if (attempt === maxRetries) {
                throw lastError;
            }
            
            // Attendi con backoff esponenziale prima del prossimo tentativo
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Definisce i percorsi dei moduli delle viste per il caricamento dinamico
const viewModules = {
    'inserimento': () => import('../features/patients/views/form.js'),
    'dimissione': () => import('../features/patients/views/dimissione.js'),
    'grafico': () => import('../features/charts/views/grafico.js'),
    'list': () => import('../features/patients/views/list.js'),
    'diagnosi': () => import('../features/diagnoses/views/diagnosi.js'),
    'eventi-clinici': () => import('../features/eventi-clinici/views/eventi-clinici.js'),
};

const viewCache = new Map();
const views = import.meta.glob('/src/views/*.html', { query: '?raw', import: 'default' });

function updateUIVisibility() {
    const userRole = currentUser.profile?.role;
    logger.log('Updating UI visibility based on role:', userRole);

    const viewPermissions = {
        'inserimento': ['admin', 'editor'],
        'list': ['admin', 'editor', 'viewer'],
        'grafico': ['admin', 'editor', 'viewer'],
        'diagnosi': ['admin'],
        'dimissione': ['admin', 'editor'],
        'eventi-clinici': ['admin', 'editor']
    };

    document.querySelectorAll('.menu-card').forEach(card => {
        const viewName = card.dataset.view;
        if (viewPermissions[viewName]) {
            if (userRole && viewPermissions[viewName].includes(userRole)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Ascolta l'evento custom per aggiornare la UI quando il profilo è pronto
window.addEventListener('auth-profile-loaded', updateUIVisibility);


async function fetchView(viewName) {
    if (viewCache.has(viewName)) {
        return viewCache.get(viewName);
    }

    const path = `/src/views/${viewName}.html`;
    if (!views[path]) {
        console.error(`Vista non trovata: ${viewName} (path cercato: ${path})`);
        logger.error(`Vista HTML non trovata: ${viewName}`);
        
        // Evita loop infinito se anche home fallisce
        if (viewName !== 'home') {
            return await fetchView('home'); // Fallback alla home
        } else {
            // Fallback di emergenza se anche home non esiste
            return `
                <div class="container mt-4">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Errore critico</h4>
                        <p>Impossibile caricare le viste dell'applicazione.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Ricarica pagina</button>
                    </div>
                </div>
            `;
        }
    }

    try {
        const viewContent = await views[path]();
        
        // Verifica che il contenuto sia valido
        if (!viewContent || typeof viewContent !== 'string') {
            throw new Error(`Contenuto vista ${viewName} non valido`);
        }
        
        viewCache.set(viewName, viewContent);
        return viewContent;
    } catch (error) {
        console.error('Errore nel caricamento della vista:', viewName, error);
        logger.error(`Fallimento caricamento vista HTML ${viewName}:`, error);
        
        // Evita loop infinito se anche home fallisce
        if (viewName !== 'home') {
            return await fetchView('home');
        } else {
            // Fallback di emergenza
            return `
                <div class="container mt-4">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Errore di caricamento</h4>
                        <p>Si è verificato un errore nel caricamento della vista.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Ricarica pagina</button>
                        ${isDevelopment ? `<details class="mt-3"><summary>Dettagli tecnici</summary><pre class="small mt-2">${error.stack || error.message}</pre></details>` : ''}
                    </div>
                </div>
            `;
        }
    }
}

export function navigateTo(viewName) {
    window.location.hash = viewName;
}

export async function renderView() {
    if (isNavigating) {
        logger.warn('Navigazione già in corso, interrotta.');
        return;
    }
    isNavigating = true;

    const viewContainer = document.getElementById('view-container');

    try {
        if (typeof currentViewCleanup === 'function') {
            currentViewCleanup();
            currentViewCleanup = null;
        }

        if (window.location.hash.includes('access_token=')) return;
        if (currentUser.session === undefined) return;

        const hashView = window.location.hash.replace(/^#/, '');
        if (!currentUser.session && (hashView === '' || hashView === 'home' || hashView === 'list')) {
            window.location.hash = 'login-required';
            return;
        }

        if (!viewContainer) {
            console.error("Fatal: #view-container non trovato.");
            return;
        }

        viewContainer.innerHTML = sanitizeHtml('<div class="d-flex justify-content-center align-items-center" style="height: 80vh;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');

        const hash = window.location.hash.substring(1) || 'home';
        const [requestedViewName, queryString] = hash.split('?');
        const urlParams = new URLSearchParams(queryString);

        const viewPermissions = {
            'inserimento': ['admin', 'editor'],
            'list': ['admin', 'editor', 'viewer'],
            'grafico': ['admin', 'editor', 'viewer'],
            'diagnosi': ['admin'],
            'dimissione': ['admin', 'editor'],
            'eventi-clinici': ['admin', 'editor']
        };
        
        let viewToRender = requestedViewName;
        if (Object.keys(viewPermissions).includes(requestedViewName) && !currentUser.session) {
            sessionStorage.setItem('redirectUrl', hash);
            viewToRender = 'login-required';
        } else if (viewPermissions[requestedViewName] && !viewPermissions[requestedViewName].includes(currentUser.profile?.role)) {
            if(currentUser.profile) {
              viewToRender = 'access-denied';
            }
        }
        
        // Carica l'HTML per la vista richiesta
        const viewHtml = await fetchView(viewToRender);
        viewContainer.innerHTML = sanitizeHtml(viewHtml);

        // Attiva la vista per le animazioni CSS
        const newView = viewContainer.querySelector('.view');
        if (newView) {
            // Forza il reflow prima di aggiungere la classe active
            newView.offsetHeight;
            newView.classList.add('active');
        }

        // Carica e inizializza il modulo JS corrispondente, se esiste
        const moduleLoader = viewModules[viewToRender];
        if (moduleLoader) {
            try {
                // Usa retry per gestire connessioni lente o instabili
                const module = await retryImport(moduleLoader);
                
                // Verifica che il modulo sia stato caricato correttamente
                if (!module) {
                    throw new Error(`Modulo ${viewToRender} caricato ma vuoto`);
                }
                
                if (viewToRender === 'list') {
                    const listData = await module.fetchListData();
                    currentViewCleanup = await module.initListView(listData);
                } else if (viewToRender === 'diagnosi') {
                    // Accesso diretto all'inizializzatore per la vista diagnosi
                    currentViewCleanup = await module.initDiagnosiView(urlParams);
                } else if (viewToRender === 'grafico') {
                    // Accesso diretto all'inizializzatore per la vista grafico
                    currentViewCleanup = await module.initGraficoView(urlParams);
                } else if (viewToRender === 'inserimento') {
                    // Accesso diretto all'inizializzatore per la vista inserimento
                    currentViewCleanup = await module.initInserimentoView(urlParams);
                } else if (viewToRender === 'dimissione') {
                    // Accesso diretto all'inizializzatore per la vista dimissione
                    currentViewCleanup = await module.initDimissioneView(urlParams);
                } else if (viewToRender === 'eventi-clinici') {
                    // Accesso diretto all'inizializzatore per la vista eventi clinici
                    currentViewCleanup = await module.initEventiCliniciView(urlParams);
                } else {
                    const initializer = Object.values(module).find(fn => typeof fn === 'function' && fn.name.startsWith('init'));
                    if (initializer) {
                        currentViewCleanup = await initializer(urlParams);
                    }
                }
            } catch (moduleError) {
                console.error('Errore nel caricamento del modulo:', viewToRender, moduleError);
                logger.error(`Fallimento caricamento modulo ${viewToRender}:`, moduleError);
                
                // Fallback: mostra un messaggio di errore user-friendly
                viewContainer.innerHTML = sanitizeHtml(`
                    <div class="container mt-4">
                        <div class="alert alert-warning" role="alert">
                            <h4 class="alert-heading">
                                <span class="material-icons me-2" style="vertical-align: middle;">warning</span>
                                Problema di caricamento
                            </h4>
                            <p>Si è verificato un problema nel caricamento di questa sezione dell'applicazione.</p>
                            <hr>
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary" onclick="location.reload()">
                                    <span class="material-icons me-1" style="vertical-align: middle;">refresh</span>
                                    Ricarica pagina
                                </button>
                                <button class="btn btn-outline-secondary" onclick="window.location.hash = 'home'">
                                    <span class="material-icons me-1" style="vertical-align: middle;">home</span>
                                    Torna alla home
                                </button>
                            </div>
                            ${isDevelopment ? `<details class="mt-3"><summary>Dettagli tecnici (solo sviluppo)</summary><pre class="small mt-2">${moduleError.stack || moduleError.message}</pre></details>` : ''}
                        </div>
                    </div>
                `);
                
                // Non bloccare l'esecuzione, l'utente può comunque navigare
                return;
            }
        } else if (viewToRender === 'home') {
            // Gestione specifica per la home (che non ha modulo JS)
            updateUIVisibility();
            document.querySelectorAll('.menu-card').forEach(card => {
                card.addEventListener('click', () => {
                    const view = card.dataset.view;
                    if (view === 'inserimento') sessionStorage.removeItem('editPazienteId');
                    navigateTo(view);
                });
            });
        } else if (viewToRender === 'login-required') {
            // Gestione per la pagina di login
            const loginButton = document.getElementById('login-prompt-button');
            if (loginButton) {
                loginButton.addEventListener('click', () => {
                    supabase.auth.signInWithOAuth({ provider: 'google' });
                });
            }
        }

        const viewChangeEvent = new CustomEvent('viewChanged', {
            detail: { view: viewToRender, params: urlParams }
        });
        document.dispatchEvent(viewChangeEvent);

    } catch (error) {
        console.error('Errore durante il rendering della vista:', error);
        if(viewContainer) {
            viewContainer.innerHTML = sanitizeHtml('<div class="alert alert-danger m-3">Si è verificato un errore critico. Si prega di ricaricare la pagina.</div>');
        }
    } finally {
        isNavigating = false;
    }
}