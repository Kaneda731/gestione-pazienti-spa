// src/core/services/notificationErrorHandler.js

import { logger } from './loggerService.js';

/**
 * Gestore centralizzato per errori del sistema di notifiche
 * Fornisce fallback e graceful degradation per garantire che le notifiche
 * funzionino sempre, anche in caso di errori
 */
class NotificationErrorHandler {
    static DEBUG = false;
    
    // Queue per notifiche quando DOM non è ready
    static notificationQueue = [];
    static isDOMReady = false;
    static domReadyCallbacks = [];
    
    // Fallback per animazioni non supportate
    static animationSupport = null;
    static reducedMotionPreference = null;
    
    // Contatori per monitoraggio errori
    static errorCounts = {
        render: 0,
        animation: 0,
        dom: 0,
        service: 0,
        total: 0
    };
    
    /**
     * Inizializza il gestore errori
     */
    static init() {
        this.checkDOMReady();
        this.checkAnimationSupport();
        this.checkReducedMotionPreference();
        this.setupErrorRecovery();
        
        if (this.DEBUG) {

        }
    }
    
    /**
     * Gestisce errori di rendering delle notifiche
     * @param {Error} error - Errore di rendering
     * @param {Object} notification - Dati della notifica
     * @param {Function} fallbackRenderer - Renderer di fallback
     * @returns {HTMLElement|null} Elemento renderizzato o null
     */
    static handleRenderError(error, notification, fallbackRenderer = null) {
        this.errorCounts.render++;
        this.errorCounts.total++;

        if (typeof window !== 'undefined' && window.appLogger) {
            window.appLogger.error('Notification render failed', {
                error: error.message,
                notificationId: notification?.id,
                notificationType: notification?.type,
                stack: error.stack
            });
        }
        
        try {
            // Tenta il renderer di fallback se fornito
            if (fallbackRenderer && typeof fallbackRenderer === 'function') {
                return fallbackRenderer(notification);
            }
            
            // Fallback semplice: crea elemento base
            return this.createSimpleFallback(notification);
            
        } catch (fallbackError) {

            // Ultimo fallback: notifica console
            this.showConsoleFallback(notification);
            return null;
        }
    }
    
    /**
     * Gestisce errori di animazione
     * @param {Error} error - Errore di animazione
     * @param {HTMLElement} element - Elemento con animazione fallita
     * @param {string} animationType - Tipo di animazione ('entrance' | 'exit')
     */
    static handleAnimationError(error, element, animationType = 'unknown') {
        this.errorCounts.animation++;
        this.errorCounts.total++;

        if (!element) return;
        
        try {
            // Rimuovi tutte le animazioni CSS
            element.style.animation = 'none';
            element.style.transition = 'none';
            
            // Applica stato finale basato sul tipo di animazione
            if (animationType === 'entrance') {
                element.style.opacity = '1';
                element.style.transform = 'translateX(0)';
                element.classList.add('notification--visible');
                element.classList.remove('notification--entering');
            } else if (animationType === 'exit') {
                element.style.opacity = '0';
                element.classList.add('notification--hidden');
                element.classList.remove('notification--exiting');
            }
            
            if (this.DEBUG) {

            }
            
        } catch (fallbackError) {

        }
    }
    
    /**
     * Gestisce errori del servizio notifiche
     * @param {Error} error - Errore del servizio
     * @param {string} operation - Operazione che ha causato l'errore
     * @param {*} data - Dati associati all'operazione
     */
    static handleServiceError(error, operation, data = null) {
        this.errorCounts.service++;
        this.errorCounts.total++;
        
        // Evita spam di log se ci sono troppi errori consecutivi
        if (this.errorCounts.service % 10 === 1) {

        }
        
        if (typeof window !== 'undefined' && window.appLogger) {
            window.appLogger.error(`NotificationService ${operation} failed`, {
                error: error.message,
                operation,
                data,
                stack: error.stack
            });
        }
        
        // Tenta recovery basato sul tipo di operazione
        try {
            switch (operation) {
                case 'show':
                    this.recoverFromShowError(data);
                    break;
                case 'remove':
                    this.recoverFromRemoveError(data);
                    break;
                case 'clear':
                    this.recoverFromClearError();
                    break;
                case 'init':
                    this.recoverFromInitError();
                    break;
                default:

            }
        } catch (recoveryError) {

        }
    }
    
    /**
     * Gestisce errori DOM
     * @param {Error} error - Errore DOM
     * @param {string} operation - Operazione DOM fallita
     * @param {HTMLElement} element - Elemento coinvolto
     */
    static handleDOMError(error, operation, element = null) {
        this.errorCounts.dom++;
        this.errorCounts.total++;

        // Se DOM non è ready, aggiungi alla queue
        if (!this.isDOMReady && operation === 'render') {

            return false; // Indica che l'operazione è stata messa in queue
        }
        
        return true; // Indica che l'errore è stato gestito
    }
    
