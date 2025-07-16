// src/features/patients/views/list-api.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { state, domElements } from './list-state-migrated.js';
import { convertToCSV } from '../../../shared/utils/index.js';
import { patientService } from '../services/patientService.js';
import { logger } from '../../../core/services/loggerService.js';

const ITEMS_PER_PAGE = 10;

function buildBaseQuery() {
    logger.log('🔍 Costruendo query base...');
    
    let query = supabase.from('pazienti').select('*', { count: 'exact' }).not('user_id', 'is', null);
    logger.log('🔍 Query iniziale creata per tabella "pazienti" con filtro user_id not null');

    if (domElements.searchInput) {
        const searchTerm = domElements.searchInput.value.trim();
        if (searchTerm) {
            logger.log('🔍 Applicando filtro ricerca:', searchTerm);
            query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%,diagnosi.ilike.%${searchTerm}%,codice_rad.ilike.%${searchTerm}%`);
        }
    }
    
    if (domElements.repartoFilter && domElements.repartoFilter.value) {
        logger.log('🔍 Applicando filtro reparto:', domElements.repartoFilter.value);
        query = query.eq('reparto_appartenenza', domElements.repartoFilter.value);
    }
    
    if (domElements.diagnosiFilter && domElements.diagnosiFilter.value) {
        logger.log('🔍 Applicando filtro diagnosi:', domElements.diagnosiFilter.value);
        query = query.eq('diagnosi', domElements.diagnosiFilter.value);
    }
    
    if (domElements.statoFilter) {
        if (domElements.statoFilter.value === 'attivo') {
            logger.log('🔍 Applicando filtro stato: attivo');
            query = query.is('data_dimissione', null);
        } else if (domElements.statoFilter.value === 'dimesso') {
            logger.log('🔍 Applicando filtro stato: dimesso');
            query = query.not('data_dimissione', 'is', null);
        }
    }
    
    if (domElements.infettoFilter && domElements.infettoFilter.value !== '') {
        const isInfetto = domElements.infettoFilter.value === 'true';
        logger.log('🔍 Applicando filtro infetto:', isInfetto);
        query = query.eq('infetto', isInfetto);
    }
    
    logger.log('✅ Query base costruita con successo');
    return query;
}

export async function fetchPazienti() {
    logger.log('📊 Iniziando fetchPazienti...');
    logger.log('📊 Stato corrente:', { 
        currentPage: state.currentPage, 
        sortColumn: state.sortColumn, 
        sortDirection: state.sortDirection 
    });
    
    let query = buildBaseQuery();
    logger.log('📊 Query base costruita');

    const startIndex = state.currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    logger.log('📊 Range paginazione:', { startIndex, endIndex });
    
    query = query.order(state.sortColumn, { ascending: state.sortDirection === 'asc' }).range(startIndex, endIndex);
    logger.log('📊 Query finale preparata, eseguendo...');

    const { data, error, count } = await query;
    logger.log('📊 Risposta Supabase:', {
        dataLength: data?.length,
        count,
        hasError: !!error,
        sampleData: data?.slice(0, 2) // Mostra i primi 2 record per debug
    });
    
    if (error) {
        console.error('❌ Errore Supabase:', error);
        throw error;
    }
    
    // Debug: verifica se i dati hanno user_id (indicatore che sono reali)
    if (data && data.length > 0) {
        logger.log('🔍 Debug dati - Primo record:', {
            hasUserId: !!data[0].user_id,
            hasCreatedAt: !!data[0].created_at,
            tableName: 'pazienti',
            sample: data[0]
        });
    }
    
    logger.log('✅ fetchPazienti completato con successo');
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
            logger.warn('Nessuna riga modificata per l-ID:', pazienteId);
            return;
        }
    } catch (error) {
        console.error('Errore durante l\'aggiornamento dello stato del paziente:', error);
        alert(`Errore: ${error.message}`);
    }
}

export async function deletePaziente(pazienteId) {
    try {
        logger.log('🗑️ Inizio eliminazione paziente ID:', pazienteId);
        
        // Verifica prima dell'eliminazione
        const { count: beforeCount } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
        logger.log('📊 Conteggio prima eliminazione:', beforeCount);
        
        // Esegui eliminazione
        const { error } = await supabase
            .from('pazienti')
            .delete()
            .eq('id', pazienteId);
            
        if (error) throw error;
        
        // Verifica dopo eliminazione
        const { count: afterCount } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
        logger.log('📊 Conteggio dopo eliminazione:', afterCount);
        logger.log('✅ Paziente eliminato correttamente. Differenza:', beforeCount - afterCount);
        
        // Invalida cache per forzare refresh
        patientService.invalidateCache();
        logger.log('🔄 Cache invalidata');
        
    } catch (error) {
        console.error('❌ Errore eliminazione paziente:', error);
        alert(`Errore: ${error.message}`);
        throw error;
    }
}
