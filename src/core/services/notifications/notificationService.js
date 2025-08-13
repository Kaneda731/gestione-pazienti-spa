// src/core/services/notifications/notificationService.js

import { stateService } from '../state/stateService.js';
import { NotificationErrorHandler } from './notificationErrorHandler.js';
import { notificationEventManager } from './notificationEventManager.js';
import { notificationAnimationManager } from './notificationAnimationManager.js';
import { notificationLazyLoader } from './notificationLazyLoader.js';
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

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

class NotificationService {
    // ========================================================================
    // CONSTANTS & CONFIGURATION
    // ========================================================================
    
    static DEBUG = false;

    constructor() {
        // Core properties
        this.notificationContainer = null;
        this.timers = new Map();
        this.touchStartX = null;
        this.isRendering = false;
        this.initialized = false;
        this.settings = stateService.getNotificationSettings();
        
        // Performance tracking
        this._lastRenderTime = null;
        this._renderCount = 0;
        this._totalRenderTime = 0;
        this._averageRenderTime = null;
        this._lastRenderedNotificationIds = [];
        
        // Performance optimizations
        this.virtualScroller = null;
        this.useVirtualScrolling = false;
        this.performanceMode = 'auto';
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

    // ========================================================================
    // INITIALIZATION METHODS
    // ========================================================================

    async init() {
        if (this.initialized || typeof window === 'undefined') return;

        try {
            await this.initializeContainer();
            this.setupEventHandlers();
            this.setupStateSubscription();
            this.setupAutomaticCleanup();
            this.setupEmergencyReset();
            
            this.initialized = true;
            
            if (NotificationService.DEBUG) {
                this.logInitializationSuccess();
            }
        } catch (error) {
            console.error('❌ Failed to initialize NotificationService:', error);
            NotificationErrorHandler.handleServiceError(error, 'init');
            await this.initializeFallback();
        }
    }

    async initializeContainer() {
        this.useVirtualScrolling = false; // Disabilita virtual scrolling per ora
        
    const { NotificationContainer } = await import('../../../shared/components/notifications/NotificationContainer.js');
        
        this.notificationContainer = new NotificationContainer({
            position: this.settings.position,
            maxVisible: this.settings.maxVisible,
        });
    }

    setupEventHandlers() {
        notificationEventManager.setupEventDelegation(this.notificationContainer.container);
        createLiveRegion();
    }

    setupStateSubscription() {
        stateService.subscribe('notifications', this.throttledRenderNotifications.bind(this));
    }

    setupEmergencyReset() {
        if (typeof window !== 'undefined') {
            window.notificationEmergencyReset = () => this.emergencyReset();
            console.log('🚨 EMERGENCY: If you see error loops, run: window.notificationEmergencyReset()');
        }
    }

    logInitializationSuccess() {
        console.log('✅ NotificationService initialized with performance optimizations');
        console.log('📊 Virtual scrolling:', this.useVirtualScrolling);
        console.log('📊 Max concurrent notifications:', this.maxConcurrentNotifications);
        console.log('🚨 Emergency reset available: window.notificationEmergencyReset()');
    }

    async initializeFallback() {
        try {
            const { NotificationContainer } = await import('../../../shared/components/notifications/NotificationContainer.js');
            
            this.notificationContainer = new NotificationContainer({
                position: this.settings.position,
                maxVisible: Math.min(this.settings.maxVisible, 5),
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

    // ========================================================================
    // CORE NOTIFICATION METHODS
    // ========================================================================

    show(type, message, options = {}) {
        try {
            const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
            const customDuration = this.getCustomDuration(type, typeConfig);
            
            const finalOptions = this.buildFinalOptions(options, customDuration);
            
            return stateService.addNotification(type, message, finalOptions);
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'show', { type, message, options });
            return NotificationErrorHandler.recoverFromShowError({ type, message, options, id: Date.now().toString() });
        }
    }

    getCustomDuration(type, typeConfig) {
        return (this.settings.customDurations && this.settings.customDurations[type] !== undefined)
            ? this.settings.customDurations[type]
            : typeConfig.defaultDuration;
    }

    buildFinalOptions(options, customDuration) {
        return {
            duration: options.duration !== undefined ? options.duration : customDuration,
            closable: options.closable !== false,
            position: options.position || this.settings.position,
            priority: options.priority || 0,
            title: options.title,
            actions: options.actions,
            ...options
        };
    }

    // Convenience methods
    success(message, options = {}) {
        if (typeof options === 'number') {
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

    // ========================================================================
    // RENDERING METHODS
    // ========================================================================

    renderNotifications(notifications = []) {
        if (!this.canRender(notifications)) return;
        
        this.isRendering = true;

        try {
            const startTime = performance.now();
            
            this.updateNotifications(notifications);
            this.trackPerformance(startTime);
            this.resetErrorCounter();
            
        } catch (error) {
            this.handleRenderError(error, notifications);
        } finally {
            this.isRendering = false;
        }
    }

    canRender(notifications) {
        // Emergency circuit breaker
        if (!this.notificationContainer || this.isRendering) {
            if (!this.notificationContainer && this.initialized) {
                console.warn('⚠️ Container missing, attempting to recreate...');
                this.recreateContainer();
            }
            return false;
        }
        
        // Validate input
        if (!Array.isArray(notifications)) {
            console.warn('⚠️ renderNotifications called with non-array:', typeof notifications, notifications);
            return false;
        }
        
        // Check error threshold
        if (this._consecutiveRenderErrors > 10) {
            this.disableRenderingTemporarily();
            return false;
        }
        
        return !this._renderingDisabled;
    }

    updateNotifications(notifications) {
        const currentIds = new Set(notifications.map(n => n.id));
        const renderedIds = new Set(this._lastRenderedNotificationIds);

        // Remove notifications that are no longer present
        this.removeObsoleteNotifications(renderedIds, currentIds);
        
        // Add new notifications
        this.addNewNotifications(notifications, renderedIds);
        
        // Handle excess notifications
        handleExcessNotifications(
            notifications.slice(this.settings.maxVisible), 
            (id) => this.removeNotification(id)
        );

        this._lastRenderedNotificationIds = notifications.map(n => n.id);
    }

    removeObsoleteNotifications(renderedIds, currentIds) {
        renderedIds.forEach(id => {
            if (!currentIds.has(id)) {
                try {
                    this.notificationContainer.removeNotification(id);
                } catch (error) {
                    NotificationErrorHandler.handleDOMError(error, 'remove', null);
                }
            }
        });
    }

    addNewNotifications(notifications, renderedIds) {
        notifications.forEach(notification => {
            if (!renderedIds.has(notification.id)) {
                try {
                    this.addNotificationToDOM(notification);
                } catch (error) {
                    this.handleNotificationRenderError(error, notification);
                }
            }
        });
    }

    handleNotificationRenderError(error, notification) {
        NotificationErrorHandler.handleRenderError(error, notification, (notif) => {
            const fallbackElement = NotificationErrorHandler.createSimpleFallback(notif);
            if (fallbackElement && this.notificationContainer) {
                this.notificationContainer.addNotification(fallbackElement);
            }
            return fallbackElement;
        });
    }

    trackPerformance(startTime) {
        const endTime = performance.now();
        this._lastRenderTime = endTime - startTime;
        this._renderCount++;
        this._totalRenderTime += this._lastRenderTime;
        this._averageRenderTime = this._totalRenderTime / this._renderCount;
    }

    resetErrorCounter() {
        this._consecutiveRenderErrors = 0;
    }

    handleRenderError(error, notifications) {
        this._consecutiveRenderErrors = (this._consecutiveRenderErrors || 0) + 1;
        
        console.error(`❌ NotificationService render error (${this._consecutiveRenderErrors}/10):`, error);
        
        if (this._consecutiveRenderErrors <= 5) {
            NotificationErrorHandler.handleServiceError(error, 'render', notifications);
        }
    }

    disableRenderingTemporarily() {
        console.error('❌ Too many consecutive render errors, disabling notifications temporarily');
        this._renderingDisabled = true;
        setTimeout(() => {
            this._renderingDisabled = false;
            this._consecutiveRenderErrors = 0;
        }, 5000);
    }

    addNotificationToDOM(notification) {
        const renderFunction = (notif) => {
            const rendererPayload = this.buildRendererPayload(notif);
            
            try {
                const element = createNotificationElement(rendererPayload);
                if (!element) {
                    throw new Error('createNotificationElement returned null');
                }
                
                this.applyAnimationSettings(element);
                this.notificationContainer.addNotification(element);
                return element;
            } catch (error) {
                return this.handleElementCreationError(error, notif);
            }
        };
        
        return NotificationErrorHandler.queueNotification(renderFunction, notification);
    }

    buildRendererPayload(notification) {
        return {
            notification,
            settings: this.settings,
            timers: this.timers,
            removeNotification: (id) => this.removeNotification(id),
            startAutoCloseTimer,
            pauseAutoCloseTimer,
            resumeAutoCloseTimer,
            announceNotification,
            attachNotificationEvents,
            attachTouchEvents,
            notificationContainer: this.notificationContainer,
            errorHandler: NotificationErrorHandler
        };
    }

    applyAnimationSettings(element) {
        if (NotificationErrorHandler.shouldDisableAnimations()) {
            element.classList.add('notification--no-animations');
        }
    }

    handleElementCreationError(error, notification) {
        return NotificationErrorHandler.handleRenderError(error, notification, (fallbackNotif) => {
            const fallbackElement = NotificationErrorHandler.createSimpleFallback(fallbackNotif);
            if (fallbackElement && this.notificationContainer) {
                this.notificationContainer.addNotification(fallbackElement);
            }
            return fallbackElement;
        });
    }

    throttledRenderNotifications = this.throttle((newState, oldState, changedKeys) => {
        let notifications = [];
        
        if (Array.isArray(newState)) {
            notifications = newState;
        } else if (newState && typeof newState === 'object') {
            notifications = newState.notifications || [];
        }
        
        if (NotificationService.DEBUG) {
            console.log('🔄 Rendering notifications:', notifications.length, 'items');
        }
        
        this.renderNotifications(notifications);
    }, 16); // ~60fps

    // ========================================================================
    // NOTIFICATION REMOVAL METHODS
    // ========================================================================

    removeNotification(id) {
        try {
            if (NotificationService.DEBUG) {
                console.log('🔧 removeNotification called for id:', id);
            }
            
            this.cleanupNotificationResources(id);
            this.removeNotificationFromDOM(id);
            
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'remove', id);
            NotificationErrorHandler.recoverFromRemoveError(id);
        }
    }

    cleanupNotificationResources(id) {
        // Clean up timers and progress bar
        stopAutoCloseTimer(this.timers, id, (nid) => this.stopProgressBarAnimation(nid));
        
        // Cleanup progress bar JavaScript if present
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
    }

    removeNotificationFromDOM(id) {
        if (!this.notificationContainer) {
            this.removeFromStateOnly(id);
            return;
        }

        const element = this.notificationContainer.container?.querySelector(`[data-id="${id}"]`);
        
        if (element && this.settings.enableAnimations && !NotificationErrorHandler.shouldDisableAnimations()) {
            this.removeWithAnimation(element, id);
        } else {
            this.removeImmediately(id);
        }
    }

    removeWithAnimation(element, id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 Starting exit animation');
        }
        
        try {
            element.classList.remove('notification--entering');
            element.classList.add('notification--exiting');
            
            this.stopProgressBarDuringExit(element);
            
            setTimeout(() => {
                this.finalizeRemoval(id);
            }, 300);
        } catch (animationError) {
            NotificationErrorHandler.handleAnimationError(animationError, element, 'exit');
            this.removeImmediately(id);
        }
    }

    stopProgressBarDuringExit(element) {
        const progressBar = element.querySelector('.notification__progress');
        if (progressBar) {
            progressBar.classList.remove(
                'notification__progress--active',
                'notification__progress--paused',
                'notification__progress--resumed'
            );
        }
    }

    removeImmediately(id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 Removing notification immediately');
        }
        this.finalizeRemoval(id);
    }

    removeFromStateOnly(id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 Container not available, removing from state only');
        }
        stateService.removeNotification(id);
        this.validateRemoval(id);
    }

    finalizeRemoval(id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 Removing notification from container and state');
        }
        try {
            this.notificationContainer.removeNotification(id);
            stateService.removeNotification(id);
            this.validateRemoval(id);
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'remove', id);
            NotificationErrorHandler.recoverFromRemoveError(id);
        }
    }

