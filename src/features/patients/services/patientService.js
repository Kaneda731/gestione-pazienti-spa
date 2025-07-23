// src/js/services/patientService.js

/**
 * Servizio centralizzato per la gestione dei pazienti
 * Centralizza tutte le operazioni CRUD e business logic
 */

import { supabase } from "/src/core/services/supabaseClient.js";
import { stateService } from "/src/core/services/stateService.js";
import { notificationService } from "/src/core/services/notificationService.js";
import { logger } from "/src/core/services/loggerService.js";

class PatientService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuti
  }

  /**
   * Ottiene la lista dei pazienti con filtri e paginazione
   */
  async getPatients(filters = {}, pagination = {}) {
    try {
      // Mostra loading
      stateService.setLoading(true, "Caricamento pazienti...");

      const {
        reparto = "",
        diagnosi = "",
        stato = "",
        search = "",
        page = 0,
        limit = 10,
        sortColumn = "data_ricovero",
        sortDirection = "desc",
      } = { ...filters, ...pagination };

      let query = supabase
        .from("pazienti")
        .select("*", { count: "exact" })
        .not("user_id", "is", null);

      // Applica filtri
      if (reparto) query = query.eq("reparto_appartenenza", reparto);
      if (diagnosi) query = query.eq("diagnosi", diagnosi);
      if (stato === "attivo") query = query.is("data_dimissione", null);
      if (stato === "dimesso") query = query.not("data_dimissione", "is", null);

      // Ricerca testuale
      if (search) {
        query = query.or(`nome.ilike.%${search}%,cognome.ilike.%${search}%`);
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
        patients: data || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: (page + 1) * limit < (count || 0),
        hasPrevPage: page > 0,
      };
    } catch (error) {
      console.error("Errore nel caricamento pazienti:", error);
      notificationService.error(`Errore nel caricamento: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Ottiene un singolo paziente per ID
   */
  async getPatientById(id) {
    try {
      // Controlla cache prima
      const cacheKey = `patient_${id}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from("pazienti")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Aggiorna cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("Errore nel caricamento paziente:", error);
      notificationService.error(
        `Errore nel caricamento paziente: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Crea un nuovo paziente
   */
  async createPatient(patientData) {
    try {
      stateService.setLoading(true, "Creazione paziente...");

      // Validazione dati
      this.validatePatientData(patientData);

      // Aggiungi user_id del utente corrente
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      const dataToInsert = {
        ...patientData,
        user_id: user.id,
        data_dimissione: null, // Nuovo paziente sempre attivo
        infetto: Boolean(patientData.infetto), // Assicurati che sia un booleano
      };

      const { data, error } = await supabase
        .from("pazienti")
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;

      // Invalida cache
      this.invalidateCache();

      notificationService.success("Paziente creato con successo!");
      return data;
    } catch (error) {
      console.error("Errore nella creazione paziente:", error);
      notificationService.error(`Errore nella creazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Aggiorna un paziente esistente
   */
  async updatePatient(id, patientData) {
    try {
      stateService.setLoading(true, "Aggiornamento paziente...");

      // Validazione dati
      this.validatePatientData(patientData);

      const { data, error } = await supabase
        .from("pazienti")
        .update(patientData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Invalida cache per questo paziente
      this.cache.delete(`patient_${id}`);

      notificationService.success("Paziente aggiornato con successo!");
      return data;
    } catch (error) {
      console.error("Errore nell'aggiornamento paziente:", error);
      notificationService.error(`Errore nell'aggiornamento: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Elimina un paziente
   */
  async deletePatient(id) {
    try {
      stateService.setLoading(true, "Eliminazione paziente...");

      const { error } = await supabase.from("pazienti").delete().eq("id", id);

      if (error) throw error;

      // Invalida cache
      this.cache.delete(`patient_${id}`);
      this.invalidateCache();

      notificationService.success("Paziente eliminato con successo!");
    } catch (error) {
      console.error("Errore nell'eliminazione paziente:", error);
      notificationService.error(`Errore nell'eliminazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Dimette un paziente
   */
  async dischargePatient(id, dischargeDate = null) {
    try {
      const date = dischargeDate || new Date().toISOString().split("T")[0];

      await this.updatePatient(id, {
        data_dimissione: date,
      });

      notificationService.success("Paziente dimesso con successo!");
    } catch (error) {
      console.error("Errore nella dimissione:", error);
      notificationService.error(`Errore nella dimissione: ${error.message}`);
      throw error;
    }
  }

  /**
   * Riattiva un paziente dimesso
   */
  async reactivatePatient(id) {
    try {
      await this.updatePatient(id, {
        data_dimissione: null,
      });

      notificationService.success("Paziente riattivato con successo!");
    } catch (error) {
      console.error("Errore nella riattivazione:", error);
      notificationService.error(`Errore nella riattivazione: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cerca pazienti per testo
   */
  async searchPatients(searchTerm, activeOnly = false) {
    try {
      let query = supabase
        .from("pazienti")
        .select(
          "id, nome, cognome, data_ricovero, diagnosi, reparto_appartenenza"
        )
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
   * Esporta pazienti in CSV
   */
  async exportPatients(filters = {}) {
    try {
      stateService.setLoading(true, "Preparazione esportazione...");

      // Ottieni tutti i pazienti senza paginazione
      let query = supabase
        .from("pazienti")
        .select("*")
        .not("user_id", "is", null);

      // Applica gli stessi filtri della vista
      if (filters.reparto)
        query = query.eq("reparto_appartenenza", filters.reparto);
      if (filters.diagnosi) query = query.eq("diagnosi", filters.diagnosi);
      if (filters.stato === "attivo") query = query.is("data_dimissione", null);
      if (filters.stato === "dimesso")
        query = query.not("data_dimissione", "is", null);
      if (filters.search) {
        query = query.or(
          `nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%`
        );
      }

      query = query.order(filters.sortColumn || "data_ricovero", {
        ascending: filters.sortDirection === "asc",
      });

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        notificationService.warning(
          "Nessun dato da esportare per i filtri selezionati."
        );
        return;
      }

      // Genera CSV
      const csvContent = this.generateCSV(data);
      this.downloadCSV(csvContent, "esportazione_pazienti.csv");

      notificationService.success(
        `Esportati ${data.length} pazienti con successo!`
      );
    } catch (error) {
      console.error("Errore nell'esportazione:", error);
      notificationService.error(`Errore nell'esportazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Validazione dati paziente
   */
  validatePatientData(data) {
    const required = [
      "nome",
      "cognome",
      "data_nascita",
      "data_ricovero",
      "diagnosi",
      "reparto_appartenenza",
    ];

    for (const field of required) {
      if (!data[field] || data[field].toString().trim() === "") {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    // Validazione data nascita
    if (data.data_nascita) {
      const nascitaDate = new Date(data.data_nascita);
      const oggi = new Date();
      if (nascitaDate > oggi) {
        throw new Error("La data di nascita non può essere nel futuro");
      }
    }

    // Validazione data ricovero
    if (data.data_ricovero) {
      const ricoveroDate = new Date(data.data_ricovero);
      if (ricoveroDate > new Date()) {
        throw new Error("La data di ricovero non può essere nel futuro");
      }
    }

    // Validazione data dimissione
    if (data.data_dimissione) {
      const dimissioneDate = new Date(data.data_dimissione);
      const ricoveroDate = new Date(data.data_ricovero);
      if (dimissioneDate < ricoveroDate) {
        throw new Error(
          "La data di dimissione non può essere precedente alla data di ricovero"
        );
      }
    }

    // Validazione codice RAD (opzionale ma con formato specifico)
    if (data.codice_rad && data.codice_rad.trim() !== "") {
      if (data.codice_rad.length > 11) {
        throw new Error("Il codice RAD non può superare i 11 caratteri");
      }
    }
  }

  /**
   * Genera contenuto CSV
   */
  generateCSV(data) {
    const headers = [
      "Nome",
      "Cognome",
      "Data Nascita",
      "Data Ricovero",
      "Data Dimissione",
      "Diagnosi",
      "Reparto Appartenenza",
      "Reparto Provenienza",
      "Livello Assistenza",
      "Codice RAD",
      "Infetto",
    ];

    const rows = data.map((p) => [
      p.nome || "",
      p.cognome || "",
      p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : "",
      p.data_ricovero ? new Date(p.data_ricovero).toLocaleDateString() : "",
      p.data_dimissione ? new Date(p.data_dimissione).toLocaleDateString() : "",
      p.diagnosi || "",
      p.reparto_appartenenza || "",
      p.reparto_provenienza || "",
      p.livello_assistenza || "",
      p.codice_rad || "",
      p.infetto ? "Sì" : "No",
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  }

  /**
   * Download file CSV
   */
  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Invalida tutta la cache
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Ottiene statistiche pazienti
   */
  async getPatientStats() {
    try {
      const { data, error } = await supabase
        .from("pazienti")
        .select("data_dimissione, diagnosi, reparto_appartenenza")
        .not("user_id", "is", null);

      if (error) throw error;

      const stats = {
        total: Array.isArray(data) ? data.length : 0,
        active: Array.isArray(data) ? data.filter((p) => !p.data_dimissione).length : 0,
        discharged: Array.isArray(data) ? data.filter((p) => p.data_dimissione).length : 0,
        byDiagnosis: {},
        byDepartment: {},
      };

      // Conta per diagnosi
      data.forEach((p) => {
        stats.byDiagnosis[p.diagnosi] =
          (stats.byDiagnosis[p.diagnosi] || 0) + 1;
        stats.byDepartment[p.reparto_appartenenza] =
          (stats.byDepartment[p.reparto_appartenenza] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Errore nel caricamento statistiche:", error);
      throw error;
    }
  }

  /**
   * Debug function per verificare la fonte dei dati
   */
  async debugDataSource() {
    logger.log("🔍 DEBUG: Verifica fonte dati pazienti...");

    try {
      // 1. Verifica connessione Supabase
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      logger.log("👤 Utente autenticato:", user?.email || "Non autenticato");
      if (authError) console.error("❌ Errore autenticazione:", authError);

      // 2. Verifica tabella pazienti
      const {
        data: allPatients,
        count,
        error: dbError,
      } = await supabase.from("pazienti").select("*", { count: "exact" });

      logger.log("📊 Pazienti nel database:", count);
      logger.log("📋 Dettagli pazienti:", allPatients);

      // 3. Verifica cache locale
      logger.log("💾 Cache locale:", {
        cacheSize: this.cache.size,
        cacheKeys: Array.from(this.cache.keys()),
      });

      // 4. Verifica localStorage/sessionStorage
      logger.log("🗄️ LocalStorage keys:", Object.keys(localStorage));
      logger.log("🗄️ SessionStorage keys:", Object.keys(sessionStorage));

      // 5. Verifica se ci sono dati mock
      const hasMockData =
        allPatients &&
        allPatients.some(
          (p) =>
            p.nome?.includes("Test") ||
            p.cognome?.includes("Test") ||
            p.email?.includes("test@")
        );
      logger.log("🧪 Dati mock rilevati:", hasMockData);

      return {
        user: user?.email,
        dbCount: count,
        hasDbError: !!dbError,
        cacheSize: this.cache.size,
        hasMockData,
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage),
      };
    } catch (error) {
      console.error("❌ Errore durante debug:", error);
      return { error: error.message };
    }
  }
}

// Esporta istanza singleton
export const patientService = new PatientService();
