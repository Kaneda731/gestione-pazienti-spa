// src/js/router.js
import { supabase } from './supabase.js';
import { initInserimentoView } from './views/form.js';
import { initDimissioneView } from './views/dimissione.js';
import { initGraficoView } from './views/grafico.js';
import { initListView } from './views/list.js';
import { initDiagnosiView } from './views/diagnosi.js';
import { currentUser } from './auth.js'; // Importa lo stato dell'utente

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

    const protectedViews = ['inserimento', 'dimissione', 'grafico', 'list', 'diagnosi', 'home'];
    
    const session = currentUser.session;

    let viewToRender = requestedViewName;
    let viewHtml;

    if (protectedViews.includes(requestedViewName) && !session) {
        sessionStorage.setItem('redirectUrl', hash);
        viewToRender = 'login-required';
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
    
    const viewChangeEvent = new CustomEvent('viewChanged', {
        detail: { view: viewToRender, params: urlParams }
    });
    document.dispatchEvent(viewChangeEvent);
}
