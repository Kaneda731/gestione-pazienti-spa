// src/shared/utils/helpers.js
import { supabase } from '../../core/services/supabaseClient.js';

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

// Re-export generateId da formatting.js per compatibilità con i test e import centralizzato
export { generateId } from './formatting.js';

/**
 * Recupera le opzioni uniche per un filtro.
 * @param {string} filterName - Il nome del filtro (es. 'reparto_appartenenza', 'diagnosi').
 * @returns {Promise<string[]>} - Una promise che risolve in un array di stringhe.
 */
export async function getFilterOptions(filterName) {
    const { data, error } = await supabase
        .from('pazienti')
        .select(filterName)
        .not(filterName, 'is', null)
        .order(filterName, { ascending: true });

    if (error) {
        console.error(`Errore nel recupero delle opzioni per ${filterName}:`, error);
        return [];
    }
    // Filtra i duplicati usando Set
    const unique = [...new Set(data.map(item => item[filterName]))];
    return unique;
}

/**
 * Popola un elemento <select> con le opzioni fornite.
 * @param {HTMLSelectElement} selectElement - L'elemento select da popolare.
 * @param {string[]} options - L'array di opzioni (stringhe).
 * @param {string} [defaultOptionText='Tutti'] - Il testo per l'opzione di default.
 */
export function populateSelectWithOptions(selectElement, options, defaultOptionText = 'Tutti') {
    if (!selectElement) return;

    const currentValue = selectElement.value;
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
    
    options.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });

    if (options.includes(currentValue)) {
        selectElement.value = currentValue;
    }
}

/**
 * Mostra un messaggio all'utente in un contenitore specifico.
 * @param {string} message - Il testo del messaggio.
 * @param {string} type - Il tipo di messaggio ('success', 'error', 'info').
 * @param {string} containerId - L'ID del contenitore del messaggio.
 */
export function mostraMessaggio(message, type = 'info', containerId = 'messaggio-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertType = type === 'error' ? 'danger' : type;
    const icon = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    }[type];

    container.innerHTML = `
        <div class="alert alert-${alertType} d-flex align-items-center" role="alert">
            <span class="material-icons me-2">${icon}</span>
            <div>${message}</div>
        </div>
    `;
}