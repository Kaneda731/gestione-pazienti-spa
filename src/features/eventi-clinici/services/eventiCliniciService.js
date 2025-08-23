/**
 * Servizio centralizzato per la gestione degli eventi clinici
 * Gestisce interventi chirurgici e infezioni con calcolo giorni post-operatori
 */

import { supabase } from "../../../core/services/supabase/supabaseClient.js";
import { stateService } from "../../../core/services/state/stateService.js";
import { notificationService } from "../../../core/services/notifications/notificationService.js";
import { logger } from "../../../core/services/logger/loggerService.js";

class EventiCliniciService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuti
  }

  /**
   * Ottiene tutti gli eventi clinici con filtri e paginazione
   */
  async getAllEventi(filters = {}, pagination = {}) {
    try {
      stateService.setLoading(true, "Caricamento eventi clinici...");

      const {
        paziente_search = "",
        paziente_id = "",
        tipo_evento = "",
        data_da = "",
        data_a = "",
        reparto = "",
        stato = "",
        page = 0,
        limit = 10,
        sortColumn = "data_evento",
        sortDirection = "desc",
      } = { ...filters, ...pagination };

      let query = supabase
        .from("eventi_clinici")
        .select(`
          *,
          pazienti!inner(
            id,
            nome,
            cognome,
            reparto_appartenenza,
            codice_rad,
            data_dimissione
          )
        `, { count: "exact" });

      // Filtri
      if (paziente_id) {
        query = query.eq("paziente_id", paziente_id);
      }
      if (tipo_evento) {
        query = query.eq("tipo_evento", tipo_evento);
      }

      if (data_da) {
        query = query.gte("data_evento", data_da);
      }

      if (data_a) {
        query = query.lte("data_evento", data_a);
      }

      if (reparto) {
        query = query.eq("pazienti.reparto_appartenenza", reparto);
      }

      // Filtro per stato paziente (ricoverato/dimesso)
      if (stato === "attivo") {
        query = query.is("pazienti.data_dimissione", null);
      } else if (stato === "dimesso") {
        query = query.not("pazienti.data_dimissione", "is", null);
      }

      // Ricerca paziente per nome/cognome/codice_rad (join: serve query separata)
      if (!paziente_id && paziente_search && paziente_search.trim() !== "") {
        const searchPattern = `%${paziente_search.trim()}%`;
        // Use the same search logic as dimissione-api.js for consistency
        const pazientiRes = await supabase
          .from("pazienti")
          .select("id")
          .or(`nome.ilike.${searchPattern},cognome.ilike.${searchPattern},codice_rad.ilike.${searchPattern}`);
        const pazientiIds = pazientiRes.data?.map(p => p.id) || [];
        if (pazientiIds.length > 0) {
          query = query.in("paziente_id", pazientiIds);
        } else {
          // Nessun paziente trovato: restituisci subito risultato vuoto
          return {
            eventi: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }
      }

      // Paginazione e ordinamento
      const startIndex = page * limit;
      const endIndex = startIndex + limit - 1;

      // Applica ordinamento solo se sortColumn è valorizzato (supporto stato neutro)
      if (sortColumn && String(sortColumn).trim() !== "") {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" });
      }
      query = query.range(startIndex, endIndex);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        eventi: data || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: (page + 1) * limit < (count || 0),
        hasPrevPage: page > 0,
      };
    } catch (error) {
      console.error("Errore nel caricamento eventi clinici:", error);
      notificationService.error(`Errore nel caricamento: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Ottiene gli eventi clinici per un paziente specifico
   */
  async getEventiByPaziente(pazienteId, filters = {}) {
    try {
      const cacheKey = `eventi_paziente_${pazienteId}_${JSON.stringify(filters)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const {
        tipo_evento = "",
        data_da = "",
        data_a = "",
        sortColumn = "data_evento",
        sortDirection = "desc",
      } = filters;

      let query = supabase
        .from("eventi_clinici")
        .select("*")
        .eq("paziente_id", pazienteId);

      // Applica filtri
      if (tipo_evento) {
        query = query.eq("tipo_evento", tipo_evento);
      }

      if (data_da) {
        query = query.gte("data_evento", data_da);
      }

      if (data_a) {
        query = query.lte("data_evento", data_a);
      }

      // Applica ordinamento solo se sortColumn è valorizzato (supporto stato neutro)
      if (sortColumn && String(sortColumn).trim() !== "") {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggiorna cache
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now(),
      });

      return data || [];
    } catch (error) {
      console.error("Errore nel caricamento eventi paziente:", error);
      notificationService.error(`Errore nel caricamento eventi: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un nuovo evento clinico
   */
  async createEvento(eventoData) {
    try {
      stateService.setLoading(true, "Creazione evento clinico...");

      // Validazione dati
      this.validateEventoData(eventoData);

      const { data, error } = await supabase
        .from("eventi_clinici")
        .insert([eventoData])
        .select()
        .single();

      if (error) throw error;

      // Se l'evento è un'infezione, aggiorna lo stato del paziente
      if (eventoData.tipo_evento === 'infezione') {
        await this._updatePazienteInfezioneStatus(eventoData.paziente_id);
      }

      // Invalida cache
      this.invalidateCache();

      notificationService.success("Evento clinico creato con successo!");
      return data;
    } catch (error) {
      console.error("Errore nella creazione evento:", error);
      notificationService.error(`Errore nella creazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Aggiorna un evento clinico esistente
   */
  async updateEvento(id, eventoData) {
    try {
      stateService.setLoading(true, "Aggiornamento evento clinico...");

      // Prima ottieni l'evento esistente per la validazione completa
      const { data: existingEvento, error: fetchError } = await supabase
        .from("eventi_clinici")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingEvento) throw new Error("Evento non trovato");

      // Merge con i dati esistenti per validazione completa
      const mergedData = {
        ...existingEvento,
        ...eventoData
      };

      // Validazione dati completi
      this.validateEventoData(mergedData);

      const { data, error } = await supabase
        .from("eventi_clinici")
        .update(eventoData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Se il tipo di evento è cambiato o era/è un'infezione,
      // è necessario ricalcolare lo stato di infezione del paziente.
      const oldType = existingEvento.tipo_evento;
      const newType = data.tipo_evento;
      const pazienteId = data.paziente_id;

      if (oldType === 'infezione' || newType === 'infezione') {
        await this._updatePazienteInfezioneStatus(pazienteId);
      }

      // Invalida cache
      this.invalidateCache();

      notificationService.success("Evento clinico aggiornato con successo!");
      return data;
    } catch (error) {
      console.error("Errore nell'aggiornamento evento:", error);
      notificationService.error(`Errore nell'aggiornamento: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Elimina un evento clinico
   */
  async deleteEvento(id) {
    try {
      stateService.setLoading(true, "Eliminazione evento clinico...");

      // Prima di eliminare, recupera l'evento per ottenere il paziente_id
      const { data: evento, error: fetchError } = await supabase
        .from("eventi_clinici")
        .select("paziente_id, tipo_evento")
        .eq("id", id)
        .single();

      if (fetchError) {
        // Se l'evento non esiste più, non c'è bisogno di fare nulla.
        if (fetchError.code === 'PGRST116') {
            logger.log(`Evento con id ${id} già eliminato.`);
            return;
        }
        throw fetchError;
      }

      const { error } = await supabase
        .from("eventi_clinici")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Se l'evento era un'infezione, aggiorna lo stato del paziente
      if (evento && evento.tipo_evento === 'infezione') {
        await this._updatePazienteInfezioneStatus(evento.paziente_id);
      }

      // Invalida cache
      this.invalidateCache();

      notificationService.success("Evento clinico eliminato con successo!");
    } catch (error) {
      console.error("Errore nell'eliminazione evento:", error);
      notificationService.error(`Errore nell'eliminazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Risolve un evento di infezione impostando la data di fine.
   * @param {string} eventoId - L'ID dell'evento di infezione.
   * @param {string} dataFine - La data di risoluzione in formato YYYY-MM-DD.
   */
  async resolveInfezione(eventoId, dataFine) {
    try {
      stateService.setLoading(true, "Risoluzione infezione...");

      if (!eventoId || !dataFine) {
        throw new Error("ID evento e data di fine sono obbligatori.");
      }

      const { data: evento, error: updateError } = await supabase
        .from("eventi_clinici")
        .update({ data_fine_evento: dataFine })
        .eq("id", eventoId)
        .select("paziente_id")
        .single();

      if (updateError) throw updateError;

      // Aggiorna lo stato generale del paziente
      if (evento && evento.paziente_id) {
        await this._updatePazienteInfezioneStatus(evento.paziente_id);
      }

      this.invalidateCache();
      notificationService.success("Infezione risolta con successo!");
    } catch (error) {
      logger.error("Errore nella risoluzione dell'infezione:", error);
      notificationService.error(`Errore nella risoluzione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Calcola i giorni post-operatori per un paziente
   */
  async getGiorniPostOperatori(pazienteId, dataRiferimento = null) {
    try {
      const dataRef = dataRiferimento || new Date().toISOString().split("T")[0];

      // Ottieni tutti gli interventi del paziente
      const { data: interventi, error } = await supabase
        .from("eventi_clinici")
        .select("data_evento")
        .eq("paziente_id", pazienteId)
        .eq("tipo_evento", "intervento")
        .lte("data_evento", dataRef)
        .order("data_evento", { ascending: false });

      if (error) throw error;

      if (!interventi || interventi.length === 0) {
        return null; // Nessun intervento trovato
      }

      // Prendi l'intervento più recente
      const ultimoIntervento = interventi[0];
      const dataIntervento = new Date(ultimoIntervento.data_evento);
      const dataRif = new Date(dataRef);

      // Calcola la differenza in giorni
      const diffTime = dataRif.getTime() - dataIntervento.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        giorni: diffDays,
        dataUltimoIntervento: ultimoIntervento.data_evento,
        descrizione: `Giorno post-operatorio ${diffDays}`,
      };
    } catch (error) {
      console.error("Errore nel calcolo giorni post-operatori:", error);
      throw error;
    }
  }

  /**
   * Cerca pazienti per associazione eventi
   */
  async searchPazienti(searchTerm, activeOnly = true) {
    try {
      let query = supabase
        .from("pazienti")
        .select("id, nome, cognome, data_ricovero, diagnosi, reparto_appartenenza, codice_rad")
        .not("user_id", "is", null);

      // Use the same search logic as dimissione-api.js
      const searchPattern = `%${searchTerm.trim()}%`;
      query = query.or(`cognome.ilike.${searchPattern},nome.ilike.${searchPattern},codice_rad.ilike.${searchPattern}`);
      query = query.order("cognome");

      if (activeOnly) {
        query = query.is("data_dimissione", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Errore nella ricerca pazienti:", error);
      notificationService.error(`Errore nella ricerca: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cerca pazienti che hanno almeno un evento clinico
   * Restituisce SOLO pazienti presenti nella tabella eventi_clinici
   */
  async searchPazientiWithEvents(searchTerm, activeOnly = true) {
    try {
      const searchPattern = `%${searchTerm.trim()}%`;

      // Join da eventi_clinici -> pazienti (inner) e filtra sui campi pazienti
      let query = supabase
        .from("eventi_clinici")
        .select(
          "pazienti: paziente_id (id, nome, cognome, data_ricovero, diagnosi, reparto_appartenenza, codice_rad, user_id, data_dimissione)"
        );

      // Filtra per pazienti attivi se richiesto
      if (activeOnly) {
        query = query.is("pazienti.data_dimissione", null);
      }

      // Escludi pazienti senza user_id
      query = query.not("pazienti.user_id", "is", null);

      // Applica ricerca su campi pazienti
      query = query.or(
        `pazienti.cognome.ilike.${searchPattern},pazienti.nome.ilike.${searchPattern},pazienti.codice_rad.ilike.${searchPattern}`
      );

      // Ordina per cognome del paziente
      query = query.order("pazienti.cognome", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Deduplica per id paziente
      const uniqueMap = new Map();
      (data || []).forEach((row) => {
        const p = row?.pazienti;
        if (p && !uniqueMap.has(p.id)) {
          uniqueMap.set(p.id, {
            id: p.id,
            nome: p.nome,
            cognome: p.cognome,
            data_ricovero: p.data_ricovero,
            diagnosi: p.diagnosi,
            reparto_appartenenza: p.reparto_appartenenza,
            codice_rad: p.codice_rad,
          });
        }
      });

      return Array.from(uniqueMap.values());
    } catch (error) {
      console.error("Errore nella ricerca pazienti con eventi:", error);
      notificationService.error(`Errore nella ricerca: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validazione dati evento clinico
   */
  validateEventoData(data) {
    const required = ["paziente_id", "tipo_evento", "data_evento"];

    for (const field of required) {
      if (!data[field] || data[field].toString().trim() === "") {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    // Validazione tipo evento
    const tipiValidi = ["intervento", "infezione"];
    if (!tipiValidi.includes(data.tipo_evento)) {
      throw new Error(`Tipo evento non valido. Valori ammessi: ${tipiValidi.join(", ")}`);
    }

    // Validazione data evento
    if (data.data_evento) {
      // Verifica che la data sia nel formato corretto (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.data_evento)) {
        throw new Error("Formato data non valido. La data deve essere nel formato YYYY-MM-DD, ricevuto: " + data.data_evento);
      }
      
      const dataEvento = new Date(data.data_evento + 'T00:00:00');
      const oggi = new Date();
      
      if (isNaN(dataEvento.getTime())) {
        throw new Error("Data non valida: " + data.data_evento);
      }
      
      // Confronta solo le date, ignorando l'orario
      const oggiDate = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
      const eventoDate = new Date(dataEvento.getFullYear(), dataEvento.getMonth(), dataEvento.getDate());
      
      if (eventoDate > oggiDate) {
        throw new Error("La data dell'evento non può essere nel futuro");
      }
    }

    // Validazione specifica per tipo evento
    if (data.tipo_evento === "intervento" && !data.tipo_intervento) {
      throw new Error("Il tipo di intervento è obbligatorio per gli interventi chirurgici");
    }

    if (data.tipo_evento === "infezione" && !data.agente_patogeno) {
      // Agente patogeno raccomandato ma non obbligatorio per le infezioni
      logger.log("Attenzione: agente patogeno non specificato per l'infezione");
    }
  }

  /**
   * Invalida tutta la cache
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Ottiene statistiche eventi clinici
   */
  async getEventiStats() {
    try {
      const { data, error } = await supabase
        .from("eventi_clinici")
        .select("tipo_evento, data_evento");

      if (error) throw error;

      const stats = {
        total: Array.isArray(data) ? data.length : 0,
        interventi: Array.isArray(data) ? data.filter(e => e.tipo_evento === "intervento").length : 0,
        infezioni: Array.isArray(data) ? data.filter(e => e.tipo_evento === "infezione").length : 0,
        ultimoMese: 0,
      };

      // Conta eventi dell'ultimo mese
      if (Array.isArray(data)) {
        const unMeseFA = new Date();
        unMeseFA.setMonth(unMeseFA.getMonth() - 1);
        
        stats.ultimoMese = data.filter(e => {
          const dataEvento = new Date(e.data_evento);
          return dataEvento >= unMeseFA;
        }).length;
      }

      return stats;
    } catch (error) {
      console.error("Errore nel caricamento statistiche eventi:", error);
      throw error;
    }
  }

  /**
   * Aggiorna lo stato di infezione e la data_infezione di un paziente
   * basandosi sui suoi eventi clinici di tipo 'infezione'.
   * @private
   */
  async _updatePazienteInfezioneStatus(pazienteId) {
    if (!pazienteId) return;

    try {
      // Cerca l'infezione più recente per il paziente
      const { data: infezioni, error: infezioniError } = await supabase
        .from("eventi_clinici")
        .select("data_evento, data_fine_evento")
        .eq("paziente_id", pazienteId)
        .eq("tipo_evento", "infezione")
        .is("data_fine_evento", null) // Cerca solo infezioni "aperte"
        .order("data_evento", { ascending: false })
        .limit(1);

      if (infezioniError) {
        throw new Error(`Errore nel recupero delle infezioni per il paziente ${pazienteId}: ${infezioniError.message}`);
      }

      const latestInfection = infezioni && infezioni.length > 0 ? infezioni[0] : null;

      const updateData = {
        infetto: !!latestInfection,
        data_infezione: latestInfection ? latestInfection.data_evento : null,
      };

      // Aggiorna la tabella pazienti
      const { error: updateError } = await supabase
        .from("pazienti")
        .update(updateData)
        .eq("id", pazienteId);

      if (updateError) {
        throw new Error(`Errore nell'aggiornamento dello stato infezione del paziente ${pazienteId}: ${updateError.message}`);
      }

      logger.log(`Stato infezione per paziente ${pazienteId} aggiornato: infetto=${updateData.infetto}`);

    } catch (error) {
      logger.error(error.message);
      // Non rilanciare l'errore per non bloccare l'operazione principale (es. cancellazione evento)
      // Ma notifica l'utente che qualcosa è andato storto con la sincronizzazione.
      notificationService.warn(`Non è stato possibile sincronizzare lo stato di infezione del paziente. Dettagli: ${error.message}`);
    }
  }
}

// Esporta istanza singleton
export const eventiCliniciService = new EventiCliniciService();