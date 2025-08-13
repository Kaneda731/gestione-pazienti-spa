/**
 * Test per PatientTransactionService
 * Testa la gestione delle transazioni complesse per creazione paziente + evento infezione
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { patientTransactionService } from '/src/features/patients/services/patientTransactionService.js';

// Mock dei servizi dipendenti
vi.mock('/src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('/src/core/services/notificationService.js', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('/src/core/services/stateService.js', () => ({
  stateService: {
    setLoading: vi.fn()
  }
}));

vi.mock('/src/features/patients/services/patientApi.js', () => ({
  patientApi: {
    createPatient: vi.fn(),
    getPatientById: vi.fn(),
    deletePatient: vi.fn()
  }
}));

vi.mock('/src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
  eventiCliniciService: {
    createEvento: vi.fn()
  }
}));

describe('PatientTransactionService', () => {
  let mockPatientApi;
  let mockEventiCliniciService;
  let mockNotificationService;
  let mockStateService;
  let mockLogger;

  beforeEach(async () => {
    // Reset dei mock
    vi.clearAllMocks();
    
    // Importa i mock
    const { patientApi } = await import('/src/features/patients/services/patientApi.js');
    const { eventiCliniciService } = await import('/src/features/eventi-clinici/services/eventiCliniciService.js');
    const { notificationService } = await import('/src/core/services/notificationService.js');
    const { stateService } = await import('/src/core/services/stateService.js');
    const { logger } = await import('/src/core/services/loggerService.js');

    mockPatientApi = patientApi;
    mockEventiCliniciService = eventiCliniciService;
    mockNotificationService = notificationService;
    mockStateService = stateService;
    mockLogger = logger;

    // Pulisci i log delle transazioni
    patientTransactionService.transactionLogs.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executePatientWithInfectionTransaction', () => {
    const validPatientData = {
      nome: 'Mario',
      cognome: 'Rossi',
      data_nascita: '1990-01-01',
      data_ricovero: '2024-01-15',
      diagnosi: 'Test diagnosi',
      reparto_appartenenza: 'Chirurgia'
    };

    const validInfectionData = {
      data_evento: '2024-01-16',
      agente_patogeno: 'Staphylococcus',
      descrizione: 'Infezione post-operatoria'
    };

    it('dovrebbe completare con successo una transazione completa', async () => {
      // Setup mock responses
      const mockPatient = { id: 'patient-123', ...validPatientData, infetto: true };
      const mockInfectionEvent = { id: 'event-456', paziente_id: 'patient-123', tipo_evento: 'infezione' };

      mockPatientApi.createPatient.mockResolvedValue(mockPatient);
      mockEventiCliniciService.createEvento.mockResolvedValue(mockInfectionEvent);
      mockPatientApi.getPatientById.mockResolvedValue({ ...mockPatient, data_infezione: '2024-01-16' });

      // Esegui transazione
      const result = await patientTransactionService.executePatientWithInfectionTransaction(
        validPatientData,
        validInfectionData
      );

      // Verifica risultato
      expect(result.success).toBe(true);
      expect(result.patient).toEqual(mockPatient);
      expect(result.infectionEvent).toEqual(mockInfectionEvent);
      expect(result.transactionId).toBeDefined();

      // Verifica chiamate ai servizi
      expect(mockPatientApi.createPatient).toHaveBeenCalledWith({
        ...validPatientData,
        infetto: true,
        data_infezione: null
      });

      expect(mockEventiCliniciService.createEvento).toHaveBeenCalledWith({
        paziente_id: 'patient-123',
        tipo_evento: 'infezione',
        data_evento: '2024-01-16',
        agente_patogeno: 'Staphylococcus',
        descrizione: 'Infezione post-operatoria',
        data_fine_evento: null
      });

      // Verifica notificazioni
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        "Paziente e evento infezione creati con successo!"
      );

      // Verifica stato loading
      expect(mockStateService.setLoading).toHaveBeenCalledWith(true, "Creazione paziente e evento infezione...");
      expect(mockStateService.setLoading).toHaveBeenCalledWith(false);
    });

    it('dovrebbe gestire il fallimento nella creazione del paziente', async () => {
      const error = new Error('Database connection failed');
      mockPatientApi.createPatient.mockRejectedValue(error);

      await expect(
        patientTransactionService.executePatientWithInfectionTransaction(
          validPatientData,
          validInfectionData
        )
      ).rejects.toThrow('Fallimento creazione paziente: Database connection failed');

      // Verifica che l'evento infezione non sia stato tentato
      expect(mockEventiCliniciService.createEvento).not.toHaveBeenCalled();

      // Verifica notificazione di errore
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        expect.stringContaining('Errore nella creazione')
      );
    });

    it('dovrebbe gestire il fallimento nella creazione dell\'evento infezione', async () => {
      const mockPatient = { id: 'patient-123', ...validPatientData, infetto: true };
      const infectionError = new Error('Failed to create infection event');

      mockPatientApi.createPatient.mockResolvedValue(mockPatient);
      mockEventiCliniciService.createEvento.mockRejectedValue(infectionError);

      await expect(
        patientTransactionService.executePatientWithInfectionTransaction(
          validPatientData,
          validInfectionData
        )
      ).rejects.toThrow('Fallimento creazione evento infezione: Failed to create infection event');

      // Verifica che il paziente sia stato creato
      expect(mockPatientApi.createPatient).toHaveBeenCalled();

      // Verifica gestione del fallimento
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Paziente creato ma evento infezione fallito. Controlla la sezione notifiche per le opzioni di recovery.',
        { persistent: true }
      );
    });

    it('dovrebbe validare i dati prima dell\'esecuzione', async () => {
      const invalidPatientData = { nome: 'Mario' }; // Mancano campi obbligatori

      await expect(
        patientTransactionService.executePatientWithInfectionTransaction(
          invalidPatientData,
          validInfectionData
        )
      ).rejects.toThrow('Campo paziente obbligatorio mancante: cognome');

      // Verifica che nessuna creazione sia stata tentata
      expect(mockPatientApi.createPatient).not.toHaveBeenCalled();
      expect(mockEventiCliniciService.createEvento).not.toHaveBeenCalled();
    });

    it('dovrebbe validare la data dell\'evento infezione', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const invalidInfectionData = {
        ...validInfectionData,
        data_evento: futureDate.toISOString().split('T')[0]
      };

      await expect(
        patientTransactionService.executePatientWithInfectionTransaction(
          validPatientData,
          invalidInfectionData
        )
      ).rejects.toThrow('La data dell\'evento di infezione non può essere nel futuro');
    });
  });

  describe('validateTransactionData', () => {
    it('dovrebbe validare dati paziente corretti', async () => {
      const validData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '1990-01-01',
        data_ricovero: '2024-01-15',
        diagnosi: 'Test diagnosi',
        reparto_appartenenza: 'Chirurgia'
      };

      const validInfection = {
        data_evento: '2024-01-16'
      };

      await expect(
        patientTransactionService.validateTransactionData(validData, validInfection)
      ).resolves.not.toThrow();
    });

    it('dovrebbe rifiutare dati paziente nulli', async () => {
      await expect(
        patientTransactionService.validateTransactionData(null, { data_evento: '2024-01-16' })
      ).rejects.toThrow('Dati paziente non validi');
    });

    it('dovrebbe rifiutare dati infezione nulli', async () => {
      const validPatient = { 
        nome: 'Mario', 
        cognome: 'Rossi', 
        data_nascita: '1990-01-01',
        data_ricovero: '2024-01-15',
        diagnosi: 'Test diagnosi',
        reparto_appartenenza: 'Chirurgia'
      };
      
      await expect(
        patientTransactionService.validateTransactionData(validPatient, null)
      ).rejects.toThrow('Dati infezione non validi');
    });

    it('dovrebbe rifiutare date infezione invalide', async () => {
      const validPatient = { 
        nome: 'Mario', 
        cognome: 'Rossi', 
        data_nascita: '1990-01-01',
        data_ricovero: '2024-01-15',
        diagnosi: 'Test diagnosi',
        reparto_appartenenza: 'Chirurgia'
      };
      const invalidInfection = { data_evento: 'invalid-date' };

      await expect(
        patientTransactionService.validateTransactionData(validPatient, invalidInfection)
      ).rejects.toThrow('Data evento infezione non valida');
    });
  });

  describe('rollbackPatientCreation', () => {
    it('dovrebbe eliminare il paziente con successo', async () => {
      const patientId = 'patient-123';
      mockPatientApi.deletePatient.mockResolvedValue();

      await patientTransactionService.rollbackPatientCreation(patientId);

      expect(mockPatientApi.deletePatient).toHaveBeenCalledWith(patientId);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        "Rollback completato: paziente eliminato"
      );
    });

    it('dovrebbe gestire errori nel rollback', async () => {
      const patientId = 'patient-123';
      const error = new Error('Delete failed');
      mockPatientApi.deletePatient.mockRejectedValue(error);

      await expect(
        patientTransactionService.rollbackPatientCreation(patientId)
      ).rejects.toThrow('Rollback fallito: Delete failed');
    });
  });

  describe('retryInfectionCreation', () => {
    it('dovrebbe riprovare con successo la creazione dell\'evento infezione', async () => {
      const transactionId = 'tx-123';
      const patientId = 'patient-456';
      const infectionData = {
        data_evento: '2024-01-16',
        agente_patogeno: 'Staphylococcus'
      };

      const mockInfectionEvent = { id: 'event-789', paziente_id: patientId };
      const mockPatient = { id: patientId, infetto: true, data_infezione: '2024-01-16' };

      mockEventiCliniciService.createEvento.mockResolvedValue(mockInfectionEvent);
      mockPatientApi.getPatientById.mockResolvedValue(mockPatient);

      const result = await patientTransactionService.retryInfectionCreation(
        transactionId,
        patientId,
        infectionData
      );

      expect(result).toEqual(mockInfectionEvent);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        "Evento infezione creato con successo!"
      );
    });
  });

  describe('Transaction Logging', () => {
    it('dovrebbe inizializzare correttamente il log della transazione', () => {
      const transactionId = 'tx-test-123';
      const type = 'test_transaction';
      const initialData = { test: 'data' };

      patientTransactionService.initializeTransactionLog(transactionId, type, initialData);

      const log = patientTransactionService.getTransactionLog(transactionId);
      expect(log).toBeDefined();
      expect(log.id).toBe(transactionId);
      expect(log.type).toBe(type);
      expect(log.status).toBe('started');
      expect(log.initialData).toEqual(initialData);
      expect(log.steps).toEqual([]);
    });

    it('dovrebbe loggare correttamente gli step della transazione', () => {
      const transactionId = 'tx-test-456';
      patientTransactionService.initializeTransactionLog(transactionId, 'test');

      patientTransactionService.logTransactionStep(transactionId, 'step1', 'completed', { result: 'success' });

      const log = patientTransactionService.getTransactionLog(transactionId);
      expect(log.steps).toHaveLength(1);
      expect(log.steps[0].step).toBe('step1');
      expect(log.steps[0].status).toBe('completed');
      expect(log.steps[0].data).toEqual({ result: 'success' });
    });

    it('dovrebbe completare correttamente il log della transazione', () => {
      const transactionId = 'tx-test-789';
      patientTransactionService.initializeTransactionLog(transactionId, 'test');

      patientTransactionService.completeTransactionLog(transactionId, 'completed');

      const log = patientTransactionService.getTransactionLog(transactionId);
      expect(log.status).toBe('completed');
      expect(log.completedAt).toBeDefined();
    });

    it('dovrebbe sanitizzare i dati sensibili nei log', () => {
      const sensitiveData = {
        nome: 'Mario',
        password: 'secret123',
        token: 'abc123',
        normalField: 'value'
      };

      const sanitized = patientTransactionService.sanitizeLogData(sensitiveData);

      expect(sanitized.nome).toBe('Mario');
      expect(sanitized.normalField).toBe('value');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
    });
  });

  describe('generateTransactionId', () => {
    it('dovrebbe generare ID univoci', () => {
      const id1 = patientTransactionService.generateTransactionId();
      const id2 = patientTransactionService.generateTransactionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^tx_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^tx_\d+_[a-z0-9]+$/);
    });
  });

  describe('getTransactionStats', () => {
    it('dovrebbe restituire statistiche corrette', () => {
      // Crea alcuni log di test
      patientTransactionService.initializeTransactionLog('tx1', 'patient_with_infection');
      patientTransactionService.completeTransactionLog('tx1', 'completed');

      patientTransactionService.initializeTransactionLog('tx2', 'patient_with_infection');
      patientTransactionService.completeTransactionLog('tx2', 'failed');

      patientTransactionService.initializeTransactionLog('tx3', 'retry_infection_creation');
      patientTransactionService.completeTransactionLog('tx3', 'completed');

      const stats = patientTransactionService.getTransactionStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.completed).toBe(2);
      expect(stats.byStatus.failed).toBe(1);
      expect(stats.byType.patient_with_infection).toBe(2);
      expect(stats.byType.retry_infection_creation).toBe(1);
      expect(stats.oldestLog).toBeDefined();
      expect(stats.newestLog).toBeDefined();
    });

    it('dovrebbe gestire il caso senza log', () => {
      const stats = patientTransactionService.getTransactionStats();

      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.byType).toEqual({});
      expect(stats.oldestLog).toBeNull();
      expect(stats.newestLog).toBeNull();
    });
  });
});