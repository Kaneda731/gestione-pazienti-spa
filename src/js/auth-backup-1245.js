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
 * Rileva se siamo su dispositivo mobile
 */
function isMobileDevice() {
    return window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Ottimizza il viewport per mobile quando si apre il modal
 */
function optimizeModalForMobile() {
    if (!isMobileDevice()) return;
    
    // Salva la posizione di scroll corrente
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('modal.scroll.position', scrollTop.toString());
    
    // Prevent body scroll su mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollTop}px`;
    document.body.style.width = '100%';
    
    // Aggiungi meta viewport specifico per il modal se necessario
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        sessionStorage.setItem('modal.original.viewport', viewport.content);
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
}

/**
 * Ripristina le impostazioni mobile quando si chiude il modal
 */
function restoreMobileSettings() {
    if (!isMobileDevice()) return;
    
    // Ripristina body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Ripristina posizione scroll
    const savedScrollTop = sessionStorage.getItem('modal.scroll.position');
    if (savedScrollTop) {
        window.scrollTo(0, parseInt(savedScrollTop, 10));
        sessionStorage.removeItem('modal.scroll.position');
    }
    
    // Ripristina viewport originale
    const originalViewport = sessionStorage.getItem('modal.original.viewport');
    if (originalViewport) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = originalViewport;
        }
        sessionStorage.removeItem('modal.original.viewport');
    }
}

/**
 * Gestisce il focus su mobile per migliore accessibilità
 */
