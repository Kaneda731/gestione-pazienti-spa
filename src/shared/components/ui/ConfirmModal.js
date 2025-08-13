// src/shared/components/ui/ConfirmModal.js

import { Modal } from '../../../core/services/bootstrap/bootstrapService.js';

/**
 * Componente per modali di conferma riutilizzabili
 */
export class ConfirmModal {
    constructor(options = {}) {
        this.options = {
            title: 'Conferma',
            message: 'Sei sicuro di voler continuare?',
            confirmText: 'Conferma',
            cancelText: 'Annulla',
            confirmClass: 'btn-primary',
            icon: 'help',
            ...options
        };
        this.modalId = `confirm-modal-${Date.now()}`;
    }

    /**
     * Mostra il modal di conferma
     * @returns {Promise<boolean>} Promise che si risolve con true se confermato
     */
    show() {
        return new Promise((resolve) => {
            // Crea il modal HTML
            const modalHTML = this.render();
            
            // Aggiungi al DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modalElement = document.getElementById(this.modalId);
            const confirmBtn = modalElement.querySelector('.btn-confirm');
            const cancelBtn = modalElement.querySelector('.btn-cancel');
            
            // Verifica se Bootstrap è disponibile
            if (!Modal) {
                console.error('Bootstrap Modal non è disponibile');
                // Fallback: usa confirm del browser
                const result = confirm(this.options.message);
                modalElement.remove();
                resolve(result);
                return;
            }

            try {
                const modal = new Modal(modalElement);
                
                // Gestisci conferma
                const handleConfirm = () => {
                    modal.hide();
                    resolve(true);
                };
                
                // Gestisci annullamento
                const handleCancel = () => {
                    modal.hide();
                    resolve(false);
                };
                
                // Aggiungi event listeners
                confirmBtn.addEventListener('click', handleConfirm);
                cancelBtn.addEventListener('click', handleCancel);
                
                // Rimuovi il modal dal DOM quando viene nascosto
                modalElement.addEventListener('hidden.bs.modal', () => {
                    modalElement.remove();
                });
                
                // Mostra il modal
                modal.show();
                
            } catch (error) {
                console.error('Errore nella gestione del modal:', error);
                // Fallback
                const result = confirm(this.options.message);
                modalElement.remove();
                resolve(result);
            }
        });
    }

    /**
     * Renderizza il modal
     * @returns {string} HTML del modal
     */
    render() {
        const headerClass = this.options.confirmClass === 'btn-danger' ? '' : 
                           this.options.confirmClass === 'btn-warning' ? 'warning' : 
                           this.options.confirmClass === 'btn-success' ? 'success' : '';
        
        return `
            <div class="modal fade confirm-modal" id="${this.modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header ${headerClass}">
                            <h5 class="modal-title">
                                <span class="material-icons">${this.options.icon}</span>
                                ${this.options.title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>${this.options.message}</p>
                        </div>
                        <div class="modal-footer d-flex justify-content-center">
                            <button type="button" class="btn btn-secondary btn-cancel" data-bs-dismiss="modal">
                                ${this.options.cancelText}
                            </button>
                            <button type="button" class="btn ${this.options.confirmClass} btn-confirm">
                                ${this.options.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Crea un modal per conferma eliminazione
     * @param {string} itemName - Nome dell'elemento da eliminare
     * @returns {ConfirmModal} Istanza del componente
     */
    static forDeletion(itemName = 'questo elemento') {
        return new ConfirmModal({
            title: 'Conferma eliminazione',
            message: `Sei sicuro di voler eliminare ${itemName}? Questa azione non può essere annullata.`,
            confirmText: 'Elimina',
            cancelText: 'Annulla',
            confirmClass: 'btn-danger',
            icon: 'delete'
        });
    }

    /**
     * Crea un modal per conferma dimissione
     * @param {string} patientName - Nome del paziente
     * @returns {ConfirmModal} Istanza del componente
     */
    static forDismissal(patientName) {
        return new ConfirmModal({
            title: 'Conferma dimissione',
            message: `Sei sicuro di voler dimettere il paziente ${patientName}?`,
            confirmText: 'Dimetti',
            cancelText: 'Annulla',
            confirmClass: 'btn-warning',
            icon: 'event_available'
        });
    }

    /**
     * Crea un modal per conferma riattivazione
     * @param {string} patientName - Nome del paziente
     * @returns {ConfirmModal} Istanza del componente
     */
    static forReactivation(patientName) {
        return new ConfirmModal({
            title: 'Conferma riattivazione',
            message: `Sei sicuro di voler riattivare il paziente ${patientName}?`,
            confirmText: 'Riattiva',
            cancelText: 'Annulla',
            confirmClass: 'btn-success',
            icon: 'undo'
        });
    }

    /**
     * Crea un modal per conferma salvataggio
     * @returns {ConfirmModal} Istanza del componente
     */
    static forSaving() {
        return new ConfirmModal({
            title: 'Conferma salvataggio',
            message: 'Sei sicuro di voler salvare le modifiche?',
            confirmText: 'Salva',
            cancelText: 'Annulla',
            confirmClass: 'btn-primary',
            icon: 'save'
        });
    }

    /**
     * Crea un modal per conferma di uscita senza salvare
     * @returns {ConfirmModal} Istanza del componente
     */
    static forUnsavedChanges() {
        return new ConfirmModal({
            title: 'Modifiche non salvate',
            message: 'Ci sono modifiche non salvate. Vuoi uscire senza salvare?',
            confirmText: 'Esci senza salvare',
            cancelText: 'Continua modifica',
            confirmClass: 'btn-warning',
            icon: 'warning'
        });
    }

    /**
     * Crea un modal per conferma eliminazione evento clinico
     * @returns {ConfirmModal} Istanza del componente
     */
    static forClinicalEventDeletion() {
        return new ConfirmModal({
            title: 'Elimina evento clinico',
            message: 'Sei sicuro di voler eliminare questo evento clinico? L\'operazione non può essere annullata.',
            confirmText: 'Elimina',
            cancelText: 'Annulla',
            confirmClass: 'btn-danger',
            icon: 'delete_forever'
        });
    }

    /**
     * Crea un modal per conferma eliminazione diagnosi
     * @returns {ConfirmModal} Istanza del componente
     */
    static forDiagnosisDeletion() {
        return new ConfirmModal({
            title: 'Elimina diagnosi',
            message: 'Sei sicuro di voler eliminare questa diagnosi? L\'operazione non può essere annullata.',
            confirmText: 'Elimina',
            cancelText: 'Annulla',
            confirmClass: 'btn-danger',
            icon: 'delete_forever'
        });
    }
}
