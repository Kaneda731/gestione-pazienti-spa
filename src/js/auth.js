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
        // Utente loggato - mostra info e logout
        const template = templates.logout;
        const content = template.content.cloneNode(true);
        content.getElementById('user-email').textContent = session.user.email;
        content.getElementById('logout-button').addEventListener('click', () => {
            // Pulisci anche la sessione di sviluppo se presente
            sessionStorage.removeItem('supabase.auth.token');
            supabase.auth.signOut();
        });
        authContainer.appendChild(content);
    } else {
        // Utente non loggato - mostra form di login
        showLoginForm();
    }
}

/**
 * Mostra il form di login con opzioni multiple
 */
function showLoginForm() {
    const isInternalServer = window.location.hostname.includes('vgold') || 
                            window.location.hostname.includes('interno') ||
                            window.location.hostname === 'localhost';

    authContainer.innerHTML = `
        <div class="auth-form-container">
            <div class="card" style="max-width: 400px; margin: 2rem auto;">
                <div class="card-header text-center">
                    <h5 class="mb-0">Accesso al Sistema</h5>
                </div>
                <div class="card-body">
                    ${isInternalServer ? `
                        <div class="alert alert-info small mb-3">
                            <i class="material-icons" style="font-size: 1rem; vertical-align: text-bottom;">info</i>
                            Server interno rilevato. Usa l'accesso email o il bypass sviluppo.
                        </div>
                    ` : ''}
                    
                    <!-- Login Email/Password -->
                    <form id="email-login-form" class="mb-3">
                        <div class="mb-3">
                            <label for="login-email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="login-email" required>
                        </div>
                        <div class="mb-3">
                            <label for="login-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="login-password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">
                            <span class="material-icons me-1" style="font-size: 1rem;">login</span>
                            Accedi con Email
                        </button>
                    </form>
                    
                    <div class="text-center mb-3">
                        <small class="text-muted">oppure</small>
                    </div>
                    
                    <!-- Login Google (se non su server interno) -->
                    ${!isInternalServer ? `
                        <button id="google-login-btn" class="btn btn-outline-danger w-100 mb-2">
                            <span class="material-icons me-1" style="font-size: 1rem;">account_circle</span>
                            Accedi con Google
                        </button>
                    ` : ''}
                    
                    <!-- Bypass Sviluppo (solo server interni) -->
                    ${isInternalServer ? `
                        <button id="dev-bypass-btn" class="btn btn-outline-secondary w-100 mb-2">
                            <span class="material-icons me-1" style="font-size: 1rem;">developer_mode</span>
                            Bypass Sviluppo
                        </button>
                    ` : ''}
                    
                    <hr>
                    <div class="text-center">
                        <small class="text-muted">
                            Non hai un account? 
                            <a href="#" id="show-signup-link">Registrati</a>
                        </small>
                    </div>
                </div>
            </div>
            
            <!-- Form Registrazione (nascosto inizialmente) -->
            <div id="signup-form-container" class="card" style="max-width: 400px; margin: 1rem auto; display: none;">
                <div class="card-header text-center">
                    <h6 class="mb-0">Registrazione</h6>
                </div>
                <div class="card-body">
                    <form id="email-signup-form">
                        <div class="mb-3">
                            <label for="signup-email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="signup-email" required>
                        </div>
                        <div class="mb-3">
                            <label for="signup-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="signup-password" required minlength="6">
                        </div>
                        <div class="mb-3">
                            <label for="signup-password-confirm" class="form-label">Conferma Password</label>
                            <input type="password" class="form-control" id="signup-password-confirm" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-success w-100">
                            <span class="material-icons me-1" style="font-size: 1rem;">person_add</span>
                            Registrati
                        </button>
                    </form>
                    <div class="text-center mt-3">
                        <small class="text-muted">
                            Hai già un account? 
                            <a href="#" id="show-login-link">Accedi</a>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupLoginEventListeners();
}

/**
 * Configura gli event listener per i form di login
 */
function setupLoginEventListeners() {
    // Login con email
    const emailForm = document.getElementById('email-login-form');
    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const submitBtn = emailForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Accesso...';
        submitBtn.disabled = true;
        
        const result = await signInWithEmail(email, password);
        
        if (!result.success) {
            alert(`Errore di accesso: ${result.error}`);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
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
        }
    });
    
    // Toggle tra login e signup
    const showSignup = document.getElementById('show-signup-link');
    const showLogin = document.getElementById('show-login-link');
    const signupContainer = document.getElementById('signup-form-container');
    const loginContainer = document.querySelector('.auth-form-container .card:first-child');
    
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    });
    
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });
    
    // Registrazione con email
    const signupForm = document.getElementById('email-signup-form');
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;
        
        if (password !== passwordConfirm) {
            alert('Le password non coincidono');
            return;
        }
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Registrazione...';
        submitBtn.disabled = true;
        
        const result = await signUpWithEmail(email, password);
        
        if (result.success) {
            alert('Registrazione completata! Controlla la tua email per confermare l\'account.');
            signupContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        } else {
            alert(`Errore di registrazione: ${result.error}`);
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
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
