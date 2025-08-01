// Debug script per testare il sistema notifiche
// Esegui questo nella console del browser

console.log('🔍 Debug Notification System');

// 1. Controlla se il NotificationService è disponibile
if (typeof window.notificationService !== 'undefined') {
    console.log('✅ NotificationService disponibile');
    
    // 2. Controlla lo stato del servizio
    const service = window.notificationService;
    console.log('📊 Service status:', {
        initialized: service.initialized,
        isRendering: service.isRendering,
        containerExists: !!service.notificationContainer,
        settings: service.settings
    });
    
    // 3. Controlla se il container DOM esiste
    const domContainer = document.getElementById('notification-container');
    console.log('📦 DOM Container:', domContainer ? 'EXISTS' : 'NOT FOUND');
    
    if (domContainer) {
        console.log('📦 Container details:', {
            className: domContainer.className,
            position: domContainer.style.position,
            zIndex: domContainer.style.zIndex,
            children: domContainer.children.length
        });
    }
    
    // 4. Test notifica semplice
    console.log('🧪 Testing simple notification...');
    try {
        service.info('Test notification from debug script');
        console.log('✅ Notification sent successfully');
        
        // Controlla dopo 1 secondo se è apparsa
        setTimeout(() => {
            const container = document.getElementById('notification-container');
            if (container && container.children.length > 0) {
                console.log('✅ Notification appeared in DOM');
                console.log('📋 Notification HTML:', container.innerHTML);
            } else {
                console.log('❌ Notification NOT found in DOM');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
    
} else {
    console.log('❌ NotificationService NON disponibile');
    
    // Controlla se è disponibile in altri modi
    if (typeof window.notificationEmergencyReset === 'function') {
        console.log('🚨 Emergency reset function available');
    }
    
    if (typeof window.NotificationDebug !== 'undefined') {
        console.log('🔧 Debug utils available');
    }
}

// 5. Controlla CSS
const styles = getComputedStyle(document.documentElement);
const notificationZIndex = styles.getPropertyValue('--notification-z-index');
console.log('🎨 CSS Variables:', {
    zIndex: notificationZIndex || 'NOT FOUND',
    hasNotificationStyles: !!document.querySelector('style, link[href*="notification"]')
});

// 6. Controlla errori in console
console.log('📝 Check browser console for any errors related to notifications');

// 7. Funzione helper per creare notifica manuale (esposta globalmente)
if (typeof window !== 'undefined') {
    window.debugCreateNotification = function(type = 'info', message = 'Debug test') {
    console.log(`🧪 Creating manual ${type} notification...`);
    
    // Crea container se non esiste
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        console.log('📦 Created manual container');
    }
    
    // Crea notifica
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
    `;
    
    notification.innerHTML = `
        <div style="font-size: 20px;">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</div>
        <div style="flex: 1;">${message}</div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
    `;
    
    container.appendChild(notification);
    console.log('✅ Manual notification created');
    
    // Auto-remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
};

    };
}

console.log('🔧 Debug functions available:');
console.log('  - window.debugCreateNotification(type, message)');
console.log('  - window.notificationStatus() (if debug utils loaded)');
console.log('  - window.notificationReset() (if available)');