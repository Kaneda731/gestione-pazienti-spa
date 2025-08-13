// src/js/services/viteSupabaseMiddleware.js
/**
 * Middleware per gestire l'integrazione Supabase-Vite
 * Risolve problemi di timing e CORS specifici di Vite
 */

import { supabase } from './supabaseClient.js';
import { logger } from '../logger/loggerService.js';

class ViteSupabaseMiddleware {
    constructor() {
        this.readyPromise = new Promise((resolve) => {
            this.resolveReady = resolve;
        });

        this.init();
    }

    async init() {
        await this.waitForViteReady();
        await this.waitForSupabaseReady();
        this.notifyReady();
    }

    async waitForViteReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                logger.log('Vite è pronto');
                resolve();
            } else {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        logger.log('Vite è pronto (dopo load)');
                        resolve();
                    }, 100);
                }, { once: true });
            }
        });
    }

    async waitForSupabaseReady() {
        return new Promise(async (resolve) => {
            try {
                await supabase.auth.getSession();
                logger.log('Supabase è pronto');
                resolve();
            } catch (error) {
                console.error('Errore nell\'inizializzazione Supabase:', error);
                this.clearCorruptedState();
                setTimeout(async () => {
                    try {
                        await supabase.auth.getSession();
                        logger.log('Supabase è pronto (dopo retry)');
                        resolve();
                    } catch (retryError) {
                        console.error('Errore nel retry Supabase:', retryError);
                        resolve(); // Risolviamo comunque per non bloccare l'app
                    }
                }, 500);
            }
        });
    }

    clearCorruptedState() {
        logger.log('Pulisco stato corrotto...');
        ['supabase.auth.token', 'sb-aiguzywadjzyrwandgba-auth-token'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            if (name.trim().includes('supabase') || name.trim().includes('sb-')) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        });
    }

    /**
     * Restituisce una Promise che si risolve quando il middleware è pronto.
     * @returns {Promise<void>}
     */
    onReady() {
        return this.readyPromise;
    }

    notifyReady() {
        logger.log('Middleware Vite-Supabase pronto');
        this.resolveReady();
    }
}

// Esporta un'istanza singleton
export const viteSupabaseMiddleware = new ViteSupabaseMiddleware();