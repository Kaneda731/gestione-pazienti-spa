// src/shared/services/modalService.js

/**
 * @deprecated Questo servizio è deprecato. Usa invece ConfirmModal da src/shared/components/ui/ConfirmModal.js
 * 
 * Servizio per gestire i modali Bootstrap in modo sicuro
 * 
 * MIGRAZIONE:
 * - showDeleteConfirmModal() -> ConfirmModal.forDeletion()
 * - showConfirmModal() -> new ConfirmModal() o metodi statici specifici
 */

// Importa Bootstrap Modal dal servizio centralizzato
import { Modal } from '../../core/services/bootstrapService.js';

import { sanitizeHtml } from '../utils/sanitizeHtml.js';

/**
 * Mostra un modal di conferma eliminazione
 * @param {Function} onConfirm - Callback da eseguire quando l'utente conferma
 * @returns {Promise} Promise che si risolve quando il modal viene gestito
 */
export function showDeleteConfirmModal(onConfirm) {
    return new Promise((resolve) => {
        const modalElement = document.getElementById('delete-confirm-modal');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        if (!modalElement || !confirmBtn) {
            console.error('Modal di conferma eliminazione non trovato nel DOM');
            resolve(false);
            return;
        }

        // Verifica se Bootstrap è disponibile
        if (!Modal) {
            console.error('Bootstrap Modal non è disponibile');
            // Fallback: usa confirm del browser
            const result = confirm('Sei sicuro di voler eliminare questo paziente? L\'azione è irreversibile.');
            if (result) {
                onConfirm();
            }
            resolve(result);
            return;
        }

        try {
            const deleteModal = new Modal(modalElement);
            
            // Rimuovi listener precedenti per evitare duplicati
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Aggiungi nuovo listener
            newConfirmBtn.addEventListener('click', async () => {
                try {
                    await onConfirm();
                    deleteModal.hide();
                    resolve(true);
                } catch (error) {
                    console.error('Errore durante l\'eliminazione:', error);
                    resolve(false);
                }
            });

            // Gestisci chiusura modal
            modalElement.addEventListener('hidden.bs.modal', () => {
                resolve(false);
            }, { once: true });

            deleteModal.show();
        } catch (error) {
            console.error('Errore durante l\'apertura del modal:', error);
            // Fallback: usa confirm del browser
            const result = confirm('Sei sicuro di voler eliminare questo paziente? L\'azione è irreversibile.');
            if (result) {
                onConfirm();
            }
            resolve(result);
        }
    });
}

/**
 * Utility per creare modali personalizzati
 * @param {string} title - Titolo del modal
 * @param {string} message - Messaggio del modal
 * @param {string} confirmText - Testo del pulsante di conferma
 * @param {string} cancelText - Testo del pulsante di annulla
 * @returns {Promise<boolean>} Promise che si risolve con true se confermato
 */
export function showConfirmModal(title, message, confirmText = 'Conferma', cancelText = 'Annulla') {
    return new Promise((resolve) => {
        // Create temporary modal
        const modalHtml = `
            <div class="modal fade" id="temp-confirm-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${sanitizeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${sanitizeHtml(message)}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${sanitizeHtml(cancelText)}</button>
                            <button type="button" class="btn btn-danger" id="temp-confirm-btn">${sanitizeHtml(confirmText)}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inserisci nel DOM
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizeHtml(modalHtml);
        document.body.appendChild(tempDiv);

        const modalElement = document.getElementById('temp-confirm-modal');
        const confirmBtn = document.getElementById('temp-confirm-btn');

        if (!Modal) {
            // Fallback
            const result = confirm(message);
            tempDiv.remove();
            resolve(result);
            return;
        }

        try {
            const modal = new Modal(modalElement);

            confirmBtn.addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });

            modalElement.addEventListener('hidden.bs.modal', () => {
                tempDiv.remove();
                resolve(false);
            }, { once: true });

            modal.show();
        } catch (error) {
            console.error('Errore modal:', error);
            const result = confirm(message);
            tempDiv.remove();
            resolve(result);
        }
    });
}
