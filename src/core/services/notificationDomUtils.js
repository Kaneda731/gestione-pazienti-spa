// Eventi e touch per notifiche modularizzati
export function attachNotificationEvents(element, notification, {
    timers,
    removeNotification,
    pauseAutoCloseTimer,
    resumeAutoCloseTimer,
    pauseProgressBarAnimation,
    resumeProgressBarAnimation,
    startProgressBarAnimation,
    notificationContainer
}) {
    const options = notification.options || {};

    // Click su notifica (se non ha azioni personalizzate)
    if (!options.actions || options.actions.length === 0) {
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.notification__close')) {
                removeNotification(notification.id);
            }
        });
    }

    // Pulsante chiusura
    const closeBtn = element.querySelector('.notification__close');
    if (closeBtn) {
        const onCloseClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeBtn.disabled = true;
            removeNotification(notification.id);
            closeBtn.removeEventListener('click', onCloseClick);
        };
        closeBtn.addEventListener('click', onCloseClick);
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
            if (action && action.keepOpen !== true) {
                removeNotification(notification.id);
            }
        });
    });

    // Keyboard navigation
    element.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                removeNotification(notification.id);
                break;
            case 'Enter':
            case ' ':
                if (e.target === element && (!options.actions || options.actions.length === 0)) {
                    e.preventDefault();
                    removeNotification(notification.id);
                }
                break;
        }
    });

    // Pausa timer su hover/focus - usa debouncing per evitare spam
    let hoverTimeout = null;
    element.addEventListener('mouseenter', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        pauseAutoCloseTimer(timers, notification.id, (id) => pauseProgressBarAnimation(id));
    });
    element.addEventListener('mouseleave', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            resumeAutoCloseTimer(timers, notification.id, (id, remainingTime) => resumeProgressBarAnimation(id, remainingTime), (id) => removeNotification(id));
        }, 100);
    });
    element.addEventListener('focusin', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        pauseAutoCloseTimer(timers, notification.id, (id) => pauseProgressBarAnimation(id));
    });
    element.addEventListener('focusout', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            resumeAutoCloseTimer(timers, notification.id, (id, remainingTime) => resumeProgressBarAnimation(id, remainingTime), (id) => removeNotification(id));
        }, 100);
    });
}

export function attachTouchEvents(element, notification, {
    pauseAutoCloseTimer,
    resumeAutoCloseTimer,
    removeNotification
}) {
    let startX = null;
    let currentX = null;
    let isDragging = false;
    let touchStartTime = null;
    let longPressTimer = null;

    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        touchStartTime = Date.now();
        isDragging = false;
        pauseAutoCloseTimer(notification.id);
        element.classList.add('notification--touched');
        longPressTimer = setTimeout(() => {
            if (!isDragging) {
                element.classList.add('notification--long-pressed');
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
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            element.classList.remove('notification--touched', 'notification--long-pressed');
            const progress = Math.min(Math.abs(diffX) / 100, 1);
            const opacity = 1 - progress * 0.6;
            const scale = 1 - progress * 0.05;
            element.style.transform = `translateX(${diffX}px) scale(${scale})`;
            element.style.opacity = opacity;
            if (Math.abs(diffX) > 80 && !element.classList.contains('notification--swipe-threshold')) {
                element.classList.add('notification--swipe-threshold');
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        }
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        element.classList.remove('notification--touched', 'notification--long-pressed');
        if (!startX) {
            resumeAutoCloseTimer(notification.id);
            return;
        }
        const touchDuration = Date.now() - touchStartTime;
        const diffX = currentX - startX;
        if (!isDragging && Math.abs(diffX) < 10 && touchDuration < 300) {
            resumeAutoCloseTimer(notification.id);
            return;
        }
        if (!isDragging) {
            resumeAutoCloseTimer(notification.id);
            return;
        }
        if (Math.abs(diffX) > 80) {
            element.classList.add('swipe-right');
            element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            element.style.transform = `translateX(${diffX > 0 ? '100%' : '-100%'}) scale(0.9)`;
            element.style.opacity = '0';
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            setTimeout(() => {
                removeNotification(notification.id);
            }, 300);
        } else {
            element.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-out';
            element.style.transform = '';
            element.style.opacity = '';
            element.classList.remove('notification--swipe-threshold');
            setTimeout(() => {
                element.style.transition = '';
            }, 400);
            setTimeout(() => {
                resumeAutoCloseTimer(notification.id);
            }, 100);
        }
        startX = null;
        isDragging = false;
    }, { passive: true });

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
        resumeAutoCloseTimer(notification.id);
    }, { passive: true });
}
/**
 * Gestisce notifiche in eccesso (oltre il limite visibile)
 * @param {Array} excessNotifications
 * @param {Function} removeNotification
 */
export function handleExcessNotifications(excessNotifications, removeNotification) {
    // Rimuovi automaticamente le notifiche più vecchie di tipo success/info
    excessNotifications.forEach(notification => {
        if (notification.type === 'success' || notification.type === 'info') {
            setTimeout(() => {
                removeNotification(notification.id);
            }, 1000);
        }
    });
}
/**
 * Annuncia notifica per screen reader
 */
export function announceNotification(type, message) {
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
// Utility DOM per notifiche: creazione elementi, eventi, touch
// Verrà popolato con funzioni estratte da notificationService.js

// Placeholder: esporta una funzione vuota per ora
export function placeholderDomUtils() {}
/**
 * Crea live region per annunci screen reader
 */
export function createLiveRegion() {
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
