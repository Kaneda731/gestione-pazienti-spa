// src/app/router.js

import { supabase } from '../core/services/supabaseClient.js';
import { currentUser } from '../core/auth/authService.js';
import { ROUTES, USER_ROLES } from './config/constants.js';

// Import delle view (aggiornati con nuovi percorsi)
import { initInserimentoView } from '../features/patients/views/form.js';
import { initDimissioneView } from '../features/patients/views/dimissione.js';
import { initGraficoView } from '../features/charts/views/grafico.js';
import { initListView } from '../features/patients/views/list.js';
import { initDiagnosiView } from '../features/diagnoses/views/diagnosi.js';

const viewInitializers = {
    'inserimento': initInserimentoView,
    'dimissione': initDimissioneView,
    'grafico': initGraficoView,
    'list': initListView,
    'diagnosi': initDiagnosiView,
};

const viewCache = new Map();
const views = import.meta.glob('/src/views/*.html', { query: '?raw', import: 'default' });

async function fetchView(viewName) {
    if (viewCache.has(viewName)) {
        return viewCache.get(viewName);
    }

    const path = `/src/views/${viewName}.html`;
    if (!views[path]) {
        console.error(`Vista non trovata: ${viewName} (path cercato: ${path})`);
        return await fetchView('home'); // Fallback alla home
    }

    try {
        const viewContent = await views[path]();
        viewCache.set(viewName, viewContent);
        return viewContent;
    } catch (error) {
        console.error(`Errore nel caricamento della vista ${viewName}:`, error);
        return await fetchView('home');
    }
}

export function navigateTo(viewName) {
    window.location.hash = viewName;
}

function updateUIVisibility() {
    const userRole = currentUser.profile?.role;

    // Definisci qui i permessi per ogni vista/card.
    // Un utente può accedere a una vista se il suo ruolo è in questa lista.
    const viewPermissions = {
        'inserimento': ['admin', 'editor'],
        'list': ['admin', 'editor', 'viewer'],
        'grafico': ['admin', 'editor', 'viewer'],
        'diagnosi': ['admin'],
        'dimissione': ['admin', 'editor']
    };

    // Itera su tutte le card del menu e applica i permessi
    document.querySelectorAll('.menu-card').forEach(card => {
        const viewName = card.dataset.view;
        
        // Se la vista ha dei permessi definiti
        if (viewPermissions[viewName]) {
            // Controlla se il ruolo dell'utente è incluso nella lista dei permessi
            if (viewPermissions[viewName].includes(userRole)) {
                card.style.display = 'block'; // Mostra la card
            } else {
                card.style.display = 'none';  // Nascondi la card
            }
        }
    });
}