    validateRemoval(id) {
        const stillPresent = (stateService.getState('notifications') || []).find(n => n.id === id);
        if (stillPresent) {
            console.error('[NotificationService] ERRORE: la notifica', id, 'è ancora nello stato dopo removeNotification!');
        }
    }

    stopProgressBarAnimation(id) {
        try {
            const element = this.notificationContainer?.container?.querySelector(`[data-id="${id}"]`);
            if (element && element._progressBarInstance) {
                element._progressBarInstance.destroy();
                element._progressBarInstance = null;
            }
        } catch (e) {
            // non critico
        }
    }

    // ========================================================================
    // BULK OPERATIONS
    // ========================================================================

    clear() {
        try {
            this.clearAllTimers();
            this.clearContainer();
            stateService.clearAllNotifications();
        } catch (error) {
            NotificationErrorHandler.handleServiceError(error, 'clear');
            NotificationErrorHandler.recoverFromClearError();
        }
    }

    clearAllTimers() {
        this.timers.forEach((timer, notificationId) => {
            stopAutoCloseTimer(this.timers, notificationId, (id) => this.stopProgressBarAnimation(id));
        });
        this.timers.clear();
    }

    clearContainer() {
        if (this.notificationContainer) {
            this.notificationContainer.clearAllNotifications();
        }
    }

