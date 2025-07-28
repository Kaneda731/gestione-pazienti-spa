// src/core/services/notificationService.js

/**
 * Servizio avanzato per la gestione delle notifiche UI
 * Supporta notifiche responsive, accessibili e personalizzabili
 * Si integra con stateService per gestire notifiche in modo centralizzato
 */

import { stateService } from './stateService.js';
import { sanitizeHtml } from '../../shared/utils/sanitizeHtml.js';
import { NotificationContainer } from '../../shared/components/notifications/NotificationContainer.js';
import { NotificationComponent } from '../../shared/components/notifications/NotificationComponent.js';

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
            
            this.init();
        } catch (error) {
            console.error('❌ [NotificationService] Errore durante inizializzazione:', error);
            // Impostazioni di fallback
            this.settings = {
                maxVisible: 5,
                defaultDuration: 4000,
                position: 'top-right',
                enableSounds: false,
                enableAnimations: true,
                autoCleanupInterval: 60000,
                maxStoredNotifications: 100,
                customDurations: {},
                soundVolume: 0.5
            };
            try {
                this.init();
            } catch (fallbackError) {
                console.error('❌ [NotificationService] Errore anche con fallback:', fallbackError);
            }
        }
    }

    /**
     * Inizializza il servizio e crea il container per le notifiche
     */
    init() {
        try {
            // Crea NotificationContainer con configurazione responsive
            this.notificationContainer = NotificationContainer.createResponsive({
                position: this.settings.position,
                maxVisible: this.settings.maxVisible,
                enableResponsive: true
            });
            // ...existing code...
            
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
        } catch (error) {
            console.error('❌ [NotificationService] Errore in init():', error);
            throw error;
        }
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
        
        // Sincronizza con StateService
        stateService.updateNotificationSettings(newSettings);
        
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
        // Protezione contro loop infiniti
        if (this.isRendering) {
            return;
        }
        // ...existing code...
        if (!this.notificationContainer) {
            if (!this._lastContainerWarned) {
                // ...existing code...
                this._lastContainerWarned = true;
            }
            return;
        } else {
            this._lastContainerWarned = false;
        }
        const notifications = stateService.getState('notifications') || [];
        // Ordina per priorità e timestamp
        const sortedNotifications = [...notifications].sort((a, b) => {
            if ((a.options.priority || 0) !== (b.options.priority || 0)) {
                return (b.options.priority || 0) - (a.options.priority || 0);
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        // Confronta gli id delle notifiche con quelli renderizzati precedentemente
        const currentIds = sortedNotifications.map(n => n.id);
        const lastIds = this._lastRenderedNotificationIds;
        const isSame = currentIds.length === lastIds.length && currentIds.every((id, i) => id === lastIds[i]);
        if (isSame) {
            return;
        }
        this._lastRenderedNotificationIds = currentIds;
        this.isRendering = true;
        try {
            // ...existing code...
            // Pulisci container
            this.notificationContainer.clearAllNotifications();
            // Renderizza notifiche usando NotificationComponent
            sortedNotifications.forEach((notification, index) => {
                const nc = new NotificationComponent(notification, notification.options);
                this.attachNotificationEvents(nc.element, notification);
                this.notificationContainer.addNotification(nc.element);
            });
            // Gestisci notifiche in eccesso (il container gestisce automaticamente maxVisible)
            if (sortedNotifications.length > this.settings.maxVisible) {
                this.handleExcessNotifications(sortedNotifications.slice(this.settings.maxVisible));
            }
        } finally {
            this.isRendering = false;
        }
    }

    /**
     * Mostra un banner di debug a schermo
     */
    debugBanner(msg) {
        let banner = document.getElementById('notification-debug-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'notification-debug-banner';
            banner.style.position = 'fixed';
            banner.style.bottom = '0';
            banner.style.left = '0';
            banner.style.zIndex = '99999';
            banner.style.background = 'rgba(0,0,0,0.8)';
            banner.style.color = '#fff';
            banner.style.padding = '4px 12px';
            banner.style.fontSize = '14px';
            banner.style.fontFamily = 'monospace';
            banner.style.pointerEvents = 'none';
            document.body.appendChild(banner);
        }
        banner.textContent = '[NotificationService] ' + msg;
        clearTimeout(banner._timeout);
        banner._timeout = setTimeout(() => {
            banner.remove();
        }, 4000);
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

        // Progress bar per auto-close con durata differenziata
        const notificationDuration = this.getDurationForType(notification.type, options.duration);
        if (notificationDuration > 0 && !options.persistent) {
            contentHtml += `
                <div class="notification__progress" 
                     aria-hidden="true" 
                     role="progressbar"
                     aria-label="Tempo rimanente prima della chiusura automatica"
                     style="--progress-duration: ${notificationDuration}ms"></div>
            `;
        }

        div.innerHTML = contentHtml;

        // Event listeners
        this.attachNotificationEvents(div, notification);

        // Gestione touch per mobile
        if (window.innerWidth <= RESPONSIVE_CONFIG.mobile.maxWidth) {
            this.attachTouchEvents(div, notification);
        }

        // Auto-close timer con durata differenziata per tipo
        if (notificationDuration > 0 && !options.persistent) {
            this.startAutoCloseTimer(notification.id, notificationDuration);
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
            // Previeni click multipli: disabilita subito e rimuovi listener dopo il primo click
            const onCloseClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeBtn.disabled = true;
                this.removeNotification(notification.id);
                closeBtn.removeEventListener('click', onCloseClick);
            };
            closeBtn.addEventListener('click', onCloseClick);
        } else {
            // Solo un warning, non spam
            if (NotificationService.DEBUG) {
                console.warn('🔧 Close button not found for notification:', notification.id);
            }
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

        // Pausa timer su hover/focus - usa debouncing per evitare spam
        let hoverTimeout = null;
        
        element.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            this.pauseAutoCloseTimer(notification.id);
        });

        element.addEventListener('mouseleave', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                this.resumeAutoCloseTimer(notification.id);
            }, 100);
        });

        element.addEventListener('focusin', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            this.pauseAutoCloseTimer(notification.id);
        });

        element.addEventListener('focusout', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                this.resumeAutoCloseTimer(notification.id);
            }, 100);
        });
    }

    /**
     * Attacca eventi touch per mobile con gestione timer migliorata
     */
    attachTouchEvents(element, notification) {
        let startX = null;
        let currentX = null;
        let isDragging = false;
        let touchStartTime = null;
        let longPressTimer = null;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            touchStartTime = Date.now();
            isDragging = false;
            
            // Pausa timer durante interazione touch
            this.pauseAutoCloseTimer(notification.id);
            
            // Feedback visivo per touch
            element.classList.add('notification--touched');
            
            // Avvia timer per long press
            longPressTimer = setTimeout(() => {
                if (!isDragging) {
                    element.classList.add('notification--long-pressed');
                    // Vibrazione se supportata
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
            }, 500);
            
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (!startX) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            
            if (Math.abs(diffX) > 10) {
                isDragging = true;
                
                // Cancella long press
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                
                // Rimuovi feedback touch
                element.classList.remove('notification--touched', 'notification--long-pressed');
                
                // Applica trasformazione swipe con feedback migliorato
                const progress = Math.min(Math.abs(diffX) / 100, 1);
                const opacity = 1 - progress * 0.6;
                const scale = 1 - progress * 0.05;
                
                element.style.transform = `translateX(${diffX}px) scale(${scale})`;
                element.style.opacity = opacity;
                
                // Feedback visivo quando si raggiunge soglia
                if (Math.abs(diffX) > 80 && !element.classList.contains('notification--swipe-threshold')) {
                    element.classList.add('notification--swipe-threshold');
                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            // Pulisci timer long press
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // Rimuovi classi feedback
            element.classList.remove('notification--touched', 'notification--long-pressed');
            
            if (!startX) {
                this.resumeAutoCloseTimer(notification.id);
                return;
            }

            const touchDuration = Date.now() - touchStartTime;
            const diffX = currentX - startX;
            
            // Gestione tap semplice
            if (!isDragging && Math.abs(diffX) < 10 && touchDuration < 300) {
                // Tap semplice - riprendi timer
                this.resumeAutoCloseTimer(notification.id);
                return;
            }
            
            if (!isDragging) {
                this.resumeAutoCloseTimer(notification.id);
                return;
            }
            
            // Gestione swipe
            if (Math.abs(diffX) > 80) {
                // Swipe completato - chiudi notifica
                element.classList.add('swipe-right');
                element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                element.style.transform = `translateX(${diffX > 0 ? '100%' : '-100%'}) scale(0.9)`;
                element.style.opacity = '0';
                
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }
                
                setTimeout(() => {
                    this.removeNotification(notification.id);
                }, 300);
            } else {
                // Swipe incompleto - ripristina posizione
                element.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-out';
                element.style.transform = '';
                element.style.opacity = '';
                element.classList.remove('notification--swipe-threshold');
                
                setTimeout(() => {
                    element.style.transition = '';
                }, 400);
                
                // Riprendi timer dopo animazione
                setTimeout(() => {
                    this.resumeAutoCloseTimer(notification.id);
                }, 100);
            }
            
            startX = null;
            isDragging = false;
        }, { passive: true });

        // Gestione touch cancel
        element.addEventListener('touchcancel', (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            element.classList.remove('notification--touched', 'notification--long-pressed', 'notification--swipe-threshold');
            
            if (isDragging) {
                element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                element.style.transform = '';
                element.style.opacity = '';
                
                setTimeout(() => {
                    element.style.transition = '';
                }, 300);
            }
            
            startX = null;
            isDragging = false;
            
            // Riprendi timer
            this.resumeAutoCloseTimer(notification.id);
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
     * Gestione timer per auto-close con supporto differenziato per tipo
     */
    startAutoCloseTimer(notificationId, duration) {
        if (this.timers.has(notificationId)) {
            clearTimeout(this.timers.get(notificationId).timeoutId);
        }

        // Non avviare timer se durata è 0 (persistente)
        if (duration <= 0) {
            return;
        }

        const timeoutId = setTimeout(() => {
            this.removeNotification(notificationId);
            this.timers.delete(notificationId);
        }, duration);

        this.timers.set(notificationId, {
            timeoutId,
            originalDuration: duration,
            remainingTime: duration,
            startTime: Date.now(),
            isPaused: false,
            pauseStartTime: null
        });

        // Avvia progress bar se elemento esiste
        this.startProgressBarAnimation(notificationId, duration);
    }

    /**
     * Pausa timer auto-close e progress bar
     */
    pauseAutoCloseTimer(notificationId) {
        const timer = this.timers.get(notificationId);
        if (!timer || timer.isPaused) return;

        // Pausa timer
        clearTimeout(timer.timeoutId);
        timer.remainingTime = timer.originalDuration - (Date.now() - timer.startTime);
        timer.isPaused = true;
        timer.pauseStartTime = Date.now();

        // Pausa progress bar
        this.pauseProgressBarAnimation(notificationId);
    }

    /**
     * Riprende timer auto-close e progress bar
     */
    resumeAutoCloseTimer(notificationId) {
        const timer = this.timers.get(notificationId);
        if (!timer || !timer.isPaused) return;

        // Riprende timer con tempo rimanente
        timer.startTime = Date.now();
        timer.timeoutId = setTimeout(() => {
            this.removeNotification(notificationId);
            this.timers.delete(notificationId);
        }, timer.remainingTime);
        
        timer.isPaused = false;
        timer.pauseStartTime = null;

        // Riprende progress bar
        this.resumeProgressBarAnimation(notificationId, timer.remainingTime);
    }

    /**
     * Avvia animazione progress bar
     */
    startProgressBarAnimation(notificationId, duration) {
        const element = this.notificationContainer?.container?.querySelector(`[data-id="${notificationId}"]`);
        const progressBar = element?.querySelector('.notification__progress');
        
        if (!progressBar) return;

        // Imposta durata CSS custom property
        progressBar.style.setProperty('--progress-duration', `${duration}ms`);
        
        // Attiva progress bar
        progressBar.classList.add('notification__progress--active');
        progressBar.classList.remove('notification__progress--paused', 'notification__progress--resumed');
    }

    /**
     * Pausa animazione progress bar
     */
    pauseProgressBarAnimation(notificationId) {
        const element = this.notificationContainer?.container?.querySelector(`[data-id="${notificationId}"]`);
        const progressBar = element?.querySelector('.notification__progress');
        
        if (!progressBar) return;

        progressBar.classList.add('notification__progress--paused');
        progressBar.classList.remove('notification__progress--resumed');
    }

    /**
     * Riprende animazione progress bar con tempo rimanente
     */
    resumeProgressBarAnimation(notificationId, remainingTime) {
        const element = this.notificationContainer?.container?.querySelector(`[data-id="${notificationId}"]`);
        const progressBar = element?.querySelector('.notification__progress');
        
        if (!progressBar) return;

        // Aggiorna durata con tempo rimanente
        progressBar.style.setProperty('--progress-duration', `${remainingTime}ms`);
        
        // Rimuovi pausa e riavvia
        progressBar.classList.remove('notification__progress--paused');
        progressBar.classList.add('notification__progress--resumed');
        
        // Forza restart dell'animazione
        progressBar.style.animation = 'none';
        progressBar.offsetHeight; // Trigger reflow
        progressBar.style.animation = null;
    }

    /**
     * Ferma completamente timer e progress bar
     */
    stopAutoCloseTimer(notificationId) {
        const timer = this.timers.get(notificationId);
        if (timer) {
            clearTimeout(timer.timeoutId);
            this.timers.delete(notificationId);
        }

        // Ferma progress bar
        const element = this.notificationContainer?.container?.querySelector(`[data-id="${notificationId}"]`);
        const progressBar = element?.querySelector('.notification__progress');
        
        if (progressBar) {
            progressBar.classList.remove(
                'notification__progress--active',
                'notification__progress--paused', 
                'notification__progress--resumed'
            );
        }
    }

    /**
     * Ottiene durata differenziata per tipo notifica
     */
    getDurationForType(type, customDuration) {
        if (customDuration !== undefined) {
            return customDuration;
        }

        const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()];
        return typeConfig ? typeConfig.defaultDuration : NOTIFICATION_TYPES.INFO.defaultDuration;
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

    /**
     * Rimuove una notifica con animazione e cleanup completo
     */
    removeNotification(id) {
        if (NotificationService.DEBUG) {
            console.log('🔧 removeNotification called for id:', id);
        }
        // Pulisci timer e progress bar
        this.stopAutoCloseTimer(id);

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
            clearTimeout(timer.timeoutId);
            this.stopAutoCloseTimer(notificationId);
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
                clearTimeout(this.timers.get(n.id).timeoutId);
                this.timers.delete(n.id);
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
     * Metodi avanzati per gestione stato e configurazione
     */
    
    /**
     * Ottiene statistiche sulle notifiche
     */
    getStats() {
        return stateService.getNotificationStats();
    }

    /**
     * Ottiene notifiche visibili
     */
    getVisibleNotifications() {
        return stateService.getVisibleNotifications();
    }

    /**
     * Ottiene notifiche per tipo
     */
    getNotificationsByType(type) {
        return stateService.getNotificationsByType(type);
    }

    /**
     * Verifica se ci sono errori attivi
     */
    hasErrors() {
        return stateService.hasErrorNotifications();
    }

    /**
     * Pulisce notifiche vecchie manualmente
     */
    cleanupOldNotifications(maxAge) {
        const removed = stateService.clearOldNotifications(maxAge);
        
        // Pulisci anche i timer corrispondenti
        this.timers.forEach((timer, notificationId) => {
            const notification = stateService.getState('notifications').find(n => n.id === notificationId);
            if (!notification) {
                clearTimeout(timer.timeoutId);
                this.timers.delete(notificationId);
            }
        });
        
        return removed;
    }

    /**
     * Esporta configurazione per backup
     */
    exportSettings() {
        return stateService.exportNotificationSettings();
    }

    /**
     * Importa configurazione da backup
     */
    importSettings(backup) {
        const success = stateService.importNotificationSettings(backup);
        if (success) {
            // Aggiorna settings locali
            const newSettings = stateService.getNotificationSettings();
            this.settings = { ...this.settings, ...newSettings };
            
            // Aggiorna container
            if (this.notificationContainer) {
                this.notificationContainer.updateSettings({
                    position: this.settings.position,
                    maxVisible: this.settings.maxVisible
                });
            }
        }
        return success;
    }

    /**
     * Configura durate personalizzate per tipo
     */
    setCustomDurations(durations) {
        const settings = stateService.getNotificationSettings();
        const updatedSettings = {
            ...settings,
            customDurations: { ...settings.customDurations, ...durations }
        };
        
        this.updateSettings(updatedSettings);
    }

    /**
     * Configura tipi persistenti
     */
    setPersistentTypes(types) {
        const settings = stateService.getNotificationSettings();
        const updatedSettings = {
            ...settings,
            persistentTypes: Array.isArray(types) ? types : [types]
        };
        
        this.updateSettings(updatedSettings);
    }

    /**
     * Configura intervallo di cleanup automatico
     */
    setAutoCleanupInterval(interval) {
        const settings = stateService.getNotificationSettings();
        const updatedSettings = {
            ...settings,
            autoCleanupInterval: interval
        };
        
        this.updateSettings(updatedSettings);
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
