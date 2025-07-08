// src/js/app.js
import { initAuth } from './auth.js';
import { renderView, navigateTo } from './router.js';
import './mobile-card-manager.js'; // Importa per l'auto-inizializzazione
import './components/CustomSelect.js'; // Importa per l'auto-inizializzazione
import './mobile-navigation.js'; // Importa per l'auto-inizializzazione

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
    
    // Inizializza la navbar mobile
    try {
        initMobileNavbar();
        initMobileThemeToggle();
    } catch (error) {
        console.error('Errore nell\'inizializzazione della navbar mobile:', error);
    }
    
    // initAuth ora gestisce l'aggiornamento di currentUser internamente.
    // Il callback serve solo a triggerare il rendering dopo che lo stato è cambiato.
    initAuth(session => {
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl');

        if (session && redirectUrl) {
            window.location.hash = redirectUrl;
        } else {
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

// === GESTIONE NAVBAR MOBILE === 
// Funzione sicura per sincronizzare il pulsante auth mobile
function syncMobileAuth() {
    const authContainer = document.getElementById('auth-container');
    const mobileAuthContainer = document.getElementById('mobile-auth-container');
    
    if (!authContainer || !mobileAuthContainer) return;
    
    // Controlla se c'è un pulsante login o logout (selettori corretti)
    const loginBtn = authContainer.querySelector('#login-modal-trigger'); // Selettore corretto!
    const logoutBtn = authContainer.querySelector('#logout-button');
    
    if (loginBtn) {
        // Utente non loggato - mostra login
        mobileAuthContainer.innerHTML = `
            <span class="material-icons">login</span>
        `;
        
        // Usa la stessa logica semplice del logout
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            loginBtn.click();
        };
        
    } else if (logoutBtn) {
        // Utente loggato - mostra logout
        mobileAuthContainer.innerHTML = `
            <span class="material-icons">logout</span>
        `;
        
        // Stessa logica semplice che funziona
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            logoutBtn.click();
        };
    } else {
        // Stato indefinito
        mobileAuthContainer.innerHTML = `
            <span class="material-icons">login</span>
        `;
        
        mobileAuthContainer.onclick = null;
    }
}

// Osserva i cambiamenti al container auth e sincronizza
if (document.getElementById('auth-container')) {
    const observer = new MutationObserver(syncMobileAuth);
    observer.observe(document.getElementById('auth-container'), {
        childList: true,
        subtree: true
    });
    
    // Sincronizzazione iniziale
    setTimeout(syncMobileAuth, 100);
}

// === GESTIONE NAVBAR MOBILE ===
function initMobileNavbar() {
    console.log('Inizializzando navbar mobile...');
    
    // Inizializza il sistema di sincronizzazione auth
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        const observer = new MutationObserver(syncMobileAuth);
        observer.observe(authContainer, {
            childList: true,
            subtree: true
        });
        
        // Sincronizzazione iniziale
        setTimeout(syncMobileAuth, 100);
    }
}

// === GESTIONE THEME TOGGLE MOBILE ===
function initMobileThemeToggle() {
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    
    if (!mobileThemeToggle || !mobileThemeIcon) {
        console.log('Mobile theme toggle non trovato');
        return;
    }
    
    console.log('Inizializzando mobile theme toggle...');
    
    // Sincronizza l'icona mobile con lo stato attuale
    function syncMobileThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        console.log('Sincronizzando tema mobile:', currentTheme);
        
        if (currentTheme === 'dark') {
            mobileThemeIcon.textContent = 'light_mode';
            mobileThemeToggle.setAttribute('title', 'Modalità chiara');
        } else {
            mobileThemeIcon.textContent = 'dark_mode';
            mobileThemeToggle.setAttribute('title', 'Modalità scura');
        }
    }
    
    // Funzione per cambiare tema (stessa logica del desktop)
    function setTheme(theme) {
        console.log('Impostando tema:', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        syncMobileThemeIcon();
    }
    
    // Click sul toggle mobile - gestione diretta
    mobileThemeToggle.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Click su mobile theme toggle');
        
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('Cambiando da', currentTheme, 'a', newTheme);
        setTheme(newTheme);
    });
    
    // Osserva i cambiamenti al tema per sincronizzare l'icona mobile
    const observer = new MutationObserver(() => {
        console.log('Tema cambiato, sincronizzando...');
        syncMobileThemeIcon();
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
    });
    
    // Sincronizzazione iniziale
    syncMobileThemeIcon();
    console.log('Mobile theme toggle inizializzato');
}