    clearByType(type) {
        const notifications = stateService.getState('notifications') || [];
        
        // Clean up timers for removed notifications
        notifications.forEach(n => {
            if (n.type === type && this.timers.has(n.id)) {
                stopAutoCloseTimer(this.timers, n.id, (id) => this.stopProgressBarAnimation(id));
            }
        });

        stateService.clearNotificationsByType(type);
    }

    // ========================================================================
    // TIMER MANAGEMENT METHODS
    // ========================================================================

    startAutoCloseTimer(notificationId, duration) {
        try {
            startAutoCloseTimer(this.timers, notificationId, duration, (id) => {
                this.removeNotification(id);
            });
        } catch (error) {
            console.warn('Failed to start auto-close timer:', error);
        }
    }

    pauseAutoCloseTimer(notificationId) {
        try {
            pauseAutoCloseTimer(this.timers, notificationId);
        } catch (error) {
            console.warn('Failed to pause auto-close timer:', error);
        }
    }

    resumeAutoCloseTimer(notificationId) {
        try {
            resumeAutoCloseTimer(this.timers, notificationId);
        } catch (error) {
            console.warn('Failed to resume auto-close timer:', error);
        }
    }

    stopAutoCloseTimer(notificationId) {
        try {
            stopAutoCloseTimer(this.timers, notificationId, (id) => this.stopProgressBarAnimation(id));
        } catch (error) {
            console.warn('Failed to stop auto-close timer:', error);
        }
    }

