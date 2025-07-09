// src/js/components/ui/StatusBadge.js

/**
 * Componente per renderizzare il badge di stato del paziente
 */
export class StatusBadge {
    constructor(patient) {
        this.patient = patient;
    }

    /**
     * Renderizza il badge di stato
     * @returns {string} HTML del badge
     */
    render() {
        const isDimesso = this.patient.data_dimissione;
        
        if (isDimesso) {
            return `<span class="badge bg-secondary">Dimesso</span>`;
        } else {
            return `<span class="badge bg-success">Attivo</span>`;
        }
    }

    /**
     * Renderizza il badge di stato per le card desktop
     * @returns {string} HTML del badge per le card
     */
    renderForCard() {
        const isDimesso = this.patient.data_dimissione;
        const statusClass = isDimesso ? 'dimesso' : 'attivo';
        const statusText = isDimesso ? 'Dimesso' : 'Attivo';
        
        return `<span class="patient-status ${statusClass}">${statusText}</span>`;
    }

    /**
     * Ottiene la classe CSS per lo stato
     * @returns {string} Classe CSS
     */
    getStatusClass() {
        return this.patient.data_dimissione ? 'dimesso' : 'attivo';
    }

    /**
     * Ottiene il testo dello stato
     * @returns {string} Testo dello stato
     */
    getStatusText() {
        return this.patient.data_dimissione ? 'Dimesso' : 'Attivo';
    }
}
