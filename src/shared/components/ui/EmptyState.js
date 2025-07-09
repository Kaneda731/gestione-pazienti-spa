// src/js/components/ui/EmptyState.js

/**
 * Componente per renderizzare stati vuoti
 */
export class EmptyState {
    constructor(options = {}) {
        this.options = {
            title: 'Nessun dato trovato',
            description: '',
            icon: 'inbox',
            actionText: '',
            actionCallback: null,
            ...options
        };
    }

    /**
     * Renderizza lo stato vuoto
     * @returns {string} HTML dello stato vuoto
     */
    render() {
        const actionButton = this.options.actionText ? this.renderActionButton() : '';
        
        return `
            <div class="text-center text-muted py-5">
                <span class="material-icons mb-3" style="font-size: 4rem; opacity: 0.5;">${this.options.icon}</span>
                <h5>${this.options.title}</h5>
                ${this.options.description ? `<p>${this.options.description}</p>` : ''}
                ${actionButton}
            </div>
        `;
    }

    /**
     * Renderizza lo stato vuoto per una tabella
     * @param {number} colspan - Numero di colonne
     * @returns {string} HTML dello stato vuoto per tabella
     */
    renderForTable(colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center text-muted py-4">
                    <div class="d-flex align-items-center justify-content-center flex-column">
                        <span class="material-icons mb-2" style="font-size: 2rem; opacity: 0.5;">${this.options.icon}</span>
                        <div>${this.options.title}</div>
                        ${this.options.description ? `<small>${this.options.description}</small>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderizza lo stato vuoto per un contenitore di card
     * @returns {string} HTML dello stato vuoto per card
     */
    renderForCards() {
        const actionButton = this.options.actionText ? this.renderActionButton() : '';
        
        return `
            <div class="text-center text-muted p-4">
                <div class="d-flex align-items-center justify-content-center flex-column">
                    <span class="material-icons mb-3" style="font-size: 3rem; opacity: 0.5;">${this.options.icon}</span>
                    <h6>${this.options.title}</h6>
                    ${this.options.description ? `<p class="small">${this.options.description}</p>` : ''}
                    ${actionButton}
                </div>
            </div>
        `;
    }

    /**
     * Renderizza lo stato vuoto compatto
     * @returns {string} HTML dello stato vuoto compatto
     */
    renderCompact() {
        return `
            <div class="text-center text-muted py-3">
                <span class="material-icons me-2" style="font-size: 1.5rem; opacity: 0.5;">${this.options.icon}</span>
                <span>${this.options.title}</span>
            </div>
        `;
    }

    /**
     * Renderizza il pulsante di azione
     * @returns {string} HTML del pulsante di azione
     */
    renderActionButton() {
        return `
            <button class="btn btn-primary mt-3" onclick="this.dispatchEvent(new CustomEvent('action'))">
                ${this.options.actionText}
            </button>
        `;
    }

    /**
     * Crea uno stato vuoto per nessun paziente
     * @returns {EmptyState} Istanza del componente
     */
    static forNoPatients() {
        return new EmptyState({
            title: 'Nessun paziente trovato',
            description: 'Non ci sono pazienti che corrispondono ai criteri di ricerca.',
            icon: 'person_off',
            actionText: 'Aggiungi nuovo paziente',
        });
    }

    /**
     * Crea uno stato vuoto per nessuna diagnosi
     * @returns {EmptyState} Istanza del componente
     */
    static forNoDiagnosis() {
        return new EmptyState({
            title: 'Nessuna diagnosi trovata',
            description: 'Non ci sono diagnosi disponibili nel sistema.',
            icon: 'medical_services',
            actionText: 'Aggiungi diagnosi',
        });
    }

    /**
     * Crea uno stato vuoto per ricerca
     * @param {string} searchTerm - Termine di ricerca
     * @returns {EmptyState} Istanza del componente
     */
    static forSearchResults(searchTerm) {
        return new EmptyState({
            title: 'Nessun risultato',
            description: `Nessun paziente corrisponde alla ricerca "${searchTerm}".`,
            icon: 'search_off',
        });
    }

    /**
     * Crea uno stato vuoto per filtri
     * @returns {EmptyState} Istanza del componente
     */
    static forFilteredResults() {
        return new EmptyState({
            title: 'Nessun risultato',
            description: 'Nessun paziente corrisponde ai filtri applicati.',
            icon: 'filter_list_off',
            actionText: 'Rimuovi filtri',
        });
    }
}