    // ========================================================================
    // ACTION HANDLING
    // ========================================================================

    handleAction(notificationId, actionIndex) {
        try {
            const notifications = stateService.getState('notifications') || [];
            const notif = notifications.find(n => n.id === notificationId);
            const action = notif?.options?.actions?.[actionIndex];
            if (action && typeof action.onClick === 'function') {
                action.onClick({ id: notificationId, index: actionIndex, notification: notif });
            }
        } catch (e) {
            console.warn('Notification action handler error:', e);
        }
    }

    // ========================================================================
    // SETTINGS MANAGEMENT
    // ========================================================================

    // Delegated configuration methods
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

    updateSettings(newSettings) {
        try {
            const validatedSettings = this._validateSettings(newSettings);
            
            stateService.updateNotificationSettings(validatedSettings);
            this.settings = stateService.getNotificationSettings();
            
            this.updateContainerSettings(newSettings);
            
            if (NotificationService.DEBUG) {
                console.log('✅ Settings updated successfully:', this.settings);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to update notification settings:', error);
            return false;
        }
    }

    updateContainerSettings(newSettings) {
        if (this.notificationContainer && (newSettings.position || newSettings.maxVisible)) {
            this.notificationContainer.updateSettings({
                position: this.settings.position,
                maxVisible: this.settings.maxVisible
            });
        }
    }

    _validateSettings(settings) {
        const validated = {};
        
        // Validate maxVisible
        if (settings.maxVisible !== undefined) {
            const max = parseInt(settings.maxVisible);
            if (isNaN(max) || max < 1 || max > 20) {
                throw new Error('maxVisible deve essere un numero tra 1 e 20');
            }
            validated.maxVisible = max;
        }
        
        // Validate defaultDuration
        if (settings.defaultDuration !== undefined) {
            const duration = parseInt(settings.defaultDuration);
            if (isNaN(duration) || duration < 0) {
                throw new Error('defaultDuration deve essere un numero >= 0');
            }
            validated.defaultDuration = duration;
        }
        
        // Validate position
        if (settings.position !== undefined) {
            const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
            if (!validPositions.includes(settings.position)) {
                throw new Error(`position deve essere uno di: ${validPositions.join(', ')}`);
            }
            validated.position = settings.position;
        }
        
        // Validate boolean settings
        ['enableSounds', 'enableAnimations'].forEach(key => {
            if (settings[key] !== undefined) {
                validated[key] = Boolean(settings[key]);
            }
        });
        
        // Validate intervals
        if (settings.autoCleanupInterval !== undefined) {
            const interval = parseInt(settings.autoCleanupInterval);
            if (isNaN(interval) || interval < 60000) {
                throw new Error('autoCleanupInterval deve essere >= 60000ms (1 minuto)');
            }
            validated.autoCleanupInterval = interval;
        }
        
        // Validate maxStoredNotifications
        if (settings.maxStoredNotifications !== undefined) {
            const max = parseInt(settings.maxStoredNotifications);
            if (isNaN(max) || max < 10 || max > 1000) {
                throw new Error('maxStoredNotifications deve essere tra 10 e 1000');
            }
            validated.maxStoredNotifications = max;
        }
        
        // Validate persistentTypes
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
        
        // Validate soundVolume
        if (settings.soundVolume !== undefined) {
            const volume = parseFloat(settings.soundVolume);
            if (isNaN(volume) || volume < 0 || volume > 1) {
                throw new Error('soundVolume deve essere tra 0 e 1');
            }
            validated.soundVolume = volume;
        }
        
        // Validate customDurations
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

    // ========================================================================
    // STATISTICS AND EXPORT/IMPORT
    // ========================================================================

    getStats() {
        try {
            const baseStats = stateService.getNotificationStats();
            
            return {
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

    exportSettings() {
        try {
            const exportData = stateService.exportNotificationSettings();
            
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

    importSettings(backupData) {
        try {
            this.validateBackupData(backupData);
            
            const success = stateService.importNotificationSettings(backupData);
            
            if (success) {
                this.applyImportedSettings();
                
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

    validateBackupData(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('Formato backup non valido');
        }
        
        if (!backupData.settings) {
            throw new Error('Impostazioni mancanti nel backup');
        }
        
        const supportedVersions = ['1.0', '2.0'];
        if (!supportedVersions.includes(backupData.version)) {
            console.warn(`⚠️ Versione backup non supportata: ${backupData.version}. Tentativo di importazione comunque.`);
        }
    }

    applyImportedSettings() {
        this.settings = stateService.getNotificationSettings();
        
        if (this.notificationContainer) {
            this.notificationContainer.updateSettings({
                position: this.settings.position,
                maxVisible: this.settings.maxVisible
            });
        }
    }

    // ========================================================================
    // CLEANUP METHODS
    // ========================================================================

    cleanupOldNotifications(maxAge = 300000) {
        try {
            const removedCount = stateService.clearOldNotifications(maxAge);
            
            // Clean up timers for removed notifications
            const currentNotifications = stateService.getState('notifications');
            const currentIds = new Set(currentNotifications.map(n => n.id));
            
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

    setupAutomaticCleanup() {
        // Cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.performAutomaticCleanup();
        }, 300000);
        
        // Cleanup on page visibility change
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.performAutomaticCleanup();
                }
            });
        }
    }

    performAutomaticCleanup() {
        const now = Date.now();
        
        this.cleanupOldNotifications();
        
        if (notificationEventManager) {
            notificationEventManager.cleanupAll();
        }
        
        if (notificationAnimationManager) {
            notificationAnimationManager.disableAllAnimations();
        }
        
        // Force garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        this.lastCleanupTime = now;
        
        if (NotificationService.DEBUG) {
            console.log('🧹 Automatic cleanup performed');
        }
    }

    // ========================================================================
    // PERFORMANCE OPTIMIZATION METHODS
    // ========================================================================

    detectOptimalMaxNotifications() {
        // Base on device memory
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory >= 8) return 20;
            if (navigator.deviceMemory >= 4) return 15;
            if (navigator.deviceMemory >= 2) return 10;
            return 5;
        }
        
        // Fallback based on screen size
        if (window.innerWidth >= 1920) return 15;
        if (window.innerWidth >= 1200) return 10;
        if (window.innerWidth >= 768) return 8;
        return 5;
    }

    setupPerformanceMonitoring() {
        if (this.performanceMode === 'performance') {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 60000);
        }
        
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
                // PerformanceObserver not supported
            }
        }
    }

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

