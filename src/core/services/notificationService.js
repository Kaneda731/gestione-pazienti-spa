// src/core/services/notificationService.js

/**
 * Servizio avanzato per la gestione delle notifiche UI
 * Supporta notifiche responsive, accessibili e personalizzabili
 * Si integra con stateService per gestire notifiche in modo centralizzato
 */


import { NOTIFICATION_TYPES, RESPONSIVE_CONFIG, getDurationForType } from './notificationConfig.js';
import { createLiveRegion, announceNotification, handleExcessNotifications, attachNotificationEvents, attachTouchEvents } from './notificationDomUtils.js';
import {
    startAutoCloseTimer,
    pauseAutoCloseTimer,
    resumeAutoCloseTimer,
    stopAutoCloseTimer
} from './notificationTimerUtils.js';
import { createNotificationElement } from './notificationRenderer.js';
import {
    getActiveNotifications,
    getNotificationById,
    hasNotifications,
    getNotificationCount,
    getNotificationsByType
} from './notificationUtils.js';
import {
    setCustomDurations as setCustomDurationsUtil,
    setPersistentTypes as setPersistentTypesUtil,
    setAutoCleanupInterval as setAutoCleanupIntervalUtil,
    updatePosition as updatePositionUtil,
    setMaxVisible as setMaxVisibleUtil,
    enableSounds as enableSoundsUtil
} from './notificationSettingsUtils.js';

class NotificationService {
    // Metodi di configurazione delegati
    setCustomDurations(durations) {
        setCustomDurationsUtil(durations);
    }

    setPersistentTypes(types) {
        setPersistentTypesUtil(types);
    }

    setAutoCleanupInterval(interval) {
        setAutoCleanupIntervalUtil(interval);
    }

    updatePosition(position) {
        updatePositionUtil(position);
    }

    setMaxVisible(max) {
        setMaxVisibleUtil(max);
        this.renderNotifications();
    }

    enableSounds(enabled = true) {
        enableSoundsUtil(enabled);
    }

    /**
     * Aggiunge una notifica con opzioni avanzate
     */
    show(type, message, options = {}) {
        const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        // Usa durata personalizzata da settings se non specificata
        const customDuration = (this.settings.customDurations && this.settings.customDurations[type] !== undefined)
            ? this.settings.customDurations[type]
            : typeConfig.defaultDuration;
        // Merge opzioni con defaults (lascia che StateService gestisca persistent)
        const finalOptions = {
            duration: options.duration !== undefined ? options.duration : customDuration,
            closable: options.closable !== false,
            position: options.position || this.settings.position,
            priority: options.priority || 0,
            title: options.title,
            actions: options.actions,
            ...options
        };
        // Non impostare persistent qui - lascia che StateService lo gestisca
        // basandosi sui persistentTypes nelle impostazioni
        return stateService.addNotification(type, message, finalOptions);
    }
    // Memorizza gli id delle notifiche renderizzate per evitare rerender inutili
    _lastRenderedNotificationIds = [];
    // Abilita log dettagliati solo se necessario
    static DEBUG = false;
    constructor() {
        this.notificationContainer = null;
        this.timers = new Map(); // Gestione timer per auto-close
        this.touchStartX = null; // Per gesture swipe su mobile
        this.isRendering = false; // Protezione contro loop infiniti
        try {
            // Carica impostazioni da StateService
            const stateSettings = stateService.getNotificationSettings();
            this.settings = {
                maxVisible: stateSettings.maxVisible,
                defaultDuration: stateSettings.defaultDuration,
                position: stateSettings.position,
                enableSounds: stateSettings.enableSounds,
                enableAnimations: stateSettings.enableAnimations,
                autoCleanupInterval: stateSettings.autoCleanupInterval,
                maxStoredNotifications: stateSettings.maxStoredNotifications,
                customDurations: stateSettings.customDurations,
                soundVolume: stateSettings.soundVolume
            };
            // this.init(); // Rimosso: il metodo non esiste
        } catch (error) {
            console.error('❌ [NotificationService] Errore durante inizializzazione:', error);
        }
    }

