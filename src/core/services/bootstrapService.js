// src/core/services/bootstrapService.js

/**
 * Servizio centralizzato per gestire Bootstrap
 * Importa solo i componenti effettivamente utilizzati per ottimizzare il bundle
 */

// Importa solo i componenti Bootstrap effettivamente utilizzati nell'app
// Modal: utilizzato in ConfirmModal, AuthUI, modalService
// Collapse: utilizzato in ErrorMessage per mostrare/nascondere dettagli errore
import { Modal, Collapse } from 'bootstrap';

// Esporta i componenti per uso in altri moduli
export { Modal, Collapse };

// Rende Bootstrap disponibile globalmente se necessario
if (typeof window !== 'undefined') {
    window.bootstrap = { Modal, Collapse };
}
