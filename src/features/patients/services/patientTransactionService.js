/**
 * Servizio per la gestione di transazioni complesse che coinvolgono
 * la creazione coordinata di pazienti ed eventi clinici.
 * Implementa pattern Saga per gestire rollback e recovery.
 */

import { logger } from "../../../core/services/logger/loggerService.js";
import { notificationService } from "../../../core/services/notifications/notificationService.js";
import { stateService } from "../../../core/services/state/stateService.js";
import { patientApi } from "./patientApi.js";
import { eventiCliniciService } from "../../eventi-clinici/services/eventiCliniciService.js";

class PatientTransactionService {
  constructor() {
    this.transactionLogs = new Map();
    this.maxLogRetention = 24 * 60 * 60 * 1000; // 24 ore
    this.cleanupInterval = 60 * 60 * 1000; // 1 ora
    
    // Avvia cleanup automatico dei log
    this.startLogCleanup();
  }

  /**
   * Esegue una transazione completa per creare paziente con evento di infezione
   * @param {Object} patientData - Dati del paziente
   * @param {Object} infectionData - Dati dell'evento di infezione
   * @returns {Promise<Object>} Risultato della transazione
   */
  async executePatientWithInfectionTransaction(patientData, infectionData) {
    const transactionId = this.generateTransactionId();
    
    try {
      // Inizializza il log della transazione
      this.initializeTransactionLog(transactionId, 'patient_with_infection', {
        patientData: this.sanitizeLogData(patientData),
        infectionData: this.sanitizeLogData(infectionData)
      });

      stateService.setLoading(true, "Creazione paziente e evento infezione...");

      // Validazione dati prima di iniziare
      await this.validateTransactionData(patientData, infectionData);
      this.logTransactionStep(transactionId, 'validation', 'completed', { message: 'Dati validati con successo' });

      // Step 1: Creazione paziente
      this.logTransactionStep(transactionId, 'create_patient', 'started');
      const patient = await this.createPatientStep(patientData);
      this.logTransactionStep(transactionId, 'create_patient', 'completed', { patientId: patient.id });

      // Step 2: Creazione evento clinico di infezione
      this.logTransactionStep(transactionId, 'create_infection_event', 'started');
      const infectionEvent = await this.createInfectionEventStep(patient.id, infectionData);
      this.logTransactionStep(transactionId, 'create_infection_event', 'completed', { eventId: infectionEvent.id });

      // Step 3: Verifica sincronizzazione stato
      this.logTransactionStep(transactionId, 'verify_synchronization', 'started');
      await this.verifySynchronizationStep(patient.id);
      this.logTransactionStep(transactionId, 'verify_synchronization', 'completed');

      // Transazione completata con successo
      this.completeTransactionLog(transactionId, 'completed');
      
      notificationService.success("Paziente e evento infezione creati con successo!");
      
      return {
        success: true,
        transactionId,
        patient,
        infectionEvent,
        message: "Transazione completata con successo"
      };

    } catch (error) {
      logger.error(`Errore nella transazione ${transactionId}:`, error);
      
      // Gestisci il rollback in base al punto di fallimento
      await this.handleTransactionFailure(transactionId, error);
      
      throw error;
    } finally {
      stateService.setLoading(false);
    }
  }

  /**
   * Valida i dati della transazione prima dell'esecuzione
   * @param {Object} patientData - Dati del paziente
   * @param {Object} infectionData - Dati dell'infezione
   */
  async validateTransactionData(patientData, infectionData) {
    // Validazione dati paziente
    if (!patientData || typeof patientData !== 'object') {
      throw new Error("Dati paziente non validi");
    }

    const requiredPatientFields = ['nome', 'cognome', 'data_ricovero'];
    for (const field of requiredPatientFields) {
      if (!patientData[field] || patientData[field].toString().trim() === '') {
        throw new Error(`Campo paziente obbligatorio mancante: ${field}`);
      }
    }

    // Validazione dati infezione
    if (!infectionData || typeof infectionData !== 'object') {
      throw new Error("Dati infezione non validi");
    }

    const requiredInfectionFields = ['data_evento'];
    for (const field of requiredInfectionFields) {
      if (!infectionData[field] || infectionData[field].toString().trim() === '') {
        throw new Error(`Campo infezione obbligatorio mancante: ${field}`);
      }
    }

    // Validazione data infezione
    const dataEvento = new Date(infectionData.data_evento);
    const oggi = new Date();
    oggi.setHours(23, 59, 59, 999); // Fine della giornata corrente

    if (isNaN(dataEvento.getTime())) {
      throw new Error("Data evento infezione non valida");
    }

    if (dataEvento > oggi) {
      throw new Error("La data dell'evento di infezione non può essere nel futuro");
    }

    logger.log("Validazione dati transazione completata con successo");
  }

