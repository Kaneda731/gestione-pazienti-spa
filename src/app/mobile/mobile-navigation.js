// src/app/mobile/mobile-navigation.js
import { signOut, currentUser } from '../../core/auth/authService.js';

/**
 * Gestisce la visibilità delle navbar (desktop vs mobile) in base alla larghezza dello schermo.
 */
function handleNavbarVisibility() {
    const desktopNavbar = document.querySelector('.navbar'); // La navbar di Bootstrap
    const mobileNavbar = document.querySelector('.mobile-navbar');

    if (!desktopNavbar || !mobileNavbar) return;

    const isMobile = window.innerWidth <= 767;

    desktopNavbar.classList.toggle('d-none', isMobile);
    mobileNavbar.classList.toggle('d-none', !isMobile);
    
    if (isMobile) {
        syncMobileAuth(); // Sincronizza lo stato auth quando si passa a mobile
    }
}

/**
 * Sincronizza lo stato di autenticazione (login/logout) sulla navbar mobile.
 */
export function syncMobileAuth() {
    const mobileAuthContainer = document.getElementById('mobile-auth-container');
    const homeLink = document.getElementById('mobile-home-link');
    if (!mobileAuthContainer || !homeLink) return;

    const session = currentUser.session;

    if (session) {
        // Utente loggato: mostra icona di logout e attiva l'effetto sulla home
        mobileAuthContainer.innerHTML = `<span class="material-icons" title="Logout">logout</span>`;
        mobileAuthContainer.onclick = async (event) => {
            event.preventDefault();
            await signOut();
        };
        homeLink.classList.add('navbar-home-logged');
    } else {
        // Utente non loggato: mostra icona di login e disattiva l'effetto
        mobileAuthContainer.innerHTML = `<span class="material-icons" title="Login">login</span>`;
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            const loginTrigger = document.getElementById('login-modal-trigger');
            if (loginTrigger) loginTrigger.click();
        };
        homeLink.classList.remove('navbar-home-logged');
    }
}

/**
 * Inizializza la UI mobile, inclusa la gestione della visibilità della navbar
 * e l'ascolto dei cambiamenti di stato di autenticazione.
 */
export function initMobileUI() {
    // Gestione iniziale e su resize
    handleNavbarVisibility();
    window.addEventListener('resize', handleNavbarVisibility);

    // Ascolta i cambiamenti nel contenitore auth desktop per sincronizzare la UI mobile
    const desktopAuthContainer = document.getElementById('auth-container');
    if (desktopAuthContainer) {
        const observer = new MutationObserver(syncMobileAuth);
        observer.observe(desktopAuthContainer, {
            childList: true,
            subtree: true
        });
    }
    
    // Sincronizzazione iniziale per sicurezza
    setTimeout(syncMobileAuth, 150);
}
