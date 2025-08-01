// EMERGENCY STOP SCRIPT
// Copia e incolla questo codice nella console del browser per fermare immediatamente i loop di errori

console.log('🚨 EMERGENCY STOP - Stopping notification error loops...');

// Ferma tutti i timer
if (window.notificationService) {
    try {
        window.notificationService.timers.forEach(timer => clearTimeout(timer));
        window.notificationService.timers.clear();
        window.notificationService.isRendering = false;
        window.notificationService._renderingDisabled = true;
        window.notificationService._consecutiveRenderErrors = 0;
        console.log('✅ NotificationService stopped');
    } catch (e) {
        console.log('⚠️ Error stopping NotificationService:', e);
    }
}

// Ferma StateService subscribers
if (window.stateService) {
    try {
        window.stateService.subscribers.clear();
        console.log('✅ StateService subscribers cleared');
    } catch (e) {
        console.log('⚠️ Error clearing StateService:', e);
    }
}

// Pulisci tutti gli interval
let intervalId = setInterval(() => {}, 1000);
for (let i = 1; i <= intervalId; i++) {
    clearInterval(i);
}
console.log('✅ All intervals cleared');

// Pulisci tutti i timeout
let timeoutId = setTimeout(() => {}, 1000);
for (let i = 1; i <= timeoutId; i++) {
    clearTimeout(i);
}
console.log('✅ All timeouts cleared');

console.log('🎯 EMERGENCY STOP COMPLETED - Reload the page to restart');
console.log('💡 To reload: location.reload()');