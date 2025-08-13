/**
 * NotificationBatchRenderer - Renderer ottimizzato per molte notifiche simultanee
 * Gestisce il rendering efficiente di batch di notifiche con ottimizzazioni performance
 */

export class NotificationBatchRenderer {
    constructor(options = {}) {
        this.options = {
            batchSize: 10,
            renderDelay: 16, // ~60fps
            maxConcurrentAnimations: 5,
            useDocumentFragment: true,
            ...options
        };
        
        this.renderQueue = [];
        this.animationQueue = [];
        this.isRendering = false;
        this.frameId = null;
        
        this.init();
    }
    
    init() {
        // Bind methods per event listeners
        this.processRenderQueue = this.processRenderQueue.bind(this);
        this.processAnimationQueue = this.processAnimationQueue.bind(this);
    }
    
    // Aggiunge notifiche alla coda di rendering
    queueNotifications(notifications) {
        if (!Array.isArray(notifications)) {
            notifications = [notifications];
        }
        
        // Aggiungi alla coda con priorità
        notifications.forEach(notification => {
            const queueItem = {
                notification,
                priority: this.calculatePriority(notification),
                timestamp: Date.now(),
                retries: 0
            };
            
            this.renderQueue.push(queueItem);
        });
        
        // Ordina per priorità
        this.renderQueue.sort((a, b) => b.priority - a.priority);
        
        // Avvia rendering se non già in corso
        if (!this.isRendering) {
            this.startRendering();
        }
    }
    
    calculatePriority(notification) {
        let priority = 0;
        
        // Priorità per tipo
        const typePriorities = {
            error: 100,
            warning: 75,
            success: 50,
            info: 25
        };
        priority += typePriorities[notification.type] || 0;
        
        // Priorità per persistenza
        if (notification.persistent) {
            priority += 50;
        }
        
        // Priorità per azioni personalizzate
        if (notification.actions && notification.actions.length > 0) {
            priority += 25;
        }
        
        return priority;
    }
    
    startRendering() {
        if (this.isRendering) {
            return;
        }
        
        this.isRendering = true;
        this.scheduleNextRender();
    }
    
    scheduleNextRender() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
        
