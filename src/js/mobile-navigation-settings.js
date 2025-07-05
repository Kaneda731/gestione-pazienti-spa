/**
 * Mobile Navigation Settings
 * Configurazione per la navigazione mobile
 */

class MobileNavigationSettings {
    constructor() {
        this.settings = {
            style: 'fab', // 'fab', 'bottom', 'none'
            enableSwipeGestures: true,
            showPulseAnimation: true,
            position: 'left' // 'left', 'right' per FAB
        };
        
        this.loadSettings();
        this.createSettingsUI();
    }

    loadSettings() {
        const saved = localStorage.getItem('mobileNavSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('mobileNavSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        if (window.mobileNavigation) {
            window.mobileNavigation.switchNavigationStyle(this.settings.style);
            
            // Applica posizione FAB
            if (this.settings.style === 'fab') {
                const fab = document.querySelector('.fab-back-menu');
                if (fab) {
                    fab.style.left = this.settings.position === 'left' ? '20px' : 'auto';
                    fab.style.right = this.settings.position === 'right' ? '20px' : 'auto';
                }
            }
        }
    }

    createSettingsUI() {
        // Aggiungi pulsante per aprire impostazioni (solo su mobile)
        if (window.innerWidth <= 768) {
            this.addSettingsButton();
        }
    }

    addSettingsButton() {
        // Crea pulsante impostazioni nell'header
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'btn btn-sm btn-outline-light mobile-nav-settings-btn';
        settingsBtn.innerHTML = `
            <span class="material-icons" style="font-size: 18px;">tune</span>
        `;
        settingsBtn.title = 'Impostazioni Navigazione';
        settingsBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1060;
            background: rgba(var(--primary-rgb), 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        settingsBtn.addEventListener('click', () => this.showSettingsModal());
        document.body.appendChild(settingsBtn);
    }

    showSettingsModal() {
        // Crea modal per impostazioni
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <span class="material-icons me-2">navigation</span>
                            Navigazione Mobile
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Stile di Navigazione</label>
                            <div class="nav-style-options">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="navStyle" value="fab" id="navFab">
                                    <label class="form-check-label" for="navFab">
                                        <strong>Floating Button</strong>
                                        <small class="text-muted d-block">Pulsante flottante moderno (Consigliato)</small>
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="navStyle" value="bottom" id="navBottom">
                                    <label class="form-check-label" for="navBottom">
                                        <strong>Barra Inferiore</strong>
                                        <small class="text-muted d-block">Navigazione in stile app nativa</small>
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="navStyle" value="none" id="navNone">
                                    <label class="form-check-label" for="navNone">
                                        <strong>Classica</strong>
                                        <small class="text-muted d-block">Solo pulsanti tradizionali</small>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3" id="fabPosition" style="display: none;">
                            <label class="form-label fw-bold">Posizione Pulsante</label>
                            <div class="btn-group w-100" role="group">
                                <input type="radio" class="btn-check" name="fabPos" value="left" id="posLeft">
                                <label class="btn btn-outline-primary" for="posLeft">Sinistra</label>
                                
                                <input type="radio" class="btn-check" name="fabPos" value="right" id="posRight">
                                <label class="btn btn-outline-primary" for="posRight">Destra</label>
                            </div>
                        </div>
                        
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="enableSwipe">
                            <label class="form-check-label" for="enableSwipe">
                                <strong>Gesti di Swipe</strong>
                                <small class="text-muted d-block">Scorri da destra a sinistra per tornare al menu</small>
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" class="btn btn-primary" id="saveNavSettings">Salva Impostazioni</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Imposta valori correnti
        const styleRadio = modal.querySelector(`input[name="navStyle"][value="${this.settings.style}"]`);
        if (styleRadio) styleRadio.checked = true;
        
        const posRadio = modal.querySelector(`input[name="fabPos"][value="${this.settings.position}"]`);
        if (posRadio) posRadio.checked = true;
        
        const swipeCheck = modal.querySelector('#enableSwipe');
        swipeCheck.checked = this.settings.enableSwipeGestures;
        
        // Mostra/nascondi opzioni posizione
        const togglePositionOptions = () => {
            const fabPosition = modal.querySelector('#fabPosition');
            const selectedStyle = modal.querySelector('input[name="navStyle"]:checked')?.value;
            fabPosition.style.display = selectedStyle === 'fab' ? 'block' : 'none';
        };
        
        modal.querySelectorAll('input[name="navStyle"]').forEach(radio => {
            radio.addEventListener('change', togglePositionOptions);
        });
        togglePositionOptions();
        
        // Gestisci salvataggio
        const saveBtn = modal.querySelector('#saveNavSettings');
        saveBtn.addEventListener('click', () => {
            this.settings.style = modal.querySelector('input[name="navStyle"]:checked')?.value || 'fab';
            this.settings.position = modal.querySelector('input[name="fabPos"]:checked')?.value || 'left';
            this.settings.enableSwipeGestures = swipeCheck.checked;
            
            this.saveSettings();
            
            // Chiudi modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.hide();
            
            // Mostra feedback
            this.showFeedback('Impostazioni salvate!');
        });
        
        // Mostra modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Rimuovi dal DOM quando chiuso
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--success-color);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.style.opacity = '1', 10);
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mobileNavigationSettings = new MobileNavigationSettings();
        
        // Applica impostazioni dopo che la navigazione mobile è stata creata
        setTimeout(() => {
            window.mobileNavigationSettings.applySettings();
        }, 500);
    }, 1000);
});

window.MobileNavigationSettings = MobileNavigationSettings;
