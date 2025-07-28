// Logica di rendering e container notifiche

import { NOTIFICATION_TYPES, RESPONSIVE_CONFIG, getDurationForType } from './notificationConfig.js';

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
    startProgressBarAnimation,
    pauseProgressBarAnimation,
    resumeProgressBarAnimation,
    startAutoCloseTimer,
    pauseAutoCloseTimer,
    resumeAutoCloseTimer,
    announceNotification,
    attachNotificationEvents,
    attachTouchEvents,
    notificationContainer
}) {
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
    if (settings.enableAnimations) {
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
    const notificationDuration = getDurationForType(notification.type, options.duration);
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
    attachNotificationEvents(div, notification, {
        timers,
        removeNotification,
        pauseAutoCloseTimer,
        resumeAutoCloseTimer,
        pauseProgressBarAnimation,
        resumeProgressBarAnimation,
        startProgressBarAnimation,
        notificationContainer
    });

    // Gestione touch per mobile
    if (window.innerWidth <= RESPONSIVE_CONFIG.mobile.maxWidth) {
        attachTouchEvents(div, notification, {
            pauseAutoCloseTimer,
            resumeAutoCloseTimer,
            removeNotification
        });
    }

    // Auto-close timer con durata differenziata per tipo
    if (notificationDuration > 0 && !options.persistent) {
        startAutoCloseTimer(
            timers,
            notification.id,
            notificationDuration,
            () => removeNotification(notification.id),
            (id, duration) => startProgressBarAnimation(id, duration)
        );
    }

    // Annuncio per screen reader
    announceNotification(notification.type, notification.message);

    return div;
}

// Placeholder: esporta una funzione vuota per ora
export function placeholderRenderer() {}
