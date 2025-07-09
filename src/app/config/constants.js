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

// Patient status
export const PATIENT_STATUS = {
    ACTIVE: 'active',
    DISCHARGED: 'discharged'
};

// Action types
export const ACTIONS = {
    EDIT: 'edit',
    DELETE: 'delete',
    DISCHARGE: 'dimetti',
    REACTIVATE: 'riattiva'
};

// Sort directions
export const SORT_DIRECTIONS = {
    ASC: 'asc',
    DESC: 'desc'
};

// Message types
export const MESSAGE_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Modal types
export const MODAL_TYPES = {
    CONFIRM: 'confirm',
    ALERT: 'alert',
    FORM: 'form'
};

// Device types
export const DEVICE_TYPES = {
    MOBILE: 'mobile',
    TABLET: 'tablet',
    DESKTOP: 'desktop'
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

// Event names
export const EVENTS = {
    AUTH_STATE_CHANGED: 'auth:state:changed',
    USER_LOGGED_IN: 'auth:user:logged_in',
    USER_LOGGED_OUT: 'auth:user:logged_out',
    PATIENT_CREATED: 'patient:created',
    PATIENT_UPDATED: 'patient:updated',
    PATIENT_DELETED: 'patient:deleted',
    PATIENT_DISCHARGED: 'patient:discharged',
    PATIENT_REACTIVATED: 'patient:reactivated',
    THEME_CHANGED: 'theme:changed',
    ROUTE_CHANGED: 'route:changed'
};

// API endpoints
export const API_ENDPOINTS = {
    PATIENTS: 'pazienti',
    DIAGNOSES: 'diagnosi',
    USERS: 'users',
    PROFILES: 'profiles'
};

// Chart types
export const CHART_TYPES = {
    BAR: 'bar',
    PIE: 'pie',
    LINE: 'line',
    DOUGHNUT: 'doughnut'
};

// Form validation rules
export const VALIDATION_RULES = {
    REQUIRED: 'required',
    EMAIL: 'email',
    MIN_LENGTH: 'minLength',
    MAX_LENGTH: 'maxLength',
    PATTERN: 'pattern',
    DATE: 'date'
};

// CSS classes
export const CSS_CLASSES = {
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    HIDDEN: 'hidden',
    ACTIVE: 'active',
    DISABLED: 'disabled'
};
