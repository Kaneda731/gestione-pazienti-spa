// src/app/mobile/mobile-navigation.js

import { navigateTo } from '../router.js';
import { signInWithGoogle, signOut, currentUser } from '../../core/auth/authService.js';

/**
 * Inizializza tutta la logica della UI specifica per mobile.
 */
export function initMobileUI() {
    if (window.innerWidth > 768) return;

    initMobileNavbar();
    // La logica MobileNavigation/FAB è stata rimossa: la navigazione mobile è ora solo tramite la navbar centrale
    // Se serve gestire resize, puoi aggiungere qui eventuali listener per la navbar mobile
}

/**
 * Gestisce la sincronizzazione del pulsante di autenticazione nella navbar mobile.
 * Questa funzione viene chiamata da AuthUI ogni volta che lo stato di autenticazione cambia.
 */
export function syncMobileAuth() {
    const mobileAuthContainer = document.getElementById('mobile-auth-container');
    if (!mobileAuthContainer) return;

    const session = currentUser.session;

    if (session) {
        // Utente loggato: mostra icona di logout NEUTRA (logout) e imposta il logout
        mobileAuthContainer.innerHTML = `<span class=\"material-icons mobile-logout-icon\" title=\"Logout\">logout</span>`;
        mobileAuthContainer.onclick = async (event) => {
            event.preventDefault();
            await signOut();
        };
        // Evidenzia la casetta centrale
        const homeIcon = document.querySelector('.mobile-nav-center .material-icons');
        if (homeIcon) homeIcon.classList.add('navbar-home-logged');
    } else {
        // Utente non loggato: mostra icona di login e imposta il login
        mobileAuthContainer.innerHTML = `<span class="material-icons">login</span>`;
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            // Chiama la stessa funzione usata dal modal di login desktop
            const loginTrigger = document.getElementById('login-modal-trigger');
            if (loginTrigger) loginTrigger.click();
        };
        // Rimuovi evidenziazione dalla casetta centrale
        const homeIcon = document.querySelector('.mobile-nav-center .material-icons');
        if (homeIcon) homeIcon.classList.remove('navbar-home-logged');
    }
}

/**
 * Inizializza la navbar mobile, inclusa la sincronizzazione del pulsante auth.
 */
function initMobileNavbar() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        const observer = new MutationObserver(syncMobileAuth);
        observer.observe(authContainer, {
            childList: true,
            subtree: true
        });
        // Esegui una sincronizzazione iniziale per sicurezza
        setTimeout(syncMobileAuth, 100);
    }
}


/**
 * Classe per la navigazione mobile (FAB).
 */
// RIMOSSA la classe MobileNavigation e la logica FAB: ora la navigazione mobile è gestita solo dalla navbar centrale
