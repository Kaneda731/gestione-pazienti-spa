// src/core/services/bootstrapService.js

/**
 * Servizio centralizzato per gestire Bootstrap
 * Importa solo i componenti effettivamente utilizzati per ottimizzare il bundle
 */

// Import only Bootstrap components actually used in the app
// Modal: used in ConfirmModal, AuthUI, modalService
// Collapse: used in ErrorMessage to show/hide error details
import { Modal, Collapse } from 'bootstrap';

// Esporta i componenti per uso in altri moduli
export { Modal };

// Rende Bootstrap disponibile globalmente se necessario
if (typeof window !== 'undefined') {
    window.bootstrap = { Modal, Collapse };
}
