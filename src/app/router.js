// src/app/router.js

import { supabase } from '../core/services/supabaseClient.js';
import { currentUser } from '../core/auth/authService.js';

let currentViewCleanup = null;
let isNavigating = false;

// Definisce i percorsi dei moduli delle viste per il caricamento dinamico
const viewModules = {
    'inserimento': () => import('../features/patients/views/form.js'),
    'dimissione': () => import('../features/patients/views/dimissione.js'),
    'grafico': () => import('../features/charts/views/grafico.js'),
    'list': () => import('../features/patients/views/list.js'),
    'diagnosi': () => import('../features/diagnoses/views/diagnosi.js'),
};

const viewCache = new Map();
const views = import.meta.glob('/src/views/*.html', { query: '?raw', import: 'default' });

function updateUIVisibility() {
    const userRole = currentUser.profile?.role;
    console.log('Updating UI visibility based on role:', userRole);

    const viewPermissions = {
        'inserimento': ['admin', 'editor'],
        'list': ['admin', 'editor', 'viewer'],
        'grafico': ['admin', 'editor', 'viewer'],
        'diagnosi': ['admin'],
        'dimissione': ['admin', 'editor']
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

export async function renderView() {
    if (isNavigating) {
        console.warn('Navigazione già in corso, interrotta.');
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

        viewContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center" style="height: 80vh;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        const hash = window.location.hash.substring(1) || 'home';
        const [requestedViewName, queryString] = hash.split('?');
        const urlParams = new URLSearchParams(queryString);

        console.log('Router: Hash corrente:', hash);
        console.log('Router: Vista richiesta:', requestedViewName);
        console.log('Router: Sessione utente presente:', !!currentUser.session);
        console.log('Router: Ruolo utente:', currentUser.profile?.role);

        const viewPermissions = {
            'inserimento': ['admin', 'editor'],
            'list': ['admin', 'editor', 'viewer'],
            'grafico': ['admin', 'editor', 'viewer'],
            'diagnosi': ['admin'],
            'dimissione': ['admin', 'editor']
        };
        
        let viewToRender = requestedViewName;
        if (Object.keys(viewPermissions).includes(requestedViewName) && !currentUser.session) {
            console.log('Router: Utente non autenticato, reindirizzo a login-required.');
            sessionStorage.setItem('redirectUrl', hash);
            viewToRender = 'login-required';
        } else if (viewPermissions[requestedViewName] && !viewPermissions[requestedViewName].includes(currentUser.profile?.role)) {
            if(currentUser.profile) {
              console.log('Router: Permessi insufficienti per la vista ', requestedViewName, ', reindirizzo a access-denied.');
              viewToRender = 'access-denied';
            }
        }
        console.log('Router: Vista finale da renderizzare:', viewToRender);
        
        // Carica l'HTML per la vista richiesta
        const viewHtml = await fetchView(viewToRender);
        viewContainer.innerHTML = viewHtml;

        // Attiva la vista per le animazioni CSS
        const newView = viewContainer.querySelector('.view');
        if (newView) {
            setTimeout(() => newView.classList.add('active'), 10);
        }

        // Carica e inizializza il modulo JS corrispondente, se esiste
        const moduleLoader = viewModules[viewToRender];
        console.log('Router: Modulo loader per ', viewToRender, ':', !!moduleLoader);
        if (moduleLoader) {
            const module = await moduleLoader();
            console.log('Router: Modulo caricato per ', viewToRender, ':', module);
            if (viewToRender === 'list') {
                const listData = await module.fetchListData();
                currentViewCleanup = await module.initListView(listData);
            } else if (viewToRender === 'diagnosi') {
                // Accesso diretto all'inizializzatore per la vista diagnosi
                console.log('Router: Accesso diretto a initDiagnosiView per ', viewToRender);
                currentViewCleanup = await module.initDiagnosiView(urlParams);
            } else if (viewToRender === 'grafico') {
                // Accesso diretto all'inizializzatore per la vista grafico
                console.log('Router: Accesso diretto a initGraficoView per ', viewToRender);
                currentViewCleanup = await module.initGraficoView(urlParams);
            } else if (viewToRender === 'inserimento') {
                // Accesso diretto all'inizializzatore per la vista inserimento
                console.log('Router: Accesso diretto a initInserimentoView per ', viewToRender);
                currentViewCleanup = await module.initInserimentoView(urlParams);
            } else {
                const initializer = Object.values(module).find(fn => typeof fn === 'function' && fn.name.startsWith('init'));
                console.log('Router: Inizializzatore trovato per ', viewToRender, ':', !!initializer);
                if (initializer) {
                    currentViewCleanup = await initializer(urlParams);
                }
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
            viewContainer.innerHTML = '<div class="alert alert-danger m-3">Si è verificato un errore critico. Si prega di ricaricare la pagina.</div>';
        }
    } finally {
        isNavigating = false;
    }
}