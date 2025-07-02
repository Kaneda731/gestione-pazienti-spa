console.log('app.js: Script started');

// --- CONFIGURAZIONE ---
const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

console.log('app.js: Supabase config loaded');

// --- INIZIALIZZAZIONE ---
let supabase;
try {
    if (!window.supabase) {
        throw new Error('Supabase library not found on window object.');
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            storage: sessionStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log('app.js: Supabase client created successfully.');
} catch (error) {
    console.error('app.js: FATAL - Supabase client could not be created.', error);
    document.body.innerHTML = `<div class="alert alert-danger">FATAL: Impossibile inizializzare Supabase. Dettagli: ${error.message}</div>`;
}


// --- ELEMENTI DOM E TEMPLATES ---
let appContainer, authContainer, templates;

function initializeDOMReferences() {
    console.log('app.js: Initializing DOM references...');
    appContainer = document.getElementById('app-container');
    authContainer = document.getElementById('auth-container');
    templates = {
        home: document.getElementById('view-home'),
        login: document.getElementById('auth-login'),
        logout: document.getElementById('auth-logout'),
    };

    if (!appContainer || !authContainer || !templates.home || !templates.login || !templates.logout) {
        console.error('app.js: FATAL - One or more essential DOM elements or templates are missing.');
        console.log({ appContainer, authContainer, home: templates.home, login: templates.login, logout: templates.logout });
        return false;
    }
    console.log('app.js: DOM references initialized successfully.');
    return true;
}


// --- ROUTER ---
function renderHome() {
    console.log('app.js: renderHome() called.');
    if (!appContainer || !templates.home) {
        console.error('app.js: Cannot render home, container or template is missing.');
        return;
    }
    try {
        appContainer.innerHTML = '';
        const homeContent = templates.home.content.cloneNode(true);
        appContainer.appendChild(homeContent);
        console.log('app.js: Home view rendered.');
    } catch (error) {
        console.error('app.js: Error while rendering home view.', error);
    }
}

// --- AUTENTICAZIONE ---
function updateAuthUI(session) {
    console.log('app.js: updateAuthUI() called with session:', session);
    if (!authContainer || !templates.login || !templates.logout) {
        console.error('app.js: Cannot update auth UI, container or templates are missing.');
        return;
    }
    authContainer.innerHTML = '';
    if (session) {
        const logoutContent = templates.logout.content.cloneNode(true);
        logoutContent.getElementById('user-email').textContent = session.user.email;
        logoutContent.getElementById('logout-button').addEventListener('click', () => supabase.auth.signOut());
        authContainer.appendChild(logoutContent);
        console.log('app.js: Logout UI rendered.');
    } else {
        const loginContent = templates.login.content.cloneNode(true);
        loginContent.getElementById('login-button').addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }));
        authContainer.appendChild(loginContent);
        console.log('app.js: Login UI rendered.');
    }
}

// --- EVENT LISTENER PRINCIPALE ---
window.addEventListener('load', () => {
    console.log('app.js: window.load event fired.');
    
    if (!initializeDOMReferences()) {
        return; // Stop execution if essential elements are not found
    }

    supabase.auth.onAuthStateChange((event, session) => {
        console.log(`app.js: onAuthStateChange event: ${event}`);
        updateAuthUI(session);
        renderHome(); // Mostra sempre la home per ora
    });
    console.log('app.js: onAuthStateChange listener attached.');
});