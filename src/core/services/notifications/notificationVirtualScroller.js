// src/core/services/notifications/notificationVirtualScroller.js

/**
 * Virtual scrolling per gestire molte notifiche simultanee
 * Ottimizza performance renderizzando solo le notifiche visibili
 */

export class NotificationVirtualScroller {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            itemHeight: 72, // Altezza stimata di una notifica
            visibleCount: 5, // Numero di notifiche visibili
            bufferSize: 2, // Notifiche extra da renderizzare fuori viewport
            ...options
        };
        
        this.notifications = [];
        this.renderedItems = new Map();
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        // Crea wrapper per virtual scrolling
        this.viewport = document.createElement('div');
        this.viewport.className = 'notification-virtual-viewport';
        this.viewport.style.cssText = `
            height: 100%;
            overflow-y: auto;
            position: relative;
        `;
        
        this.content = document.createElement('div');
        this.content.className = 'notification-virtual-content';
        this.content.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        this.viewport.appendChild(this.content);
        this.container.appendChild(this.viewport);
        
        // Event listeners
        this.viewport.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Osserva resize del container
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
            this.resizeObserver.observe(this.container);
        }
        
        this.updateContainerHeight();
    }
    
    handleScroll() {
        this.scrollTop = this.viewport.scrollTop;
        this.render();
    }
    
    handleResize() {
        this.updateContainerHeight();
        this.render();
    }
    
    updateContainerHeight() {
        this.containerHeight = this.container.clientHeight;
        this.options.visibleCount = Math.ceil(this.containerHeight / this.options.itemHeight) + 1;
    }
    
    setNotifications(notifications) {
        this.notifications = notifications;
        this.totalHeight = notifications.length * this.options.itemHeight;
        this.content.style.height = `${this.totalHeight}px`;
        this.render();
    }
    
    render() {
        if (!this.notifications.length) {
            this.clearRendered();
            return;
        }
        
        const startIndex = Math.floor(this.scrollTop / this.options.itemHeight);
        const endIndex = Math.min(
            startIndex + this.options.visibleCount + this.options.bufferSize,
            this.notifications.length
        );
        
        const visibleStart = Math.max(0, startIndex - this.options.bufferSize);
        const visibleEnd = endIndex;
        
        // Rimuovi elementi non più visibili
        for (const [index, element] of this.renderedItems) {
            if (index < visibleStart || index >= visibleEnd) {
                element.remove();
                this.renderedItems.delete(index);
            }
        }
        
        // Aggiungi nuovi elementi visibili
        for (let i = visibleStart; i < visibleEnd; i++) {
            if (!this.renderedItems.has(i) && this.notifications[i]) {
                const element = this.createNotificationElement(this.notifications[i], i);
                if (element) {
                    this.renderedItems.set(i, element);
                    this.content.appendChild(element);
                }
            }
        }
        
        // Aggiorna posizioni
        for (const [index, element] of this.renderedItems) {
            const top = index * this.options.itemHeight;
            element.style.position = 'absolute';
            element.style.top = `${top}px`;
            element.style.width = '100%';
            element.style.zIndex = this.notifications.length - index; // Stack order
        }
    }
    
    createNotificationElement(notification, index) {
        // Delega la creazione dell'elemento al renderer principale
        if (this.options.createElement) {
            return this.options.createElement(notification, index);
        }
        
        // Fallback: elemento semplice
        const div = document.createElement('div');
        div.className = `notification notification--${notification.type}`;
        div.dataset.id = notification.id;
        div.innerHTML = `
            <div class="notification__content">
                <span class="notification__icon">${this.getIconForType(notification.type)}</span>
                <div class="notification__message">${notification.message}</div>
            </div>
        `;
        return div;
    }
    
    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    }
    
    clearRendered() {
        for (const element of this.renderedItems.values()) {
            element.remove();
        }
        this.renderedItems.clear();
    }
    
    scrollToNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            const targetTop = index * this.options.itemHeight;
            this.viewport.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });
        }
    }
    
    updateNotification(notificationId, newData) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            this.notifications[index] = { ...this.notifications[index], ...newData };
            
            // Re-render se l'elemento è attualmente visibile
            if (this.renderedItems.has(index)) {
                const oldElement = this.renderedItems.get(index);
                const newElement = this.createNotificationElement(this.notifications[index], index);
                if (newElement) {
                    oldElement.replaceWith(newElement);
                    this.renderedItems.set(index, newElement);
                    
                    // Mantieni posizione
                    const top = index * this.options.itemHeight;
                    newElement.style.position = 'absolute';
                    newElement.style.top = `${top}px`;
                    newElement.style.width = '100%';
                }
            }
        }
    }
    
    removeNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            // Rimuovi dalla lista
            this.notifications.splice(index, 1);
            
            // Rimuovi elemento renderizzato se presente
            if (this.renderedItems.has(index)) {
                this.renderedItems.get(index).remove();
                this.renderedItems.delete(index);
            }
            
            // Aggiorna indici degli elementi successivi
            const newRenderedItems = new Map();
            for (const [oldIndex, element] of this.renderedItems) {
                const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
                newRenderedItems.set(newIndex, element);
            }
            this.renderedItems = newRenderedItems;
            
            // Re-render per aggiornare posizioni
            this.totalHeight = this.notifications.length * this.options.itemHeight;
            this.content.style.height = `${this.totalHeight}px`;
            this.render();
        }
    }
    
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        this.clearRendered();
        
        if (this.viewport && this.viewport.parentNode) {
            this.viewport.parentNode.removeChild(this.viewport);
        }
    }
    
    // Metodi per performance monitoring
    getStats() {
        return {
            totalNotifications: this.notifications.length,
            renderedElements: this.renderedItems.size,
            memoryUsage: this.renderedItems.size * this.options.itemHeight,
            scrollPosition: this.scrollTop,
            containerHeight: this.containerHeight
        };
    }
}