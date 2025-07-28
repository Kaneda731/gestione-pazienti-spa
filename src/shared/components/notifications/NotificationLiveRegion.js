/**
 * NotificationLiveRegion - Gestisce live region per annunci screen reader
 * Fornisce supporto centralizzato per annunci di accessibilità
 */

export class NotificationLiveRegion {
    constructor(options = {}) {
        this.options = {
            id: options.id || 'notification-announcer',
            className: options.className || 'notification__sr-only',
            defaultLive: options.defaultLive || 'polite',
            enableQueue: options.enableQueue !== false,
            queueDelay: options.queueDelay || 150,
            maxQueueSize: options.maxQueueSize || 10,
            ...options
        };

        this.element = null;
        this.queue = [];
        this.isProcessing = false;
        this.currentTimeout = null;

        this.init();
    }

    /**
     * Inizializza la live region
     */
    init() {
        this.createElement();
        this.setupAccessibility();
    }

    /**
     * Crea l'elemento live region
     */
    createElement() {
        // Rimuovi elemento esistente se presente
        const existing = document.getElementById(this.options.id);
        if (existing) {
            existing.remove();
        }

        this.element = document.createElement('div');
        this.element.id = this.options.id;
        this.element.className = this.options.className;
        
        // Aggiungi al DOM
        document.body.appendChild(this.element);
    }

    /**
     * Configura attributi di accessibilità
     */
    setupAccessibility() {
        this.element.setAttribute('aria-live', this.options.defaultLive);
        this.element.setAttribute('aria-atomic', 'true');
        this.element.setAttribute('role', 'status');
        
        // Assicurati che sia nascosto visivamente ma accessibile agli screen reader
        this.element.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
    }

    /**
     * Annuncia un messaggio
     */
    announce(message, options = {}) {
        if (!message || typeof message !== 'string') {
            console.warn('NotificationLiveRegion: messaggio non valido', message);
            return;
        }

        const announcement = {
            message: message.trim(),
            live: options.live || this.options.defaultLive,
            priority: options.priority || 0,
            timestamp: Date.now(),
            id: this.generateAnnouncementId()
        };

        if (this.options.enableQueue) {
            this.addToQueue(announcement);
        } else {
            this.processAnnouncement(announcement);
        }
    }

    /**
     * Annuncia notifica di successo
     */
    announceSuccess(message, title = '') {
        const fullMessage = title ? `Successo: ${title}. ${message}` : `Successo: ${message}`;
        this.announce(fullMessage, { live: 'polite', priority: 1 });
    }

    /**
     * Annuncia notifica di errore
     */
    announceError(message, title = '') {
        const fullMessage = title ? `Errore: ${title}. ${message}` : `Errore: ${message}`;
        this.announce(fullMessage, { live: 'assertive', priority: 3 });
    }

    /**
     * Annuncia notifica di warning
     */
    announceWarning(message, title = '') {
        const fullMessage = title ? `Attenzione: ${title}. ${message}` : `Attenzione: ${message}`;
        this.announce(fullMessage, { live: 'assertive', priority: 2 });
    }

    /**
     * Annuncia notifica informativa
     */
    announceInfo(message, title = '') {
        const fullMessage = title ? `Informazione: ${title}. ${message}` : `Informazione: ${message}`;
        this.announce(fullMessage, { live: 'polite', priority: 1 });
    }

    /**
     * Annuncia notifica generica con tipo
     */
    announceNotification(type, message, title = '', options = {}) {
        const typeLabels = {
            success: 'Successo',
            error: 'Errore',
            warning: 'Attenzione',
            info: 'Informazione'
        };

        const typeLabel = typeLabels[type] || 'Notifica';
        const fullMessage = title ? `${typeLabel}: ${title}. ${message}` : `${typeLabel}: ${message}`;
        
        const liveSettings = {
            success: 'polite',
            error: 'assertive',
            warning: 'assertive',
            info: 'polite'
        };

        const priorities = {
            success: 1,
            error: 3,
            warning: 2,
            info: 1
        };

        this.announce(fullMessage, {
            live: liveSettings[type] || 'polite',
            priority: priorities[type] || 1,
            ...options
        });
    }

    /**
     * Aggiunge annuncio alla coda
     */
    addToQueue(announcement) {
        // Rimuovi annunci duplicati recenti (ultimi 3 secondi)
        const recentThreshold = Date.now() - 3000;
        this.queue = this.queue.filter(item => 
            item.timestamp < recentThreshold || item.message !== announcement.message
        );

        // Limita dimensione coda
        if (this.queue.length >= this.options.maxQueueSize) {
            this.queue.shift(); // Rimuovi il più vecchio
        }

        // Inserisci in base alla priorità
        const insertIndex = this.queue.findIndex(item => item.priority < announcement.priority);
        if (insertIndex === -1) {
            this.queue.push(announcement);
        } else {
            this.queue.splice(insertIndex, 0, announcement);
        }

        this.processQueue();
    }

    /**
     * Processa la coda degli annunci
     */
    processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const announcement = this.queue.shift();
        
        this.processAnnouncement(announcement);

        // Programma prossimo annuncio
        this.currentTimeout = setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, this.options.queueDelay);
    }

    /**
     * Processa un singolo annuncio
     */
    processAnnouncement(announcement) {
        // Aggiorna attributo aria-live se necessario
        const currentLive = this.element.getAttribute('aria-live');
        if (currentLive !== announcement.live) {
            this.element.setAttribute('aria-live', announcement.live);
        }

        // Pulisci contenuto precedente
        this.element.textContent = '';

        // Aggiungi nuovo contenuto con delay per garantire che screen reader lo rilevi
        setTimeout(() => {
            this.element.textContent = announcement.message;
            this.dispatchEvent('announced', { announcement });
        }, 50);
    }

    /**
     * Pulisce la coda degli annunci
     */
    clearQueue() {
        this.queue = [];
        
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        this.isProcessing = false;
        this.dispatchEvent('queueCleared');
    }

    /**
     * Pulisce il contenuto corrente
     */
    clear() {
        this.element.textContent = '';
        this.dispatchEvent('cleared');
    }

    /**
     * Aggiorna impostazioni live region
     */
    updateSettings(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        if (newOptions.defaultLive) {
            this.element.setAttribute('aria-live', newOptions.defaultLive);
        }
        
        this.dispatchEvent('settingsUpdated', { options: this.options });
    }

    /**
     * Ottiene stato della live region
     */
    getState() {
        return {
            id: this.options.id,
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            currentContent: this.element.textContent,
            currentLive: this.element.getAttribute('aria-live'),
            options: { ...this.options }
        };
    }

    /**
     * Genera ID univoco per annuncio
     */
    generateAnnouncementId() {
        return `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Dispatch eventi personalizzati
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`notificationLiveRegion:${eventName}`, {
            detail: {
                liveRegion: this,
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Distrugge la live region
     */
    destroy() {
        this.clearQueue();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.dispatchEvent('destroyed');
        
        this.element = null;
        this.queue = [];
    }

    /**
     * Metodi statici
     */
    
    /**
     * Crea istanza singleton
     */
    static getInstance(options = {}) {
        if (!NotificationLiveRegion._instance) {
            NotificationLiveRegion._instance = new NotificationLiveRegion(options);
        }
        return NotificationLiveRegion._instance;
    }

    /**
     * Distrugge istanza singleton
     */
    static destroyInstance() {
        if (NotificationLiveRegion._instance) {
            NotificationLiveRegion._instance.destroy();
            NotificationLiveRegion._instance = null;
        }
    }

    /**
     * Verifica se live region esiste
     */
    static exists() {
        return !!NotificationLiveRegion._instance;
    }
}

// Istanza singleton
NotificationLiveRegion._instance = null;

export default NotificationLiveRegion;