// src/features/patients/services/patientService.js

/**
 * Servizio centralizzato per la gestione dei pazienti.
 * Orchestra la logica di business, la gestione dello stato e la comunicazione
 * con il layer di accesso ai dati.
 */

import { supabase } from "/src/core/services/supabaseClient.js";
import { stateService } from "/src/core/services/stateService.js";
import { notificationService } from "/src/core/services/notificationService.js";
import { logger } from "/src/core/services/loggerService.js";
import { patientApi } from "./patientApi.js";
import { eventiCliniciService } from "/src/features/eventi-clinici/services/eventiCliniciService.js";
import { validatePatientData, validateDischargeData } from "./patientValidation.js";
import { generateCSV, downloadCSV } from "/src/shared/utils/csvUtils.js";

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
      stateService.setLoading(true, "Caricamento pazienti...");
      const { page = 0, limit = 10 } = pagination;

      const { patients, totalCount } = await patientApi.getPaginatedPatients(
        filters,
        pagination
      );

      return {
        patients,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: (page + 1) * limit < totalCount,
        hasPrevPage: page > 0,
      };
    } catch (error) {
      logger.error("Errore nel caricamento pazienti:", error);
      notificationService.error(`Errore nel caricamento: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Ottiene un singolo paziente per ID, usando la cache.
   */
  async getPatientById(id) {
    const cacheKey = `patient_${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await patientApi.getPatientById(id);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      logger.error("Errore nel caricamento paziente:", error);
      notificationService.error(`Errore nel caricamento paziente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un nuovo paziente
   */
  async createPatient(patientData) {
    try {
      stateService.setLoading(true, "Creazione paziente...");
      validatePatientData(patientData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      const dataToInsert = {
        ...patientData,
        user_id: user.id,
        data_dimissione: null,
        infetto: Boolean(patientData.infetto),
      };

      const newPatient = await patientApi.createPatient(dataToInsert);
      this.invalidateCache();

      // Se il paziente viene creato come infetto, crea l'evento clinico corrispondente
      if (newPatient.infetto) {
        const infectionDetails = {
          data_evento: newPatient.data_infezione,
          agente_patogeno: patientData.agente_patogeno,
          descrizione: patientData.descrizione_infezione
        };
        await this._handleInfectionEventCreation(newPatient.id, infectionDetails);
      }

      notificationService.success("Paziente creato con successo!");
      return newPatient;
    } catch (error) {
      logger.error("Errore nella creazione paziente:", error);
      notificationService.error(`Errore nella creazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Aggiorna un paziente esistente
   */
  async updatePatient(id, patientData, options = { showNotification: true }) {
    try {
      // Prima di aggiornare, otteniamo lo stato precedente del paziente
      const oldPatient = await this.getPatientById(id);

      stateService.setLoading(true, "Aggiornamento paziente...");
      const updatedPatient = await patientApi.updatePatient(id, patientData);
      
      this.cache.delete(`patient_${id}`);

      // Controlla se lo stato di infezione è cambiato
      const wasInfected = oldPatient.infetto;
      const isInfected = updatedPatient.infetto;

      if (!wasInfected && isInfected) {
        // Il paziente è stato appena contrassegnato come infetto
        const infectionDetails = {
          data_evento: updatedPatient.data_infezione,
          agente_patogeno: patientData.agente_patogeno,
          descrizione: patientData.descrizione_infezione
        };
        await this._handleInfectionEventCreation(id, infectionDetails);
      }
      // Nota: non gestiamo il caso `isInfected -> wasInfected` per non eliminare eventi storici.

      if (options.showNotification) {
        notificationService.success("Paziente aggiornato con successo!");
      }
      return updatedPatient;
    } catch (error) {
      logger.error("Errore nell'aggiornamento paziente:", error);
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
      await patientApi.deletePatient(id);
      
      this.cache.delete(`patient_${id}`);
      this.invalidateCache(); // Potrebbe influenzare le statistiche, quindi invalido tutto
      
      notificationService.success("Paziente eliminato con successo!");
    } catch (error) {
      logger.error("Errore nell'eliminazione paziente:", error);
      notificationService.error(`Errore nell'eliminazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Dimette un paziente (logica di business)
   */
  async dischargePatient(id, dischargeDate = null) {
    try {
      const date = dischargeDate || new Date().toISOString().split("T")[0];
      await this.updatePatient(id, { data_dimissione: date }, { showNotification: false });
      notificationService.success("Paziente dimesso con successo!");
    } catch (error) {
      logger.error("Errore nella dimissione:", error);
      notificationService.error(`Errore nella dimissione: ${error.message}`);
      throw error;
    }
  }

  /**
   * Dimette un paziente con informazioni di trasferimento
   */
  async dischargePatientWithTransfer(id, dischargeData) {
    try {
      stateService.setLoading(true, "Dimissione paziente...");
      validateDischargeData(dischargeData);

      const data = await patientApi.updatePatient(id, dischargeData);
      this.cache.delete(`patient_${id}`);

      const tipoMessage = dischargeData.tipo_dimissione === 'dimissione' ? 'dimesso' : 'trasferito';
      notificationService.success(`Paziente ${tipoMessage} con successo!`);
      return data;
    } catch (error)
    {
      logger.error("Errore nella dimissione/trasferimento:", error);
      notificationService.error(`Errore nella dimissione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Riattiva un paziente dimesso
   */
  async reactivatePatient(id) {
    try {
      const reactivationData = {
        data_dimissione: null,
        tipo_dimissione: null,
        reparto_destinazione: null,
        clinica_destinazione: null,
        codice_clinica: null,
        codice_dimissione: null
      };
      await this.updatePatient(id, reactivationData, { showNotification: false });
      notificationService.success("Paziente riattivato con successo!");
    } catch (error) {
      logger.error("Errore nella riattivazione:", error);
      notificationService.error(`Errore nella riattivazione: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cerca pazienti per testo
   */
  async searchPatients(searchTerm, activeOnly = false) {
    try {
      return await patientApi.searchPatients(searchTerm, activeOnly);
    } catch (error) {
      logger.error("Errore nella ricerca pazienti:", error);
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
      const patients = await patientApi.getAllPatients(filters);

      if (!patients || patients.length === 0) {
        notificationService.warning("Nessun dato da esportare per i filtri selezionati.");
        return;
      }

      const csvContent = generateCSV(patients);
      downloadCSV(csvContent, "esportazione_pazienti.csv");

      notificationService.success(`Esportati ${patients.length} pazienti con successo!`);
    } catch (error) {
      logger.error("Errore nell'esportazione:", error);
      notificationService.error(`Errore nell'esportazione: ${error.message}`);
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Ottiene statistiche pazienti
   */
  async getPatientStats() {
    try {
      const data = await patientApi.getStatsData();

      const stats = {
        total: data.length,
        active: data.filter((p) => !p.data_dimissione).length,
        discharged: data.filter((p) => p.data_dimissione).length,
        byDiagnosis: {},
        byDepartment: {},
      };

      data.forEach((p) => {
        stats.byDiagnosis[p.diagnosi] = (stats.byDiagnosis[p.diagnosi] || 0) + 1;
        stats.byDepartment[p.reparto_appartenenza] = (stats.byDepartment[p.reparto_appartenenza] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error("Errore nel caricamento statistiche:", error);
      throw error;
    }
  }

  /**
   * Ottiene la cronologia dei trasferimenti per un paziente
   */
  async getTransferHistory(pazienteId) {
    try {
      const patient = await this.getPatientById(pazienteId);
      if (!patient) {
        throw new Error("Paziente non trovato");
      }

      const transferHistory = [];
      if (patient.data_dimissione && patient.tipo_dimissione) {
        transferHistory.push({
          data: patient.data_dimissione,
          tipo: patient.tipo_dimissione,
          reparto_destinazione: patient.reparto_destinazione,
          clinica_destinazione: patient.clinica_destinazione,
          codice_clinica: patient.codice_clinica,
          codice_dimissione: patient.codice_dimissione
        });
      }
      return transferHistory;
    } catch (error) {
      logger.error("Errore nel caricamento cronologia trasferimenti:", error);
      notificationService.error(`Errore nel caricamento cronologia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalida tutta la cache
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Debug function per verificare la fonte dei dati
   */
  async debugDataSource() {
    logger.log("🔍 DEBUG: Verifica fonte dati pazienti...");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      logger.log("👤 Utente autenticato:", user?.email || "Non autenticato");
      if (authError) logger.error("❌ Errore autenticazione:", authError);

      const { count, data: allPatients, error: dbError } = await supabase.from("pazienti").select("*", { count: "exact" });
      logger.log("📊 Pazienti nel database:", count);
      if (dbError) logger.error("❌ Errore DB:", dbError);

      logger.log("💾 Cache locale:", {
        cacheSize: this.cache.size,
        cacheKeys: Array.from(this.cache.keys()),
      });

      const hasMockData = allPatients && allPatients.some(p => p.nome?.includes("Test") || p.cognome?.includes("Test"));
      logger.log("🧪 Dati mock rilevati:", hasMockData);

      return {
        user: user?.email,
        dbCount: count,
        hasDbError: !!dbError,
        cacheSize: this.cache.size,
        hasMockData,
      };
    } catch (error) {
      logger.error("❌ Errore durante debug:", error);
      return { error: error.message };
    }
  }

  /**
   * Gestisce la creazione di un evento di infezione quando un paziente viene marcato come infetto.
   * @private
   */
  async _handleInfectionEventCreation(pazienteId, infectionDetails) {
    try {
      const eventoData = {
        paziente_id: pazienteId,
        tipo_evento: 'infezione',
        // Usa la data fornita o la data odierna come fallback
        data_evento: infectionDetails.data_evento || new Date().toISOString().split('T')[0],
        descrizione: infectionDetails.descrizione || 'Infezione registrata tramite form paziente.',
        agente_patogeno: infectionDetails.agente_patogeno || 'Non specificato'
      };
      await eventiCliniciService.createEvento(eventoData);
      logger.log(`Evento di infezione creato automaticamente per il paziente ${pazienteId}`);
    } catch (error) {
      notificationService.error(`Non è stato possibile creare l'evento di infezione automatico: ${error.message}`);
    }
  }
}

export const patientService = new PatientService();