// src/features/eventi-clinici/components/InfectionEventModal.js

import { Modal } from '../../../core/services/bootstrapService.js';
import { sanitizeHtml } from '../../../shared/utils/domSecurity.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';

/**
 * Componente per un modal dedicato alla creazione di un evento di infezione.
 */
export class InfectionEventModal {
    constructor(options = {}) {
        this.options = {
            title: 'Registra Infezione',
            patientName: '',
            defaultDate: new Date().toISOString().split('T')[0],
            ...options
        };
        this.modalId = `infection-modal-${Date.now()}`;
        this.datepickerInstance = null;
    }

    /**
     * Mostra il modal e restituisce una Promise con i dati inseriti.
     * @returns {Promise<Object|null>} Promise che si risolve con i dati dell'evento o null se annullato.
     */
    show() {
        return new Promise((resolve) => {
            const modalHTML = this.render();
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modalElement = document.getElementById(this.modalId);
            const form = modalElement.querySelector('form');
            const modal = new Modal(modalElement);
            
            // Inizializza il datepicker personalizzato all'interno del modal
            this.datepickerInstance = new CustomDatepicker(`#${this.modalId} [data-datepicker]`, {
                defaultDate: this.options.defaultDate,
                maxDate: "today"
            });

            const handleSubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);

                // Ottieni la data direttamente dall'istanza di flatpickr per averla nel formato corretto
                const selectedDate = this.datepickerInstance.instances[0]?.selectedDates[0];
                const formattedDate = selectedDate 
                    ? selectedDate.toISOString().split('T')[0] // Formato YYYY-MM-DD
                    : null;

                const data = {
                    data_evento: formattedDate,
                    agente_patogeno: formData.get('agente_patogeno'),
                    descrizione: formData.get('descrizione')
                };

                // Semplice validazione
                if (!data.agente_patogeno) {
                    alert('L\'agente patogeno è obbligatorio.');
                    return;
                }

                if (!data.data_evento) {
                    alert('La data di infezione è obbligatoria.');
                    return;
                }

                modal.hide();
                resolve(data);
            };

            const handleCancel = () => {
                modal.hide();
                resolve(null);
            };

            form.addEventListener('submit', handleSubmit);
            modalElement.addEventListener('hidden.bs.modal', () => {
                // Distruggi l'istanza del datepicker per pulire le risorse
                if (this.datepickerInstance) {
                    this.datepickerInstance.destroy();
                }
                modalElement.remove();
                // Se il modal viene chiuso senza submit (es. con ESC o click esterno), consideralo un annullamento.
                resolve(null); 
            });

            modal.show();
        });
    }

    render() {
        const title = this.options.patientName 
            ? `${this.options.title} per <strong>${sanitizeHtml(this.options.patientName)}</strong>`
            : this.options.title;

        return `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="infectionModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <form>
                            <div class="modal-header">
                                <h5 class="modal-title" id="infectionModalLabel">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="data_evento" class="form-label">Data Infezione</label>
                                    <div class="input-group-icon">
                                        <input type="text" class="form-control" id="data_evento" name="data_evento" data-datepicker placeholder="gg/mm/aaaa" required>
                                        <span class="material-icons input-icon">calendar_today</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="agente_patogeno" class="form-label">Agente Patogeno</label>
                                    <input type="text" class="form-control" id="agente_patogeno" name="agente_patogeno" placeholder="Es. Staphylococcus aureus" required>
                                </div>
                                <div class="mb-3">
                                    <label for="descrizione" class="form-label">Descrizione (opzionale)</label>
                                    <textarea class="form-control" id="descrizione" name="descrizione" rows="3" placeholder="Dettagli aggiuntivi sull'infezione..."></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                <button type="submit" class="btn btn-primary">Salva Evento</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}