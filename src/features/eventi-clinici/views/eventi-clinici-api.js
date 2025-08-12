// src/features/eventi-clinici/views/eventi-clinici-api.js

import { eventiCliniciService } from '../services/eventiCliniciService.js';
import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { formatDate } from '../../../shared/utils/formatting.js';

/**
 * API wrapper per la gestione degli eventi clinici
 * Fornisce metodi per CRUD operations, ricerca e trasformazione dati
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_DEBOUNCE_MS = 500;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Cache per ricerca pazienti con debouncing
let searchCache = new Map();
let searchTimeout = null;
let filterTimeout = null;

// Advanced search state
let currentFilters = {
  paziente_search: '',
  tipo_evento: '',
  data_da: '',
  data_a: '',
  reparto: '',
  agente_patogeno: '',
  tipo_intervento: '',
  sortColumn: 'data_evento',
  sortDirection: 'desc'
};

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Carica tutti gli eventi clinici con filtri e paginazione
 */
export async function fetchEventiClinici(filters = {}, page = 0) {
  try {
    logger.log('📊 Caricamento eventi clinici:', { filters, page });

    const pagination = {
      page,
      limit: ITEMS_PER_PAGE
    };

    const result = await eventiCliniciService.getAllEventi(filters, pagination);
    
    const transformedData = {
      ...result,
      eventi: result.eventi.map(transformEventoForUI)
    };

    logger.log('✅ Eventi clinici caricati:', {
      count: transformedData.eventi.length,
      totalCount: transformedData.totalCount,
      currentPage: transformedData.currentPage
    });

    return transformedData;
  } catch (error) {
    logger.error('❌ Errore caricamento eventi clinici:', error);
    handleApiError(error, 'Errore nel caricamento degli eventi clinici');
    throw error;
  }
}

/**
 * Carica eventi per un paziente specifico
 */
export async function fetchEventiByPaziente(pazienteId, filters = {}) {
  try {
    logger.log('📊 Caricamento eventi per paziente:', { pazienteId, filters });

    const eventi = await eventiCliniciService.getEventiByPaziente(pazienteId, filters);
    const transformedEventi = eventi.map(transformEventoForUI);
    
    const interventi = eventi.filter(e => e.tipo_evento === 'intervento');
    let giorniPostOp = null;
    
    if (interventi.length > 0) {
      try {
        giorniPostOp = await eventiCliniciService.getGiorniPostOperatori(pazienteId);
      } catch (error) {
        logger.warn('⚠️ Errore calcolo giorni post-operatori:', error);
      }
    }

    logger.log('✅ Eventi paziente caricati:', {
      count: transformedEventi.length,
      hasInterventi: interventi.length > 0,
      giorniPostOp
    });

    return {
      eventi: transformedEventi,
      giorniPostOperatori: giorniPostOp
    };
  } catch (error) {
    logger.error('❌ Errore caricamento eventi paziente:', error);
    handleApiError(error, 'Errore nel caricamento degli eventi del paziente');
    throw error;
  }
}

/**
 * Crea un nuovo evento clinico
 */
export async function createEventoClinico(eventoData) {
  try {
    logger.log('➕ Creazione nuovo evento clinico:', eventoData);

    validateEventoData(eventoData);

    const nuovoEvento = await eventiCliniciService.createEvento(eventoData);
    const transformedEvento = transformEventoForUI(nuovoEvento);

    logger.log('✅ Evento clinico creato:', transformedEvento);
    return transformedEvento;
  } catch (error) {
    logger.error('❌ Errore creazione evento clinico:', error);
    handleApiError(error, 'Errore nella creazione dell\'evento clinico');
    throw error;
  }
}

/**
 * Aggiorna un evento clinico esistente
 */
export async function updateEventoClinico(eventoId, eventoData) {
  try {
    logger.log('✏️ Aggiornamento evento clinico:', { eventoId, eventoData });

    validateEventoData(eventoData);

    const eventoAggiornato = await eventiCliniciService.updateEvento(eventoId, eventoData);
    const transformedEvento = transformEventoForUI(eventoAggiornato);

    logger.log('✅ Evento clinico aggiornato:', transformedEvento);
    return transformedEvento;
  } catch (error) {
    logger.error('❌ Errore aggiornamento evento clinico:', error);
    handleApiError(error, 'Errore nell\'aggiornamento dell\'evento clinico');
    throw error;
  }
}

/**
 * Elimina un evento clinico
 */
export async function deleteEventoClinico(eventoId) {
  try {
    logger.log('🗑️ Eliminazione evento clinico:', eventoId);

    await eventiCliniciService.deleteEvento(eventoId);

    logger.log('✅ Evento clinico eliminato:', eventoId);
    return true;
  } catch (error) {
    logger.error('❌ Errore eliminazione evento clinico:', error);
    handleApiError(error, 'Errore nell\'eliminazione dell\'evento clinico');
    throw error;
  }
}

/**
 * Risolve una infezione impostando la data di fine
 */
export async function resolveInfezioneEvento(eventoId, dataFine) {
  try {
    logger.log('🩺 Risoluzione infezione:', { eventoId, dataFine });
    await eventiCliniciService.resolveInfezione(eventoId, dataFine);
    logger.log('✅ Infezione risolta:', eventoId);
    return true;
  } catch (error) {
    logger.error('❌ Errore risoluzione infezione:', error);
    handleApiError(error, 'Errore nella risoluzione dell\'infezione');
    throw error;
  }
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

/**
 * Ricerca pazienti con debouncing per associazione eventi
 */
export async function searchPazientiForEvents(searchTerm, activeOnly = true) {
  return new Promise((resolve, reject) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      resolve([]);
      return;
    }

    const cacheKey = `${searchTerm}_${activeOnly}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) {
        logger.log('🔍 Risultati ricerca da cache:', cached.data.length);
        resolve(cached.data);
        return;
      }
    }

    searchTimeout = setTimeout(async () => {
      try {
        logger.log('🔍 Ricerca pazienti:', { searchTerm, activeOnly });

        const pazienti = await eventiCliniciService.searchPazienti(searchTerm.trim(), activeOnly);
        const transformedPazienti = pazienti.map(transformPazienteForUI);

        updateSearchCache(cacheKey, transformedPazienti);

        logger.log('✅ Pazienti trovati:', transformedPazienti.length);
        resolve(transformedPazienti);
      } catch (error) {
        logger.error('❌ Errore ricerca pazienti:', error);
        handleApiError(error, 'Errore nella ricerca pazienti');
        reject(error);
      }
    }, SEARCH_DEBOUNCE_MS);
  });
}

/**
 * Ricerca pazienti in tempo reale con debouncing
 */
export function searchPatientsRealTime(searchTerm, callback) {
  return new Promise((resolve, reject) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      const emptyResult = [];
      if (callback) callback(emptyResult);
      resolve(emptyResult);
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        logger.log('🔍 Ricerca pazienti real-time:', searchTerm);

        const pazienti = await searchPazientiForEvents(searchTerm.trim(), true);
        
        if (callback) {
          callback(pazienti);
        }
        
        resolve(pazienti);
      } catch (error) {
        logger.error('❌ Errore ricerca pazienti real-time:', error);
        reject(error);
      }
    }, SEARCH_DEBOUNCE_MS);
  });
}

/**
 * Implementa ricerca avanzata con debouncing per eventi clinici
 */
export function searchEventiWithDebounce(filters, callback) {
  return new Promise((resolve, reject) => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }

    currentFilters = { ...currentFilters, ...filters };

    filterTimeout = setTimeout(async () => {
      try {
        logger.log('🔍 Ricerca avanzata eventi con filtri:', currentFilters);

        const result = await fetchEventiClinici(currentFilters, 0);
        
        if (callback) {
          callback(result);
        }
        
        resolve(result);
      } catch (error) {
        logger.error('❌ Errore ricerca avanzata eventi:', error);
        reject(error);
      }
    }, FILTER_DEBOUNCE_MS);
  });
}

// ============================================================================
// FILTER OPERATIONS
// ============================================================================

/**
 * Applica filtri per tipo evento con aggiornamento immediato UI
 */
export async function applyEventTypeFilter(tipoEvento) {
  try {
    logger.log('🎯 Applicazione filtro tipo evento:', tipoEvento);

    const filters = { ...currentFilters, tipo_evento: tipoEvento };
    const result = await fetchEventiClinici(filters, 0);

    currentFilters.tipo_evento = tipoEvento;

    logger.log('✅ Filtro tipo evento applicato:', {
      tipo: tipoEvento,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore applicazione filtro tipo evento:', error);
    handleApiError(error, 'Errore nell\'applicazione del filtro');
    throw error;
  }
}

/**
 * Applica filtri per range di date
 */
export async function applyDateRangeFilter(dataDa, dataA) {
  try {
    logger.log('📅 Applicazione filtro range date:', { dataDa, dataA });

    if (dataDa && dataA) {
      const startDate = new Date(dataDa);
      const endDate = new Date(dataA);
      
      if (startDate > endDate) {
        throw new Error('La data di inizio non può essere successiva alla data di fine');
      }
    }

    const filters = { 
      ...currentFilters, 
      data_da: dataDa || '', 
      data_a: dataA || '' 
    };
    
    const result = await fetchEventiClinici(filters, 0);

    currentFilters.data_da = dataDa || '';
    currentFilters.data_a = dataA || '';

    logger.log('✅ Filtro range date applicato:', {
      da: dataDa,
      a: dataA,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore applicazione filtro date:', error);
    handleApiError(error, 'Errore nell\'applicazione del filtro date');
    throw error;
  }
}

/**
 * Applica filtro per reparto
 */
export async function applyDepartmentFilter(reparto) {
  try {
    logger.log('🏥 Applicazione filtro reparto:', reparto);

    const filters = { ...currentFilters, reparto: reparto || '' };
    const result = await fetchEventiClinici(filters, 0);

    currentFilters.reparto = reparto || '';

    logger.log('✅ Filtro reparto applicato:', {
      reparto,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore applicazione filtro reparto:', error);
    handleApiError(error, 'Errore nell\'applicazione del filtro reparto');
    throw error;
  }
}

/**
 * Applica ricerca paziente e filtra eventi
 */
export async function applyPatientSearch(searchTerm) {
  try {
    logger.log('👤 Applicazione ricerca paziente:', searchTerm);

    const filters = { ...currentFilters, paziente_search: searchTerm || '' };
    const result = await fetchEventiClinici(filters, 0);

    currentFilters.paziente_search = searchTerm || '';

    logger.log('✅ Ricerca paziente applicata:', {
      termine: searchTerm,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore ricerca paziente:', error);
    handleApiError(error, 'Errore nella ricerca paziente');
    throw error;
  }
}

/**
 * Applica filtri combinati per query complesse
 */
export async function applyCombinedFilters(filters) {
  try {
    logger.log('🔍 Applicazione filtri combinati:', filters);

    validateFilterCombination(filters);

    const combinedFilters = { ...currentFilters, ...filters };
    const result = await fetchEventiClinici(combinedFilters, 0);
    
    currentFilters = combinedFilters;

    logger.log('✅ Filtri combinati applicati:', {
      filtri: combinedFilters,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore applicazione filtri combinati:', error);
    handleApiError(error, 'Errore nell\'applicazione dei filtri');
    throw error;
  }
}

/**
 * Applica ordinamento ai risultati
 */
export async function applySorting(sortColumn, sortDirection) {
  try {
    logger.log('📊 Applicazione ordinamento:', { sortColumn, sortDirection });

    validateSortParameters(sortColumn, sortDirection);

    const filters = { 
      ...currentFilters, 
      sortColumn, 
      sortDirection 
    };
    
    const result = await fetchEventiClinici(filters, 0);

    currentFilters.sortColumn = sortColumn;
    currentFilters.sortDirection = sortDirection;

    logger.log('✅ Ordinamento applicato:', {
      colonna: sortColumn,
      direzione: sortDirection,
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore applicazione ordinamento:', error);
    handleApiError(error, 'Errore nell\'applicazione dell\'ordinamento');
    throw error;
  }
}

// ============================================================================
// FILTER MANAGEMENT
// ============================================================================

/**
 * Ottiene i filtri correnti
 */
export function getCurrentFilters() {
  return { ...currentFilters };
}

/**
 * Resetta tutti i filtri
 */
export async function resetAllFilters() {
  try {
    logger.log('🔄 Reset di tutti i filtri');

    currentFilters = {
      paziente_search: '',
      tipo_evento: '',
      data_da: '',
      data_a: '',
      reparto: ''
    };

    const result = await fetchEventiClinici(currentFilters, 0);

    logger.log('✅ Filtri resettati:', {
      risultati: result.eventi.length
    });

    return result;
  } catch (error) {
    logger.error('❌ Errore reset filtri:', error);
    handleApiError(error, 'Errore nel reset dei filtri');
    throw error;
  }
}

/**
 * Reimposta i filtri correnti ai valori di default senza effettuare fetch
 */
export function resetCurrentFiltersToDefaults() {
  currentFilters = {
    paziente_search: '',
    tipo_evento: '',
    data_da: '',
    data_a: '',
    reparto: '',
    agente_patogeno: '',
    tipo_intervento: '',
    sortColumn: 'data_evento',
    sortDirection: 'desc'
  };
  logger.log('🔧 Filtri in memoria reimpostati ai default');
}

/**
 * Resetta filtri e rimuove dallo stato persistente
 */
export async function resetFiltersAndState() {
  try {
    logger.log('🔄 Reset completo filtri e stato');

    currentFilters = {
      paziente_search: '',
      tipo_evento: '',
      data_da: '',
      data_a: '',
      reparto: '',
      agente_patogeno: '',
      tipo_intervento: '',
      sortColumn: 'data_evento',
      sortDirection: 'desc'
    };

    const { stateService } = await import('../../../core/services/stateService.js');
    stateService.setState('eventiCliniciFilters', null);

    clearSearchCache();

    const result = await fetchEventiClinici(currentFilters, 0);

    logger.log('✅ Reset completo completato:', {
      risultati: result.eventi.length
    });

    notificationService.success('Filtri resettati con successo');

    return result;
  } catch (error) {
    logger.error('❌ Errore reset completo filtri:', error);
    handleApiError(error, 'Errore nel reset dei filtri');
    throw error;
  }
}

// ============================================================================
// PERSISTENT STATE MANAGEMENT
// ============================================================================

/**
 * Salva filtri correnti nello stato persistente
 */
export async function saveFiltersToState() {
  try {
    const { stateService } = await import('../../../core/services/stateService.js');
    stateService.setState('eventiCliniciFilters', currentFilters);
    logger.log('💾 Filtri salvati nello stato:', currentFilters);
    notificationService.success('Filtri salvati con successo');
  } catch (error) {
    logger.error('❌ Errore salvataggio filtri:', error);
    notificationService.error('Impossibile salvare i filtri');
    throw error;
  }
}

/**
 * Carica filtri dallo stato persistente
 */
export async function loadFiltersFromState() {
  try {
    const { stateService } = await import('../../../core/services/stateService.js');
    const savedFilters = stateService.getState('eventiCliniciFilters');
    
    if (savedFilters) {
      currentFilters = { ...currentFilters, ...savedFilters };
      logger.log('📂 Filtri caricati dallo stato:', currentFilters);
    }
    
    return currentFilters;
  } catch (error) {
    logger.error('❌ Errore caricamento filtri:', error);
    return currentFilters;
  }
}

// ============================================================================
// DATA EXPORT OPERATIONS
// ============================================================================

/**
 * Esporta eventi filtrati in formato CSV
 */
export async function exportFilteredEvents(format = 'csv') {
  try {
    logger.log('📤 Esportazione eventi filtrati:', { format, filters: currentFilters });

    const allEventsResult = await eventiCliniciService.getAllEventi(currentFilters, { 
      page: 0, 
      limit: 10000
    });

    if (!allEventsResult.eventi || allEventsResult.eventi.length === 0) {
      throw new Error('Nessun evento da esportare con i filtri correnti');
    }

    const exportResult = generateExportData(allEventsResult.eventi, format);
    downloadFile(exportResult.data, exportResult.filename, exportResult.mimeType);

    logger.log('✅ Esportazione completata:', {
      formato: format,
      eventi: allEventsResult.eventi.length,
      filename: exportResult.filename
    });

    notificationService.success(`Esportati ${allEventsResult.eventi.length} eventi con successo!`);

    return {
      success: true,
      count: allEventsResult.eventi.length,
      filename: exportResult.filename
    };

  } catch (error) {
    logger.error('❌ Errore esportazione eventi:', error);
    handleApiError(error, 'Errore nell\'esportazione degli eventi');
    throw error;
  }
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

/**
 * Calcola giorni post-operatori per un paziente
 */
export async function getGiorniPostOperatori(pazienteId, dataRiferimento = null) {
  try {
    logger.log('📅 Calcolo giorni post-operatori:', { pazienteId, dataRiferimento });

    const risultato = await eventiCliniciService.getGiorniPostOperatori(pazienteId, dataRiferimento);

    if (risultato) {
      logger.log('✅ Giorni post-operatori calcolati:', risultato);
    } else {
      logger.log('ℹ️ Nessun intervento trovato per il paziente');
    }

    return risultato;
  } catch (error) {
    logger.error('❌ Errore calcolo giorni post-operatori:', error);
    handleApiError(error, 'Errore nel calcolo dei giorni post-operatori');
    throw error;
  }
}

/**
 * Ottiene statistiche eventi clinici
 */
export async function getEventiStats() {
  try {
    logger.log('📊 Caricamento statistiche eventi clinici');

    const stats = await eventiCliniciService.getEventiStats();

    logger.log('✅ Statistiche caricate:', stats);
    return stats;
  } catch (error) {
    logger.error('❌ Errore caricamento statistiche:', error);
    handleApiError(error, 'Errore nel caricamento delle statistiche');
    throw error;
  }
}

/**
 * Ottiene statistiche sui filtri applicati
 */
export async function getFilterStats() {
  try {
    logger.log('📊 Calcolo statistiche filtri');

    const totalResult = await fetchEventiClinici({}, 0);
    const totalCount = totalResult.totalCount;

    const filteredResult = await fetchEventiClinici(currentFilters, 0);
    const filteredCount = filteredResult.totalCount;

    const activeFilters = Object.entries(currentFilters)
      .filter(([key, value]) => value && value.toString().trim() !== '' && 
               !['sortColumn', 'sortDirection'].includes(key))
      .map(([key, value]) => ({ key, value }));

    const stats = {
      totalEvents: totalCount,
      filteredEvents: filteredCount,
      activeFiltersCount: activeFilters.length,
      activeFilters,
      filterEfficiency: totalCount > 0 ? ((totalCount - filteredCount) / totalCount * 100).toFixed(1) : 0
    };

    logger.log('✅ Statistiche filtri calcolate:', stats);
    return stats;
  } catch (error) {
    logger.error('❌ Errore calcolo statistiche filtri:', error);
    return {
      totalEvents: 0,
      filteredEvents: 0,
      activeFiltersCount: 0,
      activeFilters: [],
      filterEfficiency: 0
    };
  }
}

// ============================================================================
// SUGGESTION AND METADATA OPERATIONS
// ============================================================================

/**
 * Ottiene lista reparti per filtro
 */
export async function getDepartmentsList() {
  try {
    logger.log('🏥 Caricamento lista reparti');

    const { supabase } = await import('../../../core/services/supabaseClient.js');
    const { data, error } = await supabase
      .from('pazienti')
      .select('reparto_appartenenza')
      .not('reparto_appartenenza', 'is', null)
      .order('reparto_appartenenza');

    if (error) throw error;

    const reparti = [...new Set(data.map(p => p.reparto_appartenenza))];

    logger.log('✅ Lista reparti caricata:', reparti.length);
    return reparti;
  } catch (error) {
    logger.error('❌ Errore caricamento reparti:', error);
    return [];
  }
}

/**
 * Ottiene filtri suggeriti basati sui dati esistenti
 */
export async function getSuggestedFilters() {
  try {
    logger.log('💡 Caricamento filtri suggeriti');

    const { supabase } = await import('../../../core/services/supabaseClient.js');
    
    const [tipiIntervento, agentiPatogeni, reparti] = await Promise.all([
      supabase
        .from('eventi_clinici')
        .select('tipo_intervento')
        .eq('tipo_evento', 'intervento')
        .not('tipo_intervento', 'is', null)
        .order('tipo_intervento'),
      
      supabase
        .from('eventi_clinici')
        .select('agente_patogeno')
        .eq('tipo_evento', 'infezione')
        .not('agente_patogeno', 'is', null)
        .order('agente_patogeno'),
      
      supabase
        .from('pazienti')
        .select('reparto_appartenenza')
        .not('reparto_appartenenza', 'is', null)
        .order('reparto_appartenenza')
    ]);

    const suggestions = {
      tipiIntervento: [...new Set(tipiIntervento.data?.map(t => t.tipo_intervento) || [])],
      agentiPatogeni: [...new Set(agentiPatogeni.data?.map(a => a.agente_patogeno) || [])],
      reparti: [...new Set(reparti.data?.map(r => r.reparto_appartenenza) || [])]
    };

    logger.log('✅ Filtri suggeriti caricati:', suggestions);
    return suggestions;
  } catch (error) {
    logger.error('❌ Errore caricamento filtri suggeriti:', error);
    return {
      tipiIntervento: [],
      agentiPatogeni: [],
      reparti: []
    };
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Pulisce la cache di ricerca
 */
export function clearSearchCache() {
  searchCache.clear();
  logger.log('🧹 Cache ricerca pulita');
}

function updateSearchCache(cacheKey, data) {
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
}

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Trasforma un evento clinico per il consumo UI
 */
function transformEventoForUI(evento) {
  if (!evento) return null;

  return {
    ...evento,
    dataEventoFormatted: formatDate(evento.data_evento),
    dataFineEventoFormatted: evento.data_fine_evento ? formatDate(evento.data_fine_evento) : null,
    isInfezione: evento.tipo_evento === 'infezione',
    isRisolta: evento.tipo_evento === 'infezione' && !!evento.data_fine_evento,
    tipoEventoIcon: getTipoEventoIcon(evento.tipo_evento),
    tipoEventoColor: getTipoEventoColor(evento.tipo_evento),
    tipoEventoLabel: getTipoEventoLabel(evento.tipo_evento),
    pazienteInfo: evento.pazienti ? {
      id: evento.pazienti.id,
      nomeCompleto: `${evento.pazienti.nome} ${evento.pazienti.cognome}`,
      reparto: evento.pazienti.reparto_appartenenza
    } : null
  };
}

/**
 * Trasforma un paziente per il consumo UI
 */
function transformPazienteForUI(paziente) {
  if (!paziente) return null;

  return {
    ...paziente,
    nomeCompleto: `${paziente.nome} ${paziente.cognome}`,
    dataRicoveroFormatted: formatDate(paziente.data_ricovero),
    isActive: !paziente.data_dimissione
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validazione dati evento lato client
 */
function validateEventoData(data) {
  const errors = [];

  if (!data.paziente_id) {
    errors.push('Paziente obbligatorio');
  }

  if (!data.tipo_evento) {
    errors.push('Tipo evento obbligatorio');
  }

  if (!data.data_evento) {
    errors.push('Data evento obbligatoria');
  }

  if (data.data_evento) {
    const dataEvento = new Date(data.data_evento);
    const oggi = new Date();
    if (dataEvento > oggi) {
      errors.push('La data dell\'evento non può essere nel futuro');
    }
  }

  if (data.tipo_evento === 'intervento' && !data.tipo_intervento) {
    errors.push('Tipo intervento obbligatorio per gli interventi chirurgici');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}

/**
 * Valida la combinazione di filtri
 */
function validateFilterCombination(filters) {
  const errors = [];

  if (filters.data_da && filters.data_a) {
    const startDate = new Date(filters.data_da);
    const endDate = new Date(filters.data_a);
    
    if (startDate > endDate) {
      errors.push('La data di inizio non può essere successiva alla data di fine');
    }
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 730) {
      errors.push('Il range di date non può superare i 2 anni');
    }
  }

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  if (filters.data_da && filters.data_da > todayString) {
    errors.push('La data di inizio non può essere nel futuro');
  }
  
  if (filters.data_a && filters.data_a > todayString) {
    errors.push('La data di fine non può essere nel futuro');
  }

  if (filters.tipo_intervento && filters.tipo_evento !== 'intervento') {
    errors.push('Il filtro tipo intervento può essere usato solo con eventi di tipo intervento');
  }
  
  if (filters.agente_patogeno && filters.tipo_evento !== 'infezione') {
    errors.push('Il filtro agente patogeno può essere usato solo con eventi di tipo infezione');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}

/**
 * Valida parametri di ordinamento
 */
function validateSortParameters(sortColumn, sortDirection) {
  const validColumns = ['data_evento', 'tipo_evento', 'created_at', 'paziente_nome'];
  const validDirections = ['asc', 'desc'];

  if (!validColumns.includes(sortColumn)) {
    throw new Error(`Colonna di ordinamento non valida: ${sortColumn}`);
  }

  if (!validDirections.includes(sortDirection)) {
    throw new Error(`Direzione di ordinamento non valida: ${sortDirection}`);
  }
}

// ============================================================================
// EXPORT UTILITY FUNCTIONS
// ============================================================================

function generateExportData(eventi, format) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'csv':
      return {
        data: generateCSV(eventi),
        filename: `eventi_clinici_${timestamp}.csv`,
        mimeType: 'text/csv;charset=utf-8;'
      };
    
    case 'json':
      return {
        data: JSON.stringify(eventi, null, 2),
        filename: `eventi_clinici_${timestamp}.json`,
        mimeType: 'application/json;charset=utf-8;'
      };
    
    default:
      throw new Error(`Formato di esportazione non supportato: ${format}`);
  }
}

function generateCSV(eventi) {
  const headers = [
    'ID',
    'Tipo Evento',
    'Data Evento',
    'Paziente',
    'Reparto',
    'Descrizione',
    'Tipo Intervento',
    'Agente Patogeno',
    'Data Fine Evento',
    'Stato',
    'Data Creazione'
  ];

  const csvRows = [headers.join(',')];

  eventi.forEach(evento => {
    const isInfezione = evento.tipo_evento === 'infezione';
    const stato = isInfezione ? (evento.data_fine_evento ? 'Risolta' : 'Attiva') : '';
    const row = [
      evento.id || '',
      evento.tipo_evento || '',
      evento.data_evento || '',
      evento.pazienti ? `"${evento.pazienti.nome} ${evento.pazienti.cognome}"` : '',
      evento.pazienti?.reparto_appartenenza || '',
      evento.descrizione ? `"${evento.descrizione.replace(/"/g, '""')}"` : '',
      evento.tipo_intervento || '',
      evento.agente_patogeno || '',
      evento.data_fine_evento || '',
      stato,
      evento.created_at || ''
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

function downloadFile(data, filename, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// UI UTILITY FUNCTIONS
// ============================================================================

export function getTipoEventoIcon(tipo) {
  const icons = {
    'intervento': 'fas fa-scalpel',
    'infezione': 'fas fa-virus'
  };
  return icons[tipo] || 'fas fa-calendar-alt';
}

function getTipoEventoColor(tipo) {
  const colors = {
    'intervento': 'primary',
    'infezione': 'warning'
  };
  return colors[tipo] || 'secondary';
}

function getTipoEventoLabel(tipo) {
  const labels = {
    'intervento': 'Intervento',
    'infezione': 'Infezione'
  };
  return labels[tipo] || tipo;
}

// ============================================================================
// ERROR HANDLING AND UTILITIES
// ============================================================================

/**
 * Gestione errori API centralizzata
 */
function handleApiError(error, defaultMessage) {
  const message = error.message || defaultMessage;
  
  if (!error.message?.includes('Errore nel')) {
    notificationService.error(message);
  }
}

/**
 * Retry logic per operazioni critiche
 */
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`🔄 Tentativo ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(`⚠️ Tentativo ${attempt} fallito:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}