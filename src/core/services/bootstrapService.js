// src/js/services/bootstrapService.js

/**
 * Servizio centralizzato per gestire Bootstrap
 * Importa tutti i componenti necessari
 */

// Importa i componenti Bootstrap che servono nell'app
import { Modal, Tooltip, Dropdown, Collapse } from 'bootstrap';

// Esporta i componenti per uso in altri moduli
export { Modal, Tooltip, Dropdown, Collapse };

// Rende Bootstrap disponibile globalmente se necessario
if (typeof window !== 'undefined') {
    window.bootstrap = { Modal, Tooltip, Dropdown, Collapse };
}
