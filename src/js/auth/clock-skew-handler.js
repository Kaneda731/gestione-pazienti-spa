/**
 * Gestione robusta degli errori di clock skew di Supabase
 * 
 * Errore tipico: "Session as retrieved from URL was issued in the future? Check the device clock for skew"
 * Questo si verifica quando c'è una differenza di tempo tra client e server
 */

class ClockSkewHandler {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 secondo
        this.maxAcceptableSkew = 5000; // 5 secondi di differenza accettabile
        this.currentRetry = 0;
    }

    /**
     * Rileva se un errore è relativo al clock skew
     * @param {Error} error - L'errore da analizzare
     * @returns {boolean} - True se è un errore di clock skew
     */
    isClockSkewError(error) {
        if (!error) return false;
        
        const errorMessage = error.message?.toLowerCase() || '';
        const clockSkewIndicators = [
            'issued in the future',
            'clock skew',
            'time difference',
            'timestamp',
            'invalid time'
        ];
        
        return clockSkewIndicators.some(indicator => 
            errorMessage.includes(indicator)
        );
    }

    /**
     * Estrae i timestamp dall'errore per analizzare la differenza
     * @param {Error} error - L'errore contenente i timestamp
     * @returns {Object} - Oggetto con i timestamp estratti
     */
    extractTimestamps(error) {
        const errorMessage = error.message || '';
        
        // Regex per estrarre timestamp Unix (numeri di 10+ cifre)
        const timestampRegex = /(\d{10,})/g;
        const matches = errorMessage.match(timestampRegex);
        
        if (!matches || matches.length < 2) {
            return null;
        }

        // Converti in numeri e ordina
        const timestamps = matches.map(t => parseInt(t)).sort();
        
        return {
            serverTime: timestamps[1] || timestamps[0], // Il più grande (futuro)
            clientTime: timestamps[0], // Il più piccolo (presente)
            skewMs: (timestamps[1] - timestamps[0]) * 1000, // Differenza in millisecondi
            timestamps: timestamps
        };
    }

    /**
     * Calcola la differenza di tempo attuale tra client e un timestamp di riferimento
     * @returns {Object} - Info sulla differenza di tempo
     */
    calculateCurrentSkew() {
        const now = Math.floor(Date.now() / 1000);
        const serverEstimate = now; // Assumiamo che il server sia sincronizzato
        
        return {
            clientTime: now,
            serverTime: serverEstimate,
            skewMs: 0, // Non possiamo calcolare senza una chiamata al server
            localTime: new Date().toISOString()
        };
    }

    /**
     * Gestisce l'errore di clock skew con retry automatico
     * @param {Error} error - L'errore di clock skew
     * @param {Function} retryFunction - Funzione da riprovare
     * @param {Object} options - Opzioni di gestione
     * @returns {Promise} - Risultato del retry o gestione errore
     */
    async handleClockSkewError(error, retryFunction, options = {}) {
        const {
            showUserNotification = true,
            logError = true,
            autoRetry = true
        } = options;

        if (logError) {
            this.logClockSkewError(error);
        }

        const timestamps = this.extractTimestamps(error);
        
        // Se la differenza è piccola, prova automaticamente
        if (autoRetry && timestamps && Math.abs(timestamps.skewMs) < this.maxAcceptableSkew) {
            return this.attemptAutoRetry(retryFunction, error);
        }

        // Per differenze significative, avvisa l'utente
        if (showUserNotification && timestamps) {
            return this.showUserClockSkewNotification(timestamps, retryFunction);
        }

        // Fallback: rilancia l'errore originale
        throw error;
    }

    /**
     * Tenta un retry automatico per piccole differenze di clock
     * @param {Function} retryFunction - Funzione da riprovare
     * @param {Error} originalError - L'errore originale
     * @returns {Promise} - Risultato del retry
     */
    async attemptAutoRetry(retryFunction, originalError) {
        if (this.currentRetry >= this.maxRetries) {
            console.warn('ClockSkewHandler: Max retries raggiunti, lancio errore originale');
            throw originalError;
        }

        this.currentRetry++;
        console.log(`ClockSkewHandler: Tentativo di retry automatico ${this.currentRetry}/${this.maxRetries}`);

        try {
            // Aspetta un po' prima del retry
            await this.delay(this.retryDelay * this.currentRetry);
            
            // Resetta il counter se ha successo
            const result = await retryFunction();
            this.currentRetry = 0;
            return result;
        } catch (error) {
            // Se è ancora un errore di clock skew, riprova
            if (this.isClockSkewError(error)) {
                return this.attemptAutoRetry(retryFunction, originalError);
            }
            
            // Se è un errore diverso, lancialo
            throw error;
        }
    }

    /**
     * Mostra una notifica all'utente riguardo il problema di clock skew
     * @param {Object} timestamps - Info sui timestamp
     * @param {Function} retryFunction - Funzione per riprovare
     * @returns {Promise} - Risultato dell'azione utente
     */
    async showUserClockSkewNotification(timestamps, retryFunction) {
        const skewSeconds = Math.abs(timestamps.skewMs) / 1000;
        
        // Se disponibile, usa il sistema di notifiche dell'app
        if (window.showNotification) {
            const result = await window.showNotification({
                title: '⏰ Problema di Sincronizzazione Orario',
                message: `Rilevata differenza di orario di ${skewSeconds.toFixed(1)} secondi.
${timestamps.skewMs > 0 ? 'Il server è avanti rispetto al tuo dispositivo.' : 'Il tuo dispositivo è avanti rispetto al server.'}

Questo può causare problemi di autenticazione. Controlla l'orario del sistema.`,
                type: 'warning',
                persistent: true,
                actions: [
                    { text: 'Riprova', value: 'retry', primary: true },
                    { text: 'Ricarica Pagina', value: 'reload' },
                    { text: 'Ignora', value: 'ignore' }
                ]
            });

            return this.handleUserAction(result, retryFunction);
        }

        // Fallback con confirm del browser
        const message = `Rilevato problema di sincronizzazione orario:

Differenza: ${skewSeconds.toFixed(1)} secondi
${timestamps.skewMs > 0 ? 'Il server è avanti' : 'Il client è avanti'}

Questo può causare problemi di autenticazione.

Soluzioni:
1. Verificare l'orario del dispositivo
2. Sincronizzare l'orologio di sistema
3. Riprovare l'operazione

Vuoi riprovare l'operazione?`;

        const userChoice = confirm(message);

        if (userChoice) {
            return retryFunction();
        } else {
            throw new Error('Operazione annullata dall\'utente a causa di clock skew');
        }
    }

    /**
     * Gestisce l'azione scelta dall'utente
     * @param {string} action - L'azione scelta
     * @param {Function} retryFunction - Funzione per riprovare
     * @returns {Promise} - Risultato dell'azione
     */
    async handleUserAction(action, retryFunction) {
        switch (action) {
            case 'retry':
                this.currentRetry = 0; // Reset counter per retry manuale
                return retryFunction();
                
            case 'reload':
                window.location.reload();
                return;
                
            case 'ignore':
            default:
                throw new Error('Operazione annullata dall\'utente a causa di clock skew');
        }
    }

    /**
     * Logga dettagli dell'errore di clock skew per debugging
     * @param {Error} error - L'errore da loggare
     */
    logClockSkewError(error) {
        const timestamps = this.extractTimestamps(error);
        const currentTime = this.calculateCurrentSkew();
        
        const logData = {
            error: error.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamps: timestamps,
            currentTime: currentTime,
            url: window.location.href
        };

        console.group('🕐 Clock Skew Error Details');
        console.error('Errore originale:', error);
        console.table(logData);
        console.groupEnd();

        // Se disponibile, invia al sistema di logging
        if (window.logError) {
            window.logError('clock_skew', logData);
        }
    }

    /**
     * Utility per delay
     * @param {number} ms - Millisecondi di attesa
     * @returns {Promise} - Promise che si risolve dopo il delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verifica periodicamente il clock skew (opzionale)
     * @param {Function} callback - Callback da chiamare se rilevato skew
     * @returns {number} - ID del timer per cancellazione
     */
    startClockSkewMonitoring(callback) {
        return setInterval(async () => {
            try {
                // Effettua una chiamata di test a Supabase per verificare il timing
                const start = Date.now();
                
                // Questa chiamata dovrebbe essere sostituita con una vera chiamata Supabase
                const response = await fetch('/api/time-check', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                const end = Date.now();
                const latency = end - start;
                
                // Analizza headers per clock skew
                const serverTime = new Date(response.headers.get('Date')).getTime();
                const clientTime = end;
                const skew = Math.abs(serverTime - clientTime) - latency;
                
                if (skew > this.maxAcceptableSkew) {
                    callback({
                        skew,
                        serverTime,
                        clientTime,
                        latency
                    });
                }
            } catch (error) {
                // Ignora errori di rete nella verifica periodica
                console.debug('Clock skew monitoring error:', error);
            }
        }, 30000); // Controlla ogni 30 secondi
    }

    /**
     * Reset del gestore per nuove operazioni
     */
    reset() {
        this.currentRetry = 0;
    }
}

// Istanza singleton
const clockSkewHandler = new ClockSkewHandler();

// Funzioni di utilità esportate
export const handleClockSkewError = (error, retryFunction, options) => 
    clockSkewHandler.handleClockSkewError(error, retryFunction, options);

export const isClockSkewError = (error) => 
    clockSkewHandler.isClockSkewError(error);

export const startClockSkewMonitoring = (callback) => 
    clockSkewHandler.startClockSkewMonitoring(callback);

export { ClockSkewHandler };
export default clockSkewHandler;
