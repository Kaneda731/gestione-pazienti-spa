// src/core/utils/extensionErrorHandler.js

/**
 * Utility per gestire gli errori causati dalle estensioni del browser
 * che tentano di comunicare con la pagina web tramite message listeners
 */

class ExtensionErrorHandler {
    constructor() {
        this.errorPatterns = [
            'message channel closed before a response was received',
            'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received',
            'Extension context invalidated',
            'Could not establish connection',
            'The message port closed before a response was received',
            'Receiving end does not exist',
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://',
            'edge-extension://'
        ];
        
        this.suppressedErrors = new Set();
        this.errorCount = 0;
        this.maxErrorsToLog = 5; // Limita il numero di errori simili da loggare
        
        this.init();
    }
    
    init() {
        // Gestione degli errori globali
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
        
        // Intercetta e gestisce i message listeners delle estensioni
        this.interceptExtensionListeners();
        
        console.log('ExtensionErrorHandler inizializzato');
    }
    
    /**
     * Verifica se un errore è causato da un'estensione del browser
     * @param {string} message - Il messaggio di errore
     * @param {string} source - La fonte dell'errore (opzionale)
     * @returns {boolean}
     */
    isExtensionError(message, source = '') {
        if (!message) return false;
        
        const messageStr = message.toString().toLowerCase();
        const sourceStr = source.toString().toLowerCase();
        
        return this.errorPatterns.some(pattern => 
            messageStr.includes(pattern.toLowerCase()) || 
            sourceStr.includes(pattern.toLowerCase())
        );
    }
    
    /**
     * Gestisce gli errori JavaScript globali
     * @param {ErrorEvent} event 
     */
    handleError(event) {
        const { message, filename, error } = event;
        
        if (this.isExtensionError(message, filename)) {
            this.suppressExtensionError(event, 'JavaScript Error');
            return;
        }
        
        // Se non è un errore di estensione, lascia che venga gestito normalmente
        return true;
    }
    
    /**
     * Gestisce le promise rifiutate non gestite
     * @param {PromiseRejectionEvent} event 
     */
    handleRejection(event) {
        const reason = event.reason;
        let message = '';
        
        if (reason instanceof Error) {
            message = reason.message;
        } else if (typeof reason === 'string') {
            message = reason;
        } else if (reason && reason.toString) {
            message = reason.toString();
        }
        
        if (this.isExtensionError(message)) {
            this.suppressExtensionError(event, 'Promise Rejection');
            return;
        }
        
        // Se non è un errore di estensione, lascia che venga gestito normalmente
        return true;
    }
    
    /**
     * Sopprime un errore di estensione
     * @param {Event} event 
     * @param {string} type 
     */
    suppressExtensionError(event, type) {
        event.preventDefault();
        event.stopPropagation();
        
        const errorKey = `${type}:${event.message || event.reason}`;
        
        // Logga solo i primi errori per evitare spam nella console
        if (!this.suppressedErrors.has(errorKey) && this.errorCount < this.maxErrorsToLog) {
            console.warn(`[ExtensionErrorHandler] Errore di estensione soppresso (${type}):`, {
                message: event.message || event.reason,
                filename: event.filename,
                type: type
            });
            
            this.suppressedErrors.add(errorKey);
            this.errorCount++;
            
            if (this.errorCount === this.maxErrorsToLog) {
                console.warn('[ExtensionErrorHandler] Limite di log degli errori raggiunto. Ulteriori errori di estensione verranno soppressi silenziosamente.');
            }
        }
        
        return false;
    }
    
    /**
     * Intercetta i message listeners delle estensioni per prevenire errori
     */
    interceptExtensionListeners() {
        // Chrome/Edge extensions
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            this.wrapChromeListeners();
        }
        
        // Firefox extensions
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
            this.wrapFirefoxListeners();
        }
        
        // Intercetta anche i window.postMessage per le estensioni che li usano
        this.wrapPostMessage();
    }
    
    /**
     * Wrappa i listener di Chrome/Edge
     */
    wrapChromeListeners() {
        const originalAddListener = chrome.runtime.onMessage.addListener;
        
        chrome.runtime.onMessage.addListener = function(listener) {
            const wrappedListener = function(message, sender, sendResponse) {
                try {
                    const result = listener(message, sender, sendResponse);
                    
                    // Se il listener restituisce true (indica risposta asincrona)
                    // ma non chiama sendResponse, previeni l'errore
                    if (result === true) {
                        // Imposta un timeout per chiamare sendResponse se non è già stato chiamato
                        const timeoutId = setTimeout(() => {
                            try {
                                sendResponse({ _extensionErrorHandlerResponse: true });
                            } catch (e) {
                                // Ignora errori se il channel è già chiuso
                            }
                        }, 100);
                        
                        // Wrappa sendResponse per cancellare il timeout se viene chiamato
                        const originalSendResponse = sendResponse;
                        sendResponse = function(...args) {
                            clearTimeout(timeoutId);
                            try {
                                return originalSendResponse(...args);
                            } catch (e) {
                                // Ignora errori se il channel è già chiuso
                            }
                        };
                    }
                    
                    return result;
                } catch (error) {
                    console.warn('[ExtensionErrorHandler] Errore nel message listener:', error);
                    return false;
                }
            };
            
            return originalAddListener.call(this, wrappedListener);
        };
    }
    
    /**
     * Wrappa i listener di Firefox
     */
    wrapFirefoxListeners() {
        const originalAddListener = browser.runtime.onMessage.addListener;
        
        browser.runtime.onMessage.addListener = function(listener) {
            const wrappedListener = function(message, sender, sendResponse) {
                try {
                    return listener(message, sender, sendResponse);
                } catch (error) {
                    console.warn('[ExtensionErrorHandler] Errore nel message listener Firefox:', error);
                    return Promise.resolve();
                }
            };
            
            return originalAddListener.call(this, wrappedListener);
        };
    }
    
    /**
     * Wrappa window.postMessage per gestire messaggi delle estensioni
     */
    wrapPostMessage() {
        const originalPostMessage = window.postMessage;
        
        window.postMessage = function(message, targetOrigin, transfer) {
            try {
                return originalPostMessage.call(this, message, targetOrigin, transfer);
            } catch (error) {
                if (this.isExtensionError(error.message)) {
                    console.warn('[ExtensionErrorHandler] Errore postMessage di estensione soppresso:', error);
                    return;
                }
                throw error;
            }
        }.bind(this);
    }
    
    /**
     * Ottiene le statistiche degli errori soppressi
     * @returns {Object}
     */
    getStats() {
        return {
            suppressedErrorTypes: this.suppressedErrors.size,
            totalErrorCount: this.errorCount,
            maxErrorsToLog: this.maxErrorsToLog
        };
    }
    
    /**
     * Resetta le statistiche
     */
    resetStats() {
        this.suppressedErrors.clear();
        this.errorCount = 0;
    }
}

// Crea un'istanza globale
const extensionErrorHandler = new ExtensionErrorHandler();

// Esporta per uso in altri moduli
export default extensionErrorHandler;
export { ExtensionErrorHandler };
