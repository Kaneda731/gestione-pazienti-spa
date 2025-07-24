// src/features/eventi-clinici/views/eventi-clinici-api.js

import { eventiCliniciService } from '../services/eventiCliniciService.js';
import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { formatDate } from '../../../shared/utils/formatting.js';

/**
 * API wrapper per la gestione degli eventi clinici
 * Fornisce metodi per CRUD operations, ricerca e trasformazione dati
 */

// Configurazione paginazione
const ITEMS_PER_PAGE = 10;

// Cache per ricerca pazienti con debouncing
let searchCache = new Map();
let searchTimeout = null;
const SEARCH_DEBOUNCE_MS = 300;

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
    
    // Trasforma i dati per il consumo UI
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
    
    // Trasforma i dati e calcola giorni post-operatori
    const transformedEventi = eventi.map(transformEventoForUI);
    
    // Calcola giorni post-operatori se ci sono interventi
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

    // Validazione lato client
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

    // Validazione lato client
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
 * Ricerca pazienti con debouncing per associazione eventi
 */
export async function searchPazientiForEvents(searchTerm, activeOnly = true) {
  return new Promise((resolve, reject) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Check for short search terms immediately
    if (!searchTerm || searchTerm.trim().length < 2) {
      resolve([]);
      return;
    }

    // Check cache first
    const cacheKey = `${searchTerm}_${activeOnly}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 secondi cache
        logger.log('🔍 Risultati ricerca da cache:', cached.data.length);
        resolve(cached.data);
        return;
      }
    }

    // Set new timeout for debouncing
    searchTimeout = setTimeout(async () => {
      try {
        logger.log('🔍 Ricerca pazienti:', { searchTerm, activeOnly });

        const pazienti = await eventiCliniciService.searchPazienti(searchTerm.trim(), activeOnly);
        
        // Trasforma i dati per UI
        const transformedPazienti = pazienti.map(transformPazienteForUI);

        // Cache results
        searchCache.set(cacheKey, {
          data: transformedPazienti,
          timestamp: Date.now()
        });

        // Limit cache size
        if (searchCache.size > 50) {
          const firstKey = searchCache.keys().next().value;
          searchCache.delete(firstKey);
        }

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
 * Trasforma un evento clinico per il consumo UI
 */
function transformEventoForUI(evento) {
  if (!evento) return null;

  return {
    ...evento,
    // Formattazione data per display
    dataEventoFormatted: formatDate(evento.data_evento),
    // Icona basata sul tipo evento
    tipoEventoIcon: getTipoEventoIcon(evento.tipo_evento),
    // Colore per UI
    tipoEventoColor: getTipoEventoColor(evento.tipo_evento),
    // Label leggibile
    tipoEventoLabel: getTipoEventoLabel(evento.tipo_evento),
    // Informazioni paziente se disponibili
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

  // Validazione data evento
  if (data.data_evento) {
    const dataEvento = new Date(data.data_evento);
    const oggi = new Date();
    if (dataEvento > oggi) {
      errors.push('La data dell\'evento non può essere nel futuro');
    }
  }

  // Validazioni specifiche per tipo
  if (data.tipo_evento === 'intervento' && !data.tipo_intervento) {
    errors.push('Tipo intervento obbligatorio per gli interventi chirurgici');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}

/**
 * Gestione errori API centralizzata
 */
function handleApiError(error, defaultMessage) {
  const message = error.message || defaultMessage;
  
  // Non mostrare notifica se già gestita dal service
  if (!error.message?.includes('Errore nel')) {
    notificationService.error(message);
  }
}

/**
 * Utility functions per UI
 */

function getTipoEventoIcon(tipo) {
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

/**
 * Pulisce la cache di ricerca
 */
export function clearSearchCache() {
  searchCache.clear();
  logger.log('🧹 Cache ricerca pulita');
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