// src/js/services/errorService.js

import { logger } from '../logger/loggerService.js';

/**
 * Inizializza la gestione centralizzata degli errori e del logging.
 */
export function initErrorHandling() {
    initGlobalErrorHandler();
    initPromiseRejectionHandler();
    initAppLogger();
}

/**
 * Gestore per errori non catturati (inclusi quelli delle estensioni browser).
 */
function initGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
        const ignoredMessages = [
            'A listener indicated an asynchronous response by returning true',
            'Extension context invalidated',
            'Could not establish connection',
            'chrome-extension://',
            'moz-extension://'
        ];
        
        const shouldIgnore = ignoredMessages.some(msg => 
            event.message && event.message.includes(msg)
        );
        
        if (shouldIgnore) {
            console.debug('Browser extension error ignored:', event.message);
            event.preventDefault();
            return false;
        }
        
        console.error('Application error:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });
}

/**
 * Gestore per promise rejection non catturate.
 */
function initPromiseRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
        const errorMessage = event.reason?.message || event.reason?.toString() || '';
        
        const ignoredMessages = [
            'A listener indicated an asynchronous response by returning true',
            'message channel closed before a response was received',
            'Extension context invalidated',
            'Could not establish connection'
        ];
        
        const shouldIgnore = ignoredMessages.some(msg => 
            errorMessage.includes(msg)
        );
        
        if (shouldIgnore) {
            console.debug('Browser extension promise rejection ignored:', errorMessage);
            event.preventDefault();
            return;
        }
        
        console.error('Unhandled promise rejection:', event.reason);
    });
}

/**
 * Inizializza un sistema di logging migliorato per l'applicazione,
 * assegnandolo a window.appLogger.
 */
function initAppLogger() {
    window.appLogger = {
        info: (message, data = null) => {
            logger.log(`[APP] ${message}`, data || '');
        },
        
        warn: (message, data = null) => {
            logger.warn(`[APP WARNING] ${message}`, data || '');
        },
        
        error: (message, error = null) => {
            console.error('[APP ERROR]', message, error || '');
            // In produzione, inviare l'errore a un servizio di monitoring.
        },
        
        debug: (message, data = null) => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                logger.log(`[APP DEBUG] ${message}`, data || '');
            }
        }
    };

    // Log di inizializzazione del logger stesso
    window.appLogger.info('Error service and logger initialized.', {
        timestamp: new Date().toISOString()
    });
}