  /**
   * Step 1: Creazione del paziente
   * @param {Object} patientData - Dati del paziente
   * @returns {Promise<Object>} Paziente creato
   */
  async createPatientStep(patientData) {
    try {
      // Assicurati che il flag infetto sia impostato
      const dataToInsert = {
        ...patientData,
        infetto: true, // Forza il flag infetto per questa transazione
        data_infezione: null // Sarà aggiornato automaticamente dal servizio eventi clinici
      };

      const patient = await patientApi.createPatient(dataToInsert);
      
      if (!patient || !patient.id) {
        throw new Error("Creazione paziente fallita: nessun ID restituito");
      }

      logger.log(`Paziente creato con successo: ID ${patient.id}`);
      return patient;
    } catch (error) {
      logger.error("Errore nella creazione paziente:", error);
      throw new Error(`Fallimento creazione paziente: ${error.message}`);
    }
  }

  /**
   * Step 2: Creazione dell'evento clinico di infezione
   * @param {string} patientId - ID del paziente
   * @param {Object} infectionData - Dati dell'infezione
   * @returns {Promise<Object>} Evento clinico creato
   */
  async createInfectionEventStep(patientId, infectionData) {
    try {
      const eventoData = {
        paziente_id: patientId,
        tipo_evento: 'infezione',
        data_evento: infectionData.data_evento,
        agente_patogeno: infectionData.agente_patogeno || null,
        descrizione: infectionData.descrizione || null,
        data_fine_evento: null // Infezione attiva
      };

      const infectionEvent = await eventiCliniciService.createEvento(eventoData);
      
      if (!infectionEvent || !infectionEvent.id) {
        throw new Error("Creazione evento infezione fallita: nessun ID restituito");
      }

      logger.log(`Evento infezione creato con successo: ID ${infectionEvent.id}`);
      return infectionEvent;
    } catch (error) {
      logger.error("Errore nella creazione evento infezione:", error);
      throw new Error(`Fallimento creazione evento infezione: ${error.message}`);
    }
  }

  /**
   * Step 3: Verifica la sincronizzazione dello stato
   * @param {string} patientId - ID del paziente
   */
  async verifySynchronizationStep(patientId) {
    try {
      // Attendi un breve momento per permettere la sincronizzazione
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verifica che il paziente abbia lo stato corretto
      const patient = await patientApi.getPatientById(patientId);
      
      if (!patient) {
        throw new Error("Paziente non trovato durante verifica sincronizzazione");
      }

      if (!patient.infetto) {
        logger.warn(`Paziente ${patientId}: flag infetto non sincronizzato correttamente`);
        // Non bloccare la transazione per questo, ma logga l'avviso
      }

      if (!patient.data_infezione) {
        logger.warn(`Paziente ${patientId}: data_infezione non sincronizzata correttamente`);
      }

      logger.log(`Sincronizzazione verificata per paziente ${patientId}`);
    } catch (error) {
      logger.error("Errore nella verifica sincronizzazione:", error);
      // Non bloccare la transazione per errori di verifica
      logger.warn("Continuando nonostante errore di verifica sincronizzazione");
    }
  }

  /**
   * Gestisce il fallimento della transazione e implementa strategie di recovery
   * @param {string} transactionId - ID della transazione
   * @param {Error} error - Errore che ha causato il fallimento
   */
  async handleTransactionFailure(transactionId, error) {
    const transactionLog = this.transactionLogs.get(transactionId);
    if (!transactionLog) {
      logger.error(`Log transazione ${transactionId} non trovato`);
      return;
    }

    this.logTransactionStep(transactionId, 'handle_failure', 'started', { error: error.message });

    // Determina il punto di fallimento
    const completedSteps = transactionLog.steps.filter(step => step.status === 'completed');
    const patientCreated = completedSteps.some(step => step.step === 'create_patient');
    const infectionEventCreated = completedSteps.some(step => step.step === 'create_infection_event');

    try {
      if (infectionEventCreated && !patientCreated) {
        // Caso improbabile ma gestito per completezza
        logger.warn("Evento infezione creato senza paziente - situazione inconsistente");
        await this.handleInconsistentState(transactionId, error);
      } else if (patientCreated && !infectionEventCreated) {
        // Paziente creato ma evento infezione fallito
        await this.handlePatientCreatedInfectionFailed(transactionId, error);
      } else if (!patientCreated) {
        // Fallimento prima della creazione paziente
        await this.handleEarlyFailure(transactionId, error);
      } else {
        // Fallimento dopo entrambe le creazioni (probabilmente nella verifica)
        await this.handleLateFailure(transactionId, error);
      }

      this.completeTransactionLog(transactionId, 'failed');
    } catch (rollbackError) {
      logger.error(`Errore durante gestione fallimento transazione ${transactionId}:`, rollbackError);
      this.completeTransactionLog(transactionId, 'rollback_failed');
    }
  }

