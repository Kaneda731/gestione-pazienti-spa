// src/js/app.js
import { initAuth } from './auth.js';
import { renderView, navigateTo } from './router.js';

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

// Gestisce la navigazione quando l'hash dell'URL cambia
window.addEventListener('hashchange', renderView);

// Gestisce il caricamento iniziale e i cambiamenti di stato dell'autenticazione
window.addEventListener('load', () => {
    // Inizializza il tema
    initThemeToggle();
    
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
