import { isDevelopment, isTest, isProduction } from '../../../app/config/environment.js';

// Classe LoggerService (solo per uso interno)
class LoggerService {
    /**
     * Sanitize arguments to avoid leaking sensitive data in production
     * - Keeps primitives as-is
     * - For Error objects: keeps only name and message
     * - For plain objects: redacts known sensitive fields
     */
    sanitizeArgs(args) {
        if (!isProduction) return args;

        const sensitiveKeys = new Set([
            'password', 'token', 'auth', 'secret',
            // PII fields potentially present in patient payloads
            'nome', 'cognome', 'codice_fiscale', 'codice_rad', 'telefono', 'email',
            'indirizzo', 'indirizzo_residenza', 'citta', 'cap', 'note', 'descrizione'
        ]);

        const sanitizeValue = (val) => {
            if (val == null) return val;
            if (typeof val === 'string') {
                // Truncate very long strings to avoid accidental dumps
                return val.length > 200 ? val.slice(0, 200) + '…' : val;
            }
            if (val instanceof Error) {
                return { name: val.name, message: val.message };
            }
            if (Array.isArray(val)) {
                return val.map(sanitizeValue);
            }
            if (typeof val === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(val)) {
                    out[k] = sensitiveKeys.has(k) ? '[REDACTED]' : sanitizeValue(v);
                }
                return out;
            }
            return val;
        };

        return args.map(sanitizeValue);
    }
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
        // Always log errors, but sanitize payload in production
        const safeArgs = this.sanitizeArgs(args);
        console.error(...safeArgs);
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
     * Log di debug - solo in sviluppo e test
     */
    debug(...args) {
        if (isDevelopment || isTest) {
            console.debug(...args);
        }
    }

    /**
     * Gruppo di log - solo in sviluppo e test
     */
    group(label) {
        if (isDevelopment || isTest) {
            console.group(label);
        }
    }

    /**
     * Fine gruppo di log - solo in sviluppo e test
     */
    groupEnd() {
        if (isDevelopment || isTest) {
            console.groupEnd();
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