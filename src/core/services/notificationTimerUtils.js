// Utilità per la gestione dei timer delle notifiche

export function startAutoCloseTimer(timers, notificationId, duration, callback) {
    // Pulisci timer esistente se presente
    if (timers.has(notificationId)) {
        clearTimeout(timers.get(notificationId));
    }
    
    const timerId = setTimeout(() => {
        timers.delete(notificationId);
        callback();
    }, duration);
    
    timers.set(notificationId, timerId);
}

export function pauseAutoCloseTimer(timers, notificationId) {
    // Per ora implementazione semplice
    console.log(`⏸️ Timer paused for notification: ${notificationId}`);
}

export function resumeAutoCloseTimer(timers, notificationId) {
    // Per ora implementazione semplice
    console.log(`▶️ Timer resumed for notification: ${notificationId}`);
}

export function stopAutoCloseTimer(timers, notificationId, onStop) {
    if (timers.has(notificationId)) {
        clearTimeout(timers.get(notificationId));
        timers.delete(notificationId);
        try {
            if (typeof onStop === 'function') onStop(notificationId);
        } catch (e) {
            // best-effort cleanup, non bloccare
            console.warn('Timer onStop callback error:', e);
        }
        console.log(`⏹️ Timer stopped for notification: ${notificationId}`);
    }
}