// src/shared/components/ui/AuthUI.js
import { Modal } from 'bootstrap';
import { signInWithGoogle, signOut, currentUser } from '../../../core/auth/authService.js';
import { syncMobileAuth } from '../../../app/mobile/mobile-navigation.js';
import authModalHtml from '../../../views/auth-modal.html?raw';

export function updateAuthUI(session) {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    if (session) {
        // Se c'è una sessione, il profilo dovrebbe essere in currentUser
        const userRole = currentUser.profile?.role || 'caricamento...';
        const userEmail = session.user.email;

        authContainer.innerHTML = `
            <div class="d-flex align-items-center text-light">
                <span class="navbar-text me-3" title="${userEmail}">
                    <i class="material-icons me-1" style="font-size: 1.1em; vertical-align: text-bottom;">account_circle</i>
                    ${userEmail.split('@')[0]}
                </span>
                <span class="badge bg-info me-3 text-uppercase" style="font-size: 0.75em; padding: 0.4em 0.6em;">
                    ${userRole}
                </span>
                <button id="logout-button" class="btn btn-outline-light btn-sm">
                    <i class="material-icons" style="font-size: 1em; vertical-align: middle;">logout</i>
                </button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <button id="login-modal-trigger" class="btn btn-outline-light">
                <i class="material-icons me-1" style="font-size: 1em;">login</i>
                Accedi
            </button>
        `;
    }

    // Forza la sincronizzazione della UI mobile ogni volta che quella desktop cambia
    syncMobileAuth();
}

function initAuthEventListeners() {
    // Usa la delegazione di eventi sul body per gestire i click
    document.body.addEventListener('click', async (event) => {
        if (event.target.closest('#logout-button')) {
            event.preventDefault();
            await signOut();
        }
        
        if (event.target.closest('#login-modal-trigger')) {
            event.preventDefault();
            showLoginModal();
        }
        
        if (event.target.closest('#google-login-btn')) {
            event.preventDefault();
            console.log('Pulsante Google cliccato');
            const button = event.target.closest('#google-login-btn');
            const spinner = button.querySelector('.spinner-border');
            const icon = button.querySelector('.material-icons');
            
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (icon) icon.style.display = 'none';
            
            try {
                console.log('Chiamando signInWithGoogle...');
                const result = await signInWithGoogle();
                console.log('Risultato signInWithGoogle:', result);
                hideLoginModal();
            } catch (error) {
                console.error('Errore durante l\'accesso:', error);
                // Mostra errore all'utente
                const errorDiv = document.getElementById('auth-error');
                if (errorDiv) {
                    errorDiv.textContent = 'Errore durante l\'accesso. Riprova.';
                    errorDiv.style.display = 'block';
                }
            } finally {
                button.disabled = false;
                if (spinner) spinner.style.display = 'none';
                if (icon) icon.style.display = 'inline-block';
            }
        }
    });
}

function showLoginModal() {
    // Crea il modal se non esiste
    let modalElement = document.getElementById('auth-modal');
    if (!modalElement) {
        // Crea il modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = authModalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        modalElement = document.getElementById('auth-modal');
    }
    
    // Nascondi eventuali messaggi di errore
    const errorDiv = document.getElementById('auth-error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    const modal = new Modal(modalElement);
    modal.show();
}

function hideLoginModal() {
    const modalElement = document.getElementById('auth-modal');
    if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
}

// Inizializza i listener quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthEventListeners);
} else {
    initAuthEventListeners();
}
