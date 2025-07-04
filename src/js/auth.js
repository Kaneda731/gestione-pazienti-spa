/* Cache busting - Ven  4 Lug 2025 05:03:55 CEST */
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
            // Pulisci TUTTE le sessioni (normale e bypass)
            clearDevelopmentBypass();
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
        
        // Crea il modal di login se non esiste già o forzane la ricreazione
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove(); // Rimuovi il modal esistente per forzare ricreazione
        }
        createAuthModal();
        
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
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.includes('127.0.0.1');

    const modalHTML = `
        <div class="modal fade" id="auth-modal" tabindex="-1" aria-labelledby="authModalLabel" role="dialog" aria-modal="true" aria-describedby="auth-modal-description">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content" style="background: var(--card-bg); border: none; box-shadow: var(--shadow-lg);">
                    <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #0d47a1); color: white; border: none;">
                        <h5 class="modal-title d-flex align-items-center" id="authModalLabel">
                            <i class="material-icons me-2" aria-hidden="true">security</i>
                            <span id="modal-title">Accesso al Sistema</span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi modal di autenticazione"></button>
                    </div>
                    <div class="modal-body" role="main">
                        <div id="auth-modal-description" class="visually-hidden">
                            Modal per l'autenticazione dell'utente. Compila i campi per accedere al sistema.
                        </div>
                        ${isInternalServer ? `
                            <div class="alert alert-info d-flex align-items-center mb-3" role="alert" aria-live="polite">
                                <i class="material-icons me-2" style="font-size: 1.2em;" aria-hidden="true">info</i>
                                <div>
                                    <strong>Server interno rilevato</strong><br>
                                    <small>Usa l'accesso email o il bypass sviluppo per ambienti aziendali.</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Contenuto Login -->
                        <div id="login-content" role="form" aria-label="Modulo di accesso">
                            <form id="email-login-form" class="mb-3" novalidate autocomplete="on">
                                <div class="mb-3">
                                    <label for="modal-login-email" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;" aria-hidden="true">email</i>
                                        Email
                                    </label>
                                    <input type="email" 
                                           class="form-control input-with-email-icon" 
                                           id="modal-login-email" 
                                           name="email"
                                           required 
                                           autocomplete="email"
                                           aria-describedby="login-email-help">
                                    <div id="login-email-help" class="form-text visually-hidden">Inserisci la tua email per accedere</div>
                                </div>
                                <div class="mb-3">
                                    <label for="modal-login-password" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;" aria-hidden="true">lock</i>
                                        Password
                                    </label>
                                    <input type="password" 
                                           class="form-control input-with-password-icon" 
                                           id="modal-login-password" 
                                           name="password"
                                           required
                                           autocomplete="current-password"
                                           aria-describedby="login-password-help">
                                    <div id="login-password-help" class="form-text visually-hidden">Inserisci la tua password</div>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 mb-3" aria-describedby="login-submit-help">
                                    <i class="material-icons me-1" style="font-size: 1em;" aria-hidden="true">login</i>
                                    Accedi con Email
                                </button>
                                <div id="login-submit-help" class="form-text visually-hidden">Premere per accedere con email e password</div>
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
                                        ${localStorage.getItem('dev.bypass.enabled') ? 'Bypass Attivo' : 'Bypass Sviluppo'}
                                    </button>
                                    ${localStorage.getItem('dev.bypass.enabled') ? `
                                        <button id="clear-bypass-btn" class="btn btn-outline-warning btn-sm mt-2">
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
                        </div>
                        
                        <!-- Contenuto Registrazione -->
                        <div id="signup-content" style="display: none;">
                            <form id="email-signup-form" autocomplete="on">
                                <div class="mb-3">
                                    <label for="modal-signup-email" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">email</i>
                                        Email
                                    </label>
                                    <input type="email" 
                                           class="form-control input-with-email-icon" 
                                           id="modal-signup-email" 
                                           name="email"
                                           required
                                           autocomplete="email">
                                </div>
                                <div class="mb-3">
                                    <label for="modal-signup-password" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;" aria-hidden="true">lock</i>
                                        Password
                                    </label>
                                    <input type="password" 
                                           class="form-control input-with-password-icon" 
                                           id="modal-signup-password" 
                                           name="password"
                                           required 
                                           minlength="6"
                                           autocomplete="new-password">
                                </div>
                                <div class="mb-3">
                                    <label for="modal-signup-password-confirm" class="form-label">
                                        <i class="material-icons me-1" style="font-size: 1em; vertical-align: text-bottom;">lock_outline</i>
                                        Conferma Password
                                    </label>
                                    <input type="password" 
                                           class="form-control input-with-password-icon" 
                                           id="modal-signup-password-confirm" 
                                           name="password-confirm"
                                           required 
                                           minlength="6"
                                           autocomplete="new-password">
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
    
    // Pulsante per disattivare il bypass
    const clearBypassBtn = document.getElementById('clear-bypass-btn');
    clearBypassBtn?.addEventListener('click', () => {
        clearDevelopmentBypass();
        showModalSuccess('Bypass sviluppo disattivato. Ricarica la pagina per applicare.');
        // Ricarica il modal per aggiornare i pulsanti
        setTimeout(() => {
            window.location.reload();
        }, 1500);
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
 * Mostra un messaggio di errore nel modal con accessibilità migliorata
 */
function showModalError(message) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    let alertContainer = modalBody.querySelector('.auth-alert');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'auth-alert';
        alertContainer.setAttribute('aria-live', 'assertive');
        alertContainer.setAttribute('aria-atomic', 'true');
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2" aria-hidden="true">error</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi messaggio di errore"></button>
        </div>
    `;
    
    // Focus sul messaggio per screen reader
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            alert.focus();
        }
    }, 100);
}

