// Utilità per la gestione dei timer delle notifiche

export function startAutoCloseTimer(timers, notificationId, duration, callback) {
    // Pulisci timer esistente se presente
    if (timers.has(notificationId)) {
        const existingTimer = timers.get(notificationId);
        clearTimeout(existingTimer.timerId);
    }
    
    const startTime = Date.now();
    const timerId = setTimeout(() => {
        timers.delete(notificationId);
        callback(notificationId);
    }, duration);
    
    // Store timer object with metadata
    const timerObject = {
        timerId,
        originalDuration: duration,
        startTime,
        remainingTime: duration,
        isPaused: false,
        pausedAt: null,
        callback // Store callback for resume
    };
    
    timers.set(notificationId, timerObject);
}

export function pauseAutoCloseTimer(timers, notificationId) {
    const timer = timers.get(notificationId);
    if (timer && !timer.isPaused) {
        clearTimeout(timer.timerId);
        timer.isPaused = true;
        timer.pausedAt = Date.now();
        timer.remainingTime = timer.remainingTime - (timer.pausedAt - timer.startTime);
        console.log(`⏸️ Timer paused for notification: ${notificationId}`);
    }
}

export function resumeAutoCloseTimer(timers, notificationId) {
    const timer = timers.get(notificationId);
    if (timer && timer.isPaused) {
        timer.isPaused = false;
        timer.startTime = Date.now();
        
        timer.timerId = setTimeout(() => {
            timers.delete(notificationId);
            if (timer.callback) {
                timer.callback(notificationId);
            }
        }, timer.remainingTime);
        
        console.log(`▶️ Timer resumed for notification: ${notificationId}`);
    }
}

export function stopAutoCloseTimer(timers, notificationId, onStop) {
    const timer = timers.get(notificationId);
    if (timer) {
        clearTimeout(timer.timerId);
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