// src/js/services/notificationService.js

/**
 * Servizio per la gestione delle notifiche UI
 * Si integra con stateService per gestire notifiche in modo centralizzato
 */

import { stateService } from './stateService.js';
import { sanitizeHtml } from '../../shared/utils/sanitizeHtml.js';

class NotificationService {
    constructor() {
        this.container = null;
        this.init();
    }

    /**
     * Inizializza il servizio e crea il container per le notifiche
     */
    init() {
        // Crea container per le notifiche se non esiste
        this.createNotificationContainer();
        
        // Sottoscrive ai cambiamenti nelle notifiche
        stateService.subscribe('notifications', () => {
            this.renderNotifications();
        });
    }

    /**
     * Crea il container per le notifiche nel DOM
     */
    createNotificationContainer() {
        if (document.getElementById('notification-container')) {
            this.container = document.getElementById('notification-container');
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        this.container.innerHTML = `
            <style>
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                }
                
                .notification {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    margin-bottom: 10px;
                    padding: 16px;
                    border-left: 4px solid;
                    animation: slideIn 0.3s ease-out;
                    position: relative;
                    cursor: pointer;
                }
                
                .notification.success { border-left-color: #28a745; }
                .notification.error { border-left-color: #dc3545; }
                .notification.warning { border-left-color: #ffc107; }
                .notification.info { border-left-color: #17a2b8; }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .notification-icon {
                    font-size: 20px;
                }
                
                .notification-message {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
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
                
                .notification.fade-out {
                    animation: fadeOut 0.3s ease-out forwards;
                }
                
                @keyframes fadeOut {
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            </style>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * Renderizza tutte le notifiche attive
     */
    renderNotifications() {
        const notifications = stateService.getState('notifications');
        
        // Trova notifiche container
        const notificationsContainer = this.container.querySelector('.notifications') || 
            (() => {
                const div = document.createElement('div');
                div.className = 'notifications';
                this.container.appendChild(div);
                return div;
            })();

        // Pulisci container
        notificationsContainer.innerHTML = '';

        // Renderizza notifiche
        notifications.forEach(notification => {
            const element = this.createNotificationElement(notification);
            notificationsContainer.appendChild(element);
        });
    }

    /**
     * Crea elemento DOM per una notifica
     */
    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification ${notification.type}`;
        div.dataset.id = notification.id;

        const iconMap = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        div.innerHTML = sanitizeHtml(`
            <div class="notification-content">
                <span class="material-icons notification-icon">${iconMap[notification.type] || 'info'}</span>
                <div class="notification-message">${notification.message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `);

        // Event listeners
        div.addEventListener('click', () => {
            this.removeNotification(notification.id);
        });

        const closeBtn = div.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification.id);
        });

        return div;
    }

    /**
     * Aggiunge una notifica
     */
    show(type, message, duration = 5000) {
        return stateService.addNotification(type, message, duration);
    }

    /**
     * Rimuove una notifica con animazione
     */
    removeNotification(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('fade-out');
            setTimeout(() => {
                stateService.removeNotification(id);
            }, 300);
        } else {
            stateService.removeNotification(id);
        }
    }

    // Metodi di convenienza
    success(message, duration) {
        return this.show('success', message, duration);
    }

    error(message, duration) {
        return this.show('error', message, duration);
    }

    warning(message, duration) {
        return this.show('warning', message, duration);
    }

    info(message, duration) {
        return this.show('info', message, duration);
    }
}

// Esporta istanza singleton
export const notificationService = new NotificationService();
