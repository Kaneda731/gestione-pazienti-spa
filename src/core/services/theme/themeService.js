// src/js/services/themeService.js

/**
 * Gestisce l'inizializzazione e il toggle del tema (dark/light mode)
 * per desktop e mobile.
 */
export function initTheme() {
    initDesktopThemeToggle();
    initMobileThemeToggle();
}

function initDesktopThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    if (!themeToggle || !themeIcon) return;

    // Recupera il tema salvato o usa il tema di sistema come default
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Event listener per il toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

function initMobileThemeToggle() {
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');

    if (!mobileThemeToggle || !mobileThemeIcon) return;

    // Sincronizza l'icona mobile con lo stato attuale
    function syncMobileThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        
        if (currentTheme === 'dark') {
            mobileThemeIcon.textContent = 'light_mode';
            mobileThemeToggle.setAttribute('title', 'Modalità chiara');
        } else {
            mobileThemeIcon.textContent = 'dark_mode';
            mobileThemeToggle.setAttribute('title', 'Modalità scura');
        }
    }

    // Click sul toggle mobile
    mobileThemeToggle.addEventListener('click', (event) => {
        event.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Osserva i cambiamenti al tema per sincronizzare l'icona mobile
    const observer = new MutationObserver(syncMobileThemeIcon);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
    });

    // Sincronizzazione iniziale
    syncMobileThemeIcon();
}

/**
 * Imposta il tema a livello di applicazione.
 * @param {string} theme - Il tema da impostare ('light' or 'dark').
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Sincronizza l'icona desktop
    const themeIcon = document.getElementById('theme-icon');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeIcon && themeToggle) {
        if (theme === 'dark') {
            themeIcon.textContent = 'light_mode';
            themeToggle.setAttribute('title', 'Modalità chiara');
        } else {
            themeIcon.textContent = 'dark_mode';
            themeToggle.setAttribute('title', 'Modalità scura');
        }
    }
}
