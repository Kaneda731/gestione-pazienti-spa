// src/features/eventi-clinici/components/ResolveInfectionModal.js

import { Modal } from '../../../core/services/bootstrap/bootstrapService.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';

/**
 * Componente per un modal dedicato alla risoluzione di un evento di infezione.
 */
export class ResolveInfectionModal {
    constructor(options = {}) {
        this.options = {
            eventoId: null,
            title: 'Risolvi Infezione',
            defaultDate: new Date(), // Passa direttamente un oggetto Date invece di stringa ISO
            minDate: options.minDate ? new Date(options.minDate) : null, // Converti minDate in oggetto Date
            ...options
        };
        this.modalId = `resolve-infection-modal-${Date.now()}`;
        this.datepickerInstance = null;
    }

    /**
     * Mostra il modal e restituisce una Promise con la data di fine.
     * @returns {Promise<string|null>} Promise che si risolve con la data o null se annullato.
     */
    show() {
        return new Promise((resolve) => {
            const modalHTML = this.render();
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modalElement = document.getElementById(this.modalId);
            const form = modalElement.querySelector('form');
            const modal = new Modal(modalElement);

            this.datepickerInstance = new CustomDatepicker(`#${this.modalId} [data-datepicker]`, {
                defaultDate: this.options.defaultDate,
                minDate: this.options.minDate,
                maxDate: "today"
            });

            const handleSubmit = (e) => {
                e.preventDefault();
                const selectedDate = this.datepickerInstance.instances[0]?.selectedDates[0];
                const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : null;

                if (!formattedDate) {
                    // alert('La data di risoluzione è obbligatoria.');
                    this.showError('La data di risoluzione è obbligatoria.');
                    return;
                }

                this._defocus(modalElement);
                modal.hide();
                resolve(formattedDate);
            };

            form.addEventListener('submit', handleSubmit);
            // Defocus quando il modal sta per nascondersi (es. tramite btn-close o ESC)
            modalElement.addEventListener('hide.bs.modal', () => {
                this._defocus(modalElement);
            });
            modalElement.addEventListener('hidden.bs.modal', () => {
                if (this.datepickerInstance) this.datepickerInstance.destroy();
                modalElement.remove();
                resolve(null);
            });

            modal.show();
        });
    }

    render() {
        return `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="resolveModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <form>
                            <div class="modal-header">
                                <h5 class="modal-title" id="resolveModalLabel">${this.options.title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>Inserisci la data in cui l'infezione è stata risolta.</p>
                                <label for="data_fine_evento" class="form-label">Data Risoluzione</label>
                                <div class="input-group-icon">
                                    <input type="text" class="form-control" id="data_fine_evento" name="data_fine_evento" data-datepicker placeholder="gg/mm/aaaa" required>
                                    <span class="material-icons input-icon">calendar_today</span>
                                </div>
                                <div id="resolve-modal-message-container" class="mt-2 text-danger small"></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                <button type="submit" class="btn btn-primary">Salva Risoluzione</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rimuove il focus da elementi interni al modal per evitare warning aria-hidden
     */
    _defocus(modalElement) {
        try {
            const active = document.activeElement;
            if (active && modalElement.contains(active) && typeof active.blur === 'function') {
                active.blur();
            }
        } catch {
            // no-op
        }
    }

    showError(message) {
        const messageContainer = document.getElementById('resolve-modal-message-container');
        if (messageContainer) {
            messageContainer.innerHTML = sanitizeHtml(message);
        }
    }

    clearError() {
        this.showError('');
    }
}