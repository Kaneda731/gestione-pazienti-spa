// src/core/services/notificationService.js

/**
 * Servizio avanzato per la gestione delle notifiche UI
 * Supporta notifiche responsive, accessibili e personalizzabili
 * Si integra con stateService per gestire notifiche in modo centralizzato
 */

import { stateService } from './stateService.js';
import { sanitizeHtml } from '../../shared/utils/sanitizeHtml.js';
import { NotificationContainer } from '../../shared/components/notifications/NotificationContainer.js';

// Configurazioni per tipi di notifica
const NOTIFICATION_TYPES = {
    SUCCESS: {
        type: 'success',
        icon: 'check_circle',
        defaultDuration: 4000,
        ariaRole: 'status',
        ariaLive: 'polite'
    },
    ERROR: {
        type: 'error',
        icon: 'error',
        defaultDuration: 0, // Persistente
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    WARNING: {
        type: 'warning',
        icon: 'warning',
        defaultDuration: 6000,
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    INFO: {
        type: 'info',
        icon: 'info',
        defaultDuration: 5000,
        ariaRole: 'status',
        ariaLive: 'polite'
    }
};

// Configurazioni responsive
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

class NotificationService {
    constructor() {
        this.notificationContainer = null;
        this.timers = new Map(); // Gestione timer per auto-close
        this.touchStartX = null; // Per gesture swipe su mobile
        this.settings = {
            maxVisible: 5,
            defaultDuration: 5000,
            position: 'top-right',
            enableSounds: false,
            enableAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };
        this.init();
    }

    /**
     * Inizializza il servizio e crea il container per le notifiche
     */
    init() {
        // Crea NotificationContainer con configurazione responsive
        this.notificationContainer = NotificationContainer.createResponsive({
            position: this.settings.position,
            maxVisible: this.settings.maxVisible,
            enableResponsive: true
        });
        
        // Sottoscrive ai cambiamenti nelle notifiche
        stateService.subscribe('notifications', () => {
            this.renderNotifications();
        });

        // Sottoscrive ai cambiamenti delle impostazioni notifiche
        stateService.subscribe('notificationSettings', (state) => {
            this.updateSettings(state.notificationSettings);
        });

        // Crea live region per screen reader
        this.createLiveRegion();

        // Ascolta eventi del container
        this.setupContainerEventListeners();
    }

    /**
     * Configura event listeners per il container
     */
    setupContainerEventListeners() {
        // Ascolta eventi del NotificationContainer
        document.addEventListener('notificationContainer:positionChanged', (e) => {
            this.settings.position = e.detail.position;
        });

        document.addEventListener('notificationContainer:maxVisibleChanged', (e) => {
            this.settings.maxVisible = e.detail.maxVisible;
        });

        document.addEventListener('notificationContainer:stackChanged', (e) => {
            // Aggiorna metriche o analytics se necessario
            console.debug('Stack notifiche cambiato:', e.detail);
        });
    }

    /**
     * Crea live region per annunci screen reader
     */
    createLiveRegion() {
        if (document.getElementById('notification-announcer')) {
            return;
        }

        const announcer = document.createElement('div');
        announcer.id = 'notification-announcer';
        announcer.className = 'notification__sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        
        document.body.appendChild(announcer);
    }

    /**
     * Aggiorna le impostazioni del servizio
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.notificationContainer) {
            this.notificationContainer.updateSettings({
                position: this.settings.position,
                maxVisible: this.settings.maxVisible
            });
        }
    }



    /**
     * Renderizza tutte le notifiche attive
     */
    renderNotifications() {
        if (!this.notificationContainer) return;

        const notifications = stateService.getState('notifications') || [];
        
        // Ordina per priorità e timestamp
        const sortedNotifications = [...notifications].sort((a, b) => {
            if (a.priority !== b.priority) {
                return (b.priority || 0) - (a.priority || 0);
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Pulisci container
        this.notificationContainer.clearAllNotifications();

        // Renderizza notifiche
        sortedNotifications.forEach((notification, index) => {
            const element = this.createNotificationElement(notification, index);
            this.notificationContainer.addNotification(element);
        });

        // Gestisci notifiche in eccesso (il container gestisce automaticamente maxVisible)
        if (sortedNotifications.length > this.settings.maxVisible) {
            this.handleExcessNotifications(sortedNotifications.slice(this.settings.maxVisible));
        }
    }

    /**
     * Crea elemento DOM per una notifica
     */
    createNotificationElement(notification, index = 0) {
        const typeConfig = NOTIFICATION_TYPES[notification.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        const options = notification.options || {};
        
        const div = document.createElement('div');
        div.className = `notification notification--${notification.type}`;
        div.dataset.id = notification.id;
        div.setAttribute('role', typeConfig.ariaRole);
        div.setAttribute('aria-live', typeConfig.ariaLive);
        div.setAttribute('aria-atomic', 'true');
        div.setAttribute('tabindex', '0');

        // Animazione di entrata
        if (this.settings.enableAnimations) {
            div.classList.add('notification--entering');
        }

        // Costruisci contenuto
        let contentHtml = `
            <div class="notification__content">
                <span class="material-icons notification__icon" aria-hidden="true">${typeConfig.icon}</span>
                <div class="notification__body">
                    ${options.title ? `<div class="notification__title">${sanitizeHtml(options.title)}</div>` : ''}
                    <div class="notification__message">${sanitizeHtml(notification.message)}</div>
                </div>
            </div>
        `;

        // Aggiungi azioni
        if (options.closable !== false || options.actions) {
            contentHtml += '<div class="notification__actions">';
            
            // Azioni personalizzate
            if (options.actions && Array.isArray(options.actions)) {
                options.actions.forEach((action, actionIndex) => {
                    const btnClass = action.style === 'primary' ? 'notification__action-btn--primary' : 
                                   action.style === 'secondary' ? 'notification__action-btn--secondary' : '';
                    contentHtml += `
                        <button class="notification__action-btn ${btnClass}" 
                                data-action-index="${actionIndex}"
                                aria-label="${sanitizeHtml(action.label)}">
                            ${sanitizeHtml(action.label)}
                        </button>
                    `;
                });
            }

            // Pulsante chiusura
            if (options.closable !== false) {
                contentHtml += `
                    <button class="notification__close" 
                            aria-label="Chiudi notifica"
                            title="Chiudi notifica">
                        <span class="material-icons" aria-hidden="true">close</span>
                    </button>
                `;
            }
            
            contentHtml += '</div>';
        }

        // Progress bar per auto-close
        if (options.duration > 0 && !options.persistent) {
            contentHtml += `
                <div class="notification__progress" 
                     aria-hidden="true" 
                     style="--progress-duration: ${options.duration}ms"></div>
            `;
        }

        div.innerHTML = contentHtml;

        // Event listeners
        this.attachNotificationEvents(div, notification);

        // Gestione touch per mobile
        if (window.innerWidth <= RESPONSIVE_CONFIG.mobile.maxWidth) {
            this.attachTouchEvents(div, notification);
        }

        // Auto-close timer
        if (options.duration > 0 && !options.persistent) {
            this.startAutoCloseTimer(notification.id, options.duration);
        }

        // Annuncio per screen reader
        this.announceNotification(notification.type, notification.message);

        return div;
    }

    /**
     * Attacca event listeners alla notifica
     */
    attachNotificationEvents(element, notification) {
        const options = notification.options || {};

        // Click su notifica (se non ha azioni personalizzate)
        if (!options.actions || options.actions.length === 0) {
            element.addEventListener('click', (e) => {
                if (!e.target.closest('.notification__close')) {
                    this.removeNotification(notification.id);
                }
            });
        }

        // Pulsante chiusura
        const closeBtn = element.querySelector('.notification__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeNotification(notification.id);
            });
        }

        // Azioni personalizzate
        const actionBtns = element.querySelectorAll('.notification__action-btn');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = options.actions[index];
                if (action && typeof action.action === 'function') {
                    try {
                        action.action(notification);
                    } catch (error) {
                        console.error('Errore nell\'esecuzione dell\'azione notifica:', error);
                    }
                }
                
                // Rimuovi notifica dopo azione se non specificato diversamente
                if (action.keepOpen !== true) {
                    this.removeNotification(notification.id);
                }
            });
        });

        // Keyboard navigation
        element.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.removeNotification(notification.id);
                    break;
                case 'Enter':
                case ' ':
                    if (e.target === element && (!options.actions || options.actions.length === 0)) {
                        e.preventDefault();
                        this.removeNotification(notification.id);
                    }
                    break;
            }
        });

        // Pausa timer su hover/focus
        element.addEventListener('mouseenter', () => {
            this.pauseAutoCloseTimer(notification.id);
        });

        element.addEventListener('mouseleave', () => {
            this.resumeAutoCloseTimer(notification.id);
        });

        element.addEventListener('focusin', () => {
            this.pauseAutoCloseTimer(notification.id);
        });

        element.addEventListener('focusout', () => {
            this.resumeAutoCloseTimer(notification.id);
        });
    }

    /**
     * Attacca eventi touch per mobile
     */
    attachTouchEvents(element, notification) {
        let startX = null;
        let currentX = null;
        let isDragging = false;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = false;
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (!startX) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            
            if (Math.abs(diffX) > 10) {
                isDragging = true;
                element.style.transform = `translateX(${Math.max(0, diffX)}px)`;
                element.style.opacity = Math.max(0.3, 1 - Math.abs(diffX) / 200);
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!startX || !isDragging) {
                startX = null;
                return;
            }

            const diffX = currentX - startX;
            
            if (diffX > 100) {
                // Swipe per chiudere
                element.classList.add('swipe-right');
                setTimeout(() => {
                    this.removeNotification(notification.id);
                }, 300);
            } else {
                // Ripristina posizione
                element.style.transform = '';
                element.style.opacity = '';
            }
            
            startX = null;
            isDragging = false;
        }, { passive: true });
    }

    /**
     * Gestisce notifiche in eccesso (oltre il limite visibile)
     */
    handleExcessNotifications(excessNotifications) {
        // Rimuovi automaticamente le notifiche più vecchie di tipo success/info
        excessNotifications.forEach(notification => {
            if (notification.type === 'success' || notification.type === 'info') {
                setTimeout(() => {
                    this.removeNotification(notification.id);
                }, 1000);
            }
        });
    }

    /**
     * Gestione timer per auto-close
     */
    startAutoCloseTimer(notificationId, duration) {
        if (this.timers.has(notificationId)) {
            clearTimeout(this.timers.get(notificationId).timeoutId);
        }

        const timeoutId = setTimeout(() => {
            this.removeNotification(notificationId);
            this.timers.delete(notificationId);
        }, duration);

        this.timers.set(notificationId, {
            timeoutId,
            duration,
            startTime: Date.now(),
            remainingTime: duration,
            isPaused: false
        });
    }

    pauseAutoCloseTimer(notificationId) {
        const timer = this.timers.get(notificationId);
        if (timer && !timer.isPaused) {
            clearTimeout(timer.timeoutId);
            timer.remainingTime = timer.duration - (Date.now() - timer.startTime);
            timer.isPaused = true;
        }
    }

    resumeAutoCloseTimer(notificationId) {
        const timer = this.timers.get(notificationId);
        if (timer && timer.isPaused) {
            timer.startTime = Date.now();
            timer.timeoutId = setTimeout(() => {
                this.removeNotification(notificationId);
                this.timers.delete(notificationId);
            }, timer.remainingTime);
            timer.isPaused = false;
        }
    }

    /**
     * Annuncia notifica per screen reader
     */
    announceNotification(type, message) {
        const announcer = document.getElementById('notification-announcer');
        if (!announcer) return;

        const prefix = {
            success: 'Successo: ',
            error: 'Errore: ',
            warning: 'Attenzione: ',
            info: 'Informazione: '
        };

        announcer.textContent = (prefix[type] || '') + message;
    }

    /**
     * Aggiunge una notifica con opzioni avanzate
     */
    show(type, message, options = {}) {
        const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        
        // Merge opzioni con defaults
        const finalOptions = {
            duration: options.duration !== undefined ? options.duration : typeConfig.defaultDuration,
            persistent: options.persistent || false,
            closable: options.closable !== false,
            position: options.position || this.settings.position,
            priority: options.priority || 0,
            title: options.title,
            actions: options.actions,
            ...options
        };

        // Se persistent è true, forza duration a 0
        if (finalOptions.persistent) {
            finalOptions.duration = 0;
        }

        return stateService.addNotification(type, message, finalOptions);
    }

    /**
     * Rimuove una notifica con animazione
     */
    removeNotification(id) {
        // Pulisci timer se esiste
        if (this.timers.has(id)) {
            clearTimeout(this.timers.get(id).timeoutId);
            this.timers.delete(id);
        }

        if (this.notificationContainer) {
            const element = this.notificationContainer.container?.querySelector(`[data-id="${id}"]`);
            if (element && this.settings.enableAnimations) {
                element.classList.remove('notification--entering');
                element.classList.add('notification--exiting');
                
                setTimeout(() => {
                    this.notificationContainer.removeNotification(id);
                    stateService.removeNotification(id);
                }, 300);
            } else {
                // Rimuovi immediatamente
                this.notificationContainer.removeNotification(id);
                stateService.removeNotification(id);
            }
        } else {
            // Fallback se container non disponibile
            stateService.removeNotification(id);
        }
    }

    /**
     * Rimuove tutte le notifiche
     */
    clear() {
        // Pulisci tutti i timer
        this.timers.forEach((timer) => {
            clearTimeout(timer.timeoutId);
        });
        this.timers.clear();

        // Pulisci container
        if (this.notificationContainer) {
            this.notificationContainer.clearAllNotifications();
        }

        // Rimuovi tutte le notifiche dallo stato
        stateService.setState('notifications', []);
    }

    /**
     * Rimuove notifiche per tipo
     */
    clearByType(type) {
        const notifications = stateService.getState('notifications') || [];
        const filtered = notifications.filter(n => n.type !== type);
        
        // Pulisci timer delle notifiche rimosse
        notifications.forEach(n => {
            if (n.type === type && this.timers.has(n.id)) {
                clearTimeout(this.timers.get(n.id).timeoutId);
                this.timers.delete(n.id);
            }
        });

        stateService.setState('notifications', filtered);
    }

    // Metodi di convenienza con supporto per opzioni avanzate
    success(message, options = {}) {
        if (typeof options === 'number') {
            // Backward compatibility: se options è un numero, trattalo come duration
            options = { duration: options };
        }
        return this.show('success', message, options);
    }

    error(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('error', message, options);
    }

    warning(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('warning', message, options);
    }

    info(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('info', message, options);
    }

    /**
     * Metodi avanzati per casi d'uso specifici
     */
    
    // Notifica persistente (non si auto-chiude)
    persistent(type, message, options = {}) {
        return this.show(type, message, { ...options, persistent: true });
    }

    // Notifica con azioni personalizzate
    withActions(type, message, actions, options = {}) {
        return this.show(type, message, { ...options, actions });
    }

    // Notifica con priorità alta
    priority(type, message, priority = 10, options = {}) {
        return this.show(type, message, { ...options, priority });
    }

    // Notifica di conferma con azioni
    confirm(message, onConfirm, onCancel, options = {}) {
        const actions = [
            {
                label: 'Conferma',
                action: onConfirm,
                style: 'primary'
            },
            {
                label: 'Annulla',
                action: onCancel,
                style: 'secondary'
            }
        ];

        return this.show('warning', message, {
            ...options,
            actions,
            persistent: true,
            closable: false
        });
    }

    // Notifica di loading
    loading(message, options = {}) {
        return this.show('info', message, {
            ...options,
            persistent: true,
            closable: false,
            title: 'Caricamento...'
        });
    }

    /**
     * Gestione impostazioni
     */
    updatePosition(position) {
        this.settings.position = position;
        this.settings.customPosition = true;
        
        if (this.notificationContainer) {
            this.notificationContainer.updatePosition(position);
        }

        // Aggiorna anche lo stato globale
        stateService.setState('notificationSettings', {
            ...stateService.getState('notificationSettings'),
            position
        });
    }

    setMaxVisible(max) {
        this.settings.maxVisible = max;
        
        if (this.notificationContainer) {
            this.notificationContainer.updateMaxVisible(max);
        }
        
        stateService.setState('notificationSettings', {
            ...stateService.getState('notificationSettings'),
            maxVisible: max
        });
        this.renderNotifications();
    }

    enableSounds(enabled = true) {
        this.settings.enableSounds = enabled;
        stateService.setState('notificationSettings', {
            ...stateService.getState('notificationSettings'),
            enableSounds: enabled
        });
    }

    /**
     * Utility methods
     */
    getActiveNotifications() {
        return stateService.getState('notifications') || [];
    }

    getNotificationById(id) {
        const notifications = this.getActiveNotifications();
        return notifications.find(n => n.id === id);
    }

    hasNotifications() {
        return this.getActiveNotifications().length > 0;
    }

    getNotificationCount() {
        return this.getActiveNotifications().length;
    }

    getNotificationsByType(type) {
        return this.getActiveNotifications().filter(n => n.type === type);
    }
}

// Esporta istanza singleton
export const notificationService = new NotificationService();
