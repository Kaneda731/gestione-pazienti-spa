/* Cache busting - Ven  4 Lug 2025 05:03:55 CEST */
// src/js/auth.js - VERSIONE PULITA E RIORGANIZZATA
import { supabase } from './supabase.js';
import { authContainer } from './ui.js';

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

/**
 * Identifica il tipo di ambiente di hosting
 */
function getEnvironmentType() {
    const hostname = window.location.hostname;
    
    return {
        isInternalServer: hostname.includes('vgold') || hostname.includes('interno'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('127.0.0.1'),
        isProduction: !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('vgold') && !hostname.includes('interno')
    };
}

/**
 * Pulisce i parametri OAuth dall'URL dopo il login
 */
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
        const newUrl = url.pathname + url.search + url.hash;
        window.history.replaceState({}, '', newUrl);
    }
}

// ===================================
// GESTIONE SESSIONI DI SVILUPPO
// ===================================

/**
 * Crea una sessione fittizia per sviluppo
 */
export function enableDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
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
            clearDevelopmentBypass();
            return null;
        }
        
        const session = JSON.parse(savedSession);
        if (session.isDevelopmentBypass) {
            sessionStorage.setItem('supabase.auth.token', savedSession);
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
}

/**
 * Auto-attiva il bypass sviluppo su localhost
 */
function autoEnableLocalhostBypass() {
    const env = getEnvironmentType();
    const manualLogout = localStorage.getItem('user.manual.logout');
    
    if (env.isLocalhost && !manualLogout && !checkDevelopmentBypass()) {
        console.log('🔧 Auto-attivazione bypass sviluppo su ' + window.location.hostname);
        return enableDevelopmentBypass();
    }
    
    return null;
}

// ===================================
// AUTENTICAZIONE EMAIL
// ===================================

/**
 * Login con email e password
 */
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Errore login email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Registrazione con email e password
 */
export async function signUpWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Errore registrazione email:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// GESTIONE UI
// ===================================

/**
 * Aggiorna l'interfaccia utente di autenticazione
 */
export function updateAuthUI(session) {
    authContainer.innerHTML = '';
    
    if (session) {
        renderLoggedInUI(session);
    } else {
        renderLoginUI();
    }
}

/**
 * Renderizza UI per utente loggato
 */
function renderLoggedInUI(session) {
    authContainer.innerHTML = `
        <div class="d-flex align-items-center">
            <span class="navbar-text me-2 text-light">
                <i class="material-icons me-1" style="font-size: 1.1em; vertical-align: text-bottom;">account_circle</i>
                ${session.user.email}
            </span>
            <button id="logout-button" class="btn btn-outline-light btn-sm">
                <i class="material-icons me-1" style="font-size: 1em;">logout</i>
                Esci
            </button>
        </div>
    `;
    
    setupLogoutHandler();
}

/**
 * Renderizza UI per login
 */
function renderLoginUI() {
    authContainer.innerHTML = `
        <button id="login-modal-trigger" class="btn btn-outline-light">
            <i class="material-icons me-1" style="font-size: 1em;">login</i>
            Accedi
        </button>
    `;
    
    // Rimuovi modal esistente e creane uno nuovo
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    createAuthModal();
    setupLoginModalHandler();
}

/**
 * Configura handler per logout
 */
function setupLogoutHandler() {
    document.getElementById('logout-button').addEventListener('click', async () => {
        localStorage.setItem('user.manual.logout', 'true');
        clearDevelopmentBypass();
        sessionStorage.removeItem('supabase.auth.token');
        
        await supabase.auth.signOut();
        updateAuthUI(null);
        
        if (window.onAuthStateChangeCallback) {
            window.onAuthStateChangeCallback(null);
        }
        
        setTimeout(() => window.location.reload(), 100);
    });
}

/**
 * Configura handler per modal login
 */
function setupLoginModalHandler() {
    document.getElementById('login-modal-trigger').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('auth-modal'));
        modal.show();
    });
}

// ===================================
// MODAL DI AUTENTICAZIONE
// ===================================