function manageMobileFocus(modal) {
    if (!isMobileDevice()) return;
    
    // Imposta focus sul primo campo input quando il modal è mostrato
    const firstInput = modal.querySelector('input[type="email"], input[type="text"]');
    if (firstInput) {
        // Delay per permettere al modal di essere completamente renderizzato
        setTimeout(() => {
            firstInput.focus();
            firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
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
 * Login con email e password con gestione clock skew
 */
export async function signInWithEmail(email, password) {
    const attemptLogin = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    };

    try {
        return await attemptLogin();
    } catch (error) {
        // Gestione specifica per errori di clock skew
        if (isClockSkewError(error)) {
            try {
                return await handleClockSkewError(error, attemptLogin);
            } catch (clockError) {
                console.error('Errore login email (clock skew non risolto):', clockError);
                return { success: false, error: clockError.message };
            }
        }
        
        console.error('Errore login email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Registrazione con email e password con gestione clock skew
 */
export async function signUpWithEmail(email, password) {
    const attemptSignup = async () => {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    };

    try {
        return await attemptSignup();
    } catch (error) {
        // Gestione specifica per errori di clock skew
        if (isClockSkewError(error)) {
            try {
                return await handleClockSkewError(error, attemptSignup);
            } catch (clockError) {
                console.error('Errore registrazione (clock skew non risolto):', clockError);
                return { success: false, error: clockError.message };
            }
        }
        
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
    const modal = document.getElementById('auth-modal');
    
    // Event listeners standard
    setupEmailLoginHandler();
    setupGoogleLoginHandler();
    setupBypassHandlers();
    setupToggleHandlers();
    setupSignupHandler();
    
    // Validazione in tempo reale
    setupRealTimeValidation();
    
    // Event listeners per ottimizzazioni mobile
    if (modal) {
        // Quando il modal si apre
        modal.addEventListener('show.bs.modal', () => {
            optimizeModalForMobile();
        });
        
        // Quando il modal è completamente mostrato
        modal.addEventListener('shown.bs.modal', () => {
            manageMobileFocus(modal);
        });
        
        // Quando il modal si chiude
        modal.addEventListener('hidden.bs.modal', () => {
            restoreMobileSettings();
            
            // Pulisci eventuali messaggi di errore/successo
            const alerts = modal.querySelectorAll('.auth-alert');
            alerts.forEach(alert => alert.remove());
            
            // Reset form fields
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
            
            // Reset to login view if showing signup
            const loginContent = document.getElementById('login-content');
            const signupContent = document.getElementById('signup-content');
            const modalTitle = document.getElementById('modal-title');
            
            if (loginContent && signupContent && modalTitle) {
                loginContent.style.display = 'block';
                signupContent.style.display = 'none';
                modalTitle.innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
            }
        });
        
        // Gestione migliorata del touch su mobile
        if (isMobileDevice()) {
            modal.addEventListener('touchstart', (e) => {
                // Previeni il bounce scroll su iOS
                if (e.target.closest('.modal-content')) {
                    e.stopPropagation();
                }
            });
            
            // Chiudi modal con swipe down (solo su mobile)
            let touchStartY = 0;
            let touchEndY = 0;
            
            modal.addEventListener('touchstart', (e) => {
                touchStartY = e.changedTouches[0].screenY;
            });
            
            modal.addEventListener('touchend', (e) => {
                touchEndY = e.changedTouches[0].screenY;
                handleSwipeGesture(modal, touchStartY, touchEndY);
            });
        }
    }
}

/**
 * Gestisce il gesture di swipe per chiudere il modal
 */
function handleSwipeGesture(modal, startY, endY) {
    const swipeThreshold = 100; // pixel
    const swipeDistance = startY - endY;
    
    // Swipe down per chiudere (solo se siamo nella parte superiore del modal)
    if (swipeDistance < -swipeThreshold) {
        const modalContent = modal.querySelector('.modal-content');
        const scrollTop = modalContent.scrollTop;
        
        // Chiudi solo se siamo in cima al modal
        if (scrollTop <= 10) {
            bootstrap.Modal.getInstance(modal).hide();
        }
    }
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
        
        // Validazione client-side
        if (!validateLoginForm(email, password)) {
            return;
        }
        
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
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        
        // Validazione client-side
        if (!validateSignupForm(email, password, passwordConfirm)) {
            return;
        }
        
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

/**
 * Configura validazione in tempo reale per i campi del modal
 */
function setupRealTimeValidation() {
    // Validazione email login
    const loginEmail = document.getElementById('modal-login-email');
    if (loginEmail) {
        loginEmail.addEventListener('blur', () => {
            const email = loginEmail.value;
            if (email && !validateEmail(email)) {
                showFieldError('modal-login-email', 'Inserisci un\'email valida');
            } else if (email) {
                clearFieldError('modal-login-email');
            }
        });
        
        loginEmail.addEventListener('input', () => {
            if (loginEmail.classList.contains('is-invalid')) {
                const email = loginEmail.value;
                if (validateEmail(email)) {
                    clearFieldError('modal-login-email');
                }
            }
        });
    }
    
    // Validazione password login
    const loginPassword = document.getElementById('modal-login-password');
    if (loginPassword) {
        loginPassword.addEventListener('blur', () => {
            const password = loginPassword.value;
            if (password && !validatePassword(password)) {
                showFieldError('modal-login-password', 'La password deve essere di almeno 6 caratteri');
            } else if (password) {
                clearFieldError('modal-login-password');
            }
        });
        
        loginPassword.addEventListener('input', () => {
            if (loginPassword.classList.contains('is-invalid')) {
                const password = loginPassword.value;
                if (validatePassword(password)) {
                    clearFieldError('modal-login-password');
                }
            }
        });
    }
    
    // Validazione email registrazione
    const signupEmail = document.getElementById('modal-signup-email');
    if (signupEmail) {
        signupEmail.addEventListener('blur', () => {
            const email = signupEmail.value;
            if (email && !validateEmail(email)) {
                showFieldError('modal-signup-email', 'Inserisci un\'email valida');
            } else if (email) {
                clearFieldError('modal-signup-email');
            }
        });
        
        signupEmail.addEventListener('input', () => {
            if (signupEmail.classList.contains('is-invalid')) {
                const email = signupEmail.value;
                if (validateEmail(email)) {
                    clearFieldError('modal-signup-email');
                }
            }
        });
    }
    
    // Validazione password registrazione
    const signupPassword = document.getElementById('modal-signup-password');
    if (signupPassword) {
        signupPassword.addEventListener('blur', () => {
            const password = signupPassword.value;
            if (password && !validatePassword(password)) {
                showFieldError('modal-signup-password', 'La password deve essere di almeno 6 caratteri');
            } else if (password) {
                clearFieldError('modal-signup-password');
            }
        });
        
        signupPassword.addEventListener('input', () => {
            if (signupPassword.classList.contains('is-invalid')) {
                const password = signupPassword.value;
                if (validatePassword(password)) {
                    clearFieldError('modal-signup-password');
                }
            }
        });
    }
    
    // Validazione conferma password
    const signupPasswordConfirm = document.getElementById('modal-signup-password-confirm');
    if (signupPasswordConfirm && signupPassword) {
        signupPasswordConfirm.addEventListener('blur', () => {
            const password = signupPassword.value;
            const passwordConfirm = signupPasswordConfirm.value;
            if (passwordConfirm && password !== passwordConfirm) {
                showFieldError('modal-signup-password-confirm', 'Le password non coincidono');
            } else if (passwordConfirm) {
                clearFieldError('modal-signup-password-confirm');
            }
        });
        
        signupPasswordConfirm.addEventListener('input', () => {
            if (signupPasswordConfirm.classList.contains('is-invalid')) {
                const password = signupPassword.value;
                const passwordConfirm = signupPasswordConfirm.value;
                if (password === passwordConfirm) {
                    clearFieldError('modal-signup-password-confirm');
                }
            }
        });
    }
}

// ===================================
// VALIDAZIONE FORM
// ===================================

/**
 * Validazione email mobile-friendly
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validazione password mobile-friendly
 */
function validatePassword(password) {
    return password.length >= 6;
}

/**
 * Mostra errore di validazione su campo specifico
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Rimuovi errori precedenti
    clearFieldError(fieldId);
    
    // Aggiungi classe di errore
    field.classList.add('is-invalid');
    
    // Crea elemento errore
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    errorElement.id = `${fieldId}-error`;
    
    // Inserisci dopo il campo
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    
    // Su mobile, fai scroll al campo con errore
    if (isMobileDevice()) {
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
        }, 100);
    }
}

/**
 * Rimuove errore di validazione da campo specifico
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('is-invalid');
    
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Valida form di login
 */
function validateLoginForm(email, password) {
    let isValid = true;
    
    // Reset errori precedenti
    clearFieldError('modal-login-email');
    clearFieldError('modal-login-password');
    
    // Valida email
    if (!email) {
        showFieldError('modal-login-email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('modal-login-email', 'Inserisci un\'email valida');
        isValid = false;
    }
    
    // Valida password
    if (!password) {
        showFieldError('modal-login-password', 'La password è obbligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('modal-login-password', 'La password deve essere di almeno 6 caratteri');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Valida form di registrazione
 */
function validateSignupForm(email, password, passwordConfirm) {
    let isValid = true;
    
    // Reset errori precedenti
    clearFieldError('modal-signup-email');
    clearFieldError('modal-signup-password');
    clearFieldError('modal-signup-password-confirm');
    
    // Valida email
    if (!email) {
        showFieldError('modal-signup-email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('modal-signup-email', 'Inserisci un\'email valida');
        isValid = false;
    }
    
    // Valida password
    if (!password) {
        showFieldError('modal-signup-password', 'La password è obbligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('modal-signup-password', 'La password deve essere di almeno 6 caratteri');
        isValid = false;
    }
    
    // Valida conferma password
    if (!passwordConfirm) {
        showFieldError('modal-signup-password-confirm', 'Conferma la password');
        isValid = false;
    } else if (password !== passwordConfirm) {
        showFieldError('modal-signup-password-confirm', 'Le password non coincidono');
        isValid = false;
    }
    
    return isValid;
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

// ===================================
// GESTIONE CLOCK SKEW SUPABASE
// ===================================

/**
 * Rileva se un errore è relativo al clock skew
 * @param {Error} error - L'errore da analizzare
 * @returns {boolean} - True se è un errore di clock skew
 */
function isClockSkewError(error) {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const clockSkewIndicators = [
        'issued in the future',
        'clock skew',
        'time difference',
        'timestamp',
        'invalid time'
    ];
    
    return clockSkewIndicators.some(indicator => 
        errorMessage.includes(indicator)
    );
}

/**
 * Gestisce automaticamente gli errori di clock skew con retry
 * @param {Error} error - L'errore di clock skew
 * @param {Function} retryFunction - Funzione da riprovare
 * @param {number} attempt - Numero tentativo corrente
 * @returns {Promise} - Risultato del retry o errore
 */
async function handleClockSkewError(error, retryFunction, attempt = 1) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 secondo
    
    console.warn(`Clock skew rilevato (tentativo ${attempt}/${maxRetries}):`, error.message);
    
    if (attempt >= maxRetries) {
        console.error('Max tentativi raggiunti per clock skew');
        
        // Mostra notifica all'utente
        if (window.confirm(`Rilevato problema di sincronizzazione orario.\n\nQuesto può causare problemi di autenticazione.\nVerifica che l'orario del tuo dispositivo sia corretto.\n\nVuoi ricaricare la pagina per riprovare?`)) {
            window.location.reload();
        }
        
        throw error;
    }
    
    // Aspetta prima del retry
    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    
    try {
        console.log(`Retry automatico per clock skew (${attempt + 1}/${maxRetries})...`);
        return await retryFunction();
    } catch (retryError) {
        if (isClockSkewError(retryError)) {
            return handleClockSkewError(retryError, retryFunction, attempt + 1);
        }
        throw retryError;
    }
}