    /**
     * Rimuove una notifica con animazione e cleanup completo
     */
    removeNotification(id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 removeNotification called for id:', id);
        }
        // Pulisci timer e progress bar
        stopAutoCloseTimer(this.timers, id, (id) => this.stopProgressBarAnimation(id));

        if (this.notificationContainer) {
            const element = this.notificationContainer.container?.querySelector(`[data-id="${id}"]`);
            if (NotificationService.DEBUG) {
                console.log('🔧 Found element:', element);
            }
            const checkRemoved = () => {
                const stillPresent = (stateService.getState('notifications') || []).find(n => n.id === id);
                if (stillPresent) {
                    console.error('[NotificationService] ERRORE: la notifica', id, 'è ancora nello stato dopo removeNotification!');
                }
            };
            if (element && this.settings.enableAnimations) {
                if (NotificationService.DEBUG) {
                    console.log('🔧 Starting exit animation');
                }
                element.classList.remove('notification--entering');
                element.classList.add('notification--exiting');
                // Ferma progress bar durante animazione di uscita
                const progressBar = element.querySelector('.notification__progress');
                if (progressBar) {
                    progressBar.classList.remove(
                        'notification__progress--active',
                        'notification__progress--paused',
                        'notification__progress--resumed'
                    );
                }
                setTimeout(() => {
                    if (NotificationService.DEBUG) {
                        console.log('🔧 Removing notification from container and state');
                    }
                    this.notificationContainer.removeNotification(id);
                    stateService.removeNotification(id);
                    checkRemoved();
                }, 300);
            } else {
                // Rimuovi immediatamente
                if (NotificationService.DEBUG) {
                    console.log('🔧 Removing notification immediately');
                }
                this.notificationContainer.removeNotification(id);
                stateService.removeNotification(id);
                checkRemoved();
            }
        } else {
            // Fallback se container non disponibile
            if (NotificationService.DEBUG) {
                console.log('🔧 Container not available, removing from state only');
            }
            stateService.removeNotification(id);
            const stillPresent = (stateService.getState('notifications') || []).find(n => n.id === id);
            if (stillPresent) {
                console.error('[NotificationService] ERRORE: la notifica', id, 'è ancora nello stato dopo removeNotification!');
            }
        }
    }

    /**
     * Rimuove tutte le notifiche con cleanup completo
     */
    clear() {
        // Pulisci tutti i timer e progress bar
        this.timers.forEach((timer, notificationId) => {
            stopAutoCloseTimer(this.timers, notificationId, (id) => this.stopProgressBarAnimation(id));
        });
        this.timers.clear();

        // Pulisci container
        if (this.notificationContainer) {
            this.notificationContainer.clearAllNotifications();
        }

        // Usa il metodo del StateService per cleanup completo
        stateService.clearAllNotifications();
    }

    /**
     * Rimuove notifiche per tipo
     */
    clearByType(type) {
        const notifications = stateService.getState('notifications') || [];
        
        // Pulisci timer delle notifiche rimosse
        notifications.forEach(n => {
            if (n.type === type && this.timers.has(n.id)) {
                stopAutoCloseTimer(this.timers, n.id, (id) => this.stopProgressBarAnimation(id));
            }
        });

        // Usa il metodo del StateService
        stateService.clearNotificationsByType(type);
    }

    // Metodi di convenienza con supporto per opzioni avanzate

    success(message, options = {}) {
        if (typeof options === 'number') {
            // Backward compatibility: se options è un numero, trattalo come duration
            options = { duration: options };
        }
        return this.show('success', message, options);
    }

    info(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('info', message, options);
    }

    warning(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('warning', message, options);
    }

    error(message, options = {}) {
        if (typeof options === 'number') {
            options = { duration: options };
        }
        return this.show('error', message, options);
    }
}

// Esporta istanza singleton
var notificationService = new NotificationService();
export { notificationService };
export default notificationService;
