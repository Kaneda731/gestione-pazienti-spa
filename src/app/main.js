// src/app/main.js

/**
 * Entry point principale dell'applicazione
 */

// Importazioni di stile dinamiche
function loadStyles() {
    if (window.innerWidth <= 768) {
        import('/src/css/mobile.scss');
    } else {
        import('/src/css/desktop.scss');
    }
}
loadStyles();

// Configurazione
import { environment, isDevelopment } from './config/environment.js';
import { STORAGE_KEYS } from './config/constants.js';

// Core services
import { initErrorHandling } from '../core/services/errorService.js';
import { initAuth } from '../core/auth/authService.js';
import { initTheme } from '../core/services/themeService.js';
import { viteSupabaseMiddleware } from '../core/services/viteSupabaseMiddleware.js';

// Shared services
import '../shared/components/ui/index.js';
import '../core/services/bootstrapService.js';
import '../core/services/stateService.js';
import '../core/services/notificationService.js';
import '../core/services/uiStateService.js';

// Components
import '../shared/components/forms/CustomSelect.js';

// Mobile support
import '../features/patients/components/mobile-card-manager.js';
import { initMobileUI } from './mobile/mobile-navigation.js';
import { initializeAuthEventListeners } from '../shared/components/ui/AuthUI.js';

// Router
import { renderView } from './router.js';
import { initBackToMenuButtons } from '../core/services/navigationService.js';

// Debug tools (solo in development)
if (isDevelopment && environment.OAUTH_DEBUG) {
    import('../core/utils/oauthDebug.js');
    import('../core/utils/oauthTest.js');
}

/**
 * Inizializza l'applicazione
 */
async function initializeApp() {
    try {
        // Log dell'avvio
        console.log(`🚀 Inizializzazione ${environment.APP_NAME} v${environment.APP_VERSION}`);
        console.log(`📦 Ambiente: ${environment.NODE_ENV}`);
        
        // Aspetta che il middleware Vite-Supabase sia pronto
        await viteSupabaseMiddleware.onReady();
        console.log('✅ Middleware Vite-Supabase pronto');
        
        // Inizializza i servizi core
        initErrorHandling();
        initTheme();
        initBackToMenuButtons();
        initMobileUI();
        initializeAuthEventListeners();
        
        // Gestisce la navigazione
        window.addEventListener('hashchange', () => {
            if (window.location.hash.includes('access_token')) return;
            renderView();
        });

        // Gestisce l'autenticazione e il rendering iniziale
        await initAuth(session => {
            console.log('🔐 Callback autenticazione chiamato:', { session: !!session });
            const redirectUrl = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_URL);
            sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_URL);

            if (session && redirectUrl) {
                console.log('🔀 Reindirizzamento a:', redirectUrl);
                window.location.hash = redirectUrl;
            } else {
                console.log('🏠 Chiamando renderView per homepage');
                renderView();
            }
        });

        console.log('✅ Applicazione inizializzata con successo');
        
        // Esegui il render iniziale per sicurezza
        console.log('🎬 Eseguendo render iniziale...');
        renderView();
        
        if (window.appLogger) {
            window.appLogger.info(`${environment.APP_NAME} inizializzata con middleware Vite-Supabase.`);
        }
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione dell\'applicazione:', error);
        
        // Mostra un messaggio di errore fallback
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Errore di inizializzazione</h4>
                    <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
                    <hr>
                    <p class="mb-0">Ricarica la pagina per riprovare.</p>
                </div>
            </div>
        `;
    }
}

/**
 * Avvia l'applicazione quando il DOM è pronto
 */
window.addEventListener('load', initializeApp);

// Gestione globale degli errori non catturati
window.addEventListener('error', (event) => {
    console.error('Errore non catturato:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rifiutata non gestita:', event.reason);
});
