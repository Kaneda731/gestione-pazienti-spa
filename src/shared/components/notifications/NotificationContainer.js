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
        
        console.log(`✅ Notification added to container: ${id}`);
    }
    
    removeNotification(id) {
        const element = this.notifications.get(id);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            this.notifications.delete(id);
            console.log(`🗑️ Notification removed from container: ${id}`);
        }
    }
    
    clearAllNotifications() {
        this.notifications.forEach((element, id) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.notifications.clear();
        console.log('🧹 All notifications cleared from container');
    }
    
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        
        if (newSettings.position) {
            this.container.setAttribute('data-position', newSettings.position);
        }
    }
}