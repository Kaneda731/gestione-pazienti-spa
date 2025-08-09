// src/core/services/notificationService.js

import { stateService } from './stateService.js';
import { NotificationErrorHandler } from './notificationErrorHandler.js';
import { notificationEventManager } from './notificationEventManager.js';
import { notificationAnimationManager } from './notificationAnimationManager.js';
import { notificationLazyLoader } from './notificationLazyLoader.js';
/**
 * Servizio avanzato per la gestione delle notifiche UI
 * Supporta notifiche responsive, accessibili e personalizzabili
 * Si integra con stateService per gestire notifiche in modo centralizzato
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Virtual scrolling per molte notifiche simultanee
 * - Event listener cleanup automatico
 * - GPU-accelerated animations (60fps)
 * - Lazy loading per componenti non critici
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
        try {
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
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'show', { type, message, options });
            // Fallback: tenta di mostrare notifica semplice
            return NotificationErrorHandler.recoverFromShowError({ type, message, options, id: Date.now().toString() });
        }
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
        this.initialized = false;
        this.settings = stateService.getNotificationSettings();
        
        // Performance tracking
        this._lastRenderTime = null;
        this._renderCount = 0;
        this._totalRenderTime = 0;
        this._averageRenderTime = null;
        
        // Performance optimizations
        this.virtualScroller = null;
        this.useVirtualScrolling = false;
        this.performanceMode = 'auto'; // 'auto', 'performance', 'quality'
        this.maxConcurrentNotifications = this.detectOptimalMaxNotifications();
        
        // Memory management
        this.cleanupInterval = null;
        this.lastCleanupTime = Date.now();
        this.memoryThreshold = 50 * 1024 * 1024; // 50MB
        
        // Error tracking per circuit breaker
        this._consecutiveRenderErrors = 0;
        this._renderingDisabled = false;
        
        // Setup automatic cleanup
        this.setupPerformanceMonitoring();
    }

    async init() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            // Determina se usare virtual scrolling
            this.useVirtualScrolling = false; // Disabilita virtual scrolling per ora
            
            // Importa direttamente il NotificationContainer standard
            const { NotificationContainer } = await import('../../shared/components/notifications/NotificationContainer.js');
            
            this.notificationContainer = new NotificationContainer({
                position: this.settings.position,
                maxVisible: this.settings.maxVisible,
            });

            // Setup event delegation per performance
            notificationEventManager.setupEventDelegation(this.notificationContainer.container);

            createLiveRegion();

            // Subscribe con throttling per performance
            stateService.subscribe('notifications', this.throttledRenderNotifications.bind(this));

            // Setup cleanup automatico
            this.setupAutomaticCleanup();

            this.initialized = true;
            
            // Expose emergency reset method globally for development
            if (typeof window !== 'undefined') {
                window.notificationEmergencyReset = () => this.emergencyReset();
                console.log('🚨 EMERGENCY: If you see error loops, run: window.notificationEmergencyReset()');
            }
            
            if (NotificationService.DEBUG) {
                console.log('✅ NotificationService initialized with performance optimizations');
                console.log('📊 Virtual scrolling:', this.useVirtualScrolling);
                console.log('📊 Max concurrent notifications:', this.maxConcurrentNotifications);
                console.log('🚨 Emergency reset available: window.notificationEmergencyReset()');
            }
        } catch (error) {
            console.error('❌ Failed to initialize NotificationService:', error);
            NotificationErrorHandler.handleServiceError(error, 'init');
            
            // Fallback initialization
            await this.initializeFallback();
        }
    }

    renderNotifications(notifications = []) {
        // Emergency circuit breaker per prevenire loop infiniti
        if (!this.notificationContainer || this.isRendering) {
            // Se il container non esiste, prova a ricrearlo
            if (!this.notificationContainer && this.initialized) {
                console.warn('⚠️ Container missing, attempting to recreate...');
                this.recreateContainer();
            }
            return;
        }
        
        // Validazione input - CRITICO per prevenire errori
        if (!Array.isArray(notifications)) {
            console.warn('⚠️ renderNotifications called with non-array:', typeof notifications, notifications);
            notifications = [];
        }
        
        // Controlla se ci sono troppi errori consecutivi
        if (this._consecutiveRenderErrors > 10) {
            console.error('❌ Too many consecutive render errors, disabling notifications temporarily');
            this._renderingDisabled = true;
            setTimeout(() => {
                this._renderingDisabled = false;
                this._consecutiveRenderErrors = 0;
            }, 5000);
            return;
        }
        
        if (this._renderingDisabled) return;
        
        this.isRendering = true;

        try {
            // Performance tracking
            const startTime = performance.now();

            const currentIds = new Set(notifications.map(n => n.id));
            const renderedIds = new Set(this._lastRenderedNotificationIds);

            renderedIds.forEach(id => {
                if (!currentIds.has(id)) {
                    try {
                        this.notificationContainer.removeNotification(id);
                    } catch (error) {
                        NotificationErrorHandler.handleDOMError(error, 'remove', null);
                    }
                }
            });

            notifications.forEach(notification => {
                if (!renderedIds.has(notification.id)) {
                    try {
                        this.addNotificationToDOM(notification);
                    } catch (error) {
                        NotificationErrorHandler.handleRenderError(error, notification, (notif) => {
                            // Fallback renderer semplice
                            const fallbackElement = NotificationErrorHandler.createSimpleFallback(notif);
                            if (fallbackElement && this.notificationContainer) {
                                this.notificationContainer.addNotification(fallbackElement);
                            }
                            return fallbackElement;
                        });
                    }
                }
            });

            handleExcessNotifications(notifications.slice(this.settings.maxVisible), (id) => this.removeNotification(id));

            this._lastRenderedNotificationIds = notifications.map(n => n.id);
            
            // Reset error counter on successful render
            this._consecutiveRenderErrors = 0;
            
            // Update performance metrics
            const endTime = performance.now();
            this._lastRenderTime = endTime - startTime;
            this._renderCount++;
            this._totalRenderTime += this._lastRenderTime;
            this._averageRenderTime = this._totalRenderTime / this._renderCount;
            
        } catch (error) {
            // Incrementa contatore errori consecutivi
            this._consecutiveRenderErrors = (this._consecutiveRenderErrors || 0) + 1;
            
            console.error(`❌ NotificationService render error (${this._consecutiveRenderErrors}/10):`, error);
            
            // Solo gestisci l'errore se non siamo in un loop
            if (this._consecutiveRenderErrors <= 5) {
                NotificationErrorHandler.handleServiceError(error, 'render', notifications);
            }
        } finally {
            this.isRendering = false;
        }
    }

    addNotificationToDOM(notification) {
        // Usa la queue se DOM non è ready
        const renderFunction = (notif) => {
            const rendererPayload = {
                notification: notif,
                settings: this.settings,
                timers: this.timers,
                removeNotification: (id) => this.removeNotification(id),
                startAutoCloseTimer: startAutoCloseTimer,
                pauseAutoCloseTimer: pauseAutoCloseTimer,
                resumeAutoCloseTimer: resumeAutoCloseTimer,
                announceNotification: announceNotification,
                attachNotificationEvents: attachNotificationEvents,
                attachTouchEvents: attachTouchEvents,
                notificationContainer: this.notificationContainer,
                errorHandler: NotificationErrorHandler
            };
            
            try {
                const element = createNotificationElement(rendererPayload);
                if (!element) {
                    throw new Error('createNotificationElement returned null');
                }
                
                // Controlla supporto animazioni
                if (NotificationErrorHandler.shouldDisableAnimations()) {
                    element.classList.add('notification--no-animations');
                }
                
                this.notificationContainer.addNotification(element);
                return element;
            } catch (error) {
                return NotificationErrorHandler.handleRenderError(error, notif, (fallbackNotif) => {
                    const fallbackElement = NotificationErrorHandler.createSimpleFallback(fallbackNotif);
                    if (fallbackElement && this.notificationContainer) {
                        this.notificationContainer.addNotification(fallbackElement);
                    }
                    return fallbackElement;
                });
            }
        };
        
        return NotificationErrorHandler.queueNotification(renderFunction, notification);
    }

    /**
     * Rimuove una notifica con animazione e cleanup completo
     */
    removeNotification(id) {
        try {
            if (NotificationService.DEBUG) {
                console.log('🔧 removeNotification called for id:', id);
            }
            // Pulisci timer e progress bar
            stopAutoCloseTimer(this.timers, id);
            
            // Cleanup progress bar JavaScript se presente
            if (this.notificationContainer) {
                const element = this.notificationContainer.container?.querySelector(`[data-id="${id}"]`);
                if (element && element._progressBarInstance) {
                    try {
                        element._progressBarInstance.destroy();
                        element._progressBarInstance = null;
                        console.log('🧹 Progress bar instance cleaned up for notification:', id);
                    } catch (cleanupError) {
                        console.warn('⚠️ Error cleaning up progress bar:', cleanupError);
                    }
                }
            }

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
                
                if (element && this.settings.enableAnimations && !NotificationErrorHandler.shouldDisableAnimations()) {
                    if (NotificationService.DEBUG) {
                        console.log('🔧 Starting exit animation');
                    }
                    
                    try {
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
                            try {
                                this.notificationContainer.removeNotification(id);
                                stateService.removeNotification(id);
                                checkRemoved();
                            } catch (error) {
                                NotificationErrorHandler.handleServiceError(error, 'remove', id);
                                NotificationErrorHandler.recoverFromRemoveError(id);
                            }
                        }, 300);
                    } catch (animationError) {
                        NotificationErrorHandler.handleAnimationError(animationError, element, 'exit');
                        // Fallback: rimuovi immediatamente
                        this.notificationContainer.removeNotification(id);
                        stateService.removeNotification(id);
                        checkRemoved();
                    }
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
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'remove', id);
            // Tenta recovery
            NotificationErrorHandler.recoverFromRemoveError(id);
        }
    }

    /**
     * Rimuove tutte le notifiche con cleanup completo
     */
    clear() {
        try {
            // Pulisci tutti i timer e progress bar
            this.timers.forEach((timer, notificationId) => {
                stopAutoCloseTimer(this.timers, notificationId, (id) => this.stopProgressBarAnimation(id));
            });
            this.timers.clear();

            // Pulisci container
            if (this.notificationContainer) {
                this.notificationContainer.clearAllNotifications();
            }

            // Use StateService method for complete cleanup
            stateService.clearAllNotifications();
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'clear');
            // Tenta recovery
            NotificationErrorHandler.recoverFromClearError();
        }
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

        // Use StateService method
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

    // === METODI MANCANTI PER COMPLETARE L'INTEGRAZIONE ===

    /**
     * Aggiorna le impostazioni delle notifiche
     * @param {object} newSettings - Nuove impostazioni da applicare
     * @returns {boolean} True se l'aggiornamento è riuscito
     */
    updateSettings(newSettings) {
        try {
            // Valida le impostazioni prima di applicarle
            const validatedSettings = this._validateSettings(newSettings);
            
            // Aggiorna tramite StateService per sincronizzazione
            stateService.updateNotificationSettings(validatedSettings);
            
            // Aggiorna le impostazioni locali
            this.settings = stateService.getNotificationSettings();
            
            // Aggiorna il container se necessario
            if (this.notificationContainer && (newSettings.position || newSettings.maxVisible)) {
                this.notificationContainer.updateSettings({
                    position: this.settings.position,
                    maxVisible: this.settings.maxVisible
                });
            }
            
            if (NotificationService.DEBUG) {
                console.log('✅ Settings updated successfully:', this.settings);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to update notification settings:', error);
            return false;
        }
    }

    /**
     * Ottiene statistiche dettagliate sulle notifiche
     * @returns {object} Oggetto con statistiche complete
     */
    getStats() {
        try {
            const baseStats = stateService.getNotificationStats();
            
            // Aggiungi statistiche specifiche del servizio
            const enhancedStats = {
                ...baseStats,
                activeTimers: this.timers.size,
                containerInitialized: !!this.notificationContainer,
                serviceInitialized: this.initialized,
                settings: { ...this.settings },
                performance: {
                    lastRenderTime: this._lastRenderTime || null,
                    renderCount: this._renderCount || 0,
                    averageRenderTime: this._averageRenderTime || null
                }
            };
            
            return enhancedStats;
        } catch (error) {
            console.error('❌ Failed to get notification stats:', error);
            return {
                total: 0,
                visible: 0,
                byType: { success: 0, error: 0, warning: 0, info: 0 },
                persistent: 0,
                error: error.message
            };
        }
    }

    /**
     * Esporta le impostazioni delle notifiche per backup
     * @returns {object|null} Oggetto con le impostazioni esportate o null in caso di errore
     */
    exportSettings() {
        try {
            const exportData = stateService.exportNotificationSettings();
            
            // Aggiungi metadati del servizio
            exportData.serviceMetadata = {
                version: '2.0',
                exportedBy: 'NotificationService',
                containerType: this.notificationContainer?.constructor.name || 'unknown',
                activeNotifications: stateService.getState('notifications').length
            };
            
            if (NotificationService.DEBUG) {
                console.log('✅ Settings exported successfully:', exportData);
            }
            
            return exportData;
        } catch (error) {
            console.error('❌ Failed to export notification settings:', error);
            return null;
        }
    }

    /**
     * Importa le impostazioni delle notifiche da backup
     * @param {object} backupData - Dati di backup da importare
     * @returns {boolean} True se l'importazione è riuscita
     */
    importSettings(backupData) {
        try {
            // Valida il formato del backup
            if (!backupData || typeof backupData !== 'object') {
                throw new Error('Formato backup non valido');
            }
            
            if (!backupData.settings) {
                throw new Error('Impostazioni mancanti nel backup');
            }
            
            // Verifica compatibilità versione
            const supportedVersions = ['1.0', '2.0'];
            if (!supportedVersions.includes(backupData.version)) {
                console.warn(`⚠️ Versione backup non supportata: ${backupData.version}. Tentativo di importazione comunque.`);
            }
            
            // Importa tramite StateService
            const success = stateService.importNotificationSettings(backupData);
            
            if (success) {
                // Aggiorna le impostazioni locali
                this.settings = stateService.getNotificationSettings();
                
                // Aggiorna il container se necessario
                if (this.notificationContainer) {
                    this.notificationContainer.updateSettings({
                        position: this.settings.position,
                        maxVisible: this.settings.maxVisible
                    });
                }
                
                if (NotificationService.DEBUG) {
                    console.log('✅ Settings imported successfully:', this.settings);
                }
            }
            
            return success;
        } catch (error) {
            console.error('❌ Failed to import notification settings:', error);
            return false;
        }
    }

    /**
     * Pulisce le notifiche vecchie
     * @param {number} [maxAge=300000] - Età massima in millisecondi (default: 5 minuti)
     * @returns {number} Numero di notifiche rimosse
     */
    cleanupOldNotifications(maxAge = 300000) {
        try {
            const removedCount = stateService.clearOldNotifications(maxAge);
            
            // Pulisci anche i timer associati alle notifiche rimosse
            const currentNotifications = stateService.getState('notifications');
            const currentIds = new Set(currentNotifications.map(n => n.id));
            
            // Rimuovi timer per notifiche che non esistono più
            for (const [timerId] of this.timers) {
                if (!currentIds.has(timerId)) {
                    stopAutoCloseTimer(this.timers, timerId);
                }
            }
            
            if (NotificationService.DEBUG && removedCount > 0) {
                console.log(`🧹 Cleaned up ${removedCount} old notifications`);
            }
            
            return removedCount;
        } catch (error) {
            console.error('❌ Failed to cleanup old notifications:', error);
            return 0;
        }
    }

    /**
     * Ottiene notifiche per tipo
     * @param {string} type - Tipo di notifica ('success', 'error', 'warning', 'info')
     * @returns {array} Array di notifiche del tipo specificato
     */
    getNotificationsByType(type) {
        try {
            return stateService.getNotificationsByType(type);
        } catch (error) {
            console.error('❌ Failed to get notifications by type:', error);
            return [];
        }
    }

    /**
     * Ottiene le notifiche attualmente visibili
     * @returns {array} Array di notifiche visibili
     */
    getVisibleNotifications() {
        try {
            return stateService.getVisibleNotifications();
        } catch (error) {
            console.error('❌ Failed to get visible notifications:', error);
            return [];
        }
    }

    /**
     * Verifica se ci sono notifiche di errore attive
     * @returns {boolean} True se ci sono errori attivi
     */
    hasErrors() {
        try {
            return stateService.hasErrorNotifications();
        } catch (error) {
            console.error('❌ Failed to check for error notifications:', error);
            return false;
        }
    }

    // === METODI PRIVATI DI SUPPORTO ===

    /**
     * Valida le impostazioni prima di applicarle
     * @param {object} settings - Impostazioni da validare
     * @returns {object} Impostazioni validate
     * @private
     */
    _validateSettings(settings) {
        const validated = {};
        
        // Valida maxVisible
        if (settings.maxVisible !== undefined) {
            const max = parseInt(settings.maxVisible);
            if (isNaN(max) || max < 1 || max > 20) {
                throw new Error('maxVisible deve essere un numero tra 1 e 20');
            }
            validated.maxVisible = max;
        }
        
        // Valida defaultDuration
        if (settings.defaultDuration !== undefined) {
            const duration = parseInt(settings.defaultDuration);
            if (isNaN(duration) || duration < 0) {
                throw new Error('defaultDuration deve essere un numero >= 0');
            }
            validated.defaultDuration = duration;
        }
        
        // Valida position
        if (settings.position !== undefined) {
            const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
            if (!validPositions.includes(settings.position)) {
                throw new Error(`position deve essere uno di: ${validPositions.join(', ')}`);
            }
            validated.position = settings.position;
        }
        
        // Valida enableSounds
        if (settings.enableSounds !== undefined) {
            validated.enableSounds = Boolean(settings.enableSounds);
        }
        
        // Valida enableAnimations
        if (settings.enableAnimations !== undefined) {
            validated.enableAnimations = Boolean(settings.enableAnimations);
        }
        
        // Valida autoCleanupInterval
        if (settings.autoCleanupInterval !== undefined) {
            const interval = parseInt(settings.autoCleanupInterval);
            if (isNaN(interval) || interval < 60000) { // Minimo 1 minuto
                throw new Error('autoCleanupInterval deve essere >= 60000ms (1 minuto)');
            }
            validated.autoCleanupInterval = interval;
        }
        
        // Valida maxStoredNotifications
        if (settings.maxStoredNotifications !== undefined) {
            const max = parseInt(settings.maxStoredNotifications);
            if (isNaN(max) || max < 10 || max > 1000) {
                throw new Error('maxStoredNotifications deve essere tra 10 e 1000');
            }
            validated.maxStoredNotifications = max;
        }
        
        // Valida persistentTypes
        if (settings.persistentTypes !== undefined) {
            if (!Array.isArray(settings.persistentTypes)) {
                throw new Error('persistentTypes deve essere un array');
            }
            const validTypes = ['success', 'error', 'warning', 'info'];
            const invalidTypes = settings.persistentTypes.filter(type => !validTypes.includes(type));
            if (invalidTypes.length > 0) {
                throw new Error(`persistentTypes contiene tipi non validi: ${invalidTypes.join(', ')}`);
            }
            validated.persistentTypes = [...settings.persistentTypes];
        }
        
        // Valida soundVolume
        if (settings.soundVolume !== undefined) {
            const volume = parseFloat(settings.soundVolume);
            if (isNaN(volume) || volume < 0 || volume > 1) {
                throw new Error('soundVolume deve essere tra 0 e 1');
            }
            validated.soundVolume = volume;
        }
        
        // Valida customDurations
        if (settings.customDurations !== undefined) {
            if (typeof settings.customDurations !== 'object' || settings.customDurations === null) {
                throw new Error('customDurations deve essere un oggetto');
            }
            validated.customDurations = {};
            const validTypes = ['success', 'error', 'warning', 'info'];
            for (const [type, duration] of Object.entries(settings.customDurations)) {
                if (!validTypes.includes(type)) {
                    throw new Error(`customDurations contiene tipo non valido: ${type}`);
                }
                const dur = parseInt(duration);
                if (isNaN(dur) || dur < 0) {
                    throw new Error(`customDurations.${type} deve essere >= 0`);
                }
                validated.customDurations[type] = dur;
            }
        }
        
        return validated;
    }

    // === PERFORMANCE OPTIMIZATION METHODS ===

    /**
     * Determina se usare virtual scrolling
     */
    shouldUseVirtualScrolling() {
        // Usa virtual scrolling se dispositivo con poca memoria
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return true;
        }
        
        // Usa virtual scrolling se molte notifiche previste
        if (this.maxConcurrentNotifications > 10) {
            return true;
        }
        
        // Usa virtual scrolling su mobile per performance
        if (window.innerWidth <= 767) {
            return true;
        }
        
        return false;
    }

    /**
     * Rileva numero ottimale di notifiche simultanee
     */
    detectOptimalMaxNotifications() {
        // Basa su memoria dispositivo
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory >= 8) return 20;
            if (navigator.deviceMemory >= 4) return 15;
            if (navigator.deviceMemory >= 2) return 10;
            return 5;
        }
        
        // Fallback basato su dimensione schermo
        if (window.innerWidth >= 1920) return 15;
        if (window.innerWidth >= 1200) return 10;
        if (window.innerWidth >= 768) return 8;
        return 5;
    }

    /**
     * Setup monitoring delle performance
     */
    setupPerformanceMonitoring() {
        // Disabilita monitoring aggressivo per ora
        if (this.performanceMode === 'performance') {
            // Monitora memoria ogni 60 secondi invece di 30
            setInterval(() => {
                this.checkMemoryUsage();
            }, 60000);
        }
        
        // Monitora performance rendering
        if ('PerformanceObserver' in window) {
            try {
                this.renderPerformanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name.includes('notification-render')) {
                            this.trackRenderPerformance(entry);
                        }
                    }
                });
                this.renderPerformanceObserver.observe({ entryTypes: ['measure'] });
            } catch (e) {
                // PerformanceObserver non supportato
            }
        }
    }

    /**
     * Controlla uso memoria e ottimizza se necessario
     */
    checkMemoryUsage() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const usedMemory = memInfo.usedJSHeapSize;
            
            if (usedMemory > this.memoryThreshold) {
                console.warn('🚨 High memory usage detected, optimizing notifications');
                this.optimizeForMemory();
            }
        }
    }

    /**
     * Ottimizza per uso memoria elevato
     */
    optimizeForMemory() {
        // Riduci numero massimo notifiche
        this.maxConcurrentNotifications = Math.max(3, this.maxConcurrentNotifications - 2);
        
        // Forza cleanup aggressivo
        this.cleanupOldNotifications(60000); // 1 minuto invece di 5
        
        // Disabilita animazioni complesse
        if (notificationAnimationManager) {
            notificationAnimationManager.optimizeForLowPerformance();
        }
        
        // Passa a modalità performance
        this.performanceMode = 'performance';
        
        // Cleanup event listeners non utilizzati
        if (notificationEventManager) {
            notificationEventManager.cleanupAll();
        }
    }

    /**
     * Rendering con throttling per performance
     */
    throttledRenderNotifications = this.throttle((newState, oldState, changedKeys) => {
        // Il subscriber passa l'intero stato, non solo le notifiche
        let notifications = [];
        
        if (Array.isArray(newState)) {
            // Se è già un array, usalo direttamente
            notifications = newState;
        } else if (newState && typeof newState === 'object') {
            // Se è un oggetto stato, estrai le notifiche
            notifications = newState.notifications || [];
        }
        
        if (NotificationService.DEBUG) {
            console.log('🔄 Rendering notifications:', notifications.length, 'items');
        }
        
        this.renderNotifications(notifications);
    }, 16); // ~60fps

    /**
     * Utility throttle
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    /**
     * Ricrea il container se mancante
     */
    async recreateContainer() {
        try {
            console.log('🔄 Recreating notification container...');
            
            // Carica container
            const containerModule = await notificationLazyLoader.loadNotificationContainer({
                expectedNotifications: this.maxConcurrentNotifications,
                useVirtualScrolling: this.useVirtualScrolling
            });

            if (this.useVirtualScrolling && containerModule.NotificationVirtualContainer) {
                this.notificationContainer = new containerModule.NotificationVirtualContainer({
                    position: this.settings.position,
                    maxVisible: this.settings.maxVisible,
                });
            } else {
                const { NotificationContainer } = containerModule;
                this.notificationContainer = new NotificationContainer({
                    position: this.settings.position,
                    maxVisible: this.settings.maxVisible,
                });
            }
            
            console.log('✅ Container recreated successfully');
            
            // Verifica che sia nel DOM
            const domContainer = document.getElementById('notification-container');
            if (!domContainer) {
                console.error('❌ Container still not in DOM after recreation');
            }
            
        } catch (error) {
            console.error('❌ Failed to recreate container:', error);
        }
    }
    
    /**
     * Reset di emergenza per fermare loop infiniti
     */
    emergencyReset() {
        console.warn('🚨 Emergency reset of NotificationService');
        
        // Ferma tutti i timer
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // Reset flags
        this.isRendering = false;
        this._renderingDisabled = false;
        this._consecutiveRenderErrors = 0;
        
        // Pulisci container se esiste
        if (this.notificationContainer) {
            try {
                this.notificationContainer.clear();
            } catch (error) {
                console.warn('Error clearing container during emergency reset:', error);
            }
        }
        
        // Pulisci stato
        stateService.setState('notifications', []);
        
        console.log('✅ Emergency reset completed');
    }

    /**
     * Setup cleanup automatico
     */
    setupAutomaticCleanup() {
        // Cleanup ogni 5 minuti
        this.cleanupInterval = setInterval(() => {
            this.performAutomaticCleanup();
        }, 300000);
        
        // Cleanup su page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.performAutomaticCleanup();
            }
        });
    }

    /**
     * Esegue cleanup automatico
     */
    performAutomaticCleanup() {
        const now = Date.now();
        
        // Cleanup notifiche vecchie
        this.cleanupOldNotifications();
        
        // Cleanup event listeners
        if (notificationEventManager) {
            notificationEventManager.cleanupAll();
        }
        
        // Cleanup animazioni
        if (notificationAnimationManager) {
            notificationAnimationManager.disableAllAnimations();
        }
        
        // Force garbage collection se disponibile
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        this.lastCleanupTime = now;
        
        if (NotificationService.DEBUG) {
            console.log('🧹 Automatic cleanup performed');
        }
    }

    /**
     * Fallback initialization per errori
     */
    async initializeFallback() {
        try {
            // Carica container base senza ottimizzazioni
            const { NotificationContainer } = await import('../../shared/components/notifications/NotificationContainer.js');
            
            this.notificationContainer = new NotificationContainer({
                position: this.settings.position,
                maxVisible: Math.min(this.settings.maxVisible, 5), // Limita per sicurezza
            });

            createLiveRegion();

            stateService.subscribe('notifications', this.throttledRenderNotifications.bind(this));

            this.initialized = true;
            console.warn('⚠️ NotificationService initialized in fallback mode');
        } catch (error) {
            console.error('❌ Fallback initialization failed:', error);
            throw error;
        }
    }

    /**
     * Traccia performance rendering
     */
    trackRenderPerformance(entry) {
        const renderTime = entry.duration;
        
        this._renderCount++;
        this._totalRenderTime += renderTime;
        this._averageRenderTime = this._totalRenderTime / this._renderCount;
        
        // Ottimizza se performance scarse
        if (renderTime > 16) { // > 1 frame a 60fps
            console.warn(`🐌 Slow render detected: ${renderTime.toFixed(2)}ms`);
            
            if (this._averageRenderTime > 10) {
                this.optimizeForPerformance();
            }
        }
    }

    /**
     * Ottimizza per performance scarse
     */
    optimizeForPerformance() {
        if (this.performanceMode === 'performance') return;
        
        console.log('🚀 Optimizing for performance');
        
        // Riduci animazioni
        if (notificationAnimationManager) {
            notificationAnimationManager.optimizeForLowPerformance();
        }
        
        // Riduci numero massimo notifiche
        this.maxConcurrentNotifications = Math.max(3, this.maxConcurrentNotifications - 1);
        
        // Passa a virtual scrolling se non già attivo
        if (!this.useVirtualScrolling && this.notificationContainer) {
            this.switchToVirtualScrolling();
        }
        
        this.performanceMode = 'performance';
    }

    /**
     * Passa a virtual scrolling runtime
     */
    async switchToVirtualScrolling() {
        try {
            const { NotificationVirtualScroller } = await notificationLazyLoader.loadModule(
                'NotificationVirtualScroller',
                './notificationVirtualScroller.js'
            );
            
            // Sostituisci container esistente
            const oldContainer = this.notificationContainer;
            const notifications = stateService.getState('notifications') || [];
            
            this.virtualScroller = new NotificationVirtualScroller(
                oldContainer.container.parentNode,
                {
                    itemHeight: 72,
                    visibleCount: this.maxConcurrentNotifications,
                    createElement: (notification, index) => {
                        return this.createOptimizedNotificationElement(notification, index);
                    }
                }
            );
            
            this.virtualScroller.setNotifications(notifications);
            
            // Cleanup vecchio container
            if (oldContainer.destroy) {
                oldContainer.destroy();
            }
            
            this.useVirtualScrolling = true;
            console.log('✅ Switched to virtual scrolling for better performance');
        } catch (error) {
            console.error('❌ Failed to switch to virtual scrolling:', error);
        }
    }

    /**
     * Crea elemento notifica ottimizzato
     */
    createOptimizedNotificationElement(notification, index) {
        // Usa renderer ottimizzato per performance
        const element = document.createElement('div');
        element.className = `notification notification--${notification.type} notification--optimized`;
        element.dataset.id = notification.id;
        
        // HTML minimo per performance
        element.innerHTML = `
            <div class="notification__content">
                <span class="notification__icon">${this.getIconForType(notification.type)}</span>
                <div class="notification__message">${notification.message}</div>
                <button class="notification__close" aria-label="Chiudi">×</button>
            </div>
        `;
        
        return element;
    }

    /**
     * Ottiene icona per tipo (fallback semplice)
     */
    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    }

    /**
     * Statistiche performance complete
     */
    getPerformanceStats() {
        const baseStats = this.getStats();
        
        return {
            ...baseStats,
            performance: {
                ...baseStats.performance,
                useVirtualScrolling: this.useVirtualScrolling,
                performanceMode: this.performanceMode,
                maxConcurrentNotifications: this.maxConcurrentNotifications,
                lastCleanupTime: this.lastCleanupTime,
                memoryThreshold: this.memoryThreshold,
                eventManager: notificationEventManager ? notificationEventManager.getStats() : null,
                animationManager: notificationAnimationManager ? notificationAnimationManager.getPerformanceStats() : null,
                lazyLoader: notificationLazyLoader ? notificationLazyLoader.getStats() : null
            }
        };
    }

    /**
     * Cleanup completo con performance optimizations
     */
    destroy() {
        // Cleanup performance monitoring
        if (this.renderPerformanceObserver) {
            this.renderPerformanceObserver.disconnect();
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Cleanup virtual scroller
        if (this.virtualScroller) {
            this.virtualScroller.destroy();
        }
        
        // Cleanup managers
        if (notificationEventManager) {
            notificationEventManager.destroy();
        }
        if (notificationAnimationManager) {
            notificationAnimationManager.destroy();
        }
        if (notificationLazyLoader) {
            notificationLazyLoader.destroy();
        }
        
        // Cleanup standard
        this.clear();
        
        // Reset performance state
        this.performanceMode = 'auto';
        this.useVirtualScrolling = false;
        this.maxConcurrentNotifications = this.detectOptimalMaxNotifications();
        
        if (NotificationService.DEBUG) {
            console.log('🧹 NotificationService destroyed with full cleanup');
        }
    }
}

// Esporta istanza singleton
var notificationService = new NotificationService();
export { notificationService };
