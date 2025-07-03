// src/js/utils.js

/**
 * Converte un array di oggetti in una stringa CSV.
 * @param {Array<Object>} data L'array di dati da convertire.
 * @returns {string} La stringa in formato CSV.
 */
export function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = ['Cognome', 'Nome', 'Data Ricovero', 'Data Dimissione', 'Reparto Appartenenza', 'Reparto Provenienza', 'Diagnosi', 'Livello Assistenza', 'Stato'];
    
    const rows = data.map(p => {
        const escape = (str) => {
            if (str === null || str === undefined) return '';
            const s = String(str);
            // Se la stringa contiene virgolette, virgole o newline, la racchiude tra virgolette
            // e raddoppia le virgolette esistenti.
            return s.search(/("|,|\n)/g) >= 0 ? `"${s.replace(/"/g, '""')}"` : s;
        };

        return [
            escape(p.cognome),
            escape(p.nome),
            escape(p.data_ricovero ? new Date(p.data_ricovero).toLocaleDateString('it-IT') : ''),
            escape(p.data_dimissione ? new Date(p.data_dimissione).toLocaleDateString('it-IT') : ''),
            escape(p.reparto_appartenenza),
            escape(p.reparto_provenienza),
            escape(p.diagnosi),
            escape(p.livello_assistenza),
            p.data_dimissione ? 'Dimesso' : 'Attivo'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
}