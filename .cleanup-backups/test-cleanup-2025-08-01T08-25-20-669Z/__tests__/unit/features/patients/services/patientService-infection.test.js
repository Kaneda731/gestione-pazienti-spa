/**
 * Test per l'integrazione delle funzionalità di infezione nel PatientService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { patientService } from '/src/features/patients/services/patientService.js';
import { patientTransactionService } from '/src/features/patients/services/patientTransactionService.js';
import { eventiCliniciService } from '/src/features/eventi-clinici/services/eventiCliniciService.js';
import infectionDataManager from '/src/features/patients/services/infectionDataManager.js';
import { notificationService } from '/src/core/services/notificationService.js';
import { logger } from '/src/core/services/loggerService.js';

// Mock dei servizi
vi.mock('/src/core/services/notificationService.js');
vi.mock('/src/core/services/loggerService.js');
vi.mock('/src/features/patients/services/patientTransactionService.js');
vi.mock('/src/features/eventi-clinici/services/eventiCliniciService.js');
vi.mock('/src/features/patients/services/infectionDataManager.js');

describe('PatientService - Infection Integration', () => {
  const mockPatientData = {
    nome: 'Mario',
    cognome: 'Rossi',
    data_ricovero: '2024-01-15',
    diagnosi: 'Test diagnosis',
    reparto_appartenenza: 'Chirurgia'
  };

  const mockInfectionData = {
    data_evento: '2024-01-16',
    agente_patogeno: 'Staphylococcus aureus',
    descrizione: 'Infezione post-operatoria'
  };

  const mockPatient = {
    id: 'patient-123',
    ...mockPatientData,
    infetto: true,
    data_infezione: '2024-01-16'
  };

  const mockInfectionEvent = {
    id: 'event-456',
    paziente_id: 'patient-123',
    tipo_evento: 'infezione',
    data_evento: '2024-01-16',
    agente_patogeno: 'Staphylococcus aureus',
    descrizione: 'Infezione post-operatoria'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    infectionDataManager.setInfectionData = vi.fn();
    infectionDataManager.hasValidInfectionData = vi.fn().mockReturnValue(true);
    infectionDataManager.getValidationErrors = vi.fn().mockReturnValue([]);
    infectionDataManager.clearInfectionData = vi.fn();
    
    logger.log = vi.fn();
    logger.error = vi.fn();
    logger.warn = vi.fn();
    
    notificationService.success = vi.fn();
    notificationService.error = vi.fn();
    notificationService.warning = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPatientWithInfection', () => {
    it('dovrebbe creare paziente con infezione con successo', async () => {
      // Arrange
      const mockTransactionResult = {
        success: true,
        transactionId: 'tx-123',
        patient: mockPatient,
        infectionEvent: mockInfectionEvent,
        message: 'Transazione completata con successo'
      };

      patientTransactionService.executePatientWithInfectionTransaction = vi.fn()
        .mockResolvedValue(mockTransactionResult);

      // Act
      const result = await patientService.createPatientWithInfection(mockPatientData, mockInfectionData);

      // Assert
      expect(infectionDataManager.setInfectionData).toHaveBeenCalledWith(mockInfectionData);
      expect(infectionDataManager.hasValidInfectionData).toHaveBeenCalled();
      expect(patientTransactionService.executePatientWithInfectionTransaction)
        .toHaveBeenCalledWith(mockPatientData, mockInfectionData);
      expect(infectionDataManager.clearInfectionData).toHaveBeenCalled();
      expect(result).toEqual(mockTransactionResult);
    });

    it('dovrebbe gestire errori di validazione dati infezione', async () => {
      // Arrange
      const validationErrors = [
        { field: 'data_evento', message: 'Data obbligatoria' },
        { field: 'agente_patogeno', message: 'Agente patogeno obbligatorio' }
      ];

      infectionDataManager.hasValidInfectionData = vi.fn().mockReturnValue(false);
      infectionDataManager.getValidationErrors = vi.fn().mockReturnValue(validationErrors);

      // Act & Assert
      await expect(patientService.createPatientWithInfection(mockPatientData, mockInfectionData))
        .rejects.toThrow('Dati infezione non validi: Data obbligatoria, Agente patogeno obbligatorio');

      expect(notificationService.error).toHaveBeenCalledWith(
        expect.stringContaining('Errore nei dati di infezione')
      );
    });

    it('dovrebbe gestire transazioni parzialmente completate', async () => {
      // Arrange
      const partialError = new Error('Transazione parzialmente completata. Paziente ID: patient-123. Database error');
      
      patientTransactionService.executePatientWithInfectionTransaction = vi.fn()
        .mockRejectedValue(partialError);

      // Act & Assert
      await expect(patientService.createPatientWithInfection(mockPatientData, mockInfectionData))
        .rejects.toThrow(partialError);

      expect(logger.warn).toHaveBeenCalledWith(
        'Transazione parzialmente completata - recovery options presentate'
      );
    });

    it('dovrebbe gestire errori generici', async () => {
      // Arrange
      const genericError = new Error('Database connection failed');
      
      patientTransactionService.executePatientWithInfectionTransaction = vi.fn()
        .mockRejectedValue(genericError);

      // Act & Assert
      await expect(patientService.createPatientWithInfection(mockPatientData, mockInfectionData))
        .rejects.toThrow(genericError);

      expect(notificationService.error).toHaveBeenCalledWith(
        'Errore nella creazione: Database connection failed'
      );
    });
  });

  describe('handleInfectionEventCreation', () => {
    beforeEach(() => {
      // Mock getPatientById
      vi.spyOn(patientService, 'getPatientById').mockResolvedValue(mockPatient);
    });

    it('dovrebbe creare evento infezione per paziente esistente', async () => {
      // Arrange
      eventiCliniciService.getEventiByPaziente = vi.fn().mockResolvedValue([]);
      eventiCliniciService.createEvento = vi.fn().mockResolvedValue(mockInfectionEvent);

      // Act
      const result = await patientService.handleInfectionEventCreation('patient-123', mockInfectionData);

      // Assert
      expect(patientService.getPatientById).toHaveBeenCalledWith('patient-123');
      expect(eventiCliniciService.getEventiByPaziente).toHaveBeenCalledWith('patient-123', {
        tipo_evento: 'infezione'
      });
      expect(eventiCliniciService.createEvento).toHaveBeenCalledWith({
        paziente_id: 'patient-123',
        tipo_evento: 'infezione',
        data_evento: mockInfectionData.data_evento,
        agente_patogeno: mockInfectionData.agente_patogeno,
        descrizione: mockInfectionData.descrizione,
        data_fine_evento: null
      });
      expect(result).toEqual(mockInfectionEvent);
    });

    it('dovrebbe rilevare infezioni attive esistenti', async () => {
      // Arrange
      const existingInfection = {
        id: 'existing-infection',
        paziente_id: 'patient-123',
        tipo_evento: 'infezione',
        data_evento: '2024-01-10',
        data_fine_evento: null // Infezione attiva
      };

      eventiCliniciService.getEventiByPaziente = vi.fn().mockResolvedValue([existingInfection]);

      // Act & Assert
      await expect(patientService.handleInfectionEventCreation('patient-123', mockInfectionData))
        .rejects.toThrow("Paziente ha già un'infezione attiva");

      expect(notificationService.warning).toHaveBeenCalledWith(
        expect.stringContaining("Il paziente ha già un'infezione attiva dal 2024-01-10"),
        expect.objectContaining({
          persistent: true,
          actions: expect.arrayContaining([
            { label: 'Crea Comunque', action: 'force_create_infection' },
            { label: 'Annulla', action: 'cancel_infection' }
          ])
        })
      );
    });

    it('dovrebbe gestire paziente non trovato', async () => {
      // Arrange
      vi.spyOn(patientService, 'getPatientById').mockResolvedValue(null);

      // Act & Assert
      await expect(patientService.handleInfectionEventCreation('nonexistent', mockInfectionData))
        .rejects.toThrow('Paziente con ID nonexistent non trovato');

      expect(notificationService.error).toHaveBeenCalledWith('Paziente non trovato');
    });

    it('dovrebbe gestire errori di validazione', async () => {
      // Arrange
      infectionDataManager.hasValidInfectionData = vi.fn().mockReturnValue(false);
      infectionDataManager.getValidationErrors = vi.fn().mockReturnValue([
        { field: 'data_evento', message: 'Data non valida' }
      ]);

      // Act & Assert
      await expect(patientService.handleInfectionEventCreation('patient-123', mockInfectionData))
        .rejects.toThrow('Dati infezione non validi: Data non valida');

      expect(notificationService.error).toHaveBeenCalledWith(
        'Errore nei dati di infezione: Dati infezione non validi: Data non valida'
      );
    });
  });

  describe('retryInfectionEventCreation', () => {
    it('dovrebbe riprovare la creazione evento infezione', async () => {
      // Arrange
      const transactionId = 'tx-123';
      const patientId = 'patient-123';
      
      patientTransactionService.retryInfectionCreation = vi.fn()
        .mockResolvedValue(mockInfectionEvent);

      // Act
      const result = await patientService.retryInfectionEventCreation(
        transactionId, 
        patientId, 
        mockInfectionData
      );

      // Assert
      expect(patientTransactionService.retryInfectionCreation)
        .toHaveBeenCalledWith(transactionId, patientId, mockInfectionData);
      expect(result).toEqual(mockInfectionEvent);
    });

    it('dovrebbe gestire errori nel retry', async () => {
      // Arrange
      const retryError = new Error('Retry failed');
      patientTransactionService.retryInfectionCreation = vi.fn()
        .mockRejectedValue(retryError);

      // Act & Assert
      await expect(patientService.retryInfectionEventCreation('tx-123', 'patient-123', mockInfectionData))
        .rejects.toThrow(retryError);

      expect(notificationService.error).toHaveBeenCalledWith('Errore nel retry: Retry failed');
    });
  });

  describe('rollbackPatientCreation', () => {
    it('dovrebbe eseguire rollback paziente', async () => {
      // Arrange
      patientTransactionService.rollbackPatientCreation = vi.fn().mockResolvedValue();

      // Act
      await patientService.rollbackPatientCreation('patient-123');

      // Assert
      expect(patientTransactionService.rollbackPatientCreation)
        .toHaveBeenCalledWith('patient-123');
    });

    it('dovrebbe gestire errori nel rollback', async () => {
      // Arrange
      const rollbackError = new Error('Rollback failed');
      patientTransactionService.rollbackPatientCreation = vi.fn()
        .mockRejectedValue(rollbackError);

      // Act & Assert
      await expect(patientService.rollbackPatientCreation('patient-123'))
        .rejects.toThrow(rollbackError);

      expect(notificationService.error).toHaveBeenCalledWith('Errore nel rollback: Rollback failed');
    });
  });

  describe('forceCreateInfectionEvent', () => {
    it('dovrebbe creare evento infezione forzatamente', async () => {
      // Arrange
      eventiCliniciService.createEvento = vi.fn().mockResolvedValue(mockInfectionEvent);

      // Act
      const result = await patientService.forceCreateInfectionEvent('patient-123', mockInfectionData);

      // Assert
      expect(eventiCliniciService.createEvento).toHaveBeenCalledWith({
        paziente_id: 'patient-123',
        tipo_evento: 'infezione',
        data_evento: mockInfectionData.data_evento,
        agente_patogeno: mockInfectionData.agente_patogeno,
        descrizione: mockInfectionData.descrizione,
        data_fine_evento: null
      });
      expect(notificationService.success).toHaveBeenCalledWith(
        'Nuovo evento infezione creato con successo!'
      );
      expect(result).toEqual(mockInfectionEvent);
    });

    it('dovrebbe gestire errori di validazione nella creazione forzata', async () => {
      // Arrange
      infectionDataManager.hasValidInfectionData = vi.fn().mockReturnValue(false);
      infectionDataManager.getValidationErrors = vi.fn().mockReturnValue([
        { field: 'agente_patogeno', message: 'Agente patogeno obbligatorio' }
      ]);

      // Act & Assert
      await expect(patientService.forceCreateInfectionEvent('patient-123', mockInfectionData))
        .rejects.toThrow('Dati infezione non validi: Agente patogeno obbligatorio');
    });
  });

  describe('getTransactionStats', () => {
    it('dovrebbe restituire statistiche transazioni', () => {
      // Arrange
      const mockStats = {
        total: 5,
        byStatus: { completed: 3, failed: 2 },
        byType: { patient_with_infection: 5 }
      };
      
      patientTransactionService.getTransactionStats = vi.fn().mockReturnValue(mockStats);

      // Act
      const result = patientService.getTransactionStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(patientTransactionService.getTransactionStats).toHaveBeenCalled();
    });
  });

  describe('getTransactionLog', () => {
    it('dovrebbe restituire log transazione specifica', () => {
      // Arrange
      const mockLog = {
        id: 'tx-123',
        type: 'patient_with_infection',
        status: 'completed',
        steps: []
      };
      
      patientTransactionService.getTransactionLog = vi.fn().mockReturnValue(mockLog);

      // Act
      const result = patientService.getTransactionLog('tx-123');

      // Assert
      expect(result).toEqual(mockLog);
      expect(patientTransactionService.getTransactionLog).toHaveBeenCalledWith('tx-123');
    });
  });

  describe('debugDataSource', () => {
    it('dovrebbe includere statistiche transazioni nel debug', async () => {
      // Arrange
      const mockStats = { total: 3, byStatus: { completed: 2, failed: 1 } };
      vi.spyOn(patientService, 'getTransactionStats').mockReturnValue(mockStats);

      // Mock supabase calls
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'test@example.com' } },
            error: null
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            count: 10,
            data: [{ nome: 'Test', cognome: 'User' }],
            error: null
          })
        })
      };

      // Mock the supabase import
      vi.doMock('/src/core/services/supabaseClient.js', () => ({
        supabase: mockSupabase
      }));

      // Act
      const result = await patientService.debugDataSource();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('📊 Statistiche transazioni:', mockStats);
      expect(result).toHaveProperty('transactionStats', mockStats);
    });
  });
});