// src/js/auth-ui.js
import { signInWithGoogle, signOut, currentUser } from './services/authService.js';

export function updateAuthUI(session) {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    // Rimuovi vecchi listener clonando il nodo. È un modo semplice e robusto.
    const newAuthContainer = authContainer.cloneNode(false);
    authContainer.parentNode.replaceChild(newAuthContainer, authContainer);

    if (session) {
        // Se c'è una sessione, il profilo dovrebbe essere in currentUser
        const userRole = currentUser.profile?.role || 'caricamento...';
        const userEmail = session.user.email;

        newAuthContainer.innerHTML = `
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
        newAuthContainer.innerHTML = `
            <button id="login-modal-trigger" class="btn btn-outline-light">
                <i class="material-icons me-1" style="font-size: 1em;">login</i>
                Accedi
            </button>
        `;
    }
}

function initAuthEventListeners() {
    // Usa la delegazione di eventi sul body per gestire i click
    document.body.addEventListener('click', async (event) => {
        if (event.target.closest('#logout-button')) {
            await signOut();
        }
        if (event.target.closest('#login-modal-trigger')) {
            createAuthModal();
        }
    });
}

// Inizializza i listener globali una sola volta all'avvio del modulo
initAuthEventListeners();

async function createAuthModal() {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        // Se esiste già un modale, non fare nulla o mostralo di nuovo
        const modal = bootstrap.Modal.getInstance(existingModal);
        if (modal) {
            modal.show();
        }
        return;
    }
    
    try {
        const response = await fetch('views/auth-modal.html');
        if (!response.ok) throw new Error('auth-modal.html non trovato');
        
        const modalHTML = await response.text();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        setupModalEventListeners();

        const modalElement = document.getElementById('auth-modal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Assicura che il modale venga rimosso dal DOM quando è nascosto
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    } catch (error) {
        console.error("Errore nella creazione del modale di autenticazione:", error);
    }
}

function setupModalEventListeners() {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const originalText = googleBtn.innerHTML;
            
            googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connessione...';
            googleBtn.disabled = true;
            
            const result = await signInWithGoogle();
            
            if (!result.success) {
                googleBtn.innerHTML = originalText;
                googleBtn.disabled = false;
                const errorDiv = document.getElementById('auth-error');
                if (errorDiv) {
                    errorDiv.textContent = result.error;
                    errorDiv.style.display = 'block';
                }
            }
        });
    }
}