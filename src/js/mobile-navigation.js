/**
 * Mobile Navigation - Sistema di navigazione semplice per mobile
 * Solo FAB per tornare alla home, niente breadcrumb o altri elementi
 */

class MobileNavigation {
    constructor() {
        this.currentView = 'home';
        this.fabElement = null;
        
        this.init();
    }
    
    init() {
        if (window.innerWidth <= 768) {
            this.setupEventListeners();
            this.updateNavigation();
        }
    }
    
    createFAB() {
        // Rimuovi FAB esistente se presente
        const existingFab = document.querySelector('.mobile-fab-container');
        if (existingFab) {
            existingFab.remove();
        }
        
        // Crea il contenitore FAB (solo una freccia indietro)
        const fabContainer = document.createElement('div');
        fabContainer.className = 'mobile-fab-container';
        
        fabContainer.innerHTML = `
            <button class="mobile-fab" data-action="home" title="Torna alla Home">
                <span class="material-icons">arrow_back</span>
            </button>
        `;
        
        document.body.appendChild(fabContainer);
        this.fabElement = fabContainer.querySelector('.mobile-fab');
        
        // Setup click listener subito
        this.fabElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToHome();
        });
    }
    
    setupEventListeners() {
        // Scroll behavior per FAB
        let scrollTimer;
        window.addEventListener('scroll', () => {
            if (this.fabElement) {
                this.fabElement.classList.add('scroll-hidden');
                
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    this.fabElement.classList.remove('scroll-hidden');
                }, 150);
            }
        });
        
        // Aggiorna navigazione quando cambia vista
        document.addEventListener('viewChanged', (e) => {
            this.updateView(e.detail.view);
        });
    }
    
    
    navigateToHome() {
        // Trigger evento di navigazione
        const event = new CustomEvent('navigateToHome');
        document.dispatchEvent(event);
        
        // Se abbiamo il router disponibile, usalo
        if (window.navigateTo) {
            window.navigateTo('home');
        }
        
        this.updateView('home');
    }
    
    updateView(newView) {
        this.currentView = newView;
        
        // Gestione FAB in base alla vista
        if (newView === 'home') {
            // Nella home, nascondi FAB
            this.hideFAB();
        } else {
            // Nelle altre viste, mostra FAB
            this.showFAB();
        }
        
        this.updateNavigation();
    }
    
    updateNavigation() {
        // Nascondi completamente i pulsanti tradizionali su mobile
        if (window.innerWidth <= 768) {
            const backButtons = document.querySelectorAll('.btn-back-menu');
            backButtons.forEach(btn => {
                btn.style.display = 'none !important';
                btn.style.visibility = 'hidden';
                btn.classList.add('d-none');
            });
        }
    }
    
    showFAB() {
        if (!this.fabElement) {
            this.createFAB();
        }
        
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) {
            fabContainer.style.display = 'block';
        }
    }
    
    hideFAB() {
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) {
            fabContainer.style.display = 'none';
        }
    }
    
    // Metodo pubblico per aggiornare vista da router
    setCurrentView(view) {
        this.updateView(view);
    }
    
    // Cleanup
    destroy() {
        const fabContainer = document.querySelector('.mobile-fab-container');
        if (fabContainer) {
            fabContainer.remove();
        }
        
        this.fabElement = null;
    }
}

// Inizializza navigazione mobile solo su dispositivi mobili
let mobileNav = null;

function initMobileNavigation() {
    if (window.innerWidth <= 768) {
        mobileNav = new MobileNavigation();
    }
}

// Reinizializza su resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !mobileNav) {
        mobileNav = new MobileNavigation();
    } else if (window.innerWidth > 768 && mobileNav) {
        mobileNav.destroy();
        mobileNav = null;
    }
});

// Auto-init
document.addEventListener('DOMContentLoaded', initMobileNavigation);

// Esponi globalmente per integrazione con router
window.mobileNav = mobileNav;
window.initMobileNavigation = initMobileNavigation;

// Gestione eventi di navigazione globali
document.addEventListener('navigateToHome', () => {
    if (window.navigateTo) {
        window.navigateTo('home');
    } else {
        window.location.hash = 'home';
    }
});

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileNavigation, initMobileNavigation };
}
