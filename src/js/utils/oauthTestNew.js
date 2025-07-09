// src/js/utils/oauthTest.js
/**
 * Utility per testare l'OAuth in ambiente Vite
 */

import { oauthManager } from '../core/auth/oauthService.js';
import { viteSupabaseMiddleware } from '../core/services/viteSupabaseMiddleware.js';

export class OAuthTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    async runDiagnostics() {
        if (this.isRunning) {
            console.log('Test diagnostici già in corso...');
            return;
        }

        this.isRunning = true;
        this.testResults = [];

        console.log('=== AVVIO TEST DIAGNOSTICI OAUTH ===');

        // Test 1: Verificare che Vite sia pronto
        await this.testViteReady();

        // Test 2: Verificare che Supabase sia pronto
        await this.testSupabaseReady();

        // Test 3: Verificare lo stato dell'OAuth manager
        await this.testOAuthManagerState();

        // Test 4: Verificare la configurazione dell'ambiente
        await this.testEnvironmentConfig();

        // Test 5: Verificare i permessi di rete
        await this.testNetworkPermissions();

        console.log('=== RISULTATI TEST DIAGNOSTICI ===');
        this.testResults.forEach(result => {
            console.log(`${result.name}: ${result.passed ? '✅ PASSATO' : '❌ FALLITO'}`);
            if (result.details) {
                console.log(`  Dettagli: ${result.details}`);
            }
        });

        this.isRunning = false;
        return this.testResults;
    }

    async testViteReady() {
        const result = {
            name: 'Vite Ready',
            passed: false,
            details: null
        };

        try {
            const isReady = viteSupabaseMiddleware.isViteReady;
            result.passed = isReady;
            result.details = isReady ? 'Vite è pronto' : 'Vite non è ancora pronto';
        } catch (error) {
            result.details = `Errore: ${error.message}`;
        }

        this.testResults.push(result);
    }

    async testSupabaseReady() {
        const result = {
            name: 'Supabase Ready',
            passed: false,
            details: null
        };

        try {
            const isReady = viteSupabaseMiddleware.isSupabaseReady;
            result.passed = isReady;
            result.details = isReady ? 'Supabase è pronto' : 'Supabase non è ancora pronto';
        } catch (error) {
            result.details = `Errore: ${error.message}`;
        }

        this.testResults.push(result);
    }

    async testOAuthManagerState() {
        const result = {
            name: 'OAuth Manager State',
            passed: false,
            details: null
        };

        try {
            const state = oauthManager.getAuthState();
            result.passed = state.isInitialized && state.state !== 'error';
            result.details = `Stato: ${state.state}, Inizializzato: ${state.isInitialized}`;
            
            if (state.error) {
                result.details += `, Errore: ${state.error}`;
            }
        } catch (error) {
            result.details = `Errore: ${error.message}`;
        }

        this.testResults.push(result);
    }

    async testEnvironmentConfig() {
        const result = {
            name: 'Environment Config',
            passed: false,
            details: null
        };

        try {
            const config = {
                viteMode: import.meta.env.MODE,
                isDev: import.meta.env.DEV,
                redirectUrl: import.meta.env.VITE_REDIRECT_URL,
                oauthDebug: import.meta.env.VITE_OAUTH_DEBUG,
                currentUrl: window.location.origin
            };

            result.passed = config.redirectUrl && config.redirectUrl === config.currentUrl;
            result.details = JSON.stringify(config, null, 2);
        } catch (error) {
            result.details = `Errore: ${error.message}`;
        }

        this.testResults.push(result);
    }

    async testNetworkPermissions() {
        const result = {
            name: 'Network Permissions',
            passed: false,
            details: null
        };

        try {
            // Testa la connessione alla Supabase
            const response = await fetch('https://aiguzywadjzyrwandgba.supabase.co/rest/v1/', {
                method: 'GET',
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'key-not-found'
                }
            });

            result.passed = response.status === 200 || response.status === 401; // 401 è OK per il test
            result.details = `Status: ${response.status}, StatusText: ${response.statusText}`;
        } catch (error) {
            result.details = `Errore di rete: ${error.message}`;
        }

        this.testResults.push(result);
    }

    async testOAuthFlow() {
        console.log('=== TEST OAUTH FLOW ===');
        
        try {
            console.log('Iniziando test OAuth flow...');
            const result = await oauthManager.signInWithGoogle();
            
            if (result.success) {
                console.log('✅ OAuth flow avviato con successo!');
                return true;
            } else {
                console.log('❌ OAuth flow fallito:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Errore nel test OAuth flow:', error);
            return false;
        }
    }
}

// Funzione di utilità per eseguire i test dalla console
window.testOAuth = async function() {
    const tester = new OAuthTester();
    await tester.runDiagnostics();
    return tester;
};

// Funzione per testare il flusso OAuth
window.testOAuthFlow = async function() {
    const tester = new OAuthTester();
    return await tester.testOAuthFlow();
};

console.log('OAuth tester caricato. Usa window.testOAuth() per avviare i test diagnostici.');
console.log('Usa window.testOAuthFlow() per testare il flusso OAuth.');
