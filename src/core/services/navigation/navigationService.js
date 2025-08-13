// src/js/services/navigationService.js
import { navigateTo } from '../../../app/router.js';

/**
 * Inizializza la gestione globale dei pulsanti "Torna al Menu".
 * Utilizza event delegation per gestire tutti i pulsanti con classe .btn-back-menu.
 */
export function initBackToMenuButtons() {
    document.addEventListener('click', (event) => {
        const backButton = event.target.closest('.btn-back-menu');
        
        if (backButton) {
            event.preventDefault();
            
            // Feedback visivo
            backButton.style.transform = 'scale(0.95)';
            backButton.style.transition = 'transform 0.1s ease';
            setTimeout(() => {
                backButton.style.transform = '';
                backButton.style.transition = '';
            }, 150);
            
            const targetView = backButton.getAttribute('data-view') || 'home';
            
            // Pulisci la sessione se si torna alla home
            if (targetView === 'home') {
                sessionStorage.removeItem('editPazienteId');
                sessionStorage.removeItem('formData');
                sessionStorage.removeItem('currentFilters');
            }
            
            // Naviga con un piccolo ritardo
            setTimeout(() => navigateTo(targetView), 100);
        }
    });
}
