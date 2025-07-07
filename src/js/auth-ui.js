// src/js/auth-ui.js
import { signInWithEmail, signInWithGoogle, signOut } from './auth.js';

function getEnvironmentType() {
    const hostname = window.location.hostname;
    return {
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('127.0.0.1'),
    };
}

export function updateAuthUI(session) {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

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
            await signOut();
            // Non fare nulla qui. onAuthStateChange gestirà l'aggiornamento della UI.
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
        });
    }
}

async function createAuthModal() {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const response = await fetch('views/auth-modal.html');
    const modalHTML = await response.text();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const env = getEnvironmentType();
    if (env.isLocalhost) {
        const alert = document.getElementById('auth-bypass-alert');
        if(alert) alert.style.display = 'block';
    }
    
    setupModalEventListeners();

    const modal = new bootstrap.Modal(document.getElementById('auth-modal'));
    modal.show();
}

function setupModalEventListeners() {
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
    
    document.getElementById('google-login-btn').addEventListener('click', async () => {
        const googleBtn = document.getElementById('google-login-btn');
        const originalText = googleBtn.innerHTML;
        
        googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connessione...';
        googleBtn.disabled = true;
        
        const result = await signInWithGoogle();
        
        if (result.success) {
            googleBtn.innerHTML = '<i class="material-icons me-2">check</i>Reindirizzamento...';
        } else {
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
            
            const errorDiv = document.getElementById('auth-error');
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
    });
}