/**
 * Crea il modal di autenticazione
 */
function createAuthModal() {
    const env = getEnvironmentType();
    
    const modalHTML = `
        <div class="modal fade" id="auth-modal" tabindex="-1" aria-labelledby="authModalLabel" role="dialog" aria-modal="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content" style="background: var(--card-bg); border: none; box-shadow: var(--shadow-lg);">
                    ${createModalHeader()}
                    <div class="modal-body" role="main">
                        ${createEnvironmentAlert(env)}
                        ${createLoginForm()}
                        ${createAuthOptions(env)}
                        ${createSignupForm()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEventListeners();
}

/**
 * Crea header del modal
 */
function createModalHeader() {
    return `
        <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #0d47a1); color: white; border: none;">
            <h5 class="modal-title d-flex align-items-center" id="authModalLabel">
                <i class="material-icons me-2" aria-hidden="true">security</i>
                <span id="modal-title">Accesso al Sistema</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi modal"></button>
        </div>
    `;
}

/**
 * Crea alert ambiente
 */
function createEnvironmentAlert(env) {
    if (env.isInternalServer && !env.isLocalhost) {
        return `
            <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
                <i class="material-icons me-2" style="font-size: 1.2em;" aria-hidden="true">info</i>
                <div>
                    <strong>Server interno rilevato</strong><br>
                    <small>Usa l'accesso email o il bypass sviluppo.</small>
                </div>
            </div>
        `;
    }
    
    if (env.isLocalhost) {
        return `
            <div class="alert alert-success d-flex align-items-center mb-3" role="alert">
                <i class="material-icons me-2" style="font-size: 1.2em;" aria-hidden="true">developer_mode</i>
                <div>
                    <strong>Ambiente di sviluppo</strong><br>
                    <small>Google OAuth e bypass sviluppo disponibili.</small>
                </div>
            </div>
        `;
    }
    
    return '';
}

/**
 * Crea form di login
 */
function createLoginForm() {
    return `
        <div id="login-content" role="form" aria-label="Modulo di accesso">
            <form id="email-login-form" class="mb-3" novalidate autocomplete="on">
                <div class="mb-3">
                    <label for="modal-login-email" class="form-label">
                        <i class="material-icons me-1" style="font-size: 1em;" aria-hidden="true">email</i>
                        Email
                    </label>
                    <input type="email" class="form-control" id="modal-login-email" name="email" required autocomplete="email">
                </div>
                <div class="mb-3">
                    <label for="modal-login-password" class="form-label">
                        <i class="material-icons me-1" style="font-size: 1em;" aria-hidden="true">lock</i>
                        Password
                    </label>
                    <input type="password" class="form-control" id="modal-login-password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="material-icons me-1" style="font-size: 1em;" aria-hidden="true">login</i>
                    Accedi con Email
                </button>
            </form>
        </div>
    `;
}

/**
 * Crea opzioni di autenticazione alternative
 */
function createAuthOptions(env) {
    const showGoogle = !env.isInternalServer || env.isLocalhost;
    const showBypass = env.isInternalServer || env.isLocalhost;
    const bypassActive = localStorage.getItem('dev.bypass.enabled');
    
    return `
        <div class="d-grid gap-2 mb-3">
            ${showGoogle ? `
                <button id="google-login-btn" class="btn btn-outline-danger">
                    <i class="material-icons me-1">account_circle</i>
                    Accedi con Google
                </button>
            ` : ''}
            
            ${showBypass ? `
                <button id="dev-bypass-btn" class="btn btn-outline-secondary">
                    <i class="material-icons me-1">developer_mode</i>
                    ${bypassActive ? 'Bypass Attivo' : 'Bypass Sviluppo'}
                </button>
                ${bypassActive ? `
                    <button id="clear-bypass-btn" class="btn btn-outline-warning btn-sm">
                        <i class="material-icons me-1" style="font-size: 0.9em;">clear</i>
                        Disattiva Bypass
                    </button>
                ` : ''}
            ` : ''}
        </div>
        
        <hr class="my-3">
        <div class="text-center">
            <small class="text-muted">
                Non hai un account? 
                <a href="#" id="show-signup-link" class="text-decoration-none">Registrati qui</a>
            </small>
        </div>
    `;
}

/**
 * Crea form di registrazione
 */
function createSignupForm() {
    return `
        <div id="signup-content" style="display: none;">
            <form id="email-signup-form" autocomplete="on">
                <div class="mb-3">
                    <label for="modal-signup-email" class="form-label">
                        <i class="material-icons me-1">email</i>
                        Email
                    </label>
                    <input type="email" class="form-control" id="modal-signup-email" name="email" required autocomplete="email">
                </div>
                <div class="mb-3">
                    <label for="modal-signup-password" class="form-label">
                        <i class="material-icons me-1">lock</i>
                        Password
                    </label>
                    <input type="password" class="form-control" id="modal-signup-password" name="password" required minlength="6" autocomplete="new-password">
                </div>
                <div class="mb-3">
                    <label for="modal-signup-password-confirm" class="form-label">
                        <i class="material-icons me-1">lock_outline</i>
                        Conferma Password
                    </label>
                    <input type="password" class="form-control" id="modal-signup-password-confirm" name="password-confirm" required minlength="6" autocomplete="new-password">
                </div>
                <button type="submit" class="btn btn-success w-100">
                    <i class="material-icons me-1">person_add</i>
                    Crea Account
                </button>
            </form>
            <hr class="my-3">
            <div class="text-center">
                <small class="text-muted">
                    Hai già un account? 
                    <a href="#" id="show-login-link" class="text-decoration-none">Accedi qui</a>
                </small>
            </div>
        </div>
    `;
}

// ===================================
// EVENT LISTENERS MODAL
// ===================================

/**
 * Configura tutti gli event listener del modal
 */
function setupModalEventListeners() {
    setupEmailLoginHandler();
    setupGoogleLoginHandler();
    setupBypassHandlers();
    setupToggleHandlers();
    setupSignupHandler();
}

/**
 * Handler per login email
 */
function setupEmailLoginHandler() {
    const emailForm = document.getElementById('email-login-form');
    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('modal-login-email').value;
        const password = document.getElementById('modal-login-password').value;
        const submitBtn = emailForm.querySelector('button[type="submit"]');
        
        setButtonLoading(submitBtn, 'Accesso...');
        
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
            localStorage.removeItem('user.manual.logout');
            bootstrap.Modal.getInstance(document.getElementById('auth-modal')).hide();
        } else {
            showModalError(`Errore di accesso: ${result.error}`);
            resetButton(submitBtn, 'Accedi con Email');
        }
    });
}

/**
 * Handler per Google login
 */
function setupGoogleLoginHandler() {
    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', () => {
        supabase.auth.signInWithOAuth({ provider: 'google' });
    });
}

/**
 * Handler per bypass sviluppo
 */
function setupBypassHandlers() {
    const devBtn = document.getElementById('dev-bypass-btn');
    devBtn?.addEventListener('click', () => {
        localStorage.removeItem('user.manual.logout');
        
        const mockSession = enableDevelopmentBypass();
        if (mockSession) {
            updateAuthUI(mockSession);
            if (window.onAuthStateChangeCallback) {
                window.onAuthStateChangeCallback(mockSession);
            }
            bootstrap.Modal.getInstance(document.getElementById('auth-modal')).hide();
        }
    });
    
    const clearBypassBtn = document.getElementById('clear-bypass-btn');
    clearBypassBtn?.addEventListener('click', () => {
        clearDevelopmentBypass();
        showModalSuccess('Bypass sviluppo disattivato. Ricarica la pagina per applicare.');
        setTimeout(() => window.location.reload(), 1500);
    });
}

/**
 * Handler per toggle login/signup
 */
function setupToggleHandlers() {
    const showSignup = document.getElementById('show-signup-link');
    const showLogin = document.getElementById('show-login-link');
    const loginContent = document.getElementById('login-content');
    const signupContent = document.getElementById('signup-content');
    const modalTitle = document.getElementById('modal-title');
    
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        loginContent.style.display = 'none';
        signupContent.style.display = 'block';
        modalTitle.innerHTML = '<i class="material-icons me-2">person_add</i>Registrazione';
    });
    
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupContent.style.display = 'none';
        loginContent.style.display = 'block';
        modalTitle.innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
    });
}

/**
 * Handler per registrazione
 */
function setupSignupHandler() {
    const signupForm = document.getElementById('email-signup-form');
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('modal-signup-email').value;
        const password = document.getElementById('modal-signup-password').value;
        const passwordConfirm = document.getElementById('modal-signup-password-confirm').value;
        
        if (password !== passwordConfirm) {
            showModalError('Le password non coincidono');
            return;
        }
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, 'Registrazione...');
        
        const result = await signUpWithEmail(email, password);
        
        if (result.success) {
            showModalSuccess('Registrazione completata! Controlla la tua email per confermare l\'account.');
            setTimeout(() => {
                document.getElementById('signup-content').style.display = 'none';
                document.getElementById('login-content').style.display = 'block';
                document.getElementById('modal-title').innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
            }, 2000);
        } else {
            showModalError(`Errore di registrazione: ${result.error}`);
        }
        
        resetButton(submitBtn, 'Crea Account');
    });
}

// ===================================
// UTILITY UI
// ===================================

/**
 * Imposta stato loading per pulsante
 */
function setButtonLoading(button, text) {
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${text}`;
    button.disabled = true;
}

