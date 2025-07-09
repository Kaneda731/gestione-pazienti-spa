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

/**
 * Inizializza tutti i tooltip presenti nella pagina
 */
export function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl));
}

/**
 * Inizializza tutti i dropdown presenti nella pagina
 */
export function initDropdowns() {
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    [...dropdownElementList].map(dropdownToggleEl => new Dropdown(dropdownToggleEl));
}
