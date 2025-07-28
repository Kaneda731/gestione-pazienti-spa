/**
 * NotificationContainer - Componente per gestione container notifiche
 * Gestisce posizionamento responsive, stack e layout delle notifiche
 */

// Configurazioni responsive per posizionamento
const RESPONSIVE_CONFIG = {
    mobile: {
        maxWidth: 767,
        position: 'top-center',
        maxVisible: 3,
        containerPadding: '1rem'
    },
    tablet: {
        maxWidth: 991,
        position: 'top-right',
        maxVisible: 4,
        containerPadding: '1.5rem'
    },
    desktop: {
        minWidth: 992,
        position: 'top-right',
        maxVisible: 5,
        containerPadding: '2rem'
    }
};

// Posizioni supportate
const SUPPORTED_POSITIONS = [
    'top-right',
    'top-left', 
    'top-center',
    'bottom-right',
    'bottom-left',
    'bottom-center'
];

export class NotificationContainer {
    constructor(options = {}) {
        this.container = null;
        this.settings = {
            position: options.position || 'top-right',
            maxVisible: options.maxVisible || 5,
            enableResponsive: options.enableResponsive !== false,
            customPosition: options.customPosition || false,
            zIndex: options.zIndex || 1050,
            ...options
        };
        
        this.resizeObserver = null;
        this.mutationObserver = null;
        
        this.init();
    }

    /**
     * Inizializza il container delle notifiche
     */
    init() {
        this.createContainer();
        this.setupResponsiveBehavior();
        this.setupStackManagement();
        this.setupAccessibility();
    }

    /**
     * Crea il container DOM per le notifiche
     */
    createContainer() {
        // Rimuovi container esistente se presente
        const existingContainer = document.getElementById('notification-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifiche di sistema');
        this.container.setAttribute('aria-live', 'polite');
        this.container.style.zIndex = this.settings.zIndex;
        
        this.updatePosition(this.settings.position);
        this.updateMaxVisible(this.settings.maxVisible);
        
        document.body.appendChild(this.container);
    }

