// Utility per gestione timer e progress bar delle notifiche
// Verrà popolato con funzioni estratte da notificationService.js

// Placeholder: esporta una funzione vuota per ora
export function placeholderTimerUtils() {}
// Utilità timer/progress bar per notifiche

/**
 * Avvia il timer di auto-close per una notifica
 * @param {Map} timers
 * @param {string} notificationId
 * @param {number} duration
 * @param {Function} removeNotification
 * @param {Function} startProgressBarAnimation
 */
export function startAutoCloseTimer(timers, notificationId, duration, removeNotification, startProgressBarAnimation) {
    if (timers.has(notificationId)) {
        clearTimeout(timers.get(notificationId).timeoutId);
    }
    if (duration <= 0) {
        return;
    }
    const timeoutId = setTimeout(() => {
        removeNotification();
        timers.delete(notificationId);
    }, duration);
    timers.set(notificationId, {
        timeoutId,
        originalDuration: duration,
        remainingTime: duration,
        startTime: Date.now(),
        isPaused: false,
        pauseStartTime: null
    });
    if (typeof startProgressBarAnimation === 'function') {
        startProgressBarAnimation(notificationId, duration);
    }
}

/**
 * Pausa il timer di auto-close
 * @param {Map} timers
 * @param {string} notificationId
 * @param {Function} pauseProgressBarAnimation
 */
export function pauseAutoCloseTimer(timers, notificationId, pauseProgressBarAnimation) {
    const timer = timers.get(notificationId);
    if (!timer || timer.isPaused) return;
    clearTimeout(timer.timeoutId);
    timer.remainingTime = timer.originalDuration - (Date.now() - timer.startTime);
    timer.isPaused = true;
    timer.pauseStartTime = Date.now();
    if (typeof pauseProgressBarAnimation === 'function') {
        pauseProgressBarAnimation(notificationId);
    }
}

/**
 * Riprende il timer di auto-close
 * @param {Map} timers
 * @param {string} notificationId
 * @param {Function} resumeProgressBarAnimation
 * @param {Function} removeNotification
 */
export function resumeAutoCloseTimer(timers, notificationId, resumeProgressBarAnimation, removeNotification) {
    const timer = timers.get(notificationId);
    if (!timer || !timer.isPaused) return;
    timer.startTime = Date.now();
    timer.timeoutId = setTimeout(() => {
        removeNotification(notificationId);
        timers.delete(notificationId);
    }, timer.remainingTime);
    timer.isPaused = false;
    timer.pauseStartTime = null;
    if (typeof resumeProgressBarAnimation === 'function') {
        resumeProgressBarAnimation(notificationId, timer.remainingTime);
    }
}

/**
 * Ferma completamente il timer di auto-close
 * @param {Map} timers
 * @param {string} notificationId
 * @param {Function} stopProgressBarAnimation
 */
export function stopAutoCloseTimer(timers, notificationId, stopProgressBarAnimation) {
    const timer = timers.get(notificationId);
    if (timer) {
        clearTimeout(timer.timeoutId);
        timers.delete(notificationId);
    }
    if (typeof stopProgressBarAnimation === 'function') {
        stopProgressBarAnimation(notificationId);
    }
}