export async function renderView() {
    console.log('🚀 RenderView chiamato:', { 
        location: window.location.href,
        hash: window.location.hash,
        origin: window.location.origin,
        userSession: !!currentUser.session,
        userRole: currentUser.profile?.role,
        userProfile: currentUser.profile
    });
    

    // Se l'hash contiene i token di autenticazione, è un redirect da Supabase.
    // Il listener onAuthStateChange è la fonte di verità per gestire questo.
    // Non facciamo nulla e aspettiamo che si attivi e chiami un render pulito.
    if (window.location.hash.includes('access_token=') && window.location.hash.includes('refresh_token=')) {
        console.log('Rilevato callback OAuth, aspetto che sia processato...');
        return;
    }

    // Controllo di sicurezza: non renderizzare se lo stato utente non è ancora definito.
    if (currentUser.session === undefined) {
        console.log("Render interrotto: stato di autenticazione non ancora pronto.");
        return;
    }

    // PATCH: se non loggato e la view è home o list, mostra login-required invece della pagina vuota
    const hashView = window.location.hash.replace(/^#/, '');
    if (!currentUser.session && (hashView === '' || hashView === 'home' || hashView === 'list')) {
        window.location.hash = 'login-required';
        return;
    }

    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error("Fatal: #app-container non trovato. L'app non può essere renderizzata.");
        return;
    }

    document.body.classList.remove('custom-select-modal-open');

    const hash = window.location.hash.substring(1) || 'home';
    const [requestedViewName, queryString] = hash.split('?');
    const urlParams = new URLSearchParams(queryString);

    console.log('🎯 Navigazione richiesta:', { 
        hash, 
        requestedViewName, 
        queryString, 
        urlParams: Object.fromEntries(urlParams) 
    });

    // Definisci qui i permessi per coerenza con updateUIVisibility
    const viewPermissions = {
        'inserimento': ['admin', 'editor'],
        'list': ['admin', 'editor', 'viewer'],
        'grafico': ['admin', 'editor', 'viewer'],
        'diagnosi': ['admin'],
        'dimissione': ['admin', 'editor']
    };
    
    const session = currentUser.session;
    const userRole = currentUser.profile?.role;

    let viewToRender = requestedViewName;
    let viewHtml;

    // Flusso di controllo accessi:
    // 1. Se la vista è protetta e l'utente non è loggato -> vai a login-required
    if (Object.keys(viewPermissions).includes(requestedViewName) && !session) {
        sessionStorage.setItem('redirectUrl', hash);
        viewToRender = 'login-required';
    } 
    // 2. Se l'utente è loggato ma il suo ruolo non ha accesso alla vista -> vai a access-denied
    else if (viewPermissions[requestedViewName] && !viewPermissions[requestedViewName].includes(userRole)) {
        viewToRender = 'access-denied';
    }
    
    viewHtml = await fetchView(viewToRender);
    console.log('Inserendo HTML della vista nel DOM...', { 
        viewToRender, 
        htmlLength: viewHtml.length,
        containsTableBody: viewHtml.includes('pazienti-table-body'),
        containsCardsContainer: viewHtml.includes('pazienti-cards-container')
    });
    appContainer.innerHTML = viewHtml;

    const viewDiv = appContainer.querySelector('.view');
    if (viewDiv) {
        viewDiv.classList.add('active');
        console.log('Vista attivata:', { viewDiv });
    }

    const initializer = viewInitializers[viewToRender];
    if (initializer) {
        console.log('Inizializzatore trovato per:', viewToRender);
        // Usa setTimeout con un delay più lungo per assicurarsi che il DOM sia completamente renderizzato
        setTimeout(async () => {
            console.log('DOM dopo timeout:', {
                tableBody: document.getElementById('pazienti-table-body'),
                cardsContainer: document.getElementById('pazienti-cards-container'),
                viewContainer: document.querySelector('#app-container .view')
            });
            console.log('Chiamando inizializzatore per:', viewToRender);
            await initializer(urlParams);
        }, 100); // Aumentiamo il delay a 100ms
    } else {
        console.log('Nessun inizializzatore per:', viewToRender);
    }
    
    if (viewToRender === 'home') {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const view = card.dataset.view;
                console.log('🎯 Click su menu card:', view);
                if (view === 'inserimento') {
                    sessionStorage.removeItem('editPazienteId');
                }
                navigateTo(view);
            });
        });
    } else if (viewToRender === 'login-required') {
        // Mostra automaticamente il modal di login se presente, altrimenti focus/bottone
        setTimeout(() => {
            // Prova a mostrare il modal Bootstrap se esiste
            const authModal = document.getElementById('auth-modal');
            if (authModal && window.bootstrap) {
                const modal = window.bootstrap.Modal.getOrCreateInstance(authModal);
                modal.show();
            } else {
                // Fallback: focus sul bottone login
                const loginButton = document.getElementById('login-prompt-button');
                if (loginButton) {
                    loginButton.focus();
                }
            }
        }, 200);
        // Sempre: collega il bottone login
        const loginButton = document.getElementById('login-prompt-button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                supabase.auth.signInWithOAuth({ provider: 'google' });
            });
        }
    }
    
    if (viewToRender === 'home') {
        updateUIVisibility();
    }

    const viewChangeEvent = new CustomEvent('viewChanged', {
        detail: { view: viewToRender, params: urlParams }
    });
    document.dispatchEvent(viewChangeEvent);
}