    optimizeForMemory() {
        this.maxConcurrentNotifications = Math.max(3, this.maxConcurrentNotifications - 2);
        this.cleanupOldNotifications(60000); // 1 minute instead of 5
        
        if (notificationAnimationManager) {
            notificationAnimationManager.optimizeForLowPerformance();
        }
        
        this.performanceMode = 'performance';
        
        if (notificationEventManager) {
            notificationEventManager.cleanupAll();
        }
    }

    trackRenderPerformance(entry) {
        const renderTime = entry.duration;
        
        this._renderCount++;
        this._totalRenderTime += renderTime;
        this._averageRenderTime = this._totalRenderTime / this._renderCount;
        
        if (renderTime > 16) { // > 1 frame at 60fps
            console.warn(`🐌 Slow render detected: ${renderTime.toFixed(2)}ms`);
            
            if (this._averageRenderTime > 10) {
                this.optimizeForPerformance();
            }
        }
    }

    optimizeForPerformance() {
        if (this.performanceMode === 'performance') return;
        
        console.log('🚀 Optimizing for performance');
        
        if (notificationAnimationManager) {
            notificationAnimationManager.optimizeForLowPerformance();
        }
        
        this.maxConcurrentNotifications = Math.max(3, this.maxConcurrentNotifications - 1);
        
        if (!this.useVirtualScrolling && this.notificationContainer) {
            this.switchToVirtualScrolling();
        }
        
        this.performanceMode = 'performance';
    }

