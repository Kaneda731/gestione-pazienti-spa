// src/js/app.js

// --- 0. IMPORT DIPENDENZE E STILI ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '/src/shared/styles/main.css';

// --- 1. INIZIALIZZAZIONE SERVIZI FONDAMENTALI ---
import { initErrorHandling } from '../core/services/errorService.js';
import { initAuth } from '../core/auth/authService.js';
import { renderView } from '../app/router.js';
import { initTheme } from '../core/services/themeService.js';
import { initBackToMenuButtons } from '../core/services/navigationService.js';
import { initMobileUI } from '../features/patients/components/mobile-navigation.js';
import { viteSupabaseMiddleware } from '../core/services/viteSupabaseMiddleware.js';
import '../core/services/bootstrapService.js'; // Inizializza Bootstrap
import '../core/services/stateService.js'; // Inizializza gestione stato
import '../core/services/notificationService.js'; // Inizializza notifiche
import '../core/services/uiStateService.js'; // Inizializza stati UI
import '../shared/components/forms/CustomSelect.js';
import '../features/patients/components/mobile-card-manager.js';

// Importa il debugger OAuth se abilitato
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    import('../shared/utils/oauthDebug.js');
    import('../shared/utils/oauthTest.js');
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
