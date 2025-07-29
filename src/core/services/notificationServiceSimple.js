/**
 * NotificationServiceSimple - Versione semplificata per debug
 * Bypassa lazy loading e usa rendering diretto
 */

export class NotificationServiceSimple {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }
    
    init() {
        this.createContainer();
        
        // Esponi globalmente per debug
        window.simpleNotificationService = this;
        console.log('🔧 Simple notification service initialized');
    }
    
    createContainer() {
        // Rimuovi container esistente
        const existing = document.getElementById('simple-notification-container');
        if (existing) {
            existing.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'simple-notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.container);
        console.log('📦 Simple container created');
    }
    
    show(type, message) {
        console.log(`📢 Showing ${type} notification:`, message);
        
        const notification = document.createElement('div');
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
            pointer-events: auto;
            border-left: 4px solid ${this.getColor(type)};
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 20px; color: ${this.getColor(type)};">
                ${this.getIcon(type)}
            </div>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">
                ${this.escapeHtml(message)}
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.6;">
                ×
            </button>
        `;
        
        this.container.appendChild(notification);
        
        // Auto-remove dopo 5 secondi
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        return notification;
    }
    
    success(message) {
        return this.show('success', message);
    }
    
    error(message) {
        return this.show('error', message);
    }
    
    warning(message) {
        return this.show('warning', message);
    }
    
    info(message) {
        return this.show('info', message);
    }
    
    getColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clear() {
        this.container.innerHTML = '';
    }
    
    test() {
        console.log('🧪 Running notification tests...');
        
        setTimeout(() => this.success('Test success notification'), 100);
        setTimeout(() => this.info('Test info notification'), 600);
        setTimeout(() => this.warning('Test warning notification'), 1100);
        setTimeout(() => this.error('Test error notification'), 1600);
    }
}

// Aggiungi stili CSS per animazioni
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inizializza automaticamente
const simpleService = new NotificationServiceSimple();

export default NotificationServiceSimple;