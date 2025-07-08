// src/js/utils/oauthDebug.js
/**
 * Utilità per il debug specifico dei problemi OAuth con Supabase in Vite
 */
export class OAuthDebugger {
    constructor() {
        this.logs = [];
        this.isEnabled = import.meta.env.VITE_OAUTH_DEBUG === 'true';
        
        if (this.isEnabled) {
            this.setupDebugLogging();
        }
    }

    setupDebugLogging() {
        // Intercetta le richieste fetch per monitorare le chiamate Supabase
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const options = args[1] || {};
            
            // Log delle richieste verso Supabase
            if (typeof url === 'string' && url.includes('supabase.co')) {
                this.log('FETCH_REQUEST', {
                    url,
                    method: options.method || 'GET',
                    headers: options.headers,
                    timestamp: new Date().toISOString()
                });
            }
            
            try {
                const response = await originalFetch(...args);
                
                // Log delle risposte da Supabase
                if (typeof url === 'string' && url.includes('supabase.co')) {
                    this.log('FETCH_RESPONSE', {
                        url,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        timestamp: new Date().toISOString()
                    });
                    
                    // Se è un errore 401, loggalo specificatamente
                    if (response.status === 401) {
                        this.log('OAUTH_ERROR_401', {
                            url,
                            response: response.clone(),
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                return response;
            } catch (error) {
                if (typeof url === 'string' && url.includes('supabase.co')) {
                    this.log('FETCH_ERROR', {
                        url,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
                throw error;
            }
        };
    }

    log(type, data) {
        if (!this.isEnabled) return;
        
        const logEntry = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.logs.push(logEntry);
        
        // Mantieni solo gli ultimi 100 log
        if (this.logs.length > 100) {
            this.logs.shift();
        }
        
        // Output colorato in console
        const colors = {
            'FETCH_REQUEST': 'color: blue',
            'FETCH_RESPONSE': 'color: green',
            'FETCH_ERROR': 'color: red',
            'OAUTH_ERROR_401': 'color: red; font-weight: bold'
        };
        
        console.log(
            `%c[OAuth Debug] ${type}:`,
            colors[type] || 'color: gray',
            data
        );
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }

    downloadLogs() {
        const logsJson = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oauth-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Metodo per ispezionare lo stato del localStorage/sessionStorage
    inspectStorage() {
        const storageData = {
            localStorage: {},
            sessionStorage: {},
            cookies: document.cookie
        };
        
        // Ispeziona localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('supabase')) {
                storageData.localStorage[key] = localStorage.getItem(key);
            }
        }
        
        // Ispeziona sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes('supabase')) {
                storageData.sessionStorage[key] = sessionStorage.getItem(key);
            }
        }
        
        this.log('STORAGE_INSPECTION', storageData);
        return storageData;
    }
}

// Esporta un'istanza singleton
export const oauthDebugger = new OAuthDebugger();

// Esponi il debugger nell'oggetto window per debug manuale
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    window.oauthDebugger = oauthDebugger;
}