    /**
     * Configura comportamento responsive
     */
    setupResponsiveBehavior() {
        if (!this.settings.enableResponsive) return;

        // Gestione resize window
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Configurazione iniziale responsive
        this.updateResponsiveSettings();

        // ResizeObserver per monitoraggio container
        if (window.ResizeObserver) {
            try {
                this.resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        this.handleContainerResize(entry);
                    }
                });
                this.resizeObserver.observe(this.container);
            } catch (error) {
                console.warn('ResizeObserver non disponibile:', error);
                this.resizeObserver = null;
            }
        }
    }

    /**
     * Configura gestione stack notifiche
     */
    setupStackManagement() {
        // MutationObserver per monitorare cambiamenti nel DOM
        if (window.MutationObserver) {
            try {
                this.mutationObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            this.handleStackChanges();
                        }
                    });
                });

                this.mutationObserver.observe(this.container, {
                    childList: true,
                    subtree: false
                });
            } catch (error) {
                console.warn('MutationObserver non disponibile:', error);
                this.mutationObserver = null;
            }
        }
    }

    /**
     * Configura accessibilità
     */
    setupAccessibility() {
        // Gestione keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Focus management
        this.container.addEventListener('focusin', (e) => {
            this.handleFocusIn(e);
        });

        this.container.addEventListener('focusout', (e) => {
            this.handleFocusOut(e);
        });
    }

    /**
     * Gestisce resize della finestra
     */
    handleResize() {
        if (this.settings.enableResponsive && !this.settings.customPosition) {
            this.updateResponsiveSettings();
        }
        this.adjustStackLayout();
    }

    /**
     * Gestisce resize del container
     */
    handleContainerResize(entry) {
        const { width, height } = entry.contentRect;
        
        // Aggiusta layout se il container è troppo alto
        if (height > window.innerHeight * 0.8) {
            this.enableScrolling();
        } else {
            this.disableScrolling();
        }

        // Notifica cambiamento dimensioni per ottimizzazioni
        this.dispatchEvent('containerResize', { width, height });
    }

    /**
     * Aggiorna impostazioni responsive basate su viewport
     */
    updateResponsiveSettings() {
        const width = window.innerWidth;
        let config;

        if (width <= RESPONSIVE_CONFIG.mobile.maxWidth) {
            config = RESPONSIVE_CONFIG.mobile;
        } else if (width <= RESPONSIVE_CONFIG.tablet.maxWidth) {
            config = RESPONSIVE_CONFIG.tablet;
        } else {
            config = RESPONSIVE_CONFIG.desktop;
        }

        // Aggiorna solo se non è una posizione personalizzata
        if (!this.settings.customPosition) {
            this.settings.position = config.position;
            this.settings.maxVisible = config.maxVisible;
            
            if (this.container) {
                this.container.setAttribute('data-position', this.settings.position);
                this.container.style.setProperty('--max-visible-notifications', this.settings.maxVisible);
            }
        }

        // Aggiorna padding del container
        this.updateContainerPadding(config.containerPadding);
    }

    /**
     * Aggiorna posizione del container
     */
    updatePosition(position) {
        if (!SUPPORTED_POSITIONS.includes(position)) {
            console.warn(`Posizione non supportata: ${position}. Usando 'top-right'.`);
            position = 'top-right';
        }

        this.settings.position = position;
        this.container.setAttribute('data-position', position);
        
        // Rimuovi tutte le classi di posizione esistenti
        SUPPORTED_POSITIONS.forEach(pos => {
            this.container.classList.remove(`notification-container--${pos}`);
        });
        
        // Aggiungi nuova classe di posizione
        this.container.classList.add(`notification-container--${position}`);

        this.dispatchEvent('positionChanged', { position });
    }

    /**
     * Aggiorna numero massimo di notifiche visibili
     */
    updateMaxVisible(maxVisible) {
        this.settings.maxVisible = Math.max(1, Math.min(10, maxVisible));
        this.container.style.setProperty('--max-visible-notifications', this.settings.maxVisible);
        
        this.enforceMaxVisible();
        this.dispatchEvent('maxVisibleChanged', { maxVisible: this.settings.maxVisible });
    }

    /**
     * Aggiorna padding del container
     */
    updateContainerPadding(padding) {
        this.container.style.setProperty('--container-padding', padding);
    }

    /**
     * Gestisce cambiamenti nello stack delle notifiche
     */
    handleStackChanges() {
        const notifications = this.getNotifications();
        
        // Applica z-index progressivo per stacking corretto
        notifications.forEach((notification, index) => {
            notification.style.zIndex = this.settings.zIndex + 1 + index;
        });

        // Enforza limite massimo visibile
        this.enforceMaxVisible();
        
        // Aggiorna layout dello stack
        this.updateStackLayout();

        this.dispatchEvent('stackChanged', { 
            count: notifications.length,
            visible: Math.min(notifications.length, this.settings.maxVisible)
        });
    }

    /**
     * Applica limite massimo notifiche visibili
     */
    enforceMaxVisible() {
        const notifications = this.getNotifications();
        
        notifications.forEach((notification, index) => {
            if (index >= this.settings.maxVisible) {
                notification.style.display = 'none';
                notification.setAttribute('aria-hidden', 'true');
                notification.setAttribute('data-hidden', 'true');
            } else {
                notification.style.display = '';
                notification.removeAttribute('aria-hidden');
                notification.removeAttribute('data-hidden');
            }
        });
    }

    /**
     * Aggiorna layout dello stack
     */
    updateStackLayout() {
        const notifications = this.getVisibleNotifications();
        const isBottomPosition = this.settings.position.includes('bottom');
        
        notifications.forEach((notification, index) => {
            // Applica offset per effetto stack
            const offset = index * 4; // 4px di offset per ogni notifica
            const scale = 1 - (index * 0.02); // Leggera riduzione di scala
            
            if (isBottomPosition) {
                notification.style.transform = `translateY(-${offset}px) scale(${scale})`;
            } else {
                notification.style.transform = `translateY(${offset}px) scale(${scale})`;
            }
            
            // Riduce opacità per notifiche più in basso nello stack
            notification.style.opacity = 1 - (index * 0.1);
        });
    }

    /**
     * Aggiusta layout dello stack per responsive
     */
    adjustStackLayout() {
        const width = window.innerWidth;
        
        // Su mobile, riduci spacing tra notifiche
        if (width <= RESPONSIVE_CONFIG.mobile.maxWidth) {
            this.container.style.setProperty('--notification-gap', '0.5rem');
        } else {
            this.container.style.setProperty('--notification-gap', '0.75rem');
        }
        
        this.updateStackLayout();
    }

    /**
     * Abilita scrolling per container troppo alto
     */
    enableScrolling() {
        this.container.style.overflowY = 'auto';
        this.container.style.maxHeight = '80vh';
        this.container.classList.add('notification-container--scrollable');
    }

    /**
     * Disabilita scrolling
     */
    disableScrolling() {
        this.container.style.overflowY = 'hidden';
        this.container.style.maxHeight = '100vh';
        this.container.classList.remove('notification-container--scrollable');
    }

    /**
     * Gestisce navigazione da tastiera
     */
    handleKeyboardNavigation(e) {
        const notifications = this.getVisibleNotifications();
        const currentIndex = notifications.findIndex(n => n.contains(document.activeElement));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNotification(currentIndex + 1, notifications);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.focusNotification(currentIndex - 1, notifications);
                break;
                
            case 'Home':
                e.preventDefault();
                this.focusNotification(0, notifications);
                break;
                
            case 'End':
                e.preventDefault();
                this.focusNotification(notifications.length - 1, notifications);
                break;
                
            case 'Escape':
                e.preventDefault();
                this.clearAllNotifications();
                break;
        }
    }

    /**
     * Focalizza una notifica specifica
     */
    focusNotification(index, notifications) {
        if (index >= 0 && index < notifications.length) {
            const notification = notifications[index];
            const focusableElement = notification.querySelector('[tabindex="0"], button, [href]') || notification;
            focusableElement.focus();
        }
    }

    /**
     * Gestisce focus in entrata
     */
    handleFocusIn(e) {
        const notification = e.target.closest('.notification');
        if (notification) {
            notification.classList.add('notification--focused');
        }
    }

    /**
     * Gestisce focus in uscita
     */
    handleFocusOut(e) {
        const notification = e.target.closest('.notification');
        if (notification && !notification.contains(e.relatedTarget)) {
            notification.classList.remove('notification--focused');
        }
    }

    /**
     * Aggiunge una notifica al container
     */
    addNotification(notificationElement) {
        if (!notificationElement || !this.container) return;

        // Inserisci in base alla posizione (top o bottom)
        const isBottomPosition = this.settings.position.includes('bottom');
        
        if (isBottomPosition) {
            this.container.appendChild(notificationElement);
        } else {
            this.container.insertBefore(notificationElement, this.container.firstChild);
        }

        // Applica limite massimo visibile
        this.enforceMaxVisible();
        
        // Trigger gestione stack
        this.handleStackChanges();
    }

    /**
     * Rimuove una notifica dal container
     */
    removeNotification(notificationId) {
        const notification = this.container.querySelector(`[data-id="${notificationId}"]`);
        if (notification) {
            notification.remove();
            this.handleStackChanges();
        }
    }

    /**
     * Ottiene tutte le notifiche nel container
     */
    getNotifications() {
        return Array.from(this.container.querySelectorAll('.notification'));
    }

    /**
     * Ottiene solo le notifiche visibili
     */
    getVisibleNotifications() {
        return this.getNotifications().filter(n => 
            !n.hasAttribute('data-hidden') && !n.hasAttribute('aria-hidden')
        );
    }

    /**
     * Pulisce tutte le notifiche
     */
    clearAllNotifications() {
        this.container.innerHTML = '';
        this.dispatchEvent('allCleared');
    }

    /**
     * Aggiorna impostazioni del container
     */
    updateSettings(newSettings) {
        const oldSettings = { ...this.settings };
        this.settings = { ...this.settings, ...newSettings };

        // Applica cambiamenti
        if (newSettings.position && newSettings.position !== oldSettings.position) {
            this.updatePosition(newSettings.position);
            this.settings.customPosition = true;
        }

        if (newSettings.maxVisible && newSettings.maxVisible !== oldSettings.maxVisible) {
            this.updateMaxVisible(newSettings.maxVisible);
        }

        if (newSettings.enableResponsive !== oldSettings.enableResponsive) {
            if (newSettings.enableResponsive) {
                this.setupResponsiveBehavior();
            } else {
                this.disableResponsiveBehavior();
            }
        }

        this.dispatchEvent('settingsUpdated', { oldSettings, newSettings: this.settings });
    }

    /**
     * Disabilita comportamento responsive
     */
    disableResponsiveBehavior() {
        window.removeEventListener('resize', this.handleResize);
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    /**
     * Ottiene informazioni sullo stato del container
     */
    getStatus() {
        const notifications = this.getNotifications();
        const visible = this.getVisibleNotifications();
        
        return {
            position: this.settings.position,
            maxVisible: this.settings.maxVisible,
            totalNotifications: notifications.length,
            visibleNotifications: visible.length,
            hiddenNotifications: notifications.length - visible.length,
            isScrollable: this.container.classList.contains('notification-container--scrollable'),
            containerDimensions: {
                width: this.container.offsetWidth,
                height: this.container.offsetHeight
            }
        };
    }

    /**
     * Dispatch eventi personalizzati
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`notificationContainer:${eventName}`, {
            detail: {
                container: this,
                ...detail
            }
        });
        
        this.container.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    /**
     * Distrugge il container e pulisce event listeners
     */
    destroy() {
        // Rimuovi event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Disconnetti observers
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        // Rimuovi container dal DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Dispatch evento prima di pulire i riferimenti
        if (this.container) {
            this.dispatchEvent('destroyed');
        }
        
        // Pulisci riferimenti
        this.container = null;
        this.resizeObserver = null;
        this.mutationObserver = null;
    }

    /**
     * Metodi statici di utilità
     */
    
    /**
     * Crea un'istanza con configurazione responsive automatica
     */
    static createResponsive(options = {}) {
        return new NotificationContainer({
            enableResponsive: true,
            ...options
        });
    }

    /**
     * Crea un'istanza con posizione fissa
     */
    static createFixed(position, maxVisible = 5, options = {}) {
        return new NotificationContainer({
            position,
            maxVisible,
            enableResponsive: false,
            customPosition: true,
            ...options
        });
    }

    /**
     * Verifica se una posizione è supportata
     */
    static isValidPosition(position) {
        return SUPPORTED_POSITIONS.includes(position);
    }

    /**
     * Ottiene tutte le posizioni supportate
     */
    static getSupportedPositions() {
        return [...SUPPORTED_POSITIONS];
    }

    /**
     * Ottiene configurazione responsive default
     */
    static getResponsiveConfig() {
        return { ...RESPONSIVE_CONFIG };
    }
}

export default NotificationContainer;