// Logica di rendering e container notifiche

import { NOTIFICATION_TYPES, RESPONSIVE_CONFIG, getDurationForType } from './notificationConfig.js';
import { NotificationErrorHandler } from './notificationErrorHandler.js';
import { createProgressBar } from './notificationProgressBar.js';

// Funzione per sanificare HTML (placeholder, da sostituire con util reale)
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

export function createNotificationElement({
    notification,
    index = 0,
    settings,
    timers,
    removeNotification,
    startAutoCloseTimer,
    pauseAutoCloseTimer,
    resumeAutoCloseTimer,
    announceNotification,
    attachNotificationEvents,
    attachTouchEvents,
    notificationContainer,
    errorHandler = NotificationErrorHandler
}) {
    try {
        const typeConfig = NOTIFICATION_TYPES[notification.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        const options = notification.options || {};

        const div = document.createElement('div');
        div.className = `notification notification--${notification.type}`;
        div.dataset.id = notification.id;
        div.setAttribute('role', typeConfig.ariaRole);
        div.setAttribute('aria-live', typeConfig.ariaLive);
        div.setAttribute('aria-atomic', 'true');
        div.setAttribute('tabindex', '0');

        // Animazione di entrata con fallback
        if (settings.enableAnimations && !errorHandler.shouldDisableAnimations()) {
            try {
                div.classList.add('notification--entering');
                
                // Listener per gestire errori di animazione
                div.addEventListener('animationend', (e) => {
                    if (e.animationName.includes('slideIn') || e.animationName.includes('fadeIn')) {
                        div.classList.remove('notification--entering');
                        div.classList.add('notification--visible');
                    }
                });
                
                div.addEventListener('animationerror', (e) => {
                    errorHandler.handleAnimationError(new Error('Animation failed'), div, 'entrance');
                });
                
            } catch (animationError) {
                errorHandler.handleAnimationError(animationError, div, 'entrance');
            }
        } else {
            // Nessuna animazione: applica stato finale
            div.classList.add('notification--visible', 'notification--no-animations');
        }

        // Costruisci contenuto con gestione errori
        let contentHtml = '';
        try {
            contentHtml = `
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

            // Progress bar per auto-close - usa sempre JavaScript per controllo preciso
            const notificationDuration = getDurationForType(notification.type, options.duration);
            if (notificationDuration > 0 && !options.persistent) {
                console.log(`🔧 Creating progress bar placeholder for ${notification.type} (${notificationDuration}ms)`);
                // Placeholder per progress bar JavaScript
                contentHtml += `
                    <div class="notification__progress notification__progress--js-placeholder" 
                         aria-hidden="true" 
                         role="progressbar"
                         aria-label="Tempo rimanente prima della chiusura automatica"
                         data-duration="${notificationDuration}"
                         data-type="${notification.type}"></div>
                `;
            }

            div.innerHTML = contentHtml;
            
        } catch (htmlError) {
            console.error('❌ Error building notification HTML:', htmlError);
            // Fallback: contenuto semplice
            div.innerHTML = `
                <div class="notification__content">
                    <span class="notification__icon">!</span>
                    <div class="notification__body">
                        <div class="notification__message">${notification.message || 'Notifica'}</div>
                    </div>
                    <button class="notification__close" aria-label="Chiudi">×</button>
                </div>
            `;
        }

        // Event listeners con gestione errori
        try {
            attachNotificationEvents(div, notification, {
                timers,
                removeNotification,
                pauseAutoCloseTimer,
                resumeAutoCloseTimer,
                notificationContainer
            });
        } catch (eventError) {
            console.error('❌ Error attaching notification events:', eventError);
            // Fallback: aggiungi solo evento di chiusura base
            const closeBtn = div.querySelector('.notification__close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    try {
                        removeNotification(notification.id);
                    } catch (e) {
                        div.remove();
                    }
                });
            }
        }

        // Gestione touch per mobile con fallback
        try {
            if (window.innerWidth <= RESPONSIVE_CONFIG.mobile.maxWidth) {
                attachTouchEvents(div, notification, {
                    pauseAutoCloseTimer,
                    resumeAutoCloseTimer,
                    removeNotification
                });
            }
        } catch (touchError) {
            console.error('❌ Error attaching touch events:', touchError);
            // Touch events sono opzionali, continua senza
        }

        // Auto-close con progress bar JavaScript
        try {
            const notificationDuration = getDurationForType(notification.type, options.duration);
            if (notificationDuration > 0 && !options.persistent) {
                const progressBarPlaceholder = div.querySelector('.notification__progress--js-placeholder');
                console.log('🔍 Looking for progress bar placeholder:', progressBarPlaceholder);
                
                if (progressBarPlaceholder) {
                    // Crea progress bar JavaScript che gestisce anche l'autoclose
                    const progressBarInstance = createProgressBar(div, notificationDuration, notification.type);
                    
                    // Gestisci eventi hover per pausa/resume (solo desktop)
                    if (window.innerWidth > 768) {
                        div.addEventListener('mouseenter', () => {
                            if (progressBarInstance) progressBarInstance.pause();
                        });
                        
                        div.addEventListener('mouseleave', () => {
                            if (progressBarInstance) progressBarInstance.resume();
                        });
                    }
                    
                    // Ascolta completamento progress bar per autoclose
                    div.addEventListener('progressComplete', () => {
                        try {
                            removeNotification(notification.id);
                        } catch (removeError) {
                            console.error('❌ Error in progress complete callback:', removeError);
                            if (div.parentNode) {
                                div.remove();
                            }
                        }
                    });
                    
                    // Salva riferimento per cleanup
                    div._progressBarInstance = progressBarInstance;
                    
                    console.log(`✅ JavaScript progress bar initialized for ${notification.type} (${notificationDuration}ms)`);
                    
                } else {
                    // Fallback al timer tradizionale se non c'è placeholder
                    startAutoCloseTimer(
                        timers,
                        notification.id,
                        notificationDuration,
                        () => {
                            try {
                                removeNotification(notification.id);
                            } catch (removeError) {
                                console.error('❌ Error in auto-close callback:', removeError);
                                if (div.parentNode) {
                                    div.remove();
                                }
                            }
                        }
                    );
                    
                    console.log(`✅ Fallback timer used for ${notification.type} (${notificationDuration}ms)`);
                }
            }
        } catch (timerError) {
            console.error('❌ Error setting up auto-close timer:', timerError);
            // Timer è opzionale, continua senza
        }

        // Annuncio per screen reader con fallback
        try {
            announceNotification(notification.type, notification.message);
        } catch (announceError) {
            console.error('❌ Error announcing notification:', announceError);
            // Screen reader announcement è opzionale
        }

        return div;
        
    } catch (error) {
        console.error('❌ Critical error in createNotificationElement:', error);
        // Fallback critico: usa l'error handler
        return errorHandler.createSimpleFallback(notification);
    }
}

// Placeholder: esporta una funzione vuota per ora
export function placeholderRenderer() {}
