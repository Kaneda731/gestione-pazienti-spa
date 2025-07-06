// src/js/ui.js

// --- ELEMENTI DOM GLOBALI ---
export const authContainer = document.getElementById('auth-container');

// Controllo di sicurezza per gli elementi DOM
if (!authContainer) {
    console.error('Elemento auth-container non trovato nel DOM');
}

// --- TEMPLATES GLOBALI (per Auth) ---
export const templates = {
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
 * Mostra un messaggio all'utente in un contenitore specifico.
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
