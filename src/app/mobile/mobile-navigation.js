// src/app/mobile/mobile-navigation.js

import { navigateTo } from '../router.js';

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
 */
export function syncMobileAuth() {
    const authContainer = document.getElementById('auth-container');
    const mobileAuthContainer = document.getElementById('mobile-auth-container');
    
    if (!authContainer || !mobileAuthContainer) return;
    
    const loginBtn = authContainer.querySelector('#login-modal-trigger');
    const logoutBtn = authContainer.querySelector('#logout-button');
    
    if (loginBtn) {
        mobileAuthContainer.innerHTML = `<span class="material-icons">login</span>`;
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            loginBtn.click();
        };
    } else if (logoutBtn) {
        mobileAuthContainer.innerHTML = `<span class="material-icons">logout</span>`;
        mobileAuthContainer.onclick = (event) => {
            event.preventDefault();
            logoutBtn.click();
        };
    } else {
        mobileAuthContainer.innerHTML = `<span class="material-icons">login</span>`;
        mobileAuthContainer.onclick = null;
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
        setTimeout(syncMobileAuth, 100); // Sincronizzazione iniziale
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
