// src/core/auth/oauthService.js
import { supabase } from '../services/supabaseClient.js';
import { viteSupabaseMiddleware } from '../services/viteSupabaseMiddleware.js';

/**
 * Gestisce i problemi comuni con OAuth in ambiente Vite
 */
export class OAuthManager {
    constructor() {
        this.isInitialized = false;
        this.authState = 'idle'; // idle, authenticating, authenticated, error
        this.errorState = null;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        // Aspetta che il middleware sia pronto
        await new Promise(resolve => {
            viteSupabaseMiddleware.onReady(resolve);
        });
        
        try {
            // Verifica se siamo in un redirect OAuth con parametri reali
            const urlParams = new URLSearchParams(window.location.search);
            const fragment = new URLSearchParams(window.location.hash.substring(1));
            
            const hasOAuthParams = fragment.has('access_token') || 
                                  fragment.has('refresh_token') || 
                                  urlParams.has('code') ||
                                  fragment.has('error');
            
            if (hasOAuthParams) {
                console.log('Rilevato redirect OAuth con parametri reali, gestisco la sessione...');
                this.authState = 'authenticating';
                
                // Lascia che Supabase gestisca automaticamente il callback
                await this.handleOAuthCallback();
            } else {
                console.log('Nessun parametro OAuth rilevato, inizializzazione normale');
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Errore nell\'inizializzazione OAuth:', error);
            this.errorState = error;
            this.authState = 'error';
        }
    }

    async handleOAuthCallback() {
        try {
            console.log('Gestisco callback OAuth...');
            
            // Supabase gestisce automaticamente il callback OAuth
            // Dobbiamo solo aspettare che il processo sia completato
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Errore nel callback OAuth:', error);
                this.clearCorruptedState();
                throw error;
            }
            
            if (data.session) {
                console.log('Sessione OAuth recuperata con successo');
                this.authState = 'authenticated';
                
                // Pulisci l'URL dai parametri OAuth
                this.cleanupOAuthUrl();
                
                // Redirect alla home o alla pagina salvata
                const redirectUrl = sessionStorage.getItem('redirectUrl');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectUrl');
                    window.location.hash = redirectUrl;
                } else {
                    window.location.hash = '#home';
                }
            }
            
            return data.session;
        } catch (error) {
            console.error('Errore nella gestione del callback OAuth:', error);
            this.clearCorruptedState();
            throw error;
        }
    }

    clearCorruptedState() {
        console.log('Pulisco stato corrotto OAuth...');
        
        // Usa il middleware per pulire lo stato
        viteSupabaseMiddleware.clearCorruptedState();
        
        // Pulisci l'URL
        this.cleanupOAuthUrl();
        
        this.authState = 'idle';
        this.errorState = null;
    }

    cleanupOAuthUrl() {
        if (window.location.hash.includes('access_token') || 
            window.location.search.includes('code')) {
            
            // Pulisce l'URL dai parametri di OAuth, mantenendo solo l'hash pulito se esiste.
            const cleanHash = window.location.hash.split('&')[0];
            const newUrl = window.location.pathname + (cleanHash && cleanHash !== '#' ? cleanHash : '');

            window.history.replaceState({}, document.title, newUrl);
            console.log('URL pulito da parametri OAuth, nuovo URL:', newUrl);
        }
    }

    async signInWithGoogle() {
        try {
            // Assicurati che il middleware sia pronto
            if (!viteSupabaseMiddleware.isReady()) {
                console.log('Aspetto che il middleware sia pronto...');
                await new Promise(resolve => {
                    viteSupabaseMiddleware.onReady(resolve);
                });
            }
            
            // Se siamo già in uno stato di errore, proviamo a pulirlo
            if (this.authState === 'error') {
                console.log('Stato di errore rilevato, pulisco...');
                this.clearCorruptedState();
                
                // Aspetta un po' per permettere la pulizia
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.authState = 'authenticating';
            
            // Usa l'URL di base corrente per il reindirizzamento.
            // Funziona sia in locale (http://localhost:5173) che in produzione.
            const redirectTo = window.location.origin;
            
            console.log('Iniziando login OAuth con redirect:', redirectTo);
            
            const { data, error } = await supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: {
                    redirectTo,
                    // In sviluppo, potremmo forzare un nuovo consent per debug
                    queryParams: import.meta.env.DEV ? {
                        access_type: 'offline',
                        prompt: 'consent',
                    } : {}
                }
            });
            
            if (error) {
                console.error('Errore nella chiamata OAuth:', error);
                this.authState = 'error';
                this.errorState = error;
                throw error;
            }
            
            console.log('Login OAuth iniziato con successo:', data);
            return { success: true, data };
            
        } catch (error) {
            console.error('Errore completo nel login OAuth:', error);
            
            // Se otteniamo un 401, è probabile che lo stato sia corrotto
            if (error.status === 401) {
                console.log('Errore 401 rilevato, pulisco stato corrotto...');
                this.clearCorruptedState();
            }
            
            this.authState = 'error';
            this.errorState = error;
            
            return { success: false, error: error.message };
        }
    }

    getAuthState() {
        return {
            state: this.authState,
            error: this.errorState,
            isInitialized: this.isInitialized
        };
    }
}

// Esporta un'istanza singleton
export const oauthManager = new OAuthManager();