    /**
     * Aggiunge notifica alla queue quando DOM non è ready
     * @param {Function} renderFunction - Funzione di rendering da eseguire
     * @param {Object} notification - Dati della notifica
     */
    static queueNotification(renderFunction, notification) {
        if (this.isDOMReady) {
            // DOM è ready, esegui immediatamente
            try {
                return renderFunction(notification);
            } catch (error) {
                return this.handleRenderError(error, notification);
            }
        }
        
        // Aggiungi alla queue
        this.notificationQueue.push({
            renderFunction,
            notification,
            timestamp: Date.now()
        });
        
        if (this.DEBUG) {

        }
        
        return null;
    }
    
    /**
     * Processa la queue delle notifiche quando DOM diventa ready
     */
    static processNotificationQueue() {
        if (!this.isDOMReady || this.notificationQueue.length === 0) {
            return;
        }

        const queue = [...this.notificationQueue];
        this.notificationQueue = [];
        
        queue.forEach(({ renderFunction, notification, timestamp }) => {
            try {
                // Controlla se la notifica è troppo vecchia (> 30 secondi)
                if (Date.now() - timestamp > 30000) {

                    return;
                }
                
                renderFunction(notification);
                
            } catch (error) {
                this.handleRenderError(error, notification);
            }
        });
    }
    
    /**
     * Crea un elemento di fallback semplice
     * @param {Object} notification - Dati della notifica
     * @returns {HTMLElement} Elemento di fallback
     */
    static createSimpleFallback(notification) {
        const element = document.createElement('div');
        element.className = `notification notification--${notification.type} notification--fallback`;
        element.setAttribute('data-id', notification.id);
        element.setAttribute('role', notification.type === 'error' ? 'alert' : 'status');
        element.setAttribute('aria-live', notification.type === 'error' ? 'assertive' : 'polite');
        
        // Stili inline di base per garantire visibilità
        element.style.cssText = `
            position: relative;
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 4px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Colori di base per tipo
        const colors = {
            success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
            info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
        };
        
        const color = colors[notification.type] || colors.info;
        element.style.backgroundColor = color.bg;
        element.style.color = color.text;
        element.style.border = `1px solid ${color.border}`;
        
        // Contenuto
        const content = document.createElement('div');
        content.style.cssText = 'display: flex; align-items: flex-start; gap: 8px;';
        
        // Icona semplice
        const icon = document.createElement('span');
        icon.style.cssText = 'flex-shrink: 0; font-weight: bold; font-size: 16px;';
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        icon.textContent = icons[notification.type] || icons.info;
        
        // Messaggio
        const message = document.createElement('div');
        message.style.cssText = 'flex: 1; min-width: 0;';
        
        if (notification.title) {
            const title = document.createElement('div');
            title.style.cssText = 'font-weight: bold; margin-bottom: 4px;';
            title.textContent = notification.title;
            message.appendChild(title);
        }
        
        const text = document.createElement('div');
        text.textContent = notification.message || 'Notifica';
        message.appendChild(text);
        
        // Pulsante chiusura
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: 8px;
            color: ${color.text};
            opacity: 0.7;
            flex-shrink: 0;
        `;
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Chiudi notifica');
        closeBtn.onclick = () => {
            element.remove();
            // Tenta di rimuovere anche dallo stato se possibile
            try {
                if (window.stateService && typeof window.stateService.removeNotification === 'function') {
                    window.stateService.removeNotification(notification.id);
                }
            } catch (e) {

            }
        };
        
        content.appendChild(icon);
        content.appendChild(message);
        content.appendChild(closeBtn);
        element.appendChild(content);
        
        if (this.DEBUG) {

        }
        
        return element;
    }
    
    /**
     * Mostra notifica di fallback nella console
     * @param {Object} notification - Dati della notifica
     */
    static showConsoleFallback(notification) {
        const prefix = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const icon = prefix[notification.type] || prefix.info;
        const message = `${icon} NOTIFICATION: ${notification.message}`;
        
        if (notification.type === 'error') {

        } else if (notification.type === 'warning') {

        } else {

        }
    }
    
