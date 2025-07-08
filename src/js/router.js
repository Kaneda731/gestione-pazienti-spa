// src/js/router.js
import { supabase } from './services/supabaseClient.js';
import { initInserimentoView } from './views/form.js';
import { initDimissioneView } from './views/dimissione.js';
import { initGraficoView } from './views/grafico.js';
import { initListView } from './views/list.js';
import { initDiagnosiView } from './views/diagnosi.js';
import { currentUser } from './services/authService.js'; // Importa lo stato dell'utente

const viewInitializers = {
    inserimento: initInserimentoView,
    dimissione: initDimissioneView,
    grafico: initGraficoView,
    list: initListView,
    diagnosi: initDiagnosiView,
};

const viewCache = new Map();

async function fetchView(viewName) {
    if (viewCache.has(viewName)) {
        return viewCache.get(viewName);
    }
    try {
        const response = await fetch(`views/${viewName}.html`);
        if (!response.ok) {
            throw new Error(`Vista non trovata: ${viewName}`);
        }
        const text = await response.text();
        viewCache.set(viewName, text);
        return text;
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
    // Controllo di sicurezza: non renderizzare se lo stato utente non è ancora definito.
    // Il rendering corretto verrà triggerato dal callback di initAuth.
    if (currentUser.session === undefined) {
        console.log("Render interrotto: stato di autenticazione non ancora pronto.");
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
    appContainer.innerHTML = viewHtml;

    const viewDiv = appContainer.querySelector('.view');
    if (viewDiv) {
        viewDiv.classList.add('active');
    }

    const initializer = viewInitializers[viewToRender];
    if (initializer) {
        initializer(urlParams);
    } else if (viewToRender === 'home') {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const view = card.dataset.view;
                if (view === 'inserimento') {
                    sessionStorage.removeItem('editPazienteId');
                }
                navigateTo(view);
            });
        });
    } else if (viewToRender === 'login-required') {
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