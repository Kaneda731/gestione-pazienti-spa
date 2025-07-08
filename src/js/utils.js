// src/js/utils.js
import { supabase } from './services/supabaseClient.js';

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

/**
 * Recupera le opzioni uniche per un filtro.
 * Gestisce casi speciali come la tabella 'diagnosi'.
 * @param {string} filterName - Il nome del filtro (es. 'reparto_appartenenza', 'diagnosi').
 * @returns {Promise<string[]>} - Una promise che risolve in un array di stringhe.
 */
export async function getFilterOptions(filterName) {
    try {
        let data, error;

        if (filterName === 'diagnosi') {
            // Caso speciale: carica dalla tabella 'diagnosi'
            ({ data, error } = await supabase.from('diagnosi').select('nome').order('nome', { ascending: true }));
            if (error) throw error;
            return data.map(item => item.nome);
        } else {
            // Comportamento standard: carica valori unici dalla tabella 'pazienti'
            ({ data, error } = await supabase.from('pazienti').select(filterName));
            if (error) throw error;
            return [...new Set(data.map(item => item[filterName]).filter(Boolean))].sort();
        }

    } catch (error) {
        console.error(`Errore durante il recupero delle opzioni per ${filterName}:`, error);
        return []; // Restituisce un array vuoto in caso di errore
    }
}

/**
 * Popola un elemento <select> con le opzioni fornite.
 * @param {HTMLSelectElement} selectElement - L'elemento select da popolare.
 * @param {string[]} options - L'array di opzioni (stringhe).
 * @param {string} [defaultOptionText='Tutti'] - Il testo per l'opzione di default.
 */
export function populateSelectWithOptions(selectElement, options, defaultOptionText = 'Tutti') {
    if (!selectElement) return;

    const currentValue = selectElement.value; // Salva il valore corrente se presente
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
    
    options.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });

    // Ripristina il valore precedente se è ancora valido
    if (options.includes(currentValue)) {
        selectElement.value = currentValue;
    }
}

