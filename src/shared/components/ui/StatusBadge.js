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
        if (!isDimesso) {
            return `<span class="badge bg-success">Attivo</span>`;
        }

        if (this.patient.tipo_dimissione === 'decesso') {
            return `<span class="badge bg-dark">Decesso</span>`;
        }

        return `<span class="badge bg-secondary">Dimesso</span>`;
    }

    /**
     * Renderizza il badge di stato per le card desktop
     * @returns {string} HTML del badge per le card
     */
    renderForCard() {
        const isDimesso = this.patient.data_dimissione;
        const isDecesso = isDimesso && this.patient.tipo_dimissione === 'decesso';
        const statusClass = isDecesso ? 'decesso' : (isDimesso ? 'dimesso' : 'attivo');
        const statusText = isDecesso ? 'Decesso' : (isDimesso ? 'Dimesso' : 'Attivo');

        return `<span class="patient-status ${statusClass}">${statusText}</span>`;
    }

    /**
     * Ottiene la classe CSS per lo stato
     * @returns {string} Classe CSS
     */
    getStatusClass() {
        if (!this.patient.data_dimissione) return 'attivo';
        return this.patient.tipo_dimissione === 'decesso' ? 'decesso' : 'dimesso';
    }

    /**
     * Ottiene il testo dello stato
     * @returns {string} Testo dello stato
     */
    getStatusText() {
        if (!this.patient.data_dimissione) return 'Attivo';
        return this.patient.tipo_dimissione === 'decesso' ? 'Decesso' : 'Dimesso';
    }
}