/**
 * Ripristina pulsante normale
 */
function resetButton(button, text) {
    button.innerHTML = text;
    button.disabled = false;
}

/**
 * Mostra messaggio di errore nel modal
 */
function showModalError(message) {
    showModalMessage(message, 'danger', 'error');
}

/**
 * Mostra messaggio di successo nel modal
 */
function showModalSuccess(message) {
    showModalMessage(message, 'success', 'check_circle');
}

/**
 * Mostra messaggio generico nel modal
 */
function showModalMessage(message, type, icon) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    let alertContainer = modalBody.querySelector('.auth-alert');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'auth-alert';
        alertContainer.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');
        alertContainer.setAttribute('aria-atomic', 'true');
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-${type} d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2" aria-hidden="true">${icon}</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi messaggio"></button>
        </div>
    `;
}

// ===================================
// INIZIALIZZAZIONE
// ===================================

/**
 * Inizializza il sistema di autenticazione
 */
export function initAuth(onAuthStateChange) {
    window.onAuthStateChangeCallback = onAuthStateChange;
    
    // Auto-attiva bypass su localhost se necessario
    const autoBypassSession = autoEnableLocalhostBypass();
    if (autoBypassSession) {
        updateAuthUI(autoBypassSession);
        if (onAuthStateChange) {
            onAuthStateChange(autoBypassSession);
        }
        return;
    }
    
    // Controlla sessione di bypass esistente
    const developmentSession = checkDevelopmentBypass();
    if (developmentSession) {
        updateAuthUI(developmentSession);
        if (onAuthStateChange) {
            onAuthStateChange(developmentSession);
        }
        return;
    }
    
    // Controlla sessione salvata in sessionStorage
    const savedBypassSession = sessionStorage.getItem('supabase.auth.token');
    if (savedBypassSession) {
        try {
            const session = JSON.parse(savedBypassSession);
            if (session.isDevelopmentBypass) {
                updateAuthUI(session);
                if (onAuthStateChange) {
                    onAuthStateChange(session);
                }
                return;
            }
        } catch (e) {
            sessionStorage.removeItem('supabase.auth.token');
        }
    }
    
    // Listener Supabase standard
    supabase.auth.onAuthStateChange((_event, session) => {
        cleanOAuthParamsFromURL();
        
        if (!session) {
            const bypassSession = checkDevelopmentBypass();
            if (bypassSession) {
                session = bypassSession;
            }
        }
        
        updateAuthUI(session);
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
}
