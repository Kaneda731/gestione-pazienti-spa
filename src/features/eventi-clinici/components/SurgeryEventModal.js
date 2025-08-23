/**
 * Modal per la raccolta dati di un evento di intervento chirurgico
 * Simile a InfectionEventModal ma per interventi
 */

import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';

export class SurgeryEventModal {
    constructor(options = {}) {
        this.options = {
            title: 'Dati Intervento Chirurgico',
            patientName: '',
            defaultDate: new Date().toISOString().split('T')[0],
            ...options
        };
        
        this.modal = null;
        this.datepicker = null;
        this.resolve = null;
        this.reject = null;
    }

    /**
     * Mostra la modal e restituisce una Promise con i dati dell'intervento
     * @returns {Promise<Object|null>} Dati dell'intervento o null se annullato
     */
    show() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.createModal();
            this.showModal();
        });
    }

    /**
     * Crea la struttura HTML della modal
     */
    createModal() {
        const modalId = 'surgery-event-modal';
        
        // Rimuovi modal esistente se presente
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="${modalId}-label">
                                <span class="material-icons me-2">medical_services</span>
                                ${this.options.title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
                        </div>
                        <div class="modal-body">
                            ${this.options.patientName ? `
                                <div class="alert alert-info d-flex align-items-center mb-3">
                                    <span class="material-icons me-2">person</span>
                                    <span><strong>Paziente:</strong> ${sanitizeHtml(this.options.patientName)}</span>
                                </div>
                            ` : ''}
                            
                            <form id="surgery-event-form">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label for="surgery-data-evento" class="form-label">
                                            Data Intervento <span class="text-danger">*</span>
                                        </label>
                                        <div class="input-group-icon">
                                            <input
                                                type="text"
                                                class="form-control"
                                                id="surgery-data-evento"
                                                name="data_evento"
                                                data-datepicker
                                                placeholder="gg/mm/aaaa"
                                                required
                                            />
                                            <span class="material-icons input-icon">calendar_today</span>
                                        </div>
                                        <small class="form-text text-muted">
                                            Data in cui è stato eseguito l'intervento
                                        </small>
                                    </div>

                                    <div class="col-md-6">
                                        <label for="surgery-tipo-intervento" class="form-label">
                                            Tipo Intervento <span class="text-danger">*</span>
                                        </label>
                                        <select
                                            class="form-select"
                                            id="surgery-tipo-intervento"
                                            name="tipo_intervento"
                                            data-custom="true"
                                            required
                                        >
                                            <option value="">Seleziona tipo...</option>
                                            <option value="Chirurgia Ortopedica">Chirurgia Ortopedica</option>
                                            <option value="Chirurgia Plastica">Chirurgia Plastica</option>
                                            <option value="Chirurgia Vascolare">Chirurgia Vascolare</option>
                                            <option value="Chirurgia Generale">Chirurgia Generale</option>
                                            <option value="Chirurgia Cardiaca">Chirurgia Cardiaca</option>
                                            <option value="Neurochirurgia">Neurochirurgia</option>
                                            <option value="Chirurgia Toracica">Chirurgia Toracica</option>
                                            <option value="Altro">Altro</option>
                                        </select>
                                    </div>

                                    <div class="col-12">
                                        <label for="surgery-descrizione" class="form-label">
                                            Descrizione Intervento
                                        </label>
                                        <textarea
                                            class="form-control"
                                            id="surgery-descrizione"
                                            name="descrizione"
                                            rows="3"
                                            placeholder="Descrizione dettagliata dell'intervento eseguito..."
                                        ></textarea>
                                        <small class="form-text text-muted">
                                            Descrizione opzionale dell'intervento
                                        </small>
                                    </div>

                                    <!-- Sezione Infezione Post-Operatoria -->
                                    <div class="col-12">
                                        <hr class="my-3">
                                        <h6 class="mb-3">
                                            <span class="material-icons me-2">coronavirus</span>
                                            Infezione Post-Operatoria
                                        </h6>
                                        
                                        <div class="form-check form-switch mb-3">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                id="surgery-has-infection"
                                                name="has_infection"
                                            />
                                            <label class="form-check-label" for="surgery-has-infection">
                                                Paziente ha sviluppato infezione post-operatoria
                                            </label>
                                        </div>

                                        <!-- Campi Infezione (nascosti di default) -->
                                        <div id="surgery-infection-fields" class="d-none">
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <label for="surgery-data-infezione" class="form-label">
                                                        Data Inizio Infezione
                                                    </label>
                                                    <div class="input-group-icon">
                                                        <input
                                                            type="text"
                                                            class="form-control"
                                                            id="surgery-data-infezione"
                                                            name="data_infezione"
                                                            data-datepicker
                                                            placeholder="gg/mm/aaaa"
                                                        />
                                                        <span class="material-icons input-icon">calendar_today</span>
                                                    </div>
                                                </div>

                                                <div class="col-md-6">
                                                    <label for="surgery-agente-patogeno" class="form-label">
                                                        Agente Patogeno
                                                    </label>
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        id="surgery-agente-patogeno"
                                                        name="agente_patogeno"
                                                        placeholder="Es. Staphylococcus aureus"
                                                    />
                                                </div>

                                                <div class="col-12">
                                                    <label for="surgery-descrizione-infezione" class="form-label">
                                                        Descrizione Infezione
                                                    </label>
                                                    <textarea
                                                        class="form-control"
                                                        id="surgery-descrizione-infezione"
                                                        name="descrizione_infezione"
                                                        rows="2"
                                                        placeholder="Descrizione dell'infezione post-operatoria..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <span class="material-icons me-1">cancel</span>
                                Annulla
                            </button>
                            <button type="button" class="btn btn-primary" id="surgery-save-btn">
                                <span class="material-icons me-1">save</span>
                                Salva Dati
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById(modalId);
        
        this.setupEventListeners();
        this.initializeComponents();
    }

    /**
     * Configura gli event listener della modal
     */
    setupEventListeners() {
        // Pulsante salva
        const saveBtn = this.modal.querySelector('#surgery-save-btn');
        saveBtn.addEventListener('click', () => this.handleSave());

        // Checkbox infezione
        const hasInfectionCheckbox = this.modal.querySelector('#surgery-has-infection');
        hasInfectionCheckbox.addEventListener('change', (e) => {
            this.toggleInfectionFields(e.target.checked);
        });

        // Gestione chiusura modal
        this.modal.addEventListener('hidden.bs.modal', () => {
            if (this.resolve) {
                this.resolve(null); // Restituisce null se la modal viene chiusa senza salvare
            }
            this.cleanup();
        });

        // Gestione invio form con Enter
        const form = this.modal.querySelector('#surgery-event-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    }

    /**
     * Inizializza i componenti della modal
     */
    initializeComponents() {
        // Inizializza datepicker
        this.datepicker = new CustomDatepicker('#surgery-data-evento, #surgery-data-infezione', {
            dateFormat: "d/m/Y",
            allowInput: true,
            maxDate: "today"
        });

        // Inizializza custom select
        initCustomSelects('#surgery-tipo-intervento');

        // Imposta data di default
        const dataEventoInput = this.modal.querySelector('#surgery-data-evento');
        if (this.options.defaultDate) {
            const [year, month, day] = this.options.defaultDate.split('-');
            dataEventoInput.value = `${day}/${month}/${year}`;
        }
    }

    /**
     * Mostra/nasconde i campi dell'infezione
     * @param {boolean} show - Se mostrare i campi
     */
    toggleInfectionFields(show) {
        const infectionFields = this.modal.querySelector('#surgery-infection-fields');
        if (show) {
            infectionFields.classList.remove('d-none');
            
            // Imposta data infezione di default (stesso giorno dell'intervento o successivo)
            const dataInterventoInput = this.modal.querySelector('#surgery-data-evento');
            const dataInfezioneInput = this.modal.querySelector('#surgery-data-infezione');
            
            if (dataInterventoInput.value && !dataInfezioneInput.value) {
                dataInfezioneInput.value = dataInterventoInput.value;
            }
        } else {
            infectionFields.classList.add('d-none');
            
            // Pulisci i campi infezione
            this.modal.querySelector('#surgery-data-infezione').value = '';
            this.modal.querySelector('#surgery-agente-patogeno').value = '';
            this.modal.querySelector('#surgery-descrizione-infezione').value = '';
        }
    }

    /**
     * Mostra la modal
     */
    showModal() {
        const bootstrapModal = new bootstrap.Modal(this.modal, {
            backdrop: 'static',
            keyboard: false
        });
        bootstrapModal.show();
    }

    /**
     * Gestisce il salvataggio dei dati
     */
    handleSave() {
        const formData = this.getFormData();
        
        // Validazione
        const validation = this.validateData(formData);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // Chiudi modal e restituisci i dati
        const bootstrapModal = bootstrap.Modal.getInstance(this.modal);
        bootstrapModal.hide();
        
        if (this.resolve) {
            this.resolve(formData);
            this.resolve = null;
        }
    }

    /**
     * Raccoglie i dati dal form
     * @returns {Object} Dati dell'intervento
     */
    getFormData() {
        const form = this.modal.querySelector('#surgery-event-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Converti data da dd/mm/yyyy a yyyy-mm-dd
        if (data.data_evento && data.data_evento.includes('/')) {
            const [day, month, year] = data.data_evento.split('/');
            data.data_evento = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Gestisci dati infezione se presenti
        const hasInfection = this.modal.querySelector('#surgery-has-infection').checked;
        if (hasInfection) {
            data.has_infection = true;
            
            // Converti data infezione
            if (data.data_infezione && data.data_infezione.includes('/')) {
                const [day, month, year] = data.data_infezione.split('/');
                data.data_infezione = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        } else {
            data.has_infection = false;
            delete data.data_infezione;
            delete data.agente_patogeno;
            delete data.descrizione_infezione;
        }

        return data;
    }

    /**
     * Valida i dati dell'intervento
     * @param {Object} data - Dati da validare
     * @returns {Object} Risultato della validazione
     */
    validateData(data) {
        const errors = [];

        // Validazione campi obbligatori
        if (!data.data_evento) {
            errors.push('La data dell\'intervento è obbligatoria');
        }

        if (!data.tipo_intervento) {
            errors.push('Il tipo di intervento è obbligatorio');
        }

        // Validazione data intervento
        if (data.data_evento) {
            const dataIntervento = new Date(data.data_evento);
            const oggi = new Date();
            oggi.setHours(23, 59, 59, 999);

            if (isNaN(dataIntervento.getTime())) {
                errors.push('Data intervento non valida');
            } else if (dataIntervento > oggi) {
                errors.push('La data dell\'intervento non può essere nel futuro');
            }
        }

        // Validazione infezione se presente
        if (data.has_infection) {
            if (!data.data_infezione) {
                errors.push('La data di inizio infezione è obbligatoria se si indica un\'infezione');
            } else {
                const dataInfezione = new Date(data.data_infezione);
                const dataIntervento = new Date(data.data_evento);

                if (isNaN(dataInfezione.getTime())) {
                    errors.push('Data infezione non valida');
                } else if (dataInfezione < dataIntervento) {
                    errors.push('La data dell\'infezione non può essere precedente all\'intervento');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Mostra gli errori di validazione
     * @param {Array} errors - Lista degli errori
     */
    showValidationErrors(errors) {
        // Rimuovi messaggi di errore esistenti
        this.modal.querySelectorAll('.validation-error').forEach(el => el.remove());

        // Aggiungi nuovo messaggio di errore
        const errorHTML = `
            <div class="alert alert-danger validation-error">
                <strong>Errori di validazione:</strong>
                <ul class="mb-0 mt-2">
                    ${errors.map(error => `<li>${sanitizeHtml(error)}</li>`).join('')}
                </ul>
            </div>
        `;

        const modalBody = this.modal.querySelector('.modal-body');
        modalBody.insertAdjacentHTML('afterbegin', errorHTML);
    }

    /**
     * Pulisce le risorse della modal
     */
    cleanup() {
        if (this.datepicker) {
            this.datepicker.destroy();
            this.datepicker = null;
        }

        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }

        this.resolve = null;
        this.reject = null;
    }
}