  /**
   * Gestisce il caso in cui il paziente è stato creato ma l'evento infezione è fallito
   * @param {string} transactionId - ID della transazione
   * @param {Error} originalError - Errore originale
   */
  async handlePatientCreatedInfectionFailed(transactionId, originalError) {
    const transactionLog = this.transactionLogs.get(transactionId);
    const patientStep = transactionLog.steps.find(step => step.step === 'create_patient' && step.status === 'completed');
    
    if (!patientStep || !patientStep.data || !patientStep.data.patientId) {
      throw new Error("ID paziente non trovato nel log della transazione");
    }

    const patientId = patientStep.data.patientId;

    // Offri opzioni di recovery all'utente
    const recoveryOptions = {
      type: 'error',
      title: 'Creazione Incompleta',
      message: `Paziente creato con successo, ma creazione evento infezione fallita. 
                Paziente ID: ${patientId}
                Errore: ${originalError.message}`,
      actions: [
        {
          label: 'Riprova Evento Infezione',
          action: 'retry_infection',
          data: { transactionId, patientId }
        },
        {
          label: 'Completa Manualmente',
          action: 'complete_manually',
          data: { patientId }
        },
        {
          label: 'Elimina Paziente',
          action: 'rollback_patient',
          data: { patientId },
          variant: 'danger'
        }
      ]
    };

    // Salva le opzioni di recovery nel log
    this.logTransactionStep(transactionId, 'recovery_options_presented', 'completed', recoveryOptions);

    // Mostra notifica con opzioni di recovery
    notificationService.error(
      `Paziente creato ma evento infezione fallito. Controlla la sezione notifiche per le opzioni di recovery.`,
      { persistent: true }
    );

    throw new Error(`Transazione parzialmente completata. Paziente ID: ${patientId}. ${originalError.message}`);
  }

  /**
   * Gestisce fallimenti precoci (prima della creazione paziente)
   * @param {string} transactionId - ID della transazione
   * @param {Error} originalError - Errore originale
   */
  async handleEarlyFailure(transactionId, originalError) {
    this.logTransactionStep(transactionId, 'early_failure_handled', 'completed', { 
      message: 'Nessun rollback necessario - nessuna risorsa creata' 
    });

    notificationService.error(`Errore nella creazione: ${originalError.message}`);
  }

  /**
   * Gestisce fallimenti tardivi (dopo entrambe le creazioni)
   * @param {string} transactionId - ID della transazione
   * @param {Error} originalError - Errore originale
   */
  async handleLateFailure(transactionId, originalError) {
    this.logTransactionStep(transactionId, 'late_failure_handled', 'completed', { 
      message: 'Transazione sostanzialmente completata nonostante errore finale',
      originalError: originalError.message
    });

    notificationService.warning(
      `Paziente e evento infezione creati, ma si è verificato un errore nella verifica finale: ${originalError.message}`
    );
  }

  /**
   * Gestisce stati inconsistenti
   * @param {string} transactionId - ID della transazione
   * @param {Error} originalError - Errore originale
   */
  async handleInconsistentState(transactionId, originalError) {
    this.logTransactionStep(transactionId, 'inconsistent_state_detected', 'completed', { 
      message: 'Stato inconsistente rilevato - richiede intervento manuale',
      originalError: originalError.message
    });

    notificationService.error(
      `Stato inconsistente rilevato. Contattare l'amministratore. Transazione ID: ${transactionId}`,
      { persistent: true }
    );
  }

  /**
   * Esegue il rollback di un paziente creato
   * @param {string} patientId - ID del paziente da eliminare
   */
  async rollbackPatientCreation(patientId) {
    try {
      await patientApi.deletePatient(patientId);
      logger.log(`Rollback completato: paziente ${patientId} eliminato`);
      notificationService.success("Rollback completato: paziente eliminato");
    } catch (error) {
      logger.error(`Errore nel rollback paziente ${patientId}:`, error);
      throw new Error(`Rollback fallito: ${error.message}`);
    }
  }

