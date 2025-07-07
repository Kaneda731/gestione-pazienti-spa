// src/js/views/list-api.js
import { supabase } from '../supabase.js';
import { state, domElements } from './list-state.js';
import { convertToCSV } from '../utils.js';

const ITEMS_PER_PAGE = 10;

function buildBaseQuery() {
    let query = supabase.from('pazienti').select('*', { count: 'exact' });

    if (domElements.searchInput) {
        const searchTerm = domElements.searchInput.value.trim();
        if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`);
    }
    if (domElements.repartoFilter && domElements.repartoFilter.value) {
        query = query.eq('reparto_appartenenza', domElements.repartoFilter.value);
    }
    if (domElements.diagnosiFilter && domElements.diagnosiFilter.value) {
        query = query.eq('diagnosi', domElements.diagnosiFilter.value);
    }
    if (domElements.statoFilter) {
        if (domElements.statoFilter.value === 'attivo') query = query.is('data_dimissione', null);
        else if (domElements.statoFilter.value === 'dimesso') query = query.not('data_dimissione', 'is', null);
    }
    
    return query;
}

export async function fetchPazienti() {
    let query = buildBaseQuery();

    const startIndex = state.currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    query = query.order(state.sortColumn, { ascending: state.sortDirection === 'asc' }).range(startIndex, endIndex);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { data, count };
}

export async function exportPazientiToCSV() {
    const originalBtnContent = domElements.exportButton.innerHTML;
    domElements.exportButton.disabled = true;
    domElements.exportButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Esportazione...`;

    try {
        let query = buildBaseQuery().order(state.sortColumn, { ascending: state.sortDirection === 'asc' });

        const { data, error } = await query;
        if (error) throw error;
        if (data.length === 0) {
            alert('Nessun dato da esportare per i filtri selezionati.');
            return;
        }

        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'esportazione_pazienti.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Errore durante l\'esportazione CSV:', error);
        alert(`Errore durante l\'esportazione: ${error.message}`);
    } finally {
        domElements.exportButton.disabled = false;
        domElements.exportButton.innerHTML = originalBtnContent;
    }
}

export async function updatePazienteStatus(pazienteId, isDimissione) {
    const updateData = {
        data_dimissione: isDimissione ? new Date().toISOString().split('T')[0] : null
    };
    try {
        const { data, error } = await supabase
            .from('pazienti')
            .update(updateData)
            .eq('id', pazienteId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            alert('Operazione non riuscita. Il paziente non è stato trovato o non si hanno i permessi per modificarlo.');
            console.warn('Nessuna riga modificata per l-ID:', pazienteId);
            return;
        }
    } catch (error) {
        console.error('Errore durante l\'aggiornamento dello stato del paziente:', error);
        alert(`Errore: ${error.message}`);
    }
}

export async function deletePaziente(pazienteId) {
    try {
        await supabase.from('pazienti').delete().eq('id', pazienteId);
    } catch (error) {
        console.error('Errore eliminazione paziente:', error);
        alert(`Errore: ${error.message}`);
    }
}
