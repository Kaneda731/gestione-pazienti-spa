// src/js/auth.js
import { supabase } from './supabase.js';
import { authContainer, templates } from './ui.js';

/**
 * Aggiorna l'interfaccia utente di autenticazione in base alla sessione.
 * @param {object | null} session - La sessione utente di Supabase.
 */
export function updateAuthUI(session) {
    authContainer.innerHTML = '';
    
    if (session) {
        // Utente loggato - mostra info utente compatte nella navbar
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
        
        document.getElementById('logout-button').addEventListener('click', () => {
            // Pulisci anche la sessione di sviluppo se presente
            sessionStorage.removeItem('supabase.auth.token');
            supabase.auth.signOut();
        });
    } else {
        // Utente non loggato - mostra pulsante login elegante
        authContainer.innerHTML = `
            <button id="login-modal-trigger" class="btn btn-outline-light">
                <i class="material-icons me-1" style="font-size: 1em;">login</i>
                Accedi
            </button>
        `;
        
        // Crea il modal di login se non esiste già
        if (!document.getElementById('auth-modal')) {
            createAuthModal();
        }
        
        // Event listener per aprire il modal
        document.getElementById('login-modal-trigger').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('auth-modal'));
            modal.show();
        });
    }
}

/**
 * Crea il modal di autenticazione elegante
 */
function createAuthModal() {
    const isInternalServer = window.location.hostname.includes('vgold') || 
                            window.location.hostname.includes('interno') ||
                            window.location.hostname === 'localhost';

    const modalHTML = `
        <div class="modal fade" id="auth-modal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background: var(--card-bg); border: none; box-shadow: var(--shadow-lg);">
                    <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #0d47a1); color: white; border: none;">
                        <h5 class="modal-title d-flex align-items-center" id="authModalLabel">
                            <i class="material-icons me-2">security</i>
                            <span id="modal-title">Accesso al Sistema</span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${isInternalServer ? `
                            <div class="alert alert-info d-flex align-items-center mb-3">
                                <i class="material-icons me-2" style="font-size: 1.2em;">info</i>
                                <div>
                                    <strong>Server interno rilevato</strong><br>
                                    <small>Usa l'accesso email o il bypass sviluppo per ambienti aziendali.</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Contenuto Login -->
                        <div id="login-content">
                            <form id="email-login-form" class="mb-3">
                                <div class="mb-3">
                                    <label for="modal-login-email" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">email</i>
                                        Email
                                    </label>
                                    <input type="email" class="form-control" id="modal-login-email" required 
                                           style="padding-left: 2.5rem; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"%23666\" viewBox=\"0 0 24 24\"><path d=\"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z\"/></svg>'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px;">
                                </div>
                                <div class="mb-3">
                                    <label for="modal-login-password" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">lock</i>
                                        Password
                                    </label>
                                    <input type="password" class="form-control" id="modal-login-password" required
                                           style="padding-left: 2.5rem; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"%23666\" viewBox=\"0 0 24 24\"><path d=\"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z\"/></svg>'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px;">
                                </div>
                                <button type="submit" class="btn btn-primary w-100 mb-3">
                                    <i class="material-icons me-1" style="font-size: 1em;">login</i>
                                    Accedi con Email
                                </button>
                            </form>
                            
                            <!-- Opzioni Alternative -->
                            <div class="d-grid gap-2">
                                ${!isInternalServer ? `
                                    <button id="google-login-btn" class="btn btn-outline-danger">
                                        <i class="material-icons me-1" style="font-size: 1em;">account_circle</i>
                                        Accedi con Google
                                    </button>
                                ` : ''}
                                
                                ${isInternalServer ? `
                                    <button id="dev-bypass-btn" class="btn btn-outline-secondary">
                                        <i class="material-icons me-1" style="font-size: 1em;">developer_mode</i>
                                        Bypass Sviluppo
                                    </button>
                                ` : ''}
                            </div>
                            
                            <hr class="my-3">
                            <div class="text-center">
                                <small class="text-muted">
                                    Non hai un account? 
                                    <a href="#" id="show-signup-link" class="text-decoration-none">Registrati qui</a>
                                </small>
                            </div>
                        </div>
                        
                        <!-- Contenuto Registrazione -->
                        <div id="signup-content" style="display: none;">
                            <form id="email-signup-form">
                                <div class="mb-3">
                                    <label for="modal-signup-email" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">email</i>
                                        Email
                                    </label>
                                    <input type="email" class="form-control" id="modal-signup-email" required
                                           style="padding-left: 2.5rem; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"%23666\" viewBox=\"0 0 24 24\"><path d=\"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z\"/></svg>'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px;">
                                </div>
                                <div class="mb-3">
                                    <label for="modal-signup-password" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">lock</i>
                                        Password
                                    </label>
                                    <input type="password" class="form-control" id="modal-signup-password" required minlength="6"
                                           style="padding-left: 2.5rem; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"%23666\" viewBox=\"0 0 24 24\"><path d=\"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2 2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z\"/></svg>'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px;">
                                </div>
                                <div class="mb-3">
                                    <label for="modal-signup-password-confirm" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">lock_outline</i>
                                        Conferma Password
                                    </label>
                                    <input type="password" class="form-control" id="modal-signup-password-confirm" required minlength="6"
                                           style="padding-left: 2.5rem; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"%23666\" viewBox=\"0 0 24 24\"><path d=\"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z\"/></svg>'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px;">
                                </div>
                                <button type="submit" class="btn btn-success w-100">
                                    <i class="material-icons me-1" style="font-size: 1em;">person_add</i>
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
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEventListeners();
}

/**
 * Configura gli event listener per il modal di autenticazione
 */
function setupModalEventListeners() {
    // Login con email
    const emailForm = document.getElementById('email-login-form');
    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('modal-login-email').value;
        const password = document.getElementById('modal-login-password').value;
        
        const submitBtn = emailForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Accesso...';
        submitBtn.disabled = true;
        
        const result = await signInWithEmail(email, password);
        
        if (!result.success) {
            // Mostra errore nel modal
            showModalError(`Errore di accesso: ${result.error}`);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } else {
            // Chiudi il modal al successo
            bootstrap.Modal.getInstance(document.getElementById('auth-modal')).hide();
        }
    });
    
    // Login con Google
    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', () => {
        supabase.auth.signInWithOAuth({ provider: 'google' });
    });
    
    // Bypass sviluppo
    const devBtn = document.getElementById('dev-bypass-btn');
    devBtn?.addEventListener('click', () => {
        const mockSession = enableDevelopmentBypass();
        if (mockSession) {
            updateAuthUI(mockSession);
            // Triggepa il callback di auth state change manualmente
            if (window.onAuthStateChangeCallback) {
                window.onAuthStateChangeCallback(mockSession);
            }
            // Chiudi il modal
            bootstrap.Modal.getInstance(document.getElementById('auth-modal')).hide();
        }
    });
    
    // Toggle tra login e signup
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
    
    // Registrazione con email
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
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Registrazione...';
        submitBtn.disabled = true;
        
        const result = await signUpWithEmail(email, password);
        
        if (result.success) {
            showModalSuccess('Registrazione completata! Controlla la tua email per confermare l\'account.');
            // Torna al login dopo 2 secondi
            setTimeout(() => {
                signupContent.style.display = 'none';
                loginContent.style.display = 'block';
                modalTitle.innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
            }, 2000);
        } else {
            showModalError(`Errore di registrazione: ${result.error}`);
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

/**
 * Mostra un messaggio di errore nel modal
 */
function showModalError(message) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    let alertContainer = modalBody.querySelector('.auth-alert');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'auth-alert';
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2">error</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Mostra un messaggio di successo nel modal
 */
function showModalSuccess(message) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    let alertContainer = modalBody.querySelector('.auth-alert');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'auth-alert';
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-success d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2">check_circle</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Inizializza il listener per i cambiamenti di stato dell'autenticazione.
 * @param {function} onAuthStateChange - Callback da eseguire quando lo stato di autenticazione cambia.
 */
export function initAuth(onAuthStateChange) {
    // Salva il callback globalmente per il bypass di sviluppo
    window.onAuthStateChangeCallback = onAuthStateChange;
    
    // Controlla se c'è una sessione di bypass salvata
    const savedBypassSession = sessionStorage.getItem('supabase.auth.token');
    if (savedBypassSession) {
        try {
            const session = JSON.parse(savedBypassSession);
            updateAuthUI(session);
            if (onAuthStateChange) {
                onAuthStateChange(session);
            }
            return; // Exit early se c'è una sessione bypass
        } catch (e) {
            // Sessione corrotta, rimuovila
            sessionStorage.removeItem('supabase.auth.token');
        }
    }
    
    // Listener normale per Supabase auth
    supabase.auth.onAuthStateChange((_event, session) => {
        // Se non c'è una sessione Supabase, controlla il bypass
        if (!session) {
            const bypassSession = sessionStorage.getItem('supabase.auth.token');
            if (bypassSession) {
                try {
                    session = JSON.parse(bypassSession);
                } catch (e) {
                    sessionStorage.removeItem('supabase.auth.token');
                }
            }
        }
        
        updateAuthUI(session);
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
}

/**
 * Autenticazione con email e password per ambienti aziendali
 * Alternativa quando OAuth Google non funziona su server interni
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

/**
 * Bypass temporaneo per sviluppo su server interni
 * Crea una sessione fittizia per testare l'app
 */
export function enableDevelopmentBypass() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1') ||
                         window.location.hostname.includes('.local') ||
                         window.location.hostname.includes('vgold') ||
                         window.location.hostname.includes('interno');
                         
    if (isDevelopment) {
        // Simula una sessione per sviluppo
        const mockSession = {
            user: {
                email: 'sviluppatore@vgold.local',
                id: 'dev-user-123'
            },
            access_token: 'dev-token'
        };
        
        // Memorizza la sessione simulata
        sessionStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
        return mockSession;
    }
    return null;
}
