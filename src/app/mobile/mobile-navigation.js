// src/app/mobile/mobile-navigation.js

import { navigateTo } from '../router.js';
import { signInWithGoogle, signOut, currentUser } from '../../core/auth/authService.js';

/**
 * Inizializza tutta la logica della UI specifica per mobile.
 */
export function initMobileUI() {
    if (window.innerWidth > 768) return;

    initMobileNavbar();
    const mobileNav = new MobileNavigation();
    
    // Re-check su resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && !window.mobileNavInstance) {
            window.mobileNavInstance = new MobileNavigation();
        } else if (window.innerWidth > 768 && window.mobileNavInstance) {
            window.mobileNavInstance.destroy();
            window.mobileNavInstance = null;
        }
    });

    window.mobileNavInstance = mobileNav;
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
        // Utente loggato: mostra icona utente e imposta il logout
        const userInitial = session.user.email.charAt(0).toUpperCase();
        mobileAuthContainer.innerHTML = `
            <div class="mobile-user-avatar" title="${session.user.email}">
                ${userInitial}
            </div>
        `;
        mobileAuthContainer.onclick = async (event) => {
            event.preventDefault();
            await signOut();
        };
    } else {
        // Utente non loggato: mostra icona di login e imposta il login
        mobileAuthContainer.innerHTML = `<span class="material-icons">login</span>`;
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            // Chiama la stessa funzione usata dal modal di login desktop
            const loginTrigger = document.getElementById('login-modal-trigger');
            if (loginTrigger) loginTrigger.click();
        };
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
class MobileNavigation {
    constructor() {
        this.fabElement = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateView(window.location.hash.substring(1) || 'home');
    }
    
    createFAB() {
        const existingFab = document.querySelector('.mobile-fab-container');
        if (existingFab) existingFab.remove();
        
        const fabContainer = document.createElement('div');
        fabContainer.className = 'mobile-fab-container';
        fabContainer.innerHTML = `
            <button class="mobile-fab" data-action="home" title="Torna alla Home">
                <span class="material-icons">arrow_back</span>
            </button>
        `;
        document.body.appendChild(fabContainer);
        this.fabElement = fabContainer.querySelector('.mobile-fab');
        this.fabElement.addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateTo('home');
        });
    }
    
    setupEventListeners() {
        document.addEventListener('viewChanged', (e) => {
            this.updateView(e.detail.view);
        });
    }
    
    updateView(newView) {
        if (newView === 'home' || newView === '') {
            this.hideFAB();
        } else {
            this.showFAB();
        }
    }
    
    showFAB() {
        if (!this.fabElement) this.createFAB();
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) fabContainer.style.display = 'block';
    }
    
    hideFAB() {
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) fabContainer.style.display = 'none';
    }

    destroy() {
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) fabContainer.remove();
        this.fabElement = null;
        // Rimuovi listener se necessario
    }
}
