/**
 * Servizio centralizzato per la gestione degli eventi clinici
 * Gestisce interventi chirurgici e infezioni con calcolo giorni post-operatori
 */

import { supabase } from "/src/core/services/supabaseClient.js";
import { stateService } from "/src/core/services/stateService.js";
import { notificationService } from "/src/core/services/notificationService.js";
import { logger } from "/src/core/services/loggerService.js";

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
        tipo_evento = "",
        data_da = "",
        data_a = "",
        reparto = "",
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
            reparto_appartenenza
          )
        `, { count: "exact" });

      // Filtri
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

      // Ricerca paziente per nome/cognome
      if (paziente_search) {
        const searchPattern = `%${paziente_search}%`;
        query = query.or(
          `pazienti.nome.ilike."${searchPattern}",pazienti.cognome.ilike."${searchPattern}"`
        );
      }

      // Paginazione e ordinamento
      const startIndex = page * limit;
      const endIndex = startIndex + limit - 1;

      query = query
        .order(sortColumn, { ascending: sortDirection === "asc" })
        .range(startIndex, endIndex);

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

      query = query.order(sortColumn, { ascending: sortDirection === "asc" });

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

      const { error } = await supabase
        .from("eventi_clinici")
        .delete()
        .eq("id", id);

      if (error) throw error;

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
        .select("id, nome, cognome, data_ricovero, diagnosi, reparto_appartenenza")
        .not("user_id", "is", null)
        .or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`)
        .order("cognome");

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
      const dataEvento = new Date(data.data_evento);
      const oggi = new Date();
      if (dataEvento > oggi) {
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
}

// Esporta istanza singleton
export const eventiCliniciService = new EventiCliniciService();