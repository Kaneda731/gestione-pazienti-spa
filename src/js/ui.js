// src/js/ui.js

// --- ELEMENTI DOM ---
export const appContainer = document.getElementById('app-container');
export const authContainer = document.getElementById('auth-container');

// Controllo di sicurezza per gli elementi DOM
if (!appContainer) {
    console.error('Elemento app-container non trovato nel DOM');
}
if (!authContainer) {
    console.error('Elemento auth-container non trovato nel DOM');
}

// --- TEMPLATES ---
export const templates = {
    home: document.getElementById('view-home'),
    inserimento: document.getElementById('view-inserimento'),
    dimissione: document.getElementById('view-dimissione'),
    grafico: document.getElementById('view-grafico'),
    list: document.getElementById('view-list'),
    diagnosi: document.getElementById('view-diagnosi'),
    loginRequired: document.getElementById('view-login-required'),
    login: document.getElementById('auth-login'),
    logout: document.getElementById('auth-logout'),
};

// Controllo di sicurezza per i templates
Object.keys(templates).forEach(key => {
    if (!templates[key]) {
        console.warn(`Template '${key}' non trovato nel DOM`);
    }
});

/**
 * Mostra un messaggio all'utente.
 * @param {string} message - Il testo del messaggio.
 * @param {string} type - Il tipo di messaggio ('success', 'error', 'info').
 * @param {string} containerId - L'ID del contenitore del messaggio.
 */
export function mostraMessaggio(message, type = 'info', containerId = 'messaggio-container') {
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
