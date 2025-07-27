// src/js/components/ui/ActionButtons.js

/**
 * Componente per renderizzare i pulsanti di azione del paziente
 */
export class ActionButtons {
    constructor(patient, options = {}) {
        this.patient = patient;
        this.options = {
            isMobile: false,
            isTable: false,
            ...options
        };
    }

    /**
     * Renderizza i pulsanti di azione
     * @returns {string} HTML dei pulsanti
     */
    render() {
        const isDimesso = this.patient.data_dimissione;
        
        if (this.options.isTable) {
            return this.renderTableButtons(isDimesso);
        } else if (this.options.isMobile) {
            return this.renderMobileButtons(isDimesso);
        } else {
            return this.renderDesktopButtons(isDimesso);
        }
    }

    /**
     * Renderizza i pulsanti per la tabella
     * @param {boolean} isDimesso - Se il paziente è dimesso
     * @returns {string} HTML dei pulsanti per la tabella
     */
    renderTableButtons(isDimesso) {
        const actionButton = isDimesso
            ? `<button class="btn btn-sm btn-outline-success" data-action="riattiva" data-id="${this.patient.id}" title="Riattiva Paziente">
                 <span class="material-icons" style="font-size: 1.1em; pointer-events: none;">undo</span>
               </button>`
            : `<button class="btn btn-sm btn-outline-warning" data-action="dimetti" data-id="${this.patient.id}" title="Dimetti Paziente">
                 <span class="material-icons" style="font-size: 1.1em; pointer-events: none;">event_available</span>
               </button>`;
        
        return `
            <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${this.patient.id}" title="Modifica">
                <span class="material-icons" style="font-size: 1.1em; pointer-events: none;">edit</span>
            </button>
            ${actionButton}
            <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${this.patient.id}" title="Elimina">
                <span class="material-icons" style="font-size: 1.1em; pointer-events: none;">delete</span>
            </button>
        `;
    }

    /**
     * Renderizza i pulsanti per dispositivi mobili
     * @param {boolean} isDimesso - Se il paziente è dimesso
     * @returns {string} HTML dei pulsanti per mobile
     */
    renderMobileButtons(isDimesso) {
        const dimissioneButton = isDimesso
            ? `<button class="btn btn-outline-success mobile-action-btn" data-action="riattiva" data-id="${this.patient.id}" title="Riattiva">
                 <span class="material-icons">undo</span>
                 <span class="mobile-btn-text">Riattiva</span>
               </button>`
            : `<button class="btn btn-outline-warning mobile-action-btn" data-action="dimetti" data-id="${this.patient.id}" title="Dimetti">
                 <span class="material-icons">event_available</span>
                 <span class="mobile-btn-text">Dimetti</span>
               </button>`;
        
        return `
            <button class="btn btn-outline-primary mobile-action-btn" data-action="edit" data-id="${this.patient.id}" title="Modifica">
                <span class="material-icons">edit</span>
                <span class="mobile-btn-text">Modifica</span>
            </button>
            ${dimissioneButton}
            <button class="btn btn-outline-danger mobile-action-btn" data-action="delete" data-id="${this.patient.id}" title="Elimina">
                <span class="material-icons">delete</span>
                <span class="mobile-btn-text">Elimina</span>
            </button>
        `;
    }

    /**
     * Renderizza i pulsanti per desktop
     * @param {boolean} isDimesso - Se il paziente è dimesso
     * @returns {string} HTML dei pulsanti per desktop
     */
    renderDesktopButtons(isDimesso) {
        const dimissioneButton = isDimesso
            ? `<button class="btn btn-outline-success" data-action="riattiva" data-id="${this.patient.id}" title="Riattiva Paziente">
                 <span class="material-icons me-1" style="font-size: 1em;">undo</span>Riattiva
               </button>`
            : `<button class="btn btn-outline-warning" data-action="dimetti" data-id="${this.patient.id}" title="Dimetti Paziente">
                 <span class="material-icons me-1" style="font-size: 1em;">event_available</span>Dimetti
               </button>`;

        return `
            <button class="btn btn-outline-primary" data-action="edit" data-id="${this.patient.id}">
                <span class="material-icons me-1" style="font-size: 1em;">edit</span>Modifica
            </button>
            ${dimissioneButton}
            <button class="btn btn-outline-danger" data-action="delete" data-id="${this.patient.id}">
                <span class="material-icons me-1" style="font-size: 1em;">delete</span>Elimina
            </button>
        `;
    }
}
