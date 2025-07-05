// src/js/auth/auth-dev-bypass.js
// Sistema di bypass per ambiente di sviluppo

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 ore

/**
 * Identifica il tipo di ambiente di hosting
 */
export function getEnvironmentType() {
    const hostname = window.location.hostname;
    
    return {
        isInternalServer: hostname.includes('vgold') || hostname.includes('interno'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('127.0.0.1'),
        isProduction: !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('vgold') && !hostname.includes('interno')
    };
}

/**
 * Crea una sessione fittizia per sviluppo
 */
export function enableDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
        console.warn('Bypass sviluppo non disponibile in ambiente di produzione');
        return null;
    }
    
    const mockSession = {
        user: {
            email: 'sviluppatore@vgold.local',
            id: 'dev-user-123',
            app_metadata: { provider: 'development' },
            user_metadata: { name: 'Sviluppatore V Gold' }
        },
        access_token: 'dev-token-' + Date.now(),
        refresh_token: 'dev-refresh-token',
        expires_at: Date.now() + SESSION_DURATION,
        token_type: 'bearer',
        created_at: new Date().toISOString(),
        expires_in: 86400,
        isDevelopmentBypass: true
    };
    
    const sessionData = JSON.stringify(mockSession);
    sessionStorage.setItem('supabase.auth.token', sessionData);
    localStorage.setItem('dev.bypass.session', sessionData);
    localStorage.setItem('dev.bypass.enabled', 'true');
    localStorage.setItem('dev.bypass.timestamp', Date.now().toString());
    
    console.log('🔧 Bypass sviluppo attivato:', mockSession.user.email);
    return mockSession;
}

/**
 * Controlla se esiste una sessione di bypass valida
 */
export function checkDevelopmentBypass() {
    try {
        const bypassEnabled = localStorage.getItem('dev.bypass.enabled');
        const savedSession = localStorage.getItem('dev.bypass.session');
        const timestamp = localStorage.getItem('dev.bypass.timestamp');
        
        if (!bypassEnabled || !savedSession || !timestamp) {
            return null;
        }
        
        // Verifica validità sessione
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge > SESSION_DURATION) {
            console.log('⏰ Sessione bypass scaduta, rimozione...');
            clearDevelopmentBypass();
            return null;
        }
        
        const session = JSON.parse(savedSession);
        if (session.isDevelopmentBypass) {
            sessionStorage.setItem('supabase.auth.token', savedSession);
            console.log('✅ Sessione bypass valida:', session.user.email);
            return session;
        }
    } catch (error) {
        console.warn('Errore durante il controllo bypass sviluppo:', error);
        clearDevelopmentBypass();
    }
    
    return null;
}

/**
 * Pulisce tutte le tracce del bypass sviluppo
 */
export function clearDevelopmentBypass() {
    sessionStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('dev.bypass.session');
    localStorage.removeItem('dev.bypass.enabled');
    localStorage.removeItem('dev.bypass.timestamp');
    console.log('🧹 Bypass sviluppo rimosso');
}

/**
 * Auto-attiva il bypass sviluppo su localhost
 */
export function autoEnableLocalhostBypass() {
    const env = getEnvironmentType();
    const manualLogout = localStorage.getItem('user.manual.logout');
    
    if (env.isLocalhost && !manualLogout && !checkDevelopmentBypass()) {
        console.log('🚀 Auto-attivazione bypass sviluppo su', window.location.hostname);
        return enableDevelopmentBypass();
    }
    
    return null;
}

/**
 * Verifica se il bypass è attualmente attivo
 */
export function isBypassActive() {
    return localStorage.getItem('dev.bypass.enabled') === 'true';
}

/**
 * Ottieni informazioni sulla sessione bypass corrente
 */
export function getBypassInfo() {
    if (!isBypassActive()) return null;
    
    const timestamp = localStorage.getItem('dev.bypass.timestamp');
    const session = localStorage.getItem('dev.bypass.session');
    
    if (!timestamp || !session) return null;
    
    try {
        const sessionData = JSON.parse(session);
        const createdAt = new Date(parseInt(timestamp));
        const expiresAt = new Date(parseInt(timestamp) + SESSION_DURATION);
        
        return {
            user: sessionData.user,
            createdAt,
            expiresAt,
            isExpired: Date.now() > expiresAt.getTime(),
            timeRemaining: Math.max(0, expiresAt.getTime() - Date.now())
        };
    } catch (error) {
        console.warn('Errore nel parsing delle informazioni bypass:', error);
        return null;
    }
}

/**
 * Rinnova la sessione di bypass
 */
export function renewBypassSession() {
    if (!isBypassActive()) return false;
    
    const currentSession = localStorage.getItem('dev.bypass.session');
    if (!currentSession) return false;
    
    try {
        const session = JSON.parse(currentSession);
        const newTimestamp = Date.now();
        
        // Aggiorna timestamp e expires_at
        session.expires_at = newTimestamp + SESSION_DURATION;
        const newSessionData = JSON.stringify(session);
        
        localStorage.setItem('dev.bypass.session', newSessionData);
        localStorage.setItem('dev.bypass.timestamp', newTimestamp.toString());
        sessionStorage.setItem('supabase.auth.token', newSessionData);
        
        console.log('🔄 Sessione bypass rinnovata');
        return true;
    } catch (error) {
        console.warn('Errore nel rinnovo sessione bypass:', error);
        return false;
    }
}

/**
 * Setup auto-renewal per sessione bypass
 */
export function setupBypassAutoRenewal() {
    if (!isBypassActive()) return;
    
    // Rinnova automaticamente quando rimangono 2 ore
    const renewalThreshold = 2 * 60 * 60 * 1000; // 2 ore
    
    const checkRenewal = () => {
        const info = getBypassInfo();
        if (info && info.timeRemaining < renewalThreshold && info.timeRemaining > 0) {
            renewBypassSession();
        }
    };
    
    // Controlla ogni 10 minuti
    setInterval(checkRenewal, 10 * 60 * 1000);
    
    // Controlla subito
    checkRenewal();
}
