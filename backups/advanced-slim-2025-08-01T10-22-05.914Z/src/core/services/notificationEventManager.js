// src/core/services/notificationEventManager.js

/**
 * Gestione centralizzata degli event listeners per notifiche
 * Previene memory leaks e ottimizza performance
 */

export class NotificationEventManager {
    constructor() {
        this.listeners = new Map(); // Map<element, Set<{type, handler, options}>>
        this.globalListeners = new Set(); // Set<{target, type, handler, options}>
        this.abortControllers = new Map(); // Map<element, AbortController>
        this.cleanupCallbacks = new Set(); // Set<Function>
        
        // Auto-cleanup su page unload
        this.setupGlobalCleanup();
    }
    
    setupGlobalCleanup() {
        const cleanup = () => this.cleanupAll();
        
        // Cleanup su page unload
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        
        // Cleanup su visibility change (mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.pauseAllTimers();
            } else {
                this.resumeAllTimers();
            }
        });
        
        // Salva riferimento per cleanup
        this.globalCleanupHandler = cleanup;
    }
    
    /**
     * Aggiunge event listener con cleanup automatico
     */
    addEventListener(element, type, handler, options = {}) {
        if (!element || typeof handler !== 'function') {

            return;
        }
        
        // Crea AbortController per questo elemento se non esiste
        if (!this.abortControllers.has(element)) {
            this.abortControllers.set(element, new AbortController());
        }
        
        const abortController = this.abortControllers.get(element);
        const enhancedOptions = {
            ...options,
            signal: abortController.signal
        };
        
        // Wrapper per handler con error handling
        const wrappedHandler = (event) => {
            try {
                handler(event);
            } catch (error) {

                // Rimuovi listener problematico
                this.removeEventListener(element, type, handler);
            }
        };
        
        // Aggiungi listener
        element.addEventListener(type, wrappedHandler, enhancedOptions);
        
        // Traccia listener per cleanup
        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Set());
        }
        
        this.listeners.get(element).add({
            type,
            handler: wrappedHandler,
            originalHandler: handler,
            options: enhancedOptions
        });
        
        return wrappedHandler;
    }
    
    /**
     * Rimuove event listener specifico
     */
    removeEventListener(element, type, handler) {
        if (!element || !this.listeners.has(element)) return;
        
        const elementListeners = this.listeners.get(element);
        
        for (const listener of elementListeners) {
            if (listener.type === type && 
                (listener.originalHandler === handler || listener.handler === handler)) {
                
                element.removeEventListener(type, listener.handler, listener.options);
                elementListeners.delete(listener);
                break;
            }
        }
        
        // Cleanup se non ci sono più listeners
        if (elementListeners.size === 0) {
            this.cleanupElement(element);
        }
    }
    
    /**
     * Rimuove tutti gli event listeners di un elemento
     */
    removeAllListeners(element) {
        if (!element) return;
        
        // Usa AbortController per cleanup rapido
        if (this.abortControllers.has(element)) {
            this.abortControllers.get(element).abort();
            this.abortControllers.delete(element);
        }
        
        // Cleanup tracking
        this.listeners.delete(element);
    }
    
    /**
     * Cleanup completo di un elemento
     */
    cleanupElement(element) {
        if (!element) return;
        
        this.removeAllListeners(element);
        
        // Rimuovi attributi di tracking
        if (element.dataset) {
            delete element.dataset.notificationId;
            delete element.dataset.eventManagerTracked;
        }
        
        // Cleanup timer associati
        this.cleanupElementTimers(element);
    }
    
    /**
     * Aggiunge listener globale (window, document, etc.)
     */
    addGlobalListener(target, type, handler, options = {}) {
        const wrappedHandler = (event) => {
            try {
                handler(event);
            } catch (error) {

            }
        };
        
        target.addEventListener(type, wrappedHandler, options);
        
        this.globalListeners.add({
            target,
            type,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });
        
        return wrappedHandler;
    }
    
    /**
     * Rimuove listener globale
     */
    removeGlobalListener(target, type, handler) {
        for (const listener of this.globalListeners) {
            if (listener.target === target && 
                listener.type === type && 
                (listener.originalHandler === handler || listener.handler === handler)) {
                
                target.removeEventListener(type, listener.handler, listener.options);
                this.globalListeners.delete(listener);
                break;
            }
        }
    }
    
    /**
     * Aggiunge callback di cleanup personalizzato
     */
    addCleanupCallback(callback) {
        if (typeof callback === 'function') {
            this.cleanupCallbacks.add(callback);
        }
    }
    
    /**
     * Rimuove callback di cleanup
     */
    removeCleanupCallback(callback) {
        this.cleanupCallbacks.delete(callback);
    }
    
    /**
     * Cleanup di tutti gli event listeners
     */
    cleanupAll() {
        // Cleanup elementi
        for (const [element] of this.listeners) {
            this.cleanupElement(element);
        }
        
        // Cleanup listeners globali
        for (const listener of this.globalListeners) {
            listener.target.removeEventListener(
                listener.type, 
                listener.handler, 
                listener.options
            );
        }
        this.globalListeners.clear();
        
        // Esegui callback di cleanup personalizzati
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            } catch (error) {

            }
        }
        
        // Reset state
        this.listeners.clear();
        this.abortControllers.clear();
        this.cleanupCallbacks.clear();
    }
    
    /**
     * Pausa tutti i timer (per ottimizzazione mobile)
     */
    pauseAllTimers() {
        // Implementazione delegata al timer manager
        if (window.notificationTimerManager) {
            window.notificationTimerManager.pauseAll();
        }
    }
    
    /**
     * Riprende tutti i timer
     */
    resumeAllTimers() {
        // Implementazione delegata al timer manager
        if (window.notificationTimerManager) {
            window.notificationTimerManager.resumeAll();
        }
    }
    
    /**
     * Cleanup timer specifici di un elemento
     */
    cleanupElementTimers(element) {
        if (!element || !element.dataset.notificationId) return;
        
        const notificationId = element.dataset.notificationId;
        
        // Cleanup timer auto-close
        if (window.notificationTimerManager) {
            window.notificationTimerManager.clearTimer(notificationId);
        }
        
        // Cleanup animazioni
        if (element.getAnimations) {
            element.getAnimations().forEach(animation => {
                animation.cancel();
            });
        }
    }
    
    /**
     * Ottimizzazione: usa event delegation per eventi comuni
     */
    setupEventDelegation(container) {
        if (!container) return;
        
        // Delega eventi di click per pulsanti chiusura
        this.addEventListener(container, 'click', (event) => {
            const closeBtn = event.target.closest('.notification__close');
            if (closeBtn) {
                const notification = closeBtn.closest('.notification');
                if (notification && notification.dataset.id) {
                    this.handleNotificationClose(notification.dataset.id);
                }
            }
            
            // Gestisci pulsanti azione
            const actionBtn = event.target.closest('.notification__action-btn');
            if (actionBtn) {
                const notification = actionBtn.closest('.notification');
                const actionIndex = actionBtn.dataset.actionIndex;
                if (notification && actionIndex !== undefined) {
                    this.handleNotificationAction(notification.dataset.id, parseInt(actionIndex));
                }
            }
        });
        
        // Delega eventi keyboard
        this.addEventListener(container, 'keydown', (event) => {
            const notification = event.target.closest('.notification');
            if (!notification) return;
            
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    this.handleNotificationClose(notification.dataset.id);
                    break;
                case 'Enter':
                case ' ':
                    if (event.target.classList.contains('notification__close') ||
                        event.target.classList.contains('notification__action-btn')) {
                        event.preventDefault();
                        event.target.click();
                    }
                    break;
            }
        });
        
        // Delega eventi touch per mobile
        if ('ontouchstart' in window) {
            this.setupTouchDelegation(container);
        }
    }
    
    /**
     * Setup touch event delegation per mobile
     */
    setupTouchDelegation(container) {
        let touchStartX = null;
        let touchStartY = null;
        let touchStartTime = null;
        
        this.addEventListener(container, 'touchstart', (event) => {
            const notification = event.target.closest('.notification');
            if (!notification) return;
            
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            
            notification.classList.add('notification--touched');
        }, { passive: true });
        
        this.addEventListener(container, 'touchmove', (event) => {
            const notification = event.target.closest('.notification');
            if (!notification || !touchStartX) return;
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = Math.abs(touch.clientY - touchStartY);
            
            // Swipe orizzontale
            if (Math.abs(deltaX) > 30 && deltaY < 50) {
                notification.style.transform = `translateX(${deltaX}px)`;
                
                if (Math.abs(deltaX) > 100) {
                    notification.classList.add('notification--swipe-threshold');
                }
            }
        }, { passive: true });
        
        this.addEventListener(container, 'touchend', (event) => {
            const notification = event.target.closest('.notification');
            if (!notification) return;
            
            notification.classList.remove('notification--touched', 'notification--swipe-threshold');
            
            if (touchStartX && touchStartTime) {
                const touch = event.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaTime = Date.now() - touchStartTime;
                
                // Swipe per chiudere
                if (Math.abs(deltaX) > 100 && deltaTime < 500) {
                    this.handleNotificationClose(notification.dataset.id);
                } else {
                    // Reset posizione
                    notification.style.transform = '';
                }
            }
            
            touchStartX = null;
            touchStartY = null;
            touchStartTime = null;
        }, { passive: true });
    }
    
    /**
     * Handler per chiusura notifica
     */
    handleNotificationClose(notificationId) {
        if (window.notificationService) {
            window.notificationService.removeNotification(notificationId);
        }
    }
    
    /**
     * Handler per azioni notifica
     */
    handleNotificationAction(notificationId, actionIndex) {
        // Implementazione delegata al service principale
        if (window.notificationService && window.notificationService.handleAction) {
            window.notificationService.handleAction(notificationId, actionIndex);
        }
    }
    
    /**
     * Statistiche per monitoring
     */
    getStats() {
        return {
            elementsTracked: this.listeners.size,
            totalListeners: Array.from(this.listeners.values())
                .reduce((sum, set) => sum + set.size, 0),
            globalListeners: this.globalListeners.size,
            abortControllers: this.abortControllers.size,
            cleanupCallbacks: this.cleanupCallbacks.size
        };
    }
    
    /**
     * Cleanup su destroy
     */
    destroy() {
        this.cleanupAll();
        
        // Rimuovi listener globali di cleanup
        if (this.globalCleanupHandler) {
            window.removeEventListener('beforeunload', this.globalCleanupHandler);
            window.removeEventListener('pagehide', this.globalCleanupHandler);
        }
    }
}

// Istanza singleton
export const notificationEventManager = new NotificationEventManager();