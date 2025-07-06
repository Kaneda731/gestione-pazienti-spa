// src/js/router.js
import { supabase } from './supabase.js';
import { checkDevelopmentBypass } from './auth.js';
import { appContainer, templates } from './ui.js';
import { initInserimentoView } from './views/form.js';
import { initDimissioneView } from './views/dimissione.js';
import { initGraficoView } from './views/grafico.js';
import { initListView } from './views/list.js';
import { initDiagnosiView } from './views/diagnosi.js';

const viewInitializers = {
    inserimento: initInserimentoView,
    dimissione: initDimissioneView,
    grafico: initGraficoView,
    list: initListView,
    diagnosi: initDiagnosiView,
};

export function navigateTo(viewName) {
    window.location.hash = viewName;
}

export async function renderView() {
    const hash = window.location.hash.substring(1) || 'home';
    const [requestedViewName, queryString] = hash.split('?');
    const urlParams = new URLSearchParams(queryString);

    const protectedViews = ['inserimento', 'dimissione', 'grafico', 'list', 'diagnosi'];
    
    const { data: { session } } = await supabase.auth.getSession();

    let viewToRender = requestedViewName;
    let template;

    if (protectedViews.includes(requestedViewName) && !session) {
        localStorage.setItem('redirectUrl', hash); // Salva l'URL desiderato
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

    // Inizializza la logica specifica della vista, passando i parametri URL
    const initializer = viewInitializers[viewToRender];
    if (initializer) {
        initializer(urlParams); // Passa gli URLSearchParams alla funzione di init
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
    } else if (viewToRender === 'loginRequired') {
        const loginButton = document.getElementById('login-prompt-button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                supabase.auth.signInWithOAuth({ provider: 'google' });
            });
        }
    }
    
    // Integrazione con navigazione mobile
    if (window.mobileNav) {
        window.mobileNav.setCurrentView(viewToRender);
    }
    
    // Emetti evento per aggiornare navigazione mobile
    const viewChangeEvent = new CustomEvent('viewChanged', {
        detail: { view: viewToRender, params: urlParams }
    });
    document.dispatchEvent(viewChangeEvent);
    
    // Inizializza custom select per tutte le viste (fallback)
    setTimeout(() => {
        if (window.initCustomSelects) {
            window.initCustomSelects();
        }
    }, 200);
}
