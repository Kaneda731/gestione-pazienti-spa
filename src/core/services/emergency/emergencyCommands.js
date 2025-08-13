/**
 * Emergency Commands - Comandi di emergenza per debug
 * Questi comandi sono disponibili globalmente per fermare loop infiniti
 */

// Esponi comandi di emergenza immediatamente
if (typeof window !== 'undefined') {
    
    // Comando principale di stop
    window.EMERGENCY_STOP = function() {
        console.log('🚨 EMERGENCY STOP ACTIVATED');
        
        try {
            // Ferma NotificationService
            if (window.notificationService) {
                window.notificationService.timers?.forEach(timer => clearTimeout(timer));
                window.notificationService.timers?.clear();
                if (window.notificationService.emergencyReset) {
                    window.notificationService.emergencyReset();
                }
            }
            
            // Ferma StateService
            if (window.stateService) {
                window.stateService.subscribers?.clear();
            }
            
            console.log('✅ Emergency stop completed');
            console.log('💡 Reload page with: location.reload()');
            
        } catch (error) {
            console.error('❌ Emergency stop failed:', error);
            console.log('💡 Manual reload required: location.reload()');
        }
    };
    
    // Comando di reload rapido
    window.EMERGENCY_RELOAD = function() {
        console.log('🔄 Emergency reload...');
        location.reload();
    };
    
    // Mostra messaggio di aiuto molto visibile
    console.log('%c🚨 EMERGENCY COMMANDS LOADED 🚨', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cIf you see error loops:', 'color: orange; font-size: 16px;');
    console.log('%c1. Run: EMERGENCY_STOP()', 'color: yellow; font-size: 14px;');
    console.log('%c2. Or run: EMERGENCY_RELOAD()', 'color: yellow; font-size: 14px;');
    console.log('%c3. Or run: location.reload()', 'color: yellow; font-size: 14px;');
}

// Nessun export: il file è importato per side-effects dall'app