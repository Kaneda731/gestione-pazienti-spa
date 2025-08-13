// Utilità DOM per le notifiche

export function createLiveRegion() {
    if (document.getElementById('notification-announcer')) return;
    
    const liveRegion = document.createElement('div');
    liveRegion.id = 'notification-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    
    document.body.appendChild(liveRegion);
}

export function announceNotification(type, message) {
    const announcer = document.getElementById('notification-announcer');
    if (announcer) {
        announcer.textContent = `${type}: ${message}`;
    }
}

export function handleExcessNotifications(excessNotifications, removeNotification) {
    // Rimuovi automaticamente le notifiche in eccesso
    excessNotifications.forEach(notification => {
        if (notification.type === 'success' || notification.type === 'info') {
            setTimeout(() => {
                removeNotification(notification.id);
            }, 1000);
        }
    });
}

export function attachNotificationEvents(element, notification, { timers, removeNotification, pauseAutoCloseTimer, resumeAutoCloseTimer }) {
    // Evento click per chiudere
    const closeBtn = element.querySelector('.notification__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeNotification(notification.id);
        });
    }
    
    // Evento keyboard
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            removeNotification(notification.id);
        }
    });
}

export function attachTouchEvents(element, notification, { pauseAutoCloseTimer, resumeAutoCloseTimer, removeNotification }) {
    let touchStartTime = 0;
    
    element.addEventListener('touchstart', () => {
        touchStartTime = Date.now();
    });
    
    element.addEventListener('touchend', () => {
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration > 500) {
            // Long press - pause
            pauseAutoCloseTimer?.(notification.id);
        }
    });
}