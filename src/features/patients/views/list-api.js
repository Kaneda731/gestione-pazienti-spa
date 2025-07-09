// src/features/patients/views/list-api.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { state, domElements } from './list-state-migrated.js';
import { convertToCSV } from '../../../shared/utils/index.js';

const ITEMS_PER_PAGE = 10;

function buildBaseQuery() {
    console.log('🔍 Costruendo query base...');
    
    let query = supabase.from('pazienti').select('*', { count: 'exact' });
    console.log('🔍 Query iniziale creata per tabella "pazienti"');

    if (domElements.searchInput) {
        const searchTerm = domElements.searchInput.value.trim();
        if (searchTerm) {
            console.log('🔍 Applicando filtro ricerca:', searchTerm);
            query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`);
        }
    }
    
    if (domElements.repartoFilter && domElements.repartoFilter.value) {
        console.log('🔍 Applicando filtro reparto:', domElements.repartoFilter.value);
        query = query.eq('reparto_appartenenza', domElements.repartoFilter.value);
    }
    
    if (domElements.diagnosiFilter && domElements.diagnosiFilter.value) {
        console.log('🔍 Applicando filtro diagnosi:', domElements.diagnosiFilter.value);
        query = query.eq('diagnosi', domElements.diagnosiFilter.value);
    }
    
    if (domElements.statoFilter) {
        if (domElements.statoFilter.value === 'attivo') {
            console.log('🔍 Applicando filtro stato: attivo');
            query = query.is('data_dimissione', null);
        } else if (domElements.statoFilter.value === 'dimesso') {
            console.log('🔍 Applicando filtro stato: dimesso');
            query = query.not('data_dimissione', 'is', null);
        }
    }
    
    console.log('✅ Query base costruita con successo');
    return query;
}

export async function fetchPazienti() {
    console.log('📊 Iniziando fetchPazienti...');
    console.log('📊 Stato corrente:', { 
        currentPage: state.currentPage, 
        sortColumn: state.sortColumn, 
        sortDirection: state.sortDirection 
    });
    
    let query = buildBaseQuery();
    console.log('📊 Query base costruita');

    const startIndex = state.currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    console.log('📊 Range paginazione:', { startIndex, endIndex });
    
    query = query.order(state.sortColumn, { ascending: state.sortDirection === 'asc' }).range(startIndex, endIndex);
    console.log('📊 Query finale preparata, eseguendo...');

    const { data, error, count } = await query;
    console.log('📊 Risposta Supabase:', { 
        dataLength: data?.length, 
        count, 
        hasError: !!error 
    });
    
    if (error) {
        console.error('❌ Errore Supabase:', error);
        throw error;
    }
    
    console.log('✅ fetchPazienti completato con successo');
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
