/**
 * Mobile Navigation - Sistema di navigazione innovativo per mobile
 * Gestisce FAB, breadcrumb e navigazione ottimizzata per touch
 */

class MobileNavigation {
    constructor() {
        this.currentView = 'home';
        this.navigationStack = ['home'];
        this.fabElement = null;
        this.breadcrumbElement = null;
        this.isMenuOpen = false;
        
        this.init();
    }
    
    init() {
        if (window.innerWidth <= 768) {
            this.createFAB();
            this.createBreadcrumb();
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
        
        // Crea il contenitore FAB
        const fabContainer = document.createElement('div');
        fabContainer.className = 'mobile-fab-container';
        
        fabContainer.innerHTML = `
            <div class="fab-overlay"></div>
            <div class="fab-menu">
                <button class="fab-mini" data-action="refresh" title="Aggiorna">
                    <span class="material-icons">refresh</span>
                </button>
                <button class="fab-mini" data-action="search" title="Cerca">
                    <span class="material-icons">search</span>
                </button>
                <button class="fab-mini" data-action="add" title="Aggiungi">
                    <span class="material-icons">add</span>
                </button>
            </div>
            <button class="mobile-fab pulse" data-action="home">
                <span class="material-icons">home</span>
            </button>
        `;
        
        document.body.appendChild(fabContainer);
        this.fabElement = fabContainer.querySelector('.mobile-fab');
    }
    
    createBreadcrumb() {
        // Trova il primo card-header e aggiungi il breadcrumb
        const cardHeaders = document.querySelectorAll('.card-header');
        
        cardHeaders.forEach(header => {
            if (!header.querySelector('.mobile-breadcrumb')) {
                const breadcrumb = document.createElement('div');
                breadcrumb.className = 'mobile-breadcrumb';
                
                // Inserisci come primo elemento del card-header
                header.insertBefore(breadcrumb, header.firstChild);
            }
        });
    }
    
    setupEventListeners() {
        // Click sul FAB principale
        this.fabElement?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleFABClick();
        });
        
        // Long press sul FAB per aprire menu
        let longPressTimer;
        this.fabElement?.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.toggleFABMenu();
                navigator.vibrate?.(50); // Haptic feedback se supportato
            }, 500);
        });
        
        this.fabElement?.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        // Click sui mini FAB
        document.addEventListener('click', (e) => {
            if (e.target.closest('.fab-mini')) {
                e.preventDefault();
                const action = e.target.closest('.fab-mini').dataset.action;
                this.handleMiniAction(action);
                this.closeFABMenu();
            }
        });
        
        // Click sull'overlay per chiudere menu
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fab-overlay')) {
                this.closeFABMenu();
            }
        });
        
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
    
    handleFABClick() {
        if (this.currentView === 'home') {
            // Se siamo già home, mostra menu opzioni
            this.toggleFABMenu();
        } else {
            // Altrimenti, torna alla home
            this.navigateToHome();
        }
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
        const oldView = this.currentView;
        this.currentView = newView;
        
        // Aggiorna stack di navigazione
        if (newView !== 'home' && this.navigationStack[this.navigationStack.length - 1] !== newView) {
            this.navigationStack.push(newView);
        } else if (newView === 'home') {
            this.navigationStack = ['home'];
        }
        
        this.updateNavigation();
        this.updateFABIcon();
        this.updateBreadcrumb();
        
        // Animazione di feedback
        this.animateFAB();
    }
    
    updateNavigation() {
        // Nascondi pulsanti tradizionali su mobile
        if (window.innerWidth <= 768) {
            const backButtons = document.querySelectorAll('.btn-back-menu');
            backButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }
    
    updateFABIcon() {
        if (!this.fabElement) return;
        
        const icon = this.fabElement.querySelector('.material-icons');
        const newIcon = this.currentView === 'home' ? 'menu' : 'home';
        
        // Animazione di cambio icona
        icon.style.transform = 'scale(0)';
        setTimeout(() => {
            icon.textContent = newIcon;
            icon.style.transform = 'scale(1)';
        }, 150);
        
        // Aggiorna data-action
        this.fabElement.dataset.action = this.currentView === 'home' ? 'menu' : 'home';
        
        // Rimuovi pulse se non siamo in home
        if (this.currentView !== 'home') {
            this.fabElement.classList.remove('pulse');
        }
    }
    
    updateBreadcrumb() {
        const breadcrumbs = document.querySelectorAll('.mobile-breadcrumb');
        
        breadcrumbs.forEach(breadcrumb => {
            breadcrumb.innerHTML = this.generateBreadcrumbHTML();
        });
    }
    
    generateBreadcrumbHTML() {
        const viewNames = {
            'home': { icon: 'home', name: 'Home' },
            'diagnosi': { icon: 'medical_information', name: 'Diagnosi' },
            'form': { icon: 'person_add', name: 'Nuovo Paziente' },
            'list': { icon: 'list', name: 'Lista Pazienti' },
            'grafico': { icon: 'analytics', name: 'Grafici' },
            'dimissione': { icon: 'exit_to_app', name: 'Dimissioni' }
        };
        
        let html = '';
        
        // Home sempre presente
        html += `
            <div class="breadcrumb-item" onclick="mobileNav.navigateToHome()">
                <span class="material-icons" style="font-size: 18px;">home</span>
            </div>
        `;
        
        // Aggiungi vista corrente se non è home
        if (this.currentView !== 'home' && viewNames[this.currentView]) {
            const current = viewNames[this.currentView];
            html += `
                <span class="breadcrumb-separator">›</span>
                <div class="breadcrumb-item current">
                    <span class="material-icons" style="font-size: 16px;">${current.icon}</span>
                    <span>${current.name}</span>
                </div>
            `;
        }
        
        return html;
    }
    
    toggleFABMenu() {
        const menu = document.querySelector('.fab-menu');
        const overlay = document.querySelector('.fab-overlay');
        
        if (this.isMenuOpen) {
            this.closeFABMenu();
        } else {
            this.openFABMenu();
        }
    }
    
    openFABMenu() {
        const menu = document.querySelector('.fab-menu');
        const overlay = document.querySelector('.fab-overlay');
        
        menu?.classList.add('show');
        overlay?.classList.add('show');
        this.isMenuOpen = true;
        
        // Animazione icona FAB
        const icon = this.fabElement?.querySelector('.material-icons');
        if (icon) {
            icon.style.transform = 'rotate(45deg)';
        }
    }
    
    closeFABMenu() {
        const menu = document.querySelector('.fab-menu');
        const overlay = document.querySelector('.fab-overlay');
        
        menu?.classList.remove('show');
        overlay?.classList.remove('show');
        this.isMenuOpen = false;
        
        // Reset icona FAB
        const icon = this.fabElement?.querySelector('.material-icons');
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }
    
    handleMiniAction(action) {
        switch (action) {
            case 'refresh':
                window.location.reload();
                break;
            case 'search':
                // Implementa ricerca se necessario
                console.log('Ricerca attivata');
                break;
            case 'add':
                // Naviga a form di aggiunta
                if (window.navigateTo) {
                    window.navigateTo('form');
                }
                break;
        }
    }
    
    animateFAB() {
        if (!this.fabElement) return;
        
        this.fabElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.fabElement.style.transform = 'scale(1)';
        }, 200);
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
        
        const breadcrumbs = document.querySelectorAll('.mobile-breadcrumb');
        breadcrumbs.forEach(b => b.remove());
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
