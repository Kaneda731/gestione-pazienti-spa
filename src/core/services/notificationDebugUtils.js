/**
 * NotificationDebugUtils - Utility per debug del sistema notifiche
 * Fornisce strumenti per monitorare e debuggare il sistema notifiche
 */

export class NotificationDebugUtils {
    static getSystemStatus() {
        const notificationService = window.notificationService;
        if (!notificationService) {
            return { error: 'NotificationService not available' };
        }
        
        return {
            initialized: notificationService.initialized,
            isRendering: notificationService.isRendering,
            renderingDisabled: notificationService._renderingDisabled,
            consecutiveErrors: notificationService._consecutiveRenderErrors,
            containerExists: !!notificationService.notificationContainer,
            activeTimers: notificationService.timers.size,
            performance: {
                lastRenderTime: notificationService._lastRenderTime,
                renderCount: notificationService._renderCount,
                averageRenderTime: notificationService._averageRenderTime
            }
        };
    }
    
    static logSystemStatus() {
        const status = this.getSystemStatus();
        console.group('🔍 NotificationService Status');
        console.log('Status:', status);
        console.groupEnd();
        return status;
    }
    
    static enableDebugMode() {
        if (window.notificationService) {
            window.notificationService.constructor.DEBUG = true;
            console.log('✅ Debug mode enabled for NotificationService');
        }
    }
    
    static disableDebugMode() {
        if (window.notificationService) {
            window.notificationService.constructor.DEBUG = false;
            console.log('❌ Debug mode disabled for NotificationService');
        }
    }
    
    static clearAllNotifications() {
        if (window.notificationService) {
            window.notificationService.clear();
            console.log('🧹 All notifications cleared');
        }
    }
    
    static testNotification(type = 'info', message = 'Test notification') {
        if (window.notificationService) {
            window.notificationService[type](message);
            console.log(`📢 Test ${type} notification sent`);
        }
    }
    
    static getErrorStats() {
        const errorHandler = window.NotificationErrorHandler;
        if (!errorHandler) {
            return { error: 'NotificationErrorHandler not available' };
        }
        
        return errorHandler.getErrorStats();
    }
    
    static resetErrorStats() {
        const errorHandler = window.NotificationErrorHandler;
        if (errorHandler) {
            errorHandler.resetErrorCounts();
            console.log('🔄 Error stats reset');
        }
    }
    
    static monitorPerformance(duration = 10000) {
        console.log(`📊 Monitoring performance for ${duration}ms...`);
        
        const startStatus = this.getSystemStatus();
        
        setTimeout(() => {
            const endStatus = this.getSystemStatus();
            
            console.group('📊 Performance Report');
            console.log('Start:', startStatus);
            console.log('End:', endStatus);
            console.log('Renders during monitoring:', endStatus.performance.renderCount - startStatus.performance.renderCount);
            console.log('Errors during monitoring:', endStatus.consecutiveErrors);
            console.groupEnd();
        }, duration);
    }
}

// Esponi globalmente per uso in console
if (typeof window !== 'undefined') {
    window.NotificationDebug = NotificationDebugUtils;
    
    // Comandi rapidi
    window.notificationStatus = () => NotificationDebugUtils.logSystemStatus();
    window.notificationReset = () => window.notificationEmergencyReset?.();
    window.notificationTest = (type, message) => NotificationDebugUtils.testNotification(type, message);
    
    console.log('🔧 Notification debug utils loaded. Available commands:');
    console.log('  - window.notificationStatus() - Show system status');
    console.log('  - window.notificationReset() - Emergency reset');
    console.log('  - window.notificationTest(type, message) - Test notification');
    console.log('  - window.NotificationDebug - Full debug utils');
}

export default NotificationDebugUtils;