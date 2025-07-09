// src/js/components/ui/index.js

/**
 * Esportazioni centrali per tutti i componenti UI
 */

export { PatientCard } from './PatientCard.js';
export { StatusBadge } from './StatusBadge.js';
export { ActionButtons } from './ActionButtons.js';
export { LoadingSpinner } from './LoadingSpinner.js';
export { ErrorMessage } from './ErrorMessage.js';
export { EmptyState } from './EmptyState.js';
export { ConfirmModal } from './ConfirmModal.js';
export { FormField } from './FormField.js';

/**
 * Utilità per i componenti UI
 */
export const UIUtils = {
    /**
     * Controlla se siamo su dispositivo mobile
     * @returns {boolean} True se mobile
     */
    isMobile() {
        return window.innerWidth <= 767;
    },

    /**
     * Controlla se siamo su tablet
     * @returns {boolean} True se tablet
     */
    isTablet() {
        return window.innerWidth > 767 && window.innerWidth < 1500;
    },

    /**
     * Controlla se siamo su desktop
     * @returns {boolean} True se desktop
     */
    isDesktop() {
        return window.innerWidth >= 1500;
    },

    /**
     * Aggiunge un listener per i cambiamenti di dimensione
     * @param {Function} callback - Funzione da chiamare al cambio
     */
    onResize(callback) {
        window.addEventListener('resize', callback);
    },

    /**
     * Rimuove un listener per i cambiamenti di dimensione
     * @param {Function} callback - Funzione da rimuovere
     */
    offResize(callback) {
        window.removeEventListener('resize', callback);
    },

    /**
     * Debounce una funzione
     * @param {Function} func - Funzione da debounce
     * @param {number} wait - Tempo di attesa in ms
     * @returns {Function} Funzione debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle una funzione
     * @param {Function} func - Funzione da throttle
     * @param {number} limit - Limite di tempo in ms
     * @returns {Function} Funzione throttled
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

/**
 * Componenti renderizzati dinamicamente
 */
export const DynamicComponents = {
    /**
     * Renderizza una lista di pazienti
     * @param {Array} patients - Lista pazienti
     * @param {Object} options - Opzioni di rendering
     * @returns {string} HTML della lista
     */
    renderPatientList(patients, options = {}) {
        if (!patients || patients.length === 0) {
            return new EmptyState.forNoPatients().render();
        }

        const isMobile = UIUtils.isMobile();
        
        return patients.map(patient => {
            const card = new PatientCard(patient, { 
                isMobile, 
                ...options 
            });
            return card.render();
        }).join('');
    },

    /**
     * Renderizza una tabella di pazienti
     * @param {Array} patients - Lista pazienti
     * @param {Object} options - Opzioni di rendering
     * @returns {string} HTML della tabella
     */
    renderPatientTable(patients, options = {}) {
        if (!patients || patients.length === 0) {
            return new EmptyState().renderForTable();
        }

        return patients.map(patient => {
            const card = new PatientCard(patient, options);
            return card.renderTableRow();
        }).join('');
    },

    /**
     * Renderizza lo stato di caricamento
     * @param {string} context - Contesto ('table', 'cards', 'button')
     * @param {Object} options - Opzioni aggiuntive
     * @returns {string} HTML dello stato di caricamento
     */
    renderLoadingState(context, options = {}) {
        const spinner = new LoadingSpinner(options);
        
        switch (context) {
            case 'table':
                return spinner.renderForTable(options.colspan);
            case 'cards':
                return spinner.renderForCards();
            case 'button':
                return spinner.renderForButton();
            default:
                return spinner.render();
        }
    },

    /**
     * Renderizza lo stato di errore
     * @param {Error} error - Errore
     * @param {string} context - Contesto ('table', 'cards', 'inline')
     * @param {Object} options - Opzioni aggiuntive
     * @returns {string} HTML dello stato di errore
     */
    renderErrorState(error, context, options = {}) {
        const errorComponent = new ErrorMessage(error, options);
        
        switch (context) {
            case 'table':
                return errorComponent.renderForTable(options.colspan);
            case 'cards':
                return errorComponent.renderForCards();
            case 'inline':
                return errorComponent.renderCompact();
            default:
                return errorComponent.render();
        }
    }
};
