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
import { patientTransactionService } from "./patientTransactionService.js";
import infectionDataManager from "./infectionDataManager.js";

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
      stateService.setLoading(true, "Aggiornamento paziente...");
      const updatedPatient = await patientApi.updatePatient(id, patientData);
      
      this.cache.delete(`patient_${id}`);

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
   * Crea un paziente con evento di infezione associato in una transazione coordinata
   * @param {Object} patientData - Dati del paziente
   * @param {Object} infectionData - Dati dell'evento di infezione
   * @returns {Promise<Object>} Risultato della transazione
   */
  async createPatientWithInfection(patientData, infectionData) {
    try {
      logger.log("Avvio creazione paziente con infezione:", { 
        patientName: `${patientData.nome} ${patientData.cognome}`,
        infectionDate: infectionData.data_evento 
      });

      // Validazione preliminare dei dati
      validatePatientData(patientData);
      
      // Validazione dati infezione tramite InfectionDataManager
      infectionDataManager.setInfectionData(infectionData);
      if (!infectionDataManager.hasValidInfectionData()) {
        const errors = infectionDataManager.getValidationErrors();
        const errorMessages = errors.map(err => err.message).join(', ');
        throw new Error(`Dati infezione non validi: ${errorMessages}`);
      }

      // Esegui la transazione coordinata
      const result = await patientTransactionService.executePatientWithInfectionTransaction(
        patientData, 
        infectionData
      );

      // Pulisci i dati temporanei dopo il successo
      infectionDataManager.clearInfectionData();
      
      // Invalida la cache per forzare il refresh dei dati
      this.invalidateCache();

      logger.log("Creazione paziente con infezione completata con successo:", {
        transactionId: result.transactionId,
        patientId: result.patient?.id,
        infectionEventId: result.infectionEvent?.id
      });

      return result;

    } catch (error) {
      logger.error("Errore nella creazione paziente con infezione:", error);
      
      // Gestisci diversi tipi di errore con messaggi specifici
      if (error.message.includes('Dati infezione non validi')) {
        notificationService.error(`Errore nei dati di infezione: ${error.message}`);
      } else if (error.message.includes('Transazione parzialmente completata')) {
        // L'errore è già gestito dal transaction service con opzioni di recovery
        logger.warn("Transazione parzialmente completata - recovery options presentate");
      } else {
        notificationService.error(`Errore nella creazione: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Gestisce la creazione dell'evento di infezione per un paziente esistente
   * @param {string} patientId - ID del paziente
   * @param {Object} infectionData - Dati dell'evento di infezione
   * @returns {Promise<Object>} Evento clinico creato
   */
  async handleInfectionEventCreation(patientId, infectionData) {
    try {
      logger.log(`Creazione evento infezione per paziente ${patientId}`);

      // Verifica che il paziente esista
      const patient = await this.getPatientById(patientId);
      if (!patient) {
        throw new Error(`Paziente con ID ${patientId} non trovato`);
      }

      // Validazione dati infezione
      infectionDataManager.setInfectionData(infectionData);
      if (!infectionDataManager.hasValidInfectionData()) {
        const errors = infectionDataManager.getValidationErrors();
        const errorMessages = errors.map(err => err.message).join(', ');
        throw new Error(`Dati infezione non validi: ${errorMessages}`);
      }

      // Verifica se esiste già un evento di infezione attivo per questo paziente
      const existingInfections = await eventiCliniciService.getEventiByPaziente(patientId, {
        tipo_evento: 'infezione'
      });

      const activeInfections = existingInfections.filter(event => !event.data_fine_evento);
      
      if (activeInfections.length > 0) {
        logger.warn(`Paziente ${patientId} ha già un'infezione attiva`);
        
        // Offri opzioni all'utente
        notificationService.warning(
          `Il paziente ha già un'infezione attiva dal ${activeInfections[0].data_evento}. ` +
          `Vuoi comunque creare un nuovo evento di infezione?`,
          { 
            persistent: true,
            actions: [
              { label: 'Crea Comunque', action: 'force_create_infection' },
              { label: 'Annulla', action: 'cancel_infection' }
            ]
          }
        );
        
        throw new Error("Paziente ha già un'infezione attiva");
      }

      // Crea l'evento di infezione
      const eventoData = {
        paziente_id: patientId,
        tipo_evento: 'infezione',
        data_evento: infectionData.data_evento,
        agente_patogeno: infectionData.agente_patogeno || null,
        descrizione: infectionData.descrizione || null,
        data_fine_evento: null // Infezione attiva
      };

      const infectionEvent = await eventiCliniciService.createEvento(eventoData);

      // Pulisci i dati temporanei
      infectionDataManager.clearInfectionData();
      
      // Invalida la cache del paziente
      this.cache.delete(`patient_${patientId}`);

      logger.log(`Evento infezione creato con successo: ID ${infectionEvent.id}`);
      
      return infectionEvent;

    } catch (error) {
      logger.error(`Errore nella creazione evento infezione per paziente ${patientId}:`, error);
      
      // Gestisci errori specifici
      if (error.message.includes('già un\'infezione attiva')) {
        // Errore già gestito sopra con notifica
        throw error;
      } else if (error.message.includes('Dati infezione non validi')) {
        notificationService.error(`Errore nei dati di infezione: ${error.message}`);
      } else if (error.message.includes('non trovato')) {
        notificationService.error("Paziente non trovato");
      } else {
        notificationService.error(`Errore nella creazione evento infezione: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Riprova la creazione di un evento infezione per una transazione fallita
   * @param {string} transactionId - ID della transazione originale
   * @param {string} patientId - ID del paziente
   * @param {Object} infectionData - Dati dell'infezione
   * @returns {Promise<Object>} Evento clinico creato
   */
  async retryInfectionEventCreation(transactionId, patientId, infectionData) {
    try {
      logger.log(`Retry creazione evento infezione - Transazione: ${transactionId}, Paziente: ${patientId}`);
      
      return await patientTransactionService.retryInfectionCreation(
        transactionId, 
        patientId, 
        infectionData
      );
    } catch (error) {
      logger.error("Errore nel retry creazione evento infezione:", error);
      notificationService.error(`Errore nel retry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Esegue il rollback di un paziente creato in una transazione fallita
   * @param {string} patientId - ID del paziente da eliminare
   * @returns {Promise<void>}
   */
  async rollbackPatientCreation(patientId) {
    try {
      logger.log(`Rollback creazione paziente: ${patientId}`);
      
      await patientTransactionService.rollbackPatientCreation(patientId);
      
      // Invalida la cache
      this.cache.delete(`patient_${patientId}`);
      this.invalidateCache();
      
    } catch (error) {
      logger.error(`Errore nel rollback paziente ${patientId}:`, error);
      notificationService.error(`Errore nel rollback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Forza la creazione di un evento infezione anche se ne esiste già uno attivo
   * @param {string} patientId - ID del paziente
   * @param {Object} infectionData - Dati dell'infezione
   * @returns {Promise<Object>} Evento clinico creato
   */
  async forceCreateInfectionEvent(patientId, infectionData) {
    try {
      logger.log(`Creazione forzata evento infezione per paziente ${patientId}`);

      // Validazione dati infezione
      infectionDataManager.setInfectionData(infectionData);
      if (!infectionDataManager.hasValidInfectionData()) {
        const errors = infectionDataManager.getValidationErrors();
        const errorMessages = errors.map(err => err.message).join(', ');
        throw new Error(`Dati infezione non validi: ${errorMessages}`);
      }

      // Crea l'evento senza controlli di duplicazione
      const eventoData = {
        paziente_id: patientId,
        tipo_evento: 'infezione',
        data_evento: infectionData.data_evento,
        agente_patogeno: infectionData.agente_patogeno || null,
        descrizione: infectionData.descrizione || null,
        data_fine_evento: null
      };

      const infectionEvent = await eventiCliniciService.createEvento(eventoData);

      // Pulisci i dati temporanei
      infectionDataManager.clearInfectionData();
      
      // Invalida la cache del paziente
      this.cache.delete(`patient_${patientId}`);

      notificationService.success("Nuovo evento infezione creato con successo!");
      
      return infectionEvent;

    } catch (error) {
      logger.error(`Errore nella creazione forzata evento infezione:`, error);
      notificationService.error(`Errore nella creazione: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ottiene lo stato delle transazioni per debugging e monitoraggio
   * @returns {Object} Statistiche delle transazioni
   */
  getTransactionStats() {
    return patientTransactionService.getTransactionStats();
  }

  /**
   * Ottiene il log di una transazione specifica
   * @param {string} transactionId - ID della transazione
   * @returns {Object|null} Log della transazione
   */
  getTransactionLog(transactionId) {
    return patientTransactionService.getTransactionLog(transactionId);
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

      // Aggiungi statistiche transazioni
      const transactionStats = this.getTransactionStats();
      logger.log("📊 Statistiche transazioni:", transactionStats);

      return {
        user: user?.email,
        dbCount: count,
        hasDbError: !!dbError,
        cacheSize: this.cache.size,
        hasMockData,
        transactionStats
      };
    } catch (error) {
      logger.error("❌ Errore durante debug:", error);
      return { error: error.message };
    }
  }
}

export const patientService = new PatientService();