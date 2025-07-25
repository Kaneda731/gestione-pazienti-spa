// src/app/config/environment.js

/**
 * Configurazione dell'ambiente
 */
export const environment = {
    // Ambiente corrente
    NODE_ENV: import.meta.env.MODE || 'development',
    
    // Supabase
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    
    // OAuth
    OAUTH_DEBUG: import.meta.env.VITE_OAUTH_DEBUG === 'true',
    
    // App
    APP_NAME: 'Gestione Pazienti SPA',
    APP_VERSION: '1.0.0',
    
    // UI
    MOBILE_BREAKPOINT: 767,
    
    // Feature flags
    FEATURES: {
        ROLE_BASED_ACCESS: true
    }
};

/**
 * Verifica se siamo in produzione
 */
export const isProduction = environment.NODE_ENV === 'production';

/**
 * Verifica se siamo in sviluppo
 */
export const isDevelopment = environment.NODE_ENV === 'development';

/**
 * Verifica se siamo in test
 */
export const isTest = environment.NODE_ENV === 'test';

/**
 * Verifica se una feature è abilitata
 */
export const isFeatureEnabled = (featureName) => {
    return environment.FEATURES[featureName] === true;
};
