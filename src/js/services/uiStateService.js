// src/js/services/uiStateService.js

/**
 * Servizio per gestire stati UI standardizzati
 * Fornisce componenti riutilizzabili per loading, empty state, errori
 */

class UIStateService {
    constructor() {
        this.loadingInstances = new Map();
    }

    /**
     * Mostra stato di caricamento in un container
     */
    showLoading(container, message = 'Caricamento...') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;

        const loadingId = this.generateId();
        const loadingElement = this.createLoadingElement(message);
        
        // Salva contenuto originale
        this.loadingInstances.set(loadingId, {
            container,
            originalContent: container.innerHTML
        });

        container.innerHTML = '';
        container.appendChild(loadingElement);
        
        return loadingId;
    }

    /**
     * Nasconde stato di caricamento
     */
    hideLoading(loadingId) {
        const instance = this.loadingInstances.get(loadingId);
        if (instance) {
            instance.container.innerHTML = instance.originalContent;
            this.loadingInstances.delete(loadingId);
        }
    }

    /**
     * Mostra stato vuoto
     */
    showEmpty(container, message = 'Nessun dato disponibile', icon = 'inbox') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;

        const emptyElement = this.createEmptyElement(message, icon);
        container.innerHTML = '';
        container.appendChild(emptyElement);
    }

    /**
     * Mostra stato di errore
     */
    showError(container, message = 'Si è verificato un errore', canRetry = false, retryCallback = null) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;

        const errorElement = this.createErrorElement(message, canRetry, retryCallback);
        container.innerHTML = '';
        container.appendChild(errorElement);
    }

    /**
     * Crea elemento di loading
     */
    createLoadingElement(message) {
        const div = document.createElement('div');
        div.className = 'ui-state loading-state';
        div.innerHTML = `
            <div class="loading-content">
                <div class="spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="loading-message">${message}</div>
            </div>
            <style>
                .ui-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    text-align: center;
                    padding: 2rem;
                }
                
                .loading-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                
                .loading-message {
                    color: #6c757d;
                    font-size: 0.9rem;
                }
                
                .empty-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: #6c757d;
                }
                
                .empty-icon {
                    font-size: 3rem;
                    opacity: 0.5;
                }
                
                .empty-message {
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                
                .error-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: #dc3545;
                }
                
                .error-icon {
                    font-size: 3rem;
                    opacity: 0.7;
                }
                
                .error-message {
                    font-size: 1.1rem;
                    font-weight: 500;
                    text-align: center;
                }
                
                .retry-button {
                    margin-top: 0.5rem;
                }
            </style>
        `;
        return div;
    }

    /**
     * Crea elemento empty state
     */
    createEmptyElement(message, icon) {
        const div = document.createElement('div');
        div.className = 'ui-state empty-state';
        div.innerHTML = `
            <div class="empty-content">
                <span class="material-icons empty-icon">${icon}</span>
                <div class="empty-message">${message}</div>
            </div>
        `;
        return div;
    }

    /**
     * Crea elemento error state
     */
    createErrorElement(message, canRetry, retryCallback) {
        const div = document.createElement('div');
        div.className = 'ui-state error-state';
        
        const retryButton = canRetry && retryCallback ? `
            <button class="btn btn-outline-danger btn-sm retry-button">
                <span class="material-icons me-1">refresh</span>
                Riprova
            </button>
        ` : '';

        div.innerHTML = `
            <div class="error-content">
                <span class="material-icons error-icon">error_outline</span>
                <div class="error-message">${message}</div>
                ${retryButton}
            </div>
        `;

        // Aggiungi event listener per retry se necessario
        if (canRetry && retryCallback) {
            const retryBtn = div.querySelector('.retry-button');
            retryBtn.addEventListener('click', retryCallback);
        }

        return div;
    }

    /**
     * Utility per mostrare overlay di loading su tutta la pagina
     */
    showPageLoading(message = 'Caricamento...') {
        const overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const content = this.createLoadingElement(message);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        return () => {
            const existingOverlay = document.getElementById('page-loading-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
        };
    }

    /**
     * Nasconde overlay di loading della pagina
     */
    hidePageLoading() {
        const overlay = document.getElementById('page-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Genera ID univoco per le istanze
     */
    generateId() {
        return 'loading_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Wrapper per operazioni async con loading automatico
     */
    async withLoading(container, asyncOperation, loadingMessage = 'Caricamento...') {
        const loadingId = this.showLoading(container, loadingMessage);
        
        try {
            const result = await asyncOperation();
            this.hideLoading(loadingId);
            return result;
        } catch (error) {
            this.hideLoading(loadingId);
            this.showError(container, `Errore: ${error.message}`, true, () => {
                this.withLoading(container, asyncOperation, loadingMessage);
            });
            throw error;
        }
    }

    /**
     * Gestisce rendering condizionale basato sui dati
     */
    renderConditional(container, data, renderFunction, emptyMessage = 'Nessun dato disponibile') {
        if (!data || (Array.isArray(data) && data.length === 0)) {
            this.showEmpty(container, emptyMessage);
            return;
        }

        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (container) {
            container.innerHTML = '';
            renderFunction(container, data);
        }
    }
}

// Esporta istanza singleton
export const uiStateService = new UIStateService();
