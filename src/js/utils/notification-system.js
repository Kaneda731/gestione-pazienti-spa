/**
 * Sistema di notifiche per gestione clock skew e altri avvisi
 * Integrato con il design esistente dell'applicazione
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    /**
     * Inizializza il sistema di notifiche
     */
    init() {
        // Crea il container per le notifiche se non esiste
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }

        // Aggiungi CSS per le notifiche se non esiste
        if (!document.getElementById('notification-styles')) {
            this.addNotificationStyles();
        }

        // Esponi la funzione globalmente per compatibilità
        window.showNotification = this.show.bind(this);
    }

    /**
     * Aggiunge gli stili CSS per le notifiche
     */
    addNotificationStyles() {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                box-shadow: var(--shadow-lg, 0 4px 6px rgba(0, 0, 0, 0.1));
                margin-bottom: 10px;
                padding: 16px;
                pointer-events: auto;
                transform: translateX(100%);
                transition: all 0.3s ease;
                opacity: 0;
                max-width: 100%;
                word-wrap: break-word;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .notification-title {
                font-weight: 600;
                margin: 0;
                font-size: 0.95rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: var(--text-muted, #666);
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .notification-close:hover {
                background-color: var(--bg-secondary, #f5f5f5);
            }

            .notification-message {
                color: var(--text-color, #333);
                font-size: 0.9rem;
                line-height: 1.4;
                margin: 0;
                white-space: pre-wrap;
            }

            .notification-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .notification-action {
                padding: 6px 12px;
                border-radius: 4px;
                border: 1px solid var(--border-color, #e0e0e0);
                background: var(--bg-secondary, #f8f9fa);
                color: var(--text-color, #333);
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .notification-action:hover {
                background: var(--primary-color, #007bff);
                color: white;
                border-color: var(--primary-color, #007bff);
            }

            .notification-action.primary {
                background: var(--primary-color, #007bff);
                color: white;
                border-color: var(--primary-color, #007bff);
            }

            .notification-action.primary:hover {
                background: var(--primary-hover, #0056b3);
                border-color: var(--primary-hover, #0056b3);
            }

            /* Varianti per tipo */
            .notification.success {
                border-left: 4px solid #28a745;
            }

            .notification.warning {
                border-left: 4px solid #ffc107;
                background: #fffbf0;
            }

            .notification.error {
                border-left: 4px solid #dc3545;
                background: #fff5f5;
            }

            .notification.info {
                border-left: 4px solid #17a2b8;
                background: #f0f9ff;
            }

            /* Icone per tipo */
            .notification-icon.success::before {
                content: "✓";
                color: #28a745;
            }

            .notification-icon.warning::before {
                content: "⚠";
                color: #ffc107;
            }

            .notification-icon.error::before {
                content: "✕";
                color: #dc3545;
            }

            .notification-icon.info::before {
                content: "ℹ";
                color: #17a2b8;
            }

            /* Responsiveness */
            @media (max-width: 480px) {
                .notification-container {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    max-width: none;
                }

                .notification {
                    margin-bottom: 8px;
                    padding: 12px;
                }

                .notification-actions {
                    flex-direction: column;
                }

                .notification-action {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Mostra una notifica
     * @param {Object} options - Opzioni della notifica
     * @returns {Promise} - Promise che si risolve con l'azione scelta
     */
    show(options = {}) {
        const {
            title = 'Notifica',
            message = '',
            type = 'info', // success, warning, error, info
            duration = 5000,
            actions = [],
            persistent = false
        } = options;

        return new Promise((resolve) => {
            const notification = this.createNotification({
                title,
                message,
                type,
                actions,
                onAction: resolve,
                onClose: () => resolve('dismissed')
            });

            this.notifications.push(notification);
            this.container.appendChild(notification.element);

            // Anima l'ingresso
            setTimeout(() => {
                notification.element.classList.add('show');
            }, 10);

            // Auto-dismiss se non persistente
            if (!persistent && duration > 0) {
                notification.timeoutId = setTimeout(() => {
                    this.dismiss(notification);
                    resolve('timeout');
                }, duration);
            }
        });
    }

    /**
     * Crea l'elemento notifica
     * @param {Object} options - Opzioni della notifica
     * @returns {Object} - Oggetto notifica con elemento e metodi
     */
    createNotification({ title, message, type, actions, onAction, onClose }) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;

        const icon = type ? `<span class="notification-icon ${type}"></span>` : '';
        
        const actionsHTML = actions.length > 0 ? `
            <div class="notification-actions">
                ${actions.map((action, index) => `
                    <button class="notification-action ${action.primary ? 'primary' : ''}" data-action="${action.value || action.text}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        element.innerHTML = `
            <div class="notification-header">
                <h6 class="notification-title">
                    ${icon}
                    ${title}
                </h6>
                <button class="notification-close" aria-label="Chiudi notifica">×</button>
            </div>
            <p class="notification-message">${message}</p>
            ${actionsHTML}
        `;

        const notification = {
            element,
            id: Date.now() + Math.random(),
            timeoutId: null
        };

        // Event listeners
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.dismiss(notification);
            onClose();
        });

        // Action buttons
        const actionButtons = element.querySelectorAll('.notification-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const actionValue = button.dataset.action;
                this.dismiss(notification);
                onAction(actionValue);
            });
        });

        return notification;
    }

    /**
     * Dismisses una notifica
     * @param {Object} notification - La notifica da rimuovere
     */
    dismiss(notification) {
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }

        notification.element.classList.add('hide');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Rimuove tutte le notifiche
     */
    dismissAll() {
        this.notifications.forEach(notification => {
            this.dismiss(notification);
        });
    }

    /**
     * Mostra notifica specifica per clock skew
     * @param {Object} skewInfo - Info sul clock skew
     * @returns {Promise} - Promise che si risolve con l'azione scelta
     */
    showClockSkewNotification(skewInfo) {
        const skewSeconds = Math.abs(skewInfo.skew) / 1000;
        const isAhead = skewInfo.skew > 0;
        
        const message = `Rilevata differenza di orario di ${skewSeconds.toFixed(1)} secondi.
${isAhead ? 'Il server è avanti rispetto al tuo dispositivo.' : 'Il tuo dispositivo è avanti rispetto al server.'}

Questo può causare problemi di autenticazione. Controlla l'orario del sistema.`;

        return this.show({
            title: '⏰ Problema di Sincronizzazione Orario',
            message: message,
            type: 'warning',
            persistent: true,
            actions: [
                { text: 'Riprova', value: 'retry', primary: true },
                { text: 'Ricarica Pagina', value: 'reload' },
                { text: 'Ignora', value: 'ignore' }
            ]
        });
    }

    /**
     * Mostra notifica di successo per login
     */
    showLoginSuccess(email) {
        return this.show({
            title: 'Accesso Effettuato',
            message: `Benvenuto, ${email}!`,
            type: 'success',
            duration: 3000
        });
    }

    /**
     * Mostra notifica di errore di autenticazione
     */
    showAuthError(error, hasClockSkew = false) {
        let message = error;
        if (hasClockSkew) {
            message += '\n\n💡 Suggerimento: Verifica che l\'orario del tuo dispositivo sia corretto.';
        }

        return this.show({
            title: 'Errore di Autenticazione',
            message: message,
            type: 'error',
            duration: 8000
        });
    }
}

// Inizializza il sistema di notifiche
const notificationSystem = new NotificationSystem();

// Esporta per uso nei moduli
export default notificationSystem;
export { NotificationSystem };