  /**
   * Riprova la creazione dell'evento infezione per una transazione fallita
   * @param {string} transactionId - ID della transazione originale
   * @param {string} patientId - ID del paziente
   * @param {Object} infectionData - Dati dell'infezione
   */
  async retryInfectionCreation(transactionId, patientId, infectionData) {
    const retryTransactionId = `${transactionId}_retry_${Date.now()}`;
    
    try {
      this.initializeTransactionLog(retryTransactionId, 'retry_infection_creation', {
        originalTransactionId: transactionId,
        patientId,
        infectionData: this.sanitizeLogData(infectionData)
      });

      const infectionEvent = await this.createInfectionEventStep(patientId, infectionData);
      await this.verifySynchronizationStep(patientId);

      this.completeTransactionLog(retryTransactionId, 'completed');
      notificationService.success("Evento infezione creato con successo!");

      return infectionEvent;
    } catch (error) {
      this.completeTransactionLog(retryTransactionId, 'failed');
      logger.error(`Errore nel retry creazione infezione:`, error);
      throw error;
    }
  }

  /**
   * Inizializza il log di una transazione
   * @param {string} transactionId - ID della transazione
   * @param {string} type - Tipo di transazione
   * @param {Object} initialData - Dati iniziali
   */
  initializeTransactionLog(transactionId, type, initialData = {}) {
    const transactionLog = {
      id: transactionId,
      type,
      status: 'started',
      steps: [],
      initialData,
      createdAt: Date.now(),
      completedAt: null
    };

    this.transactionLogs.set(transactionId, transactionLog);
    logger.log(`Transazione ${transactionId} inizializzata: ${type}`);
  }

  /**
   * Logga un step della transazione
   * @param {string} transactionId - ID della transazione
   * @param {string} step - Nome dello step
   * @param {string} status - Stato dello step
   * @param {Object} data - Dati aggiuntivi
   */
  logTransactionStep(transactionId, step, status, data = {}) {
    const transactionLog = this.transactionLogs.get(transactionId);
    if (!transactionLog) {
      logger.error(`Tentativo di loggare step per transazione inesistente: ${transactionId}`);
      return;
    }

    const stepLog = {
      step,
      status,
      data: this.sanitizeLogData(data),
      timestamp: Date.now()
    };

    transactionLog.steps.push(stepLog);
    logger.log(`Transazione ${transactionId} - Step ${step}: ${status}`);
  }

  /**
   * Completa il log di una transazione
   * @param {string} transactionId - ID della transazione
   * @param {string} finalStatus - Stato finale
   */
  completeTransactionLog(transactionId, finalStatus) {
    const transactionLog = this.transactionLogs.get(transactionId);
    if (!transactionLog) {
      logger.error(`Tentativo di completare transazione inesistente: ${transactionId}`);
      return;
    }

    transactionLog.status = finalStatus;
    transactionLog.completedAt = Date.now();
    
    logger.log(`Transazione ${transactionId} completata con stato: ${finalStatus}`);
  }

  /**
   * Ottiene il log di una transazione
   * @param {string} transactionId - ID della transazione
   * @returns {Object|null} Log della transazione
   */
  getTransactionLog(transactionId) {
    return this.transactionLogs.get(transactionId) || null;
  }

  /**
   * Ottiene tutti i log delle transazioni
   * @returns {Array} Array dei log delle transazioni
   */
  getAllTransactionLogs() {
    return Array.from(this.transactionLogs.values());
  }

  /**
   * Genera un ID univoco per la transazione
   * @returns {string} ID della transazione
   */
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitizza i dati per il logging (rimuove informazioni sensibili)
   * @param {Object} data - Dati da sanitizzare
   * @returns {Object} Dati sanitizzati
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // Rimuovi campi sensibili se presenti
    const sensitiveFields = ['password', 'token', 'auth', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Avvia il cleanup automatico dei log vecchi
   */
  startLogCleanup() {
    setInterval(() => {
      this.cleanupOldLogs();
    }, this.cleanupInterval);
  }

  /**
   * Pulisce i log delle transazioni più vecchi del limite di retention
   */
  cleanupOldLogs() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [transactionId, log] of this.transactionLogs.entries()) {
      if (now - log.createdAt > this.maxLogRetention) {
        this.transactionLogs.delete(transactionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.log(`Cleanup log transazioni: ${cleanedCount} log rimossi`);
    }
  }

  /**
   * Ottiene statistiche sui log delle transazioni
   * @returns {Object} Statistiche
   */
  getTransactionStats() {
    const logs = Array.from(this.transactionLogs.values());
    
    return {
      total: logs.length,
      byStatus: logs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {}),
      byType: logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {}),
      oldestLog: logs.length > 0 ? Math.min(...logs.map(log => log.createdAt)) : null,
      newestLog: logs.length > 0 ? Math.max(...logs.map(log => log.createdAt)) : null
    };
  }
}

// Esporta istanza singleton
export const patientTransactionService = new PatientTransactionService();