    async switchToVirtualScrolling() {
        try {
            const { NotificationVirtualScroller } = await notificationLazyLoader.loadModule(
                'NotificationVirtualScroller',
                './notificationVirtualScroller.js'
            );
            
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
            
            if (oldContainer.destroy) {
                oldContainer.destroy();
            }
            
            this.useVirtualScrolling = true;
            console.log('✅ Switched to virtual scrolling for better performance');
        } catch (error) {
            console.error('❌ Failed to switch to virtual scrolling:', error);
        }
    }

    createOptimizedNotificationElement(notification, index) {
        const element = document.createElement('div');
        element.className = `notification notification--${notification.type} notification--optimized`;
        element.dataset.id = notification.id;
        
        element.innerHTML = `
            <div class="notification__content">
                <span class="notification__icon">${this.getIconForType(notification.type)}</span>
                <div class="notification__message">${notification.message}</div>
                <button class="notification__close" aria-label="Chiudi">×</button>
            </div>
        `;
        
        return element;
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

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

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

    async recreateContainer() {
        try {
            console.log('🔄 Recreating notification container...');
            
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
            
            const domContainer = document.getElementById('notification-container');
            if (!domContainer) {
                console.error('❌ Container still not in DOM after recreation');
            }
            
        } catch (error) {
            console.error('❌ Failed to recreate container:', error);
        }
    }

    emergencyReset() {
        console.warn('🚨 Emergency reset of NotificationService');
        
        // Stop all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // Reset flags
        this.isRendering = false;
        this._renderingDisabled = false;
        this._consecutiveRenderErrors = 0;
        
        // Clean container if exists
        if (this.notificationContainer) {
            try {
                this.notificationContainer.clear();
            } catch (error) {
                console.warn('Error clearing container during emergency reset:', error);
            }
        }
        
        // Clean state
        stateService.setState('notifications', []);
        
        console.log('✅ Emergency reset completed');
    }

    // ========================================================================
    // DESTROY METHOD
    // ========================================================================

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

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

const notificationService = new NotificationService();
export { notificationService };