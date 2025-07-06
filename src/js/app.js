// src/js/app.js
import { initAuth } from './auth.js';
import { renderView, navigateTo } from './router.js';

// --- GESTIONE ERRORI GLOBALE ---

// Gestore per errori non catturati (inclusi quelli delle estensioni browser)
window.addEventListener('error', (event) => {
    // Filtra errori comuni delle estensioni browser che non impattano l'app
    const ignoredMessages = [
        'A listener indicated an asynchronous response by returning true',
        'Extension context invalidated',
        'Could not establish connection',
        'chrome-extension://',
        'moz-extension://'
    ];
    
    const shouldIgnore = ignoredMessages.some(msg => 
        event.message && event.message.includes(msg)
    );
    
    if (shouldIgnore) {
        console.debug('Browser extension error ignored:', event.message);
        event.preventDefault();
        return false;
    }
    
    // Log solo errori reali dell'applicazione
    console.error('Application error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Gestore per promise rejection non catturate
window.addEventListener('unhandledrejection', (event) => {
    // Filtra errori comuni delle estensioni browser
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    
    const ignoredMessages = [
        'A listener indicated an asynchronous response by returning true',
        'message channel closed before a response was received',
        'Extension context invalidated',
        'Could not establish connection'
    ];
    
    const shouldIgnore = ignoredMessages.some(msg => 
        errorMessage.includes(msg)
    );
    
    if (shouldIgnore) {
        console.debug('Browser extension promise rejection ignored:', errorMessage);
        event.preventDefault();
        return;
    }
    
    // Log solo promise rejection reali dell'applicazione
    console.error('Unhandled promise rejection:', event.reason);
});

// --- INIZIALIZZAZIONE GLOBALE ---

// Gestione del tema (dark/light mode)
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Recupera il tema salvato o usa il tema di sistema come default
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Event listener per il toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Aggiorna l'icona
        if (theme === 'dark') {
            themeIcon.textContent = 'light_mode';
            themeToggle.setAttribute('title', 'Modalità chiara');
        } else {
            themeIcon.textContent = 'dark_mode';
            themeToggle.setAttribute('title', 'Modalità scura');
        }
    }
}

/**
 * Inizializza la gestione globale dei pulsanti "Torna al Menu"
 * Utilizza event delegation per gestire tutti i pulsanti con classe btn-back-menu
 */
function initBackToMenuButtons() {
    document.addEventListener('click', (event) => {
        // Verifica se l'elemento cliccato o un suo genitore ha la classe btn-back-menu
        const backButton = event.target.closest('.btn-back-menu');
        
        if (backButton) {
            event.preventDefault();
            
            // Feedback visivo immediato
            backButton.style.transform = 'scale(0.95)';
            backButton.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                backButton.style.transform = '';
                backButton.style.transition = '';
            }, 150);
            
            // Ottieni la vista di destinazione dall'attributo data-view
            const targetView = backButton.getAttribute('data-view') || 'home';
            
            // Pulisci eventuali dati di sessione se necessario
            if (targetView === 'home') {
                sessionStorage.removeItem('editPazienteId');
                sessionStorage.removeItem('formData');
                sessionStorage.removeItem('currentFilters');
            }
            
            // Naviga alla vista target con un piccolo delay per il feedback visivo
            setTimeout(() => {
                navigateTo(targetView);
                
                // Log per debug (rimuovibile in produzione)
                // Navigazione:
            }, 100);
        }
    });
}

// Gestisce la navigazione quando l'hash dell'URL cambia
window.addEventListener('hashchange', renderView);

// Gestisce il caricamento iniziale e i cambiamenti di stato dell'autenticazione
window.addEventListener('load', () => {
    // Inizializza il tema
    initThemeToggle();
    
    // Inizializza la gestione dei pulsanti "Torna al Menu"
    initBackToMenuButtons();
    
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

// --- UTILITY DI LOGGING ---

/**
 * Sistema di logging migliorato per l'applicazione
 * Evita spam di log da estensioni browser e fornisce informazioni utili per debug
 */
window.appLogger = {
    info: (message, data = null) => {
        console.log(`[APP] ${message}`, data || '');
    },
    
    warn: (message, data = null) => {
        console.warn(`[APP WARNING] ${message}`, data || '');
    },
    
    error: (message, error = null) => {
        console.error(`[APP ERROR] ${message}`, error || '');
        
        // In produzione, qui potresti inviare l'errore a un servizio di monitoring
        // come Sentry, LogRocket, etc.
    },
    
    debug: (message, data = null) => {
        // Solo in ambiente di sviluppo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.debug(`[APP DEBUG] ${message}`, data || '');
        }
    }
};

// Log di inizializzazione app completata
window.appLogger.info('Gestione Pazienti SPA inizializzata correttamente', {
    version: '2.2.1',
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    timestamp: new Date().toISOString()
});
