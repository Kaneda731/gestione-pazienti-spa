import { isDevelopment, isTest } from '../../app/config/environment.js';

// Esporta sia la classe che l'istanza singleton
export class LoggerService {
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
     */
    info(...args) {
        if (isDevelopment || isTest) {
            console.info(...args);
        }
    }

    /**
     * Log tabellare - solo in sviluppo e test
     */
    table(data) {
        if (isDevelopment || isTest) {
            console.table(data);
        }
    }

    /**
     * Log di tempo - solo in sviluppo e test
     */
    time(label) {
        if (isDevelopment || isTest) {
            console.time(label);
        }
    }

    /**
     * Fine log di tempo - solo in sviluppo e test
     */
    timeEnd(label) {
        if (isDevelopment || isTest) {
            console.timeEnd(label);
        }
    }
}

export const logger = new LoggerService();