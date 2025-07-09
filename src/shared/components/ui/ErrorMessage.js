// src/js/components/ui/ErrorMessage.js

/**
 * Componente per renderizzare messaggi di errore
 */
export class ErrorMessage {
    constructor(error, options = {}) {
        this.error = error;
        this.options = {
            showDetails: false,
            title: 'Errore',
            canRetry: false,
            retryCallback: null,
            ...options
        };
    }

    /**
     * Renderizza il messaggio di errore
     * @returns {string} HTML del messaggio di errore
     */
    render() {
        const errorText = this.getErrorText();
        const retryButton = this.options.canRetry ? this.renderRetryButton() : '';
        
        return `
            <div class="alert alert-danger" role="alert">
                <div class="d-flex align-items-center">
                    <span class="material-icons me-2">error</span>
                    <div class="flex-grow-1">
                        <strong>${this.options.title}</strong>
                        <div>${errorText}</div>
                        ${this.options.showDetails ? this.renderErrorDetails() : ''}
                    </div>
                    ${retryButton}
                </div>
            </div>
        `;
    }

    /**
     * Renderizza il messaggio di errore per una tabella
     * @param {number} colspan - Numero di colonne
     * @returns {string} HTML del messaggio per tabella
     */
    renderForTable(colspan = 7) {
        const errorText = this.getErrorText();
        
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-danger">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="material-icons me-2">error</span>
                        <div>
                            <strong>${this.options.title}</strong><br>
                            ${errorText}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderizza il messaggio di errore per un contenitore di card
     * @returns {string} HTML del messaggio per card
     */
    renderForCards() {
        const errorText = this.getErrorText();
        const retryButton = this.options.canRetry ? this.renderRetryButton() : '';
        
        return `
            <div class="text-center text-danger p-4">
                <div class="d-flex align-items-center justify-content-center flex-column">
                    <span class="material-icons mb-2" style="font-size: 2rem;">error</span>
                    <div>
                        <strong>${this.options.title}</strong><br>
                        ${errorText}
                    </div>
                    ${retryButton}
                </div>
            </div>
        `;
    }

    /**
     * Renderizza il messaggio di errore compatto
     * @returns {string} HTML del messaggio compatto
     */
    renderCompact() {
        const errorText = this.getErrorText();
        
        return `
            <div class="text-danger small">
                <span class="material-icons me-1" style="font-size: 1em;">error</span>
                ${errorText}
            </div>
        `;
    }

    /**
     * Ottiene il testo dell'errore
     * @returns {string} Testo dell'errore
     */
    getErrorText() {
        if (typeof this.error === 'string') {
            return this.error;
        }
        
        if (this.error?.message) {
            return this.error.message;
        }
        
        return 'Si è verificato un errore imprevisto.';
    }

    /**
     * Renderizza i dettagli dell'errore
     * @returns {string} HTML dei dettagli
     */
    renderErrorDetails() {
        if (!this.options.showDetails || !this.error) return '';
        
        const details = this.error.stack || JSON.stringify(this.error, null, 2);
        
        return `
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#error-details">
                    Mostra dettagli
                </button>
                <div class="collapse mt-2" id="error-details">
                    <pre class="small text-muted">${details}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Renderizza il pulsante di retry
     * @returns {string} HTML del pulsante di retry
     */
    renderRetryButton() {
        return `
            <button class="btn btn-sm btn-outline-primary ms-2" onclick="this.dispatchEvent(new CustomEvent('retry'))">
                <span class="material-icons me-1" style="font-size: 1em;">refresh</span>
                Riprova
            </button>
        `;
    }

    /**
     * Crea un messaggio di errore per caricamento dati
     * @param {Error} error - Errore
     * @returns {ErrorMessage} Istanza del componente
     */
    static forDataLoading(error) {
        return new ErrorMessage(error, {
            title: 'Errore nel caricamento dei dati',
            canRetry: true,
            showDetails: true
        });
    }

    /**
     * Crea un messaggio di errore per operazioni di salvataggio
     * @param {Error} error - Errore
     * @returns {ErrorMessage} Istanza del componente
     */
    static forSaving(error) {
        return new ErrorMessage(error, {
            title: 'Errore durante il salvataggio',
            canRetry: true
        });
    }

    /**
     * Crea un messaggio di errore per operazioni di eliminazione
     * @param {Error} error - Errore
     * @returns {ErrorMessage} Istanza del componente
     */
    static forDeletion(error) {
        return new ErrorMessage(error, {
            title: 'Errore durante l\'eliminazione',
            canRetry: true
        });
    }

    /**
     * Crea un messaggio di errore per validazione
     * @param {string} message - Messaggio di errore
     * @returns {ErrorMessage} Istanza del componente
     */
    static forValidation(message) {
        return new ErrorMessage(message, {
            title: 'Errore di validazione',
            canRetry: false
        });
    }
}