/**
 * Mostra un messaggio di successo nel modal con accessibilità migliorata
 */
function showModalSuccess(message) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    let alertContainer = modalBody.querySelector('.auth-alert');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'auth-alert';
        alertContainer.setAttribute('aria-live', 'polite');
        alertContainer.setAttribute('aria-atomic', 'true');
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-success d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2" aria-hidden="true">check_circle</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi messaggio di successo"></button>
        </div>
    `;
    
    // Focus sul messaggio per screen reader
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            alert.focus();
        }
    }, 100);
}

/**
 * Inizializza il listener per i cambiamenti di stato dell'autenticazione.
 * @param {function} onAuthStateChange - Callback da eseguire quando lo stato di autenticazione cambia.
 */
export function initAuth(onAuthStateChange) {
    // Salva il callback globalmente per il bypass di sviluppo
    window.onAuthStateChangeCallback = onAuthStateChange;
    
    // PRIMA: Auto-attiva bypass su localhost se non esiste
    const autoBypassSession = autoEnableLocalhostBypass();
    if (autoBypassSession) {
        updateAuthUI(autoBypassSession);
        if (onAuthStateChange) {
            onAuthStateChange(autoBypassSession);
        }
        return; // Exit early con sessione auto-attivata
    }
    
    // SECONDA: Controlla se c'è una sessione di bypass sviluppo persistente
    const developmentSession = checkDevelopmentBypass();
    if (developmentSession) {
        updateAuthUI(developmentSession);
        if (onAuthStateChange) {
            onAuthStateChange(developmentSession);
        }
        return; // Exit early con sessione di sviluppo
    }
    
    // SECONDA: Controlla se c'è una sessione di bypass salvata in sessionStorage
    const savedBypassSession = sessionStorage.getItem('supabase.auth.token');
    if (savedBypassSession) {
        try {
            const session = JSON.parse(savedBypassSession);
            // Verifica che sia una sessione di sviluppo valida
            if (session.isDevelopmentBypass) {
                updateAuthUI(session);
                if (onAuthStateChange) {
                    onAuthStateChange(session);
                }
                return; // Exit early se c'è una sessione bypass valida
            }
        } catch (e) {
            // Sessione corrotta, rimuovila
            sessionStorage.removeItem('supabase.auth.token');
        }
    }
    
    // TERZA: Listener normale per Supabase auth
    supabase.auth.onAuthStateChange((_event, session) => {
        // Pulisci i parametri OAuth dall'URL se presenti
        cleanOAuthParamsFromURL();
        
        // Se non c'è una sessione Supabase, controlla di nuovo il bypass
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
 * Crea una sessione fittizia per testare l'app con persistenza migliorata
 */
export function enableDevelopmentBypass() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1') ||
                         window.location.hostname.includes('.local') ||
                         window.location.hostname.includes('vgold') ||
                         window.location.hostname.includes('interno');
                         
    if (isDevelopment) {
        // Simula una sessione per sviluppo con timestamp per validità
        const mockSession = {
            user: {
                email: 'sviluppatore@vgold.local',
                id: 'dev-user-123',
                app_metadata: { provider: 'development' },
                user_metadata: { name: 'Sviluppatore V Gold' }
            },
            access_token: 'dev-token-' + Date.now(),
            refresh_token: 'dev-refresh-token',
            expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 ore
            token_type: 'bearer',
            created_at: new Date().toISOString(),
            expires_in: 86400,
            // Flag per identificare che è una sessione di sviluppo
            isDevelopmentBypass: true
        };
        
        // Memorizza la sessione in ENTRAMBI sessionStorage e localStorage per persistenza
        const sessionData = JSON.stringify(mockSession);
        sessionStorage.setItem('supabase.auth.token', sessionData);
        localStorage.setItem('dev.bypass.session', sessionData);
        localStorage.setItem('dev.bypass.enabled', 'true');
        localStorage.setItem('dev.bypass.timestamp', Date.now().toString());
        
        // Bypass sviluppo attivato - sessione persistente creata
        return mockSession;
    }
    return null;
}

/**
 * Controlla se esiste una sessione di bypass valida salvata
 */
export function checkDevelopmentBypass() {
    try {
        const bypassEnabled = localStorage.getItem('dev.bypass.enabled');
        const savedSession = localStorage.getItem('dev.bypass.session');
        const timestamp = localStorage.getItem('dev.bypass.timestamp');
        
        if (!bypassEnabled || !savedSession || !timestamp) {
            return null;
        }
        
        // Verifica se la sessione è ancora valida (24 ore)
        const sessionAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore
        
        if (sessionAge > maxAge) {
            // Sessione scaduta, pulisci
            clearDevelopmentBypass();
            return null;
        }
        
        const session = JSON.parse(savedSession);
        
        // Verifica che sia effettivamente una sessione di sviluppo
        if (session.isDevelopmentBypass) {
            // Ripristina anche in sessionStorage
            sessionStorage.setItem('supabase.auth.token', savedSession);
            // Sessione bypass sviluppo ripristinata automaticamente
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
    // Bypass sviluppo pulito
}

/**
 * Pulisce i parametri OAuth dall'URL dopo il login
 */
function cleanOAuthParamsFromURL() {
    const url = new URL(window.location);
    const oauthParams = [
        'access_token', 'expires_at', 'expires_in', 
        'provider_token', 'refresh_token', 'token_type'
    ];
    
    let hasOAuthParams = false;
    oauthParams.forEach(param => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasOAuthParams = true;
        }
    });
    
    // Se c'erano parametri OAuth, aggiorna l'URL senza ricaricare la pagina
    if (hasOAuthParams) {
        // Mantieni solo l'hash se presente (per il routing SPA)
        const newUrl = url.pathname + url.search + url.hash;
        window.history.replaceState({}, '', newUrl);
    }
}

/**
 * Auto-attiva il bypass sviluppo su localhost se non è già presente una sessione
 */
function autoEnableLocalhostBypass() {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('127.0.0.1');
    
    if (isLocalhost && !checkDevelopmentBypass()) {
        console.log('🔧 Auto-attivazione bypass sviluppo su ' + window.location.hostname);
        return enableDevelopmentBypass();
    }
    return null;
}