    /**
     * Controlla se DOM è ready
     */
    static checkDOMReady() {
        if (typeof document === 'undefined') {
            this.isDOMReady = false;
            return;
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.isDOMReady = true;
                this.processNotificationQueue();
                this.domReadyCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {

                    }
                });
                this.domReadyCallbacks = [];
            });
        } else {
            this.isDOMReady = true;
        }
    }
    
    /**
     * Controlla supporto animazioni CSS
     */
    static checkAnimationSupport() {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            this.animationSupport = false;
            return;
        }
        
        try {
            const testElement = document.createElement('div');
            testElement.style.animation = 'test 1s';
            this.animationSupport = testElement.style.animation !== '';
        } catch (error) {
            this.animationSupport = false;
        }
        
        if (this.DEBUG) {

        }
    }
    
    /**
     * Controlla preferenza per movimento ridotto
     */
    static checkReducedMotionPreference() {
        if (typeof window === 'undefined' || !window.matchMedia) {
            this.reducedMotionPreference = false;
            return;
        }
        
        try {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.reducedMotionPreference = mediaQuery.matches;
            
            // Ascolta cambiamenti
            mediaQuery.addEventListener('change', (e) => {
                this.reducedMotionPreference = e.matches;
                if (this.DEBUG) {

                }
            });
            
        } catch (error) {
            this.reducedMotionPreference = false;
        }
        
        if (this.DEBUG) {

        }
    }
    
    /**
     * Configura recovery automatico per errori comuni
     */
    static setupErrorRecovery() {
        // Recovery per memory leaks
        setInterval(() => {
            this.cleanupOldQueuedNotifications();
        }, 60000); // Ogni minuto
        
        // Recovery per errori di rendering ripetuti
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                if (event.message && event.message.includes('notification')) {

                }
            });
        }
    }
    
    /**
     * Pulisce notifiche vecchie dalla queue
     */
    static cleanupOldQueuedNotifications() {
        const maxAge = 60000; // 1 minuto
        const now = Date.now();
        
        const initialLength = this.notificationQueue.length;
        this.notificationQueue = this.notificationQueue.filter(item => 
            now - item.timestamp < maxAge
        );
        
        const removed = initialLength - this.notificationQueue.length;
        if (removed > 0 && this.DEBUG) {

        }
    }
    
    /**
     * Recovery da errore di show
     */
    static recoverFromShowError(notification) {

        // Tenta fallback semplice
        try {
            const fallbackElement = this.createSimpleFallback(notification);
            if (fallbackElement) {
                // Cerca container o body per inserire l'elemento
                const container = document.querySelector('.notification-container') || 
                                document.querySelector('#notification-container') ||
                                document.body;
                
                if (container) {
                    container.appendChild(fallbackElement);

                    return true;
                }
            }
        } catch (error) {

        }
        
        // Ultimo fallback: console
        this.showConsoleFallback(notification);
        return false;
    }
    
    /**
     * Recovery da errore di remove
     */
    static recoverFromRemoveError(notificationId) {

        try {
            // Cerca e rimuovi elemento dal DOM
            const element = document.querySelector(`[data-id="${notificationId}"]`);
            if (element) {
                element.remove();

                return true;
            }
        } catch (error) {

        }
        
        return false;
    }
    
    /**
     * Recovery da errore di clear
     */
    static recoverFromClearError() {

        try {
            // Rimuovi tutti gli elementi notifica dal DOM
            const notifications = document.querySelectorAll('.notification, [class*="notification"]');
            notifications.forEach(el => {
                try {
                    el.remove();
                } catch (e) {

                }
            });

            return true;
            
        } catch (error) {

        }
        
        return false;
    }
    
    /**
     * Recovery da errore di init
     */
    static recoverFromInitError() {

        try {
            // Crea container di fallback se non esiste
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container notification-container--fallback';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    pointer-events: none;
                `;
                document.body.appendChild(container);

                return true;
            }
        } catch (error) {

        }
        
        return false;
    }
    
    /**
     * Ottiene statistiche errori
     * @returns {Object} Statistiche errori
     */
    static getErrorStats() {
        return {
            ...this.errorCounts,
            queueSize: this.notificationQueue.length,
            isDOMReady: this.isDOMReady,
            animationSupport: this.animationSupport,
            reducedMotionPreference: this.reducedMotionPreference
        };
    }
    
    /**
     * Resetta contatori errori
     */
    static resetErrorStats() {
        this.errorCounts = {
            render: 0,
            animation: 0,
            dom: 0,
            service: 0,
            total: 0
        };
    }
    
    /**
     * Verifica se le animazioni dovrebbero essere disabilitate
     * @returns {boolean} True se le animazioni dovrebbero essere disabilitate
     */
    static shouldDisableAnimations() {
        return !this.animationSupport || this.reducedMotionPreference;
    }
    
    /**
     * Aggiunge callback da eseguire quando DOM è ready
     * @param {Function} callback - Callback da eseguire
     */
    static onDOMReady(callback) {
        if (this.isDOMReady) {
            try {
                callback();
            } catch (error) {

            }
        } else {
            this.domReadyCallbacks.push(callback);
        }
    }
}

// Inizializza automaticamente se in ambiente browser
if (typeof window !== 'undefined') {
    NotificationErrorHandler.init();
}

export { NotificationErrorHandler };
export default NotificationErrorHandler;