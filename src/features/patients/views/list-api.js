// src/features/patients/views/list-api.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { state, domElements, getCurrentFilters } from './list-state-migrated.js';
import { convertToCSV } from '../../../shared/utils/index.js';
import { patientService } from '../services/patientService.js';
import { logger } from '../../../core/services/loggerService.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';

const ITEMS_PER_PAGE = 10;

function buildBaseQuery() {
    logger.log('🔍 Costruendo query base...');
    
    let query = supabase.from('pazienti').select('*', { count: 'exact' }).not('user_id', 'is', null);
    logger.log('🔍 Query iniziale creata per tabella "pazienti" con filtro user_id not null');

    if (domElements.searchInput) {
        const searchTerm = domElements.searchInput.value.trim();
        if (searchTerm) {
            logger.log('🔍 Applicando filtro ricerca:', searchTerm);
            query = query.or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%,diagnosi.ilike.%${searchTerm}%,codice_rad.ilike.%${searchTerm}%,reparto_destinazione.ilike.%${searchTerm}%,clinica_destinazione.ilike.%${searchTerm}%`);
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
    
    if (domElements.trasferimentoFilter && domElements.trasferimentoFilter.value) {
        logger.log('🔍 Applicando filtro trasferimento:', domElements.trasferimentoFilter.value);
        query = query.eq('tipo_dimissione', domElements.trasferimentoFilter.value);
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
        sampleData: data?.slice(0, 2)
    });
    
    if (error) {
        console.error('❌ Errore Supabase:', error);
        throw error;
    }
    
    // Fetch clinical events for each patient
    if (data && data.length > 0) {
        logger.log('📊 Caricamento eventi clinici per i pazienti...');
        
        try {
            const patientIds = data.map(p => p.id);
            const { data: eventiData, error: eventiError } = await supabase
                .from('eventi_clinici')
                .select('*')
                .in('paziente_id', patientIds)
                .order('data_evento', { ascending: false });
            
            if (eventiError) {
                logger.warn('⚠️ Errore nel caricamento eventi clinici:', eventiError);
                // Continue without clinical events data
            } else {
                // Group events by patient ID
                const eventiByPatient = {};
                if (eventiData) {
                    eventiData.forEach(evento => {
                        if (!eventiByPatient[evento.paziente_id]) {
                            eventiByPatient[evento.paziente_id] = [];
                        }
                        eventiByPatient[evento.paziente_id].push(evento);
                    });
                }
                
                // Add clinical events to each patient
                data.forEach(patient => {
                    patient.eventi_clinici = eventiByPatient[patient.id] || [];
                });
                
                logger.log('✅ Eventi clinici caricati per', Object.keys(eventiByPatient).length, 'pazienti');
            }
        } catch (eventiError) {
            logger.warn('⚠️ Errore nel caricamento eventi clinici:', eventiError);
            // Continue without clinical events data
            data.forEach(patient => {
                patient.eventi_clinici = [];
            });
        }
    }
    
    // Verify data integrity
    if (data && data.length > 0) {
        logger.log('🔍 Data verification - First record:', {
            hasUserId: !!data[0].user_id,
            hasCreatedAt: !!data[0].created_at,
            hasEventiClinici: !!data[0].eventi_clinici,
            eventiCount: data[0].eventi_clinici?.length || 0,
            tableName: 'pazienti',
            sample: data[0]
        });
    }
    
    logger.log('✅ fetchPazienti completato con successo');
    return { data, count };
}

export async function exportPazientiToCSV() {
    if (!domElements.exportButton) return;

    const originalBtnContent = domElements.exportButton.innerHTML;
    domElements.exportButton.disabled = true;
    domElements.exportButton.innerHTML = sanitizeHtml(`<span class="spinner-border spinner-border-sm"></span> Esportazione...`);

    try {
        // Usa il servizio centralizzato che gestisce anche le notifiche e lo stato di caricamento
        const filters = getCurrentFilters();
        await patientService.exportPatients(filters);
    } catch (error) {
        // Error is already notified by service, log for monitoring
        logger.error("Errore catturato in list-api durante l'esportazione CSV:", error);
    } finally {
        domElements.exportButton.disabled = false;
        domElements.exportButton.innerHTML = sanitizeHtml(originalBtnContent);
    }
}

export async function updatePazienteStatus(pazienteId, isDimissione) {
    try {
        if (isDimissione) {
            await patientService.dischargePatient(pazienteId);
        } else {
            await patientService.reactivatePatient(pazienteId);
        }
    } catch (error) {
        // Le notifiche di errore sono già gestite dal service
        logger.error(`❌ Errore durante l'aggiornamento dello stato del paziente ${pazienteId}:`, error);
        throw error; // Rilancia l'errore per il chiamante se necessario
    }
}

export async function deletePaziente(pazienteId) {
    try {
        // Utilizza il servizio centralizzato che gestisce anche le notifiche
        await patientService.deletePatient(pazienteId);
        logger.log('✅ Chiamata a patientService.deletePatient completata per ID:', pazienteId);
    } catch (error) {
        console.error('❌ Errore eliminazione paziente:', error);
        // La notifica di errore è già gestita dal service, ma possiamo loggare qui
        logger.error('Errore catturato in list-api durante la cancellazione del paziente:', error.message);
        throw error;
    }
}
