// src/js/app.js
import { initAuth } from './auth.js';
import { renderView, navigateTo } from './router.js';

// --- INIZIALIZZAZIONE GLOBALE ---

// Gestisce la navigazione quando l'hash dell'URL cambia
window.addEventListener('hashchange', renderView);

// Gestisce il caricamento iniziale e i cambiamenti di stato dell'autenticazione
window.addEventListener('load', () => {
    initAuth(session => {
        // Ogni volta che lo stato di autenticazione cambia (login/logout),
        // renderizza nuovamente la vista per applicare le protezioni.
        renderView();
    });
});
