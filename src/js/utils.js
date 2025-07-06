// src/js/utils.js
import { supabase } from './supabase.js';

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
 * Popola un elemento <select> con valori unici da una colonna del database.
 * @param {string} columnName - Il nome della colonna da cui prendere i valori.
 * @param {HTMLSelectElement} selectElement - L'elemento select da popolare.
 */
export async function populateFilter(columnName, selectElement) {
    try {
        let data, error;
        
        // Caso speciale per le diagnosi: carica dalla tabella 'diagnosi'
        if (columnName === 'diagnosi') {
            const result = await supabase.from('diagnosi').select('nome').order('nome', { ascending: true });
            data = result.data;
            error = result.error;
            
            if (error) throw error;
            
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            data.forEach(item => {
                selectElement.innerHTML += `<option value="${item.nome}">${item.nome}</option>`;
            });
        } else {
            // Comportamento normale per altri filtri (es. reparto_appartenenza)
            const result = await supabase.from('pazienti').select(columnName);
            data = result.data;
            error = result.error;
            
            if (error) throw error;
            
            const uniqueValues = [...new Set(data.map(item => item[columnName]).filter(Boolean))].sort();
            
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                selectElement.innerHTML += `<option value="${value}">${value}</option>`;
            });
        }
    } catch (error) {
        console.error(`Errore durante il popolamento del filtro ${columnName}:`, error);
        selectElement.innerHTML = `<option value="">Errore nel caricamento</option>`;
    }
}
