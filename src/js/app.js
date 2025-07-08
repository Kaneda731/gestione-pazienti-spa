// src/js/app.js

// --- 1. INIZIALIZZAZIONE SERVIZI FONDAMENTALI ---
import { initErrorHandling } from './services/errorService.js';
initErrorHandling(); // Deve essere il primo per catturare tutti gli errori

import { initAuth } from './services/authService.js';
import { initTheme } from './services/themeService.js';
import { initBackToMenuButtons } from './services/navigationService.js';
import { renderView } from './router.js';
import { initMobileUI } from './mobile/mobile-navigation.js';

// --- 2. FUNZIONE DI INIZIALIZZAZIONE PRINCIPALE ---

function main() {
    // Inizializza i servizi globali
    initTheme();
    initBackToMenuButtons();
    initMobileUI();

    // Gestisce la navigazione quando l'hash dell'URL cambia
    window.addEventListener('hashchange', renderView);

    // Gestisce il caricamento iniziale e l'autenticazione
    initAuth(session => {
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl');

        if (session && redirectUrl) {
            window.location.hash = redirectUrl;
        } else {
            renderView();
        }
    });

    // Log di completamento
    window.appLogger.info('Gestione Pazienti SPA inizializzata.', {
        version: '2.3.0', // Versione post-refactoring
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    });
}

// --- 3. ESECUZIONE ---

// Avvia l'applicazione quando la pagina è caricata
window.addEventListener('load', main);
