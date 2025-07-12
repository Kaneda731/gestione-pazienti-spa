// src/app/config/constants.js

/**
 * Costanti dell'applicazione
 */

// Routes
export const ROUTES = {
    HOME: 'home',
    LIST: 'list',
    FORM: 'inserimento',
    CHARTS: 'grafico',
    DIAGNOSES: 'diagnosi',
    DISCHARGE: 'dimissione',
    ACCESS_DENIED: 'access-denied',
    LOGIN_REQUIRED: 'login-required'
};

// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer'
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH_STATE: 'auth_state',
    USER_PREFERENCES: 'user_preferences',
    LIST_FILTERS: 'listFilters',
    THEME: 'theme',
    REDIRECT_URL: 'redirectUrl',
    EDIT_PATIENT_ID: 'editPazienteId'
};
