// Container semplificato per le notifiche

export class NotificationContainer {
    constructor(options = {}) {
        this.options = options;
        this.container = this.createContainer();
        this.notifications = new Map();
    }
    
    createContainer() {
        let container = document.querySelector('.notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.setAttribute('data-position', this.options.position || 'top-right');
            
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1050;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            `;
            
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    addNotification(element) {
        if (!element) return;
        
        const id = element.dataset.id;
        if (id && this.notifications.has(id)) {
            return; // Già presente
        }
        
        // Aggiungi al DOM
        this.container.appendChild(element);
        
        if (id) {
            this.notifications.set(id, element);
        }
    }
    
    removeNotification(id) {
        const element = this.notifications.get(id);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            this.notifications.delete(id);
        }
    }
    
    clearAllNotifications() {
        this.notifications.forEach((element, id) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.notifications.clear();
    }
    
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        
        if (newSettings.position) {
            this.container.setAttribute('data-position', newSettings.position);
        }
    }

    // Compatibilità: aggiorna solo la posizione (alias di updateSettings)
    updatePosition(position) {
        this.updateSettings({ position });
    }

    // Compatibilità: restituisce lista notifiche correnti (elementi DOM)
    getNotifications() {
        return Array.from(this.notifications.values());
    }

    // Compatibilità: per container non virtuale coincide con getNotifications
    getVisibleNotifications() {
        return this.getNotifications();
    }

    // Impone un limite massimo di notifiche visibili rimuovendo le più vecchie
    enforceMaxVisible() {
        const max = this.options.maxVisible;
        if (!max || max <= 0) return;

        while (this.notifications.size > max) {
            // rimuovi la prima inserita (FIFO)
            const firstId = this.notifications.keys().next().value;
            this.removeNotification(firstId);
        }
    }

    // Aggiorna maxVisible e applica subito il trimming
    updateMaxVisible(maxVisible) {
        this.options.maxVisible = maxVisible;
        this.enforceMaxVisible();
    }

    // Rimuove container dal DOM e pulisce riferimenti
    destroy() {
        try {
            this.clearAllNotifications();
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        } finally {
            this.notifications.clear();
            this.container = null;
        }
    }
}