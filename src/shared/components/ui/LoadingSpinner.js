// src/js/components/ui/LoadingSpinner.js

/**
 * Componente per renderizzare gli spinner di caricamento
 */
export class LoadingSpinner {
    constructor(options = {}) {
        this.options = {
            size: 'normal', // 'small', 'normal', 'large'
            text: 'Caricamento...',
            centered: true,
            ...options
        };
    }

    /**
     * Renderizza lo spinner di caricamento
     * @returns {string} HTML dello spinner
     */
    render() {
        const sizeClass = this.getSizeClass();
        const containerClass = this.options.centered ? 'text-center' : '';
        
        return `
            <div class="${containerClass}">
                <div class="spinner-border ${sizeClass}" role="status">
                    <span class="visually-hidden">${this.options.text}</span>
                </div>
                ${this.options.text ? `<div class="mt-2">${this.options.text}</div>` : ''}
            </div>
        `;
    }

    /**
     * Renderizza lo spinner per una tabella
     * @param {number} colspan - Numero di colonne
     * @returns {string} HTML dello spinner per tabella
     */
    renderForTable(colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center">
                    <div class="spinner-border"></div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderizza lo spinner per un contenitore di card
     * @returns {string} HTML dello spinner per card
     */
    renderForCards() {
        return `
            <div class="text-center p-4">
                <div class="spinner-border"></div>
                ${this.options.text ? `<div class="mt-2">${this.options.text}</div>` : ''}
            </div>
        `;
    }

    /**
     * Renderizza lo spinner per un pulsante
     * @returns {string} HTML dello spinner per pulsante
     */
    renderForButton() {
        return `<span class="spinner-border spinner-border-sm me-2"></span>`;
    }

    /**
     * Ottiene la classe CSS per la dimensione
     * @returns {string} Classe CSS
     */
    getSizeClass() {
        switch (this.options.size) {
            case 'small':
                return 'spinner-border-sm';
            case 'large':
                return 'spinner-border-lg';
            default:
                return '';
        }
    }

    /**
     * Crea uno spinner inline per i pulsanti
     * @param {string} text - Testo da mostrare
     * @returns {string} HTML dello spinner inline
     */
    static forButton(text = 'Caricamento...') {
        return `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
    }

    /**
     * Crea uno spinner per tabelle
     * @param {number} colspan - Numero di colonne
     * @returns {string} HTML dello spinner per tabella
     */
    static forTable(colspan = 7) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center">
                    <div class="spinner-border"></div>
                </td>
            </tr>
        `;
    }

    /**
     * Crea uno spinner per contenitori di card
     * @param {string} text - Testo da mostrare
     * @returns {string} HTML dello spinner per card
     */
    static forCards(text = '') {
        return `
            <div class="text-center p-4">
                <div class="spinner-border"></div>
                ${text ? `<div class="mt-2">${text}</div>` : ''}
            </div>
        `;
    }
}
