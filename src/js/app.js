// src/js/app.js

// --- 0. IMPORT DIPENDENZE E STILI ---
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap'; // Importa il JS di Bootstrap e lo rende globale
import '/src/css/style.css';

// --- 1. INIZIALIZZAZIONE SERVIZI FONDAMENTALI ---
import { initErrorHandling } from './services/errorService.js';
import { initAuth } from './services/authService.js';
import { renderView } from './router.js';
import { initTheme } from './services/themeService.js';
import { initBackToMenuButtons } from './services/navigationService.js';
import { initMobileUI } from './mobile/mobile-navigation.js';
import { viteSupabaseMiddleware } from './services/viteSupabaseMiddleware.js';
import './components/CustomSelect.js';
import './mobile/mobile-card-manager.js';

// Importa il debugger OAuth se abilitato
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    import('./utils/oauthDebug.js');
    import('./utils/oauthTest.js');
}

// --- 2. FUNZIONE DI INIZIALIZZAZIONE PRINCIPALE ---

function main() {
    // Aspetta che il middleware Vite-Supabase sia pronto
    viteSupabaseMiddleware.onReady(() => {
        console.log('Inizializzazione app con middleware pronto');
        
        // Inizializza i servizi
        initErrorHandling();
        initTheme();
        initBackToMenuButtons();
        initMobileUI();

        // Gestisce la navigazione
        window.addEventListener('hashchange', () => {
            if (window.location.hash.includes('access_token')) return;
            renderView();
        });

        // Gestisce l'autenticazione e il rendering iniziale
        initAuth(session => {
            const redirectUrl = sessionStorage.getItem('redirectUrl');
            sessionStorage.removeItem('redirectUrl');

            if (session && redirectUrl) {
                window.location.hash = redirectUrl;
            } else {
                renderView();
            }
        });

        window.appLogger.info('Gestione Pazienti SPA inizializzata con middleware Vite-Supabase.');
    });
}

// --- 3. ESECUZIONE ---
window.addEventListener('load', main);
