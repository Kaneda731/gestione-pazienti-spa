// src/js/auth.js
import { supabase } from './supabase.js';
import { updateAuthUI } from './auth-ui.js';

// ===================================
// COSTANTI E CONFIGURAZIONE  
// ===================================
const OAUTH_PARAMS = [
    'access_token', 'expires_at', 'expires_in', 
    'provider_token', 'refresh_token', 'token_type'
];

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 ore

// ===================================
// UTILITY FUNCTIONS
// ===================================

function getEnvironmentType() {
    const hostname = window.location.hostname;
    return {
        isInternalServer: hostname.includes('vgold') || hostname.includes('interno'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('127.0.0.1'),
        isProduction: !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('vgold') && !hostname.includes('interno')
    };
}

function cleanOAuthParamsFromURL() {
    const url = new URL(window.location);
    let hasOAuthParams = false;
    
    OAUTH_PARAMS.forEach(param => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasOAuthParams = true;
        }
    });
    
    if (hasOAuthParams) {
        history.replaceState(null, '', url.toString());
    }
}

// ===================================
// AUTENTICAZIONE
// ===================================

export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Errore login email:', error);
        return { success: false, error: error.message };
    }
}

export async function signUpWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Errore registrazione email:', error);
        return { success: false, error: error.message };
    }
}

export async function signInWithGoogle() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Errore login Google:', error);
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        // Forza l'aggiornamento della sessione prima del logout per risolvere problemi su mobile
        await supabase.auth.refreshSession();
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Errore durante il signOut:', error);
        // Se anche il refresh fallisce, prova un logout forzato lato client
        if (error.message.includes('Auth session missing')) {
            sessionStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('supabase.auth.token');
            window.location.reload();
            return { success: true };
        }
        return { success: false, error: error.message };
    }
}

// ===================================
// DEVELOPMENT BYPASS
// ===================================

export function enableDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
        console.warn('Bypass sviluppo non disponibile in ambiente di produzione');
        return null;
    }
    
    const mockSession = {
        user: { 
            id: 'dev-user-123', 
            email: 'dev@localhost.dev',
            created_at: new Date().toISOString()
        },
        access_token: 'dev-token-123',
        expires_at: Date.now() + SESSION_DURATION,
        isDevelopmentBypass: true
    };
    
    localStorage.setItem('supabase.auth.session', JSON.stringify(mockSession));
    localStorage.setItem('user.bypass.enabled', 'true');
    localStorage.setItem('user.bypass.timestamp', Date.now().toString());
    
    console.log('✅ Bypass sviluppo attivato - Sessione fittizia creata');
    return mockSession;
}

export function checkDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
        return null;
    }
    
    const bypassEnabled = localStorage.getItem('user.bypass.enabled');
    const sessionData = localStorage.getItem('supabase.auth.session');
    
    if (bypassEnabled === 'true' && sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.isDevelopmentBypass) {
                return session;
            }
        } catch (error) {
            console.error('Errore parsing sessione bypass:', error);
        }
    }
    
    return null;
}

export function clearDevelopmentBypass() {
    localStorage.removeItem('user.bypass.enabled');
    localStorage.removeItem('user.bypass.timestamp');
    localStorage.removeItem('supabase.auth.session');
}

// ===================================
// INIZIALIZZAZIONE
// ===================================

export function initAuth(onAuthStateChange) {
    cleanOAuthParamsFromURL();
    
    window.onAuthStateChangeCallback = onAuthStateChange;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event !== 'INITIAL_SESSION') {
            console.log('Auth state change:', event, session?.user?.email || 'no user');
        }
        
        updateAuthUI(session);
        
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
    
    console.log('Sistema di autenticazione inizializzato');
}