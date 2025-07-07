/**
 * Mobile Navigation - Sistema di navigazione semplice per mobile
 * Solo FAB per tornare alla home, niente breadcrumb o altri elementi
 */

export class MobileNavigation {
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
        let lastScrollY = window.scrollY;
        let ticking = false;
        const scrollThreshold = 10;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDifference = currentScrollY - lastScrollY;

            if (Math.abs(scrollDifference) > scrollThreshold) {
                if (scrollDifference > 0) {
                    this.fabElement?.classList.add('fab-hidden');
                } else {
                    this.fabElement?.classList.remove('fab-hidden');
                }
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        }, { passive: true });
        
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
        if (!mobileNav) { // Controlla se già inizializzato
            mobileNav = new MobileNavigation();
        }
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

// Gestione eventi di navigazione globali
document.addEventListener('navigateToHome', () => {
    if (window.navigateTo) {
        window.navigateTo('home');
    } else {
        window.location.hash = 'home';
    }
});

export { initMobileNavigation };
// Esponi istanza per uso globale se necessario (es. dal router)
export let mobileNavInstance = mobileNav;