        this.frameId = requestAnimationFrame(() => {
            this.processRenderQueue();
            
            // Continua se ci sono ancora elementi in coda
            if (this.renderQueue.length > 0) {
                setTimeout(() => {
                    this.scheduleNextRender();
                }, this.options.renderDelay);
            } else {
                this.isRendering = false;
            }
        });
    }
    
    processRenderQueue() {
        if (this.renderQueue.length === 0) {
            return;
        }
        
        // Prendi un batch di notifiche da renderizzare
        const batch = this.renderQueue.splice(0, this.options.batchSize);
        
        try {
            this.renderBatch(batch);
        } catch (error) {
            console.error('Errore rendering batch notifiche:', error);
            
            // Riprova con le notifiche fallite
            batch.forEach(item => {
                if (item.retries < 3) {
                    item.retries++;
                    this.renderQueue.push(item);
                }
            });
        }
    }
    
    renderBatch(batch) {
        if (batch.length === 0) {
            return;
        }
        
        // Usa DocumentFragment per ottimizzare DOM manipulation
        const fragment = this.options.useDocumentFragment 
            ? document.createDocumentFragment() 
            : null;
        
        const renderedElements = [];
        
        batch.forEach(item => {
            try {
                const element = this.renderSingleNotification(item.notification);
                if (element) {
                    if (fragment) {
                        fragment.appendChild(element);
                    }
                    renderedElements.push({
                        element,
                        notification: item.notification
                    });
                }
            } catch (error) {
                console.error('Errore rendering singola notifica:', error);
            }
        });
        
        // Aggiungi tutto al DOM in una volta
        if (fragment && renderedElements.length > 0) {
            const container = this.getNotificationContainer();
            if (container) {
                container.appendChild(fragment);
            }
        }
        
        // Avvia animazioni per le notifiche renderizzate
        this.queueAnimations(renderedElements);
    }
    
    renderSingleNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification notification--${notification.type}`;
        element.setAttribute('role', notification.type === 'error' ? 'alert' : 'status');
        element.setAttribute('aria-atomic', 'true');
        element.setAttribute('data-notification-id', notification.id);
        
        // Imposta stili iniziali per animazione
        element.style.cssText = `
            opacity: 0;
            transform: translateX(100%);
            transition: none;
        `;
        
        element.innerHTML = this.generateNotificationHTML(notification);
        
        // Aggiungi event listeners
        this.attachEventListeners(element, notification);
        
        return element;
    }
    
    generateNotificationHTML(notification) {
        const iconMap = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        
        const icon = iconMap[notification.type] || 'info';
        const message = this.escapeHtml(notification.message);
        const timestamp = notification.timestamp 
            ? this.formatTimestamp(notification.timestamp) 
            : '';
        
        let actionsHTML = '';
        if (notification.actions && notification.actions.length > 0) {
            actionsHTML = `
                <div class="notification__custom-actions">
                    ${notification.actions.map(action => `
                        <button class="notification__action notification__action--${action.style || 'secondary'}" 
                                data-action="${action.id || 'custom'}">
                            ${this.escapeHtml(action.label)}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="notification__content">
                <span class="notification__icon material-icons">${icon}</span>
                <div class="notification__body">
                    <div class="notification__message">${message}</div>
                    ${timestamp ? `<div class="notification__timestamp">${timestamp}</div>` : ''}
                </div>
            </div>
            ${actionsHTML}
            <div class="notification__actions">
                <button class="notification__close" aria-label="Chiudi notifica" data-action="close">
                    <span class="material-icons">close</span>
                </button>
            </div>
            ${!notification.persistent && notification.duration > 0 ? `
                <div class="notification__progress" aria-hidden="true">
                    <div class="notification__progress-bar"></div>
                </div>
            ` : ''}
        `;
    }
    
    attachEventListeners(element, notification) {
        // Close button
        const closeButton = element.querySelector('[data-action="close"]');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeNotification(element, notification);
            });
        }
        
        // Custom actions
        const actionButtons = element.querySelectorAll('.notification__action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const actionId = button.getAttribute('data-action');
                this.handleCustomAction(actionId, notification, element);
            });
        });
        
        // Pause timer on hover/focus
        if (!notification.persistent && notification.duration > 0) {
            element.addEventListener('mouseenter', () => {
                this.pauseTimer(notification.id);
            });
            
            element.addEventListener('mouseleave', () => {
                this.resumeTimer(notification.id);
            });
            
            element.addEventListener('focusin', () => {
                this.pauseTimer(notification.id);
            });
            
            element.addEventListener('focusout', () => {
                this.resumeTimer(notification.id);
            });
        }
    }
    
    queueAnimations(renderedElements) {
        renderedElements.forEach(({ element, notification }) => {
            this.animationQueue.push({
                element,
                notification,
                type: 'entrance',
                timestamp: Date.now()
            });
        });
        
        this.processAnimationQueue();
    }
    
    processAnimationQueue() {
        const maxConcurrent = this.options.maxConcurrentAnimations;
        const activeAnimations = this.animationQueue.filter(item => item.active);
        
        if (activeAnimations.length >= maxConcurrent) {
            return;
        }
        
        const toAnimate = this.animationQueue
            .filter(item => !item.active)
            .slice(0, maxConcurrent - activeAnimations.length);
        
        toAnimate.forEach(item => {
            item.active = true;
            this.animateElement(item);
        });
    }
    
    animateElement(animationItem) {
        const { element, type } = animationItem;
        
        if (type === 'entrance') {
            this.animateEntrance(element, animationItem);
        } else if (type === 'exit') {
            this.animateExit(element, animationItem);
        }
    }
    
    animateEntrance(element, animationItem) {
        // Force reflow per assicurare che gli stili iniziali siano applicati
        element.offsetHeight;
        
        // Applica animazione di entrata
        element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
        
        // Cleanup dopo animazione
        setTimeout(() => {
            this.cleanupAnimation(animationItem);
            
            // Avvia timer auto-close se necessario
            if (!animationItem.notification.persistent && animationItem.notification.duration > 0) {
                this.startAutoCloseTimer(animationItem.notification, element);
            }
        }, 300);
    }
    
    animateExit(element, animationItem) {
        element.style.transition = 'opacity 0.3s ease-in, transform 0.3s ease-in';
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.cleanupAnimation(animationItem);
        }, 300);
    }
    
    cleanupAnimation(animationItem) {
        const index = this.animationQueue.indexOf(animationItem);
        if (index !== -1) {
            this.animationQueue.splice(index, 1);
        }
        
        // Processa prossime animazioni in coda
        setTimeout(() => {
            this.processAnimationQueue();
        }, 50);
    }
    
    removeNotification(element, notification) {
        // Aggiungi alla coda di animazioni di uscita
        this.animationQueue.push({
            element,
            notification,
            type: 'exit',
            timestamp: Date.now()
        });
        
        this.processAnimationQueue();
        
        // Notifica rimozione al sistema
        this.notifyRemoval(notification);
    }
    
    handleCustomAction(actionId, notification, element) {
        // Trova l'azione corrispondente
        const action = notification.actions?.find(a => (a.id || 'custom') === actionId);
        if (action && typeof action.action === 'function') {
            try {
                action.action(notification, element);
            } catch (error) {
                console.error('Errore esecuzione azione personalizzata:', error);
            }
        }
    }
    
    startAutoCloseTimer(notification, element) {
        const timerId = setTimeout(() => {
            this.removeNotification(element, notification);
        }, notification.duration);
        
        // Salva timer ID per poterlo pausare/riprendere
        element.setAttribute('data-timer-id', timerId);
    }
    
    pauseTimer(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            const timerId = element.getAttribute('data-timer-id');
            if (timerId) {
                clearTimeout(parseInt(timerId));
                element.setAttribute('data-timer-paused', 'true');
            }
        }
    }
    
    resumeTimer(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element && element.getAttribute('data-timer-paused') === 'true') {
            element.removeAttribute('data-timer-paused');
            // Restart timer with remaining time (simplified)
            const notification = this.getNotificationById(notificationId);
            if (notification) {
                this.startAutoCloseTimer(notification, element);
            }
        }
    }
    
    getNotificationContainer() {
        return document.querySelector('.notification-container') || 
               document.querySelector('#notification-container') ||
               document.body;
    }
    
    getNotificationById(id) {
        // Questo dovrebbe essere implementato dal sistema principale
        return null;
    }
    
    notifyRemoval(notification) {
        // Dispatch evento per notificare la rimozione
        const event = new CustomEvent('notification-removed', {
            detail: { notification }
        });
        document.dispatchEvent(event);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Metodi di controllo
    clear() {
        this.renderQueue = [];
        this.animationQueue = [];
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        this.isRendering = false;
    }
    
    pause() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.isRendering = false;
    }
    
    resume() {
        if (this.renderQueue.length > 0 && !this.isRendering) {
            this.startRendering();
        }
    }
    
    getStats() {
        return {
            queueLength: this.renderQueue.length,
            animationQueueLength: this.animationQueue.length,
            isRendering: this.isRendering,
            activeAnimations: this.animationQueue.filter(item => item.active).length
        };
    }
    
    destroy() {
        this.clear();
        
        // Pulisci riferimenti
        this.renderQueue = null;
        this.animationQueue = null;
        this.options = null;
    }
}

export default NotificationBatchRenderer;