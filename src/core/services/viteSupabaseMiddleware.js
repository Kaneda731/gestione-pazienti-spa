// src/js/services/viteSupabaseMiddleware.js
/**
 * Middleware per gestire l'integrazione Supabase-Vite
 * Risolve problemi di timing e CORS specifici di Vite
 */

import { supabase } from './supabaseClient.js';

export class ViteSupabaseMiddleware {
    constructor() {
        this.isViteReady = false;
        this.isSupabaseReady = false;
        this.readyCallbacks = [];
        
        this.init();
    }

    async init() {
        // Aspetta che Vite sia completamente pronto
        await this.waitForViteReady();
        
        // Verifica che Supabase sia inizializzato correttamente
        await this.waitForSupabaseReady();
        
        // Notifica tutti i callback che siamo pronti
        this.notifyReady();
    }

    async waitForViteReady() {
        return new Promise((resolve) => {
            // Controlla che siamo su localhost
            const currentUrl = window.location.origin;
            if (!currentUrl.includes('localhost:5174')) {
                console.warn('Non siamo su localhost:5174, redirect necessario');
                window.location.href = 'http://localhost:5174';
                return;
            }
            
            if (document.readyState === 'complete' && window.location.href.includes('localhost')) {
                console.log('Vite è pronto');
                this.isViteReady = true;
                resolve();
            } else {
                window.addEventListener('load', () => {
                    // Piccolo delay per assicurarsi che Vite abbia finito di caricare tutto
                    setTimeout(() => {
                        console.log('Vite è pronto (dopo load)');
                        this.isViteReady = true;
                        resolve();
                    }, 100);
                }, { once: true });
            }
        });
    }

    async waitForSupabaseReady() {
        return new Promise(async (resolve) => {
            try {
                // Testa la connessione a Supabase
                const { data, error } = await supabase.auth.getSession();
                
                if (error && error.status !== 401) {
                    console.warn('Problema con la connessione Supabase:', error);
                    // Continuiamo comunque, potrebbe essere normale
                }
                
                console.log('Supabase è pronto');
                this.isSupabaseReady = true;
                resolve();
            } catch (error) {
                console.error('Errore nell\'inizializzazione Supabase:', error);
                
                // Prova a pulire lo stato se necessario
                this.clearCorruptedState();
                
                // Ritenta una volta
                setTimeout(async () => {
                    try {
                        await supabase.auth.getSession();
                        console.log('Supabase è pronto (dopo retry)');
                        this.isSupabaseReady = true;
                        resolve();
                    } catch (retryError) {
                        console.error('Errore nel retry Supabase:', retryError);
                        // Continuiamo comunque
                        this.isSupabaseReady = true;
                        resolve();
                    }
                }, 500);
            }
        });
    }

    clearCorruptedState() {
        console.log('Pulisco stato corrotto...');
        
        // Pulisci localStorage
        ['supabase.auth.token', 'sb-aiguzywadjzyrwandgba-auth-token'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Pulisci cookie Supabase
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            if (name.trim().includes('supabase') || name.trim().includes('sb-')) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        });
    }

    onReady(callback) {
        if (typeof callback !== 'function') {
            console.warn('onReady: callback deve essere una funzione');
            return;
        }
        
        if (this.isViteReady && this.isSupabaseReady) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }

    notifyReady() {
        console.log('Middleware Vite-Supabase pronto');
        this.readyCallbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback();
            }
        });
        this.readyCallbacks = [];
    }

    isReady() {
        return this.isViteReady && this.isSupabaseReady;
    }
}

// Esporta un'istanza singleton
export const viteSupabaseMiddleware = new ViteSupabaseMiddleware();
