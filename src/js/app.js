// src/js/app.js
import { initAuth } from './auth.js';
import { renderView, navigateTo } from './router.js';

// --- INIZIALIZZAZIONE GLOBALE ---

// Gestisce la navigazione quando l'hash dell'URL cambia
window.addEventListener('hashchange', renderView);

// Gestisce il caricamento iniziale e i cambiamenti di stato dell'autenticazione
window.addEventListener('load', () => {
    initAuth(session => {
        const redirectUrl = localStorage.getItem('redirectUrl');
        localStorage.removeItem('redirectUrl'); // Rimuovi sempre l'URL dopo averlo letto

        if (session && redirectUrl) {
            // Se l'utente si è appena loggato e c'era un URL di destinazione,
            // vai a quell'URL.
            window.location.hash = redirectUrl;
        } else {
            // Altrimenti, renderizza la vista corrente (o la home).
            renderView();
        }
    });
});
