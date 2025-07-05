// src/js/auth/auth-modal.js
// Gestione modal di autenticazione

import { optimizeModalForMobile, restoreMobileSettings, manageMobileFocus, addMobileTouchHandlers } from '../utils/mobile-utils.js';
import { showMessage } from '../utils/ui-utils.js';
import { getEnvironmentType, isBypassActive } from './auth-dev-bypass.js';

/**
 * Crea il modal di autenticazione
 */
export function createAuthModal() {
    const env = getEnvironmentType();
    
    const modalHTML = `
        <div class="modal fade" id="auth-modal" tabindex="-1" aria-labelledby="authModalLabel" role="dialog" aria-modal="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
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
    return document.getElementById('auth-modal');
}

/**
 * Crea header del modal
 */
function createModalHeader() {
    return `
        <div class="modal-header">
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
                        <i class="material-icons me-1" aria-hidden="true">email</i>
                        Email
                    </label>
                    <input type="email" class="form-control" id="modal-login-email" name="email" required autocomplete="email">
                </div>
                <div class="mb-3">
                    <label for="modal-login-password" class="form-label">
                        <i class="material-icons me-1" aria-hidden="true">lock</i>
                        Password
                    </label>
                    <input type="password" class="form-control" id="modal-login-password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="material-icons me-1" aria-hidden="true">login</i>
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
    const bypassActive = isBypassActive();
    
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

/**
 * Setup event listeners per il modal
 */
export function setupModalEventListeners(modal) {
    if (!modal) return;
    
    // Event listeners per lifecycle del modal
    modal.addEventListener('show.bs.modal', () => {
        optimizeModalForMobile();
    });
    
    modal.addEventListener('shown.bs.modal', () => {
        manageMobileFocus(modal);
    });
    
    modal.addEventListener('hidden.bs.modal', () => {
        restoreMobileSettings();
        resetModalToLogin(modal);
        clearModalMessages(modal);
    });
    
    // Aggiungi gestione touch per mobile
    addMobileTouchHandlers(modal);
}

/**
 * Reset modal alla vista di login
 */
function resetModalToLogin(modal) {
    const loginContent = modal.querySelector('#login-content');
    const signupContent = modal.querySelector('#signup-content');
    const modalTitle = modal.querySelector('#modal-title');
    
    if (loginContent && signupContent && modalTitle) {
        loginContent.style.display = 'block';
        signupContent.style.display = 'none';
        modalTitle.innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
    }
    
    // Reset form fields
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Clear validation errors
    const invalidFields = modal.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => field.classList.remove('is-invalid'));
    
    const errorElements = modal.querySelectorAll('.invalid-feedback');
    errorElements.forEach(error => error.remove());
}

/**
 * Pulisce messaggi dal modal
 */
function clearModalMessages(modal) {
    const alerts = modal.querySelectorAll('.alert-container, .auth-alert');
    alerts.forEach(alert => alert.remove());
}

/**
 * Mostra messaggio nel modal
 */
export function showModalMessage(message, type = 'info', icon = null) {
    const modalBody = document.querySelector('#auth-modal .modal-body');
    if (!modalBody) return;
    
    showMessage(modalBody, message, type, icon);
}

/**
 * Mostra errore nel modal
 */
export function showModalError(message) {
    showModalMessage(message, 'error', 'error');
}

/**
 * Mostra successo nel modal
 */
export function showModalSuccess(message) {
    showModalMessage(message, 'success', 'check_circle');
}

/**
 * Toggle tra login e signup
 */
export function setupToggleHandlers(modal) {
    const showSignup = modal.querySelector('#show-signup-link');
    const showLogin = modal.querySelector('#show-login-link');
    const loginContent = modal.querySelector('#login-content');
    const signupContent = modal.querySelector('#signup-content');
    const modalTitle = modal.querySelector('#modal-title');
    
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        clearModalMessages(modal);
        loginContent.style.display = 'none';
        signupContent.style.display = 'block';
        modalTitle.innerHTML = '<i class="material-icons me-2">person_add</i>Registrazione';
    });
    
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        clearModalMessages(modal);
        signupContent.style.display = 'none';
        loginContent.style.display = 'block';
        modalTitle.innerHTML = '<i class="material-icons me-2">security</i>Accesso al Sistema';
    });
}

/**
 * Rimuove modal esistente se presente
 */
export function removeExistingModal() {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        const bsModal = bootstrap.Modal.getInstance(existingModal);
        if (bsModal) {
            bsModal.dispose();
        }
        existingModal.remove();
    }
}

/**
 * Ottieni istanza Bootstrap Modal
 */
export function getModalInstance() {
    const modal = document.getElementById('auth-modal');
    return modal ? bootstrap.Modal.getInstance(modal) : null;
}

/**
 * Mostra il modal
 */
export function showModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        return bsModal;
    }
    return null;
}

/**
 * Nascondi il modal
 */
export function hideModal() {
    const bsModal = getModalInstance();
    if (bsModal) {
        bsModal.hide();
    }
}
