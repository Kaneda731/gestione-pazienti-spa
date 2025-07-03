// src/js/router.js
import { supabase } from './supabase.js';
import { appContainer, templates } from './ui.js';
import { initInserimentoView } from './views/form.js';
import { initDimissioneView } from './views/dimissione.js';
import { initGraficoView } from './views/grafico.js';
import { initListView } from './views/list.js';

const viewInitializers = {
    inserimento: initInserimentoView,
    dimissione: initDimissioneView,
    grafico: initGraficoView,
    list: initListView,
};

export function navigateTo(viewName) {
    window.location.hash = viewName;
}

export async function renderView() {
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

    // Inizializza la logica specifica della vista
    const initializer = viewInitializers[viewToRender];
    if (initializer) {
        initializer();
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
}
