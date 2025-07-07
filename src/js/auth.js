// src/js/auth-minimal.js - REFACTORING MINIMAL PER SNELLIRE
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
// UTILITY FUNCTIONS (ESISTENTI)
// ===================================

function getEnvironmentType() {
    const hostname = window.location.hostname;
    return {
        isInternalServer: hostname.includes('vgold') || hostname.includes('interno'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('127.0.0.1'),
        isProduction: !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('vgold') && !hostname.includes('interno')
    };
}

function isMobileDevice() {
    return window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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
        history.replaceState(null, '', url.toString());
    }
}

// ===================================
// AUTENTICAZIONE (ESISTENTI CON MINIMAL CLOCK SKEW)
// ===================================

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

export async function signInWithGoogle() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google' 
        });
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Errore login Google:', error);
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        localStorage.setItem('user.manual.logout', 'true');
        clearDevelopmentBypass();
        sessionStorage.removeItem('supabase.auth.token');
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Errore logout:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// DEVELOPMENT BYPASS (ESISTENTE)
// ===================================

export function enableDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
        console.warn('Bypass sviluppo non disponibile in ambiente di produzione');
        return null;
    }
    
    const mockSession = {
        user: { 
            id: 'dev-user-123', 
            email: 'dev@localhost.dev',
            created_at: new Date().toISOString()
        },
        access_token: 'dev-token-123',
        expires_at: Date.now() + SESSION_DURATION,
        isDevelopmentBypass: true
    };
    
    localStorage.setItem('supabase.auth.session', JSON.stringify(mockSession));
    localStorage.setItem('user.bypass.enabled', 'true');
    localStorage.setItem('user.bypass.timestamp', Date.now().toString());
    
    console.log('✅ Bypass sviluppo attivato - Sessione fittizia creata');
    return mockSession;
}

export function checkDevelopmentBypass() {
    const env = getEnvironmentType();
    
    if (!env.isLocalhost && !env.isInternalServer) {
        return null;
    }
    
    const bypassEnabled = localStorage.getItem('user.bypass.enabled');
    const sessionData = localStorage.getItem('supabase.auth.session');
    
    if (bypassEnabled === 'true' && sessionData) {
        try {
            const session = JSON.parse(sessionData);
            if (session.isDevelopmentBypass) {
                return session;
            }
        } catch (error) {
            console.error('Errore parsing sessione bypass:', error);
        }
    }
    
    return null;
}

export function clearDevelopmentBypass() {
    localStorage.removeItem('user.bypass.enabled');
    localStorage.removeItem('user.bypass.timestamp');
    localStorage.removeItem('supabase.auth.session');
}

// ===================================
// UI MANAGEMENT (ESISTENTE SEMPLIFICATO)
// ===================================

export function updateAuthUI(session) {
    authContainer.innerHTML = '';
    
    if (session) {
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
        
        document.getElementById('logout-button').addEventListener('click', async () => {
            const result = await signOut();
            if (result.success) {
                updateAuthUI(null);
                if (window.onAuthStateChangeCallback) {
                    window.onAuthStateChangeCallback(null);
                }
                setTimeout(() => window.location.reload(), 100);
            }
        });
    } else {
        authContainer.innerHTML = `
            <button id="login-modal-trigger" class="btn btn-outline-light">
                <i class="material-icons me-1" style="font-size: 1em;">login</i>
                Accedi
            </button>
        `;
        
        document.getElementById('login-modal-trigger').addEventListener('click', () => {
            createAuthModal();
            const modal = new bootstrap.Modal(document.getElementById('auth-modal'));
            modal.show();
        });
    }
}

// ===================================
// MODAL CREATION (ESISTENTE SEMPLIFICATO)
// ===================================

function createAuthModal() {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const env = getEnvironmentType();
    
    const modalHTML = `
        <div class="modal fade" id="auth-modal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Accesso</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${env.isLocalhost ? '<div class="alert alert-info">Modalità sviluppo - Bypass attivo</div>' : ''}
                        
                        <form id="login-form">
                            <div class="mb-3">
                                <input type="email" class="form-control" id="login-email" placeholder="Email" required>
                            </div>
                            <div class="mb-3">
                                <input type="password" class="form-control" id="login-password" placeholder="Password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 mb-3">Accedi</button>
                        </form>
                        
                        <div class="text-center mb-3">
                            <span class="text-muted">oppure</span>
                        </div>
                        
                        <button id="google-login-btn" class="btn btn-outline-danger w-100">
                            <i class="material-icons me-2" style="font-size: 1.2em;">account_circle</i>
                            Accedi con Google
                        </button>
                        
                        <div id="auth-error" class="alert alert-danger mt-3" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event handlers
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('auth-modal')).hide();
            window.location.reload();
        } else {
            const errorDiv = document.getElementById('auth-error');
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    });
    
    // Google login handler
    document.getElementById('google-login-btn').addEventListener('click', async () => {
        const googleBtn = document.getElementById('google-login-btn');
        const originalText = googleBtn.innerHTML;
        
        // Stato loading
        googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connessione...';
        googleBtn.disabled = true;
        
        const result = await signInWithGoogle();
        
        if (result.success) {
            // Il redirect di Google gestirà il resto
            googleBtn.innerHTML = '<i class="material-icons me-2">check</i>Reindirizzamento...';
        } else {
            // Ripristina pulsante e mostra errore
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
            
            const errorDiv = document.getElementById('auth-error');
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    });
}

// ===================================
// INIZIALIZZAZIONE
// ===================================

export function initAuth(onAuthStateChange) {
    cleanOAuthParamsFromURL();
    
    window.onAuthStateChangeCallback = onAuthStateChange;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        // Log solo eventi importanti, non sessioni di routine
        if (event !== 'INITIAL_SESSION') {
            console.log('Auth state change:', event, session?.user?.email || 'no user');
        }
        
        updateAuthUI(session);
        
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
    
    console.log('Sistema di autenticazione inizializzato (versione minimal)');
}
