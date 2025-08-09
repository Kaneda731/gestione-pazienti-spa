import { isDevelopment, isTest } from '../../app/config/environment.js';

/**
 * Servizio di logging intelligente che rimuove automaticamente i log in produzione
 * 
 * Comportamento:
 * - In sviluppo: tutti i log sono attivi
 * - In test: tutti i log sono attivi
 * - In produzione: solo gli error log sono attivi
 */
class LoggerService {
    /**
     * Log di debug - attivo solo in sviluppo e test
     * @param {...any} args - Argomenti da loggare
     */
    log(...args) {
        if (isDevelopment || isTest) {
            console.log(...args);
        }
    }

    /**
     * Log di warning - solo in sviluppo e test
     * @param {...any} args - Argomenti da loggare
     */
    warn(...args) {
        if (isDevelopment || isTest) {
            console.warn(...args);
        }
    }

    /**
     * Log di errore - sempre attivo anche in produzione
     * @param {...any} args - Argomenti da loggare
     */
    error(...args) {
        console.error(...args);
    }

    /**
     * Log informativo - solo in sviluppo e test
     * @param {...any} args - Argomenti da loggare
     */
    info(...args) {
        if (isDevelopment || isTest) {
            console.info(...args);
        }
    }

    /**
     * Log di debug con prefisso - solo in sviluppo e test
     * @param {string} prefix - Prefisso per identificare il modulo
     * @param {...any} args - Argomenti da loggare
     */
    debug(prefix, ...args) {
        if (isDevelopment || isTest) {
            console.log('[' + String(prefix) + ']', ...args);
        }
    }

    /**
     * Log di gruppo - solo in sviluppo e test
     * @param {string} label - Etichetta del gruppo
     * @param {Function} callback - Funzione che contiene i log del gruppo
     */
    group(label, callback) {
        if (isDevelopment || isTest) {
            console.group(label);
            callback();
            console.groupEnd();
        }
    }

    /**
     * Log di tabella - solo in sviluppo e test
     * @param {any} data - Dati da visualizzare in tabella
     */
    table(data) {
        if (isDevelopment || isTest) {
            console.table(data);
        }
    }

    /**
     * Log di tempo - solo in sviluppo e test
     * @param {string} label - Etichetta del timer
     */
    time(label) {
        if (isDevelopment || isTest) {
            console.time(label);
        }
    }

    /**
     * Fine log di tempo - solo in sviluppo e test
     * @param {string} label - Etichetta del timer
     */
    timeEnd(label) {
        if (isDevelopment || isTest) {
            console.timeEnd(label);
        }
    }
}

// Esporta un'istanza singleton del logger
export const logger = new LoggerService();
// Nota: non esportiamo la classe per evitare warning di unused export; se serve nei test, importare dal file direttamente con path.