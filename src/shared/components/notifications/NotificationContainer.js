// Container semplificato per le notifiche

export class NotificationContainer {
    constructor(options = {}) {
        this.options = {
            position: 'top-right',
            maxVisible: 5,
            ...options,
        };
        // Alias compatibile con alcuni test/consumatori
        this.settings = this.options;
        this.container = this.createContainer();
        this.notifications = new Map();
    }
    
    createContainer() {
        // SSR guard: se non c'è window o document, ritorna null
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return null;
        }

        // Rimuovi eventuale container precedente duplicato
        const existing = document.getElementById('notification-container');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        const container = document.createElement('div');
        container.id = 'notification-container';
        const position = this.options.position || 'top-right';
        container.className = `notification-container notification-container--${position}`;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Notifiche di sistema');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('data-position', position);
        container.style.cssText = `
            position: fixed;
            z-index: 1050;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            pointer-events: auto;
        `;

        // Posizionamento di default basato sulla posizione
        this.applyPositionStyles(container, position);

        if (document.body) {
            document.body.appendChild(container);
        }
        return container;
    }

    applyPositionStyles(container, position) {
        if (!container) return;
        // Reset
        container.style.top = '';
        container.style.right = '';
        container.style.bottom = '';
        container.style.left = '';
        container.style.transform = '';

        const padding = '20px';
        switch (position) {
            case 'top-left':
                container.style.top = padding;
                container.style.left = padding;
                break;
            case 'top-center':
                container.style.top = padding;
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
                break;
            case 'bottom-right':
                container.style.bottom = padding;
                container.style.right = padding;
                break;
            case 'bottom-left':
                container.style.bottom = padding;
                container.style.left = padding;
                break;
            case 'bottom-center':
                container.style.bottom = padding;
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
                break;
            case 'top-right':
            default:
                container.style.top = padding;
                container.style.right = padding;
                break;
        }
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
    
    // Alias richiesto da alcune API/test
    clear() {
        this.clearAllNotifications();
    }
    
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        this.settings = this.options;
        
        if (newSettings.position) {
            const pos = newSettings.position;
            this.container.setAttribute('data-position', pos);
            // aggiorna classi modifier
            this.container.className = `notification-container notification-container--${pos}`;
            this.applyPositionStyles(this.container, pos);
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

    // Per parità API con il container virtuale
    handleResize() {
        // opzionale nei test, no-op qui
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