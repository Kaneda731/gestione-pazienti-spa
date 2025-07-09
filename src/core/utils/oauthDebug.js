// src/core/utils/oauthDebug.js

/**
 * Debug utilities per OAuth
 */

export function logOAuthState() {
    console.log('OAuth Debug - Current State:', {
        location: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
        localStorage: localStorage.getItem('supabase.auth.token'),
        sessionStorage: sessionStorage.getItem('supabase.auth.token')
    });
}

export function clearOAuthState() {
    console.log('OAuth Debug - Clearing state...');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    window.location.hash = '';
}

// Log automatico all'avvio
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    console.log('OAuth Debug mode enabled');
    logOAuthState();
}
