// __tests__/integration/features/eventi-clinici/eventi-clinici-api.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Setup mocks before imports
vi.mock('../../../../src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
  eventiCliniciService: {
    getAllEventi: vi.fn(),
    getEventiByPaziente: vi.fn(),
    createEvento: vi.fn(),
    updateEvento: vi.fn(),
    deleteEvento: vi.fn(),
    searchPazienti: vi.fn(),
    getGiorniPostOperatori: vi.fn(),
    getEventiStats: vi.fn()
  }
}));

vi.mock('../../../../src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../../src/core/services/notificationService.js', () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Import after mocks
import { 
  fetchEventiClinici,
  fetchEventiByPaziente,
  createEventoClinico,
  updateEventoClinico,
  deleteEventoClinico,
  searchPazientiForEvents,
  getGiorniPostOperatori,
  getEventiStats,
  clearSearchCache,
  retryOperation
} from '../../../../src/features/eventi-clinici/views/eventi-clinici-api.js';

import { eventiCliniciService } from '../../../../src/features/eventi-clinici/services/eventiCliniciService.js';
import { logger } from '../../../../src/core/services/loggerService.js';
import { notificationService } from '../../../../src/core/services/notificationService.js';

describe('Eventi Clinici API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSearchCache();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('fetchEventiClinici', () => {
    it('should fetch and transform eventi clinici successfully', async () => {
      const mockResponse = {
        eventi: [
          {
            id: '1',
            tipo_evento: 'intervento',
            data_evento: '2024-01-15',
            descrizione: 'Test intervento',
            pazienti: {
              id: 'p1',
              nome: 'Mario',
              cognome: 'Rossi',
              reparto_appartenenza: 'Chirurgia'
            }
          }
        ],
        totalCount: 1,
        currentPage: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      const result = await fetchEventiClinici({ tipo_evento: 'intervento' }, 0);

      expect(eventiCliniciService.getAllEventi).toHaveBeenCalledWith(
        { tipo_evento: 'intervento' },
        { page: 0, limit: 10 }
      );

      expect(result.eventi).toHaveLength(1);
      expect(result.eventi[0]).toMatchObject({
        id: '1',
        tipo_evento: 'intervento',
        dataEventoFormatted: '15/01/2024',
        tipoEventoIcon: 'fas fa-scalpel',
        tipoEventoColor: 'primary',
        tipoEventoLabel: 'Intervento'
      });

      expect(result.eventi[0].pazienteInfo).toEqual({
        id: 'p1',
        nomeCompleto: 'Mario Rossi',
        reparto: 'Chirurgia'
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Database connection failed');
      eventiCliniciService.getAllEventi.mockRejectedValue(error);

      await expect(fetchEventiClinici()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith('❌ Errore caricamento eventi clinici:', error);
    });
  });

  describe('fetchEventiByPaziente', () => {
    it('should fetch patient events and calculate post-operative days', async () => {
      const mockEventi = [
        {
          id: '1',
          tipo_evento: 'intervento',
          data_evento: '2024-01-10',
          descrizione: 'Intervento chirurgico'
        },
        {
          id: '2',
          tipo_evento: 'infezione',
          data_evento: '2024-01-15',
          agente_patogeno: 'E. coli'
        }
      ];

      const mockGiorniPostOp = {
        giorni: 5,
        dataUltimoIntervento: '2024-01-10',
        descrizione: 'Giorno post-operatorio 5'
      };

      eventiCliniciService.getEventiByPaziente.mockResolvedValue(mockEventi);
      eventiCliniciService.getGiorniPostOperatori.mockResolvedValue(mockGiorniPostOp);

      const result = await fetchEventiByPaziente('patient-id', { tipo_evento: 'intervento' });

      expect(eventiCliniciService.getEventiByPaziente).toHaveBeenCalledWith(
        'patient-id',
        { tipo_evento: 'intervento' }
      );

      expect(eventiCliniciService.getGiorniPostOperatori).toHaveBeenCalledWith('patient-id');

      expect(result.eventi).toHaveLength(2);
      expect(result.giorniPostOperatori).toEqual(mockGiorniPostOp);
    });

    it('should handle patients without interventions', async () => {
      const mockEventi = [
        {
          id: '1',
          tipo_evento: 'infezione',
          data_evento: '2024-01-15',
          agente_patogeno: 'E. coli'
        }
      ];

      eventiCliniciService.getEventiByPaziente.mockResolvedValue(mockEventi);

      const result = await fetchEventiByPaziente('patient-id');

      expect(eventiCliniciService.getGiorniPostOperatori).not.toHaveBeenCalled();
      expect(result.giorniPostOperatori).toBeNull();
    });
  });

  describe('createEventoClinico', () => {
    it('should create evento clinico successfully', async () => {
      const eventoData = {
        paziente_id: 'patient-id',
        tipo_evento: 'intervento',
        data_evento: '2024-01-15',
        tipo_intervento: 'Appendicectomia'
      };

      const mockCreatedEvento = {
        id: 'new-id',
        ...eventoData,
        created_at: '2024-01-15T10:00:00Z'
      };

      eventiCliniciService.createEvento.mockResolvedValue(mockCreatedEvento);

      const result = await createEventoClinico(eventoData);

      expect(eventiCliniciService.createEvento).toHaveBeenCalledWith(eventoData);
      expect(result.id).toBe('new-id');
      expect(result.tipoEventoLabel).toBe('Intervento');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        tipo_evento: 'intervento'
        // Missing paziente_id and data_evento
      };

      await expect(createEventoClinico(invalidData)).rejects.toThrow('Paziente obbligatorio');
    });

    it('should validate intervention type for interventions', async () => {
      const invalidData = {
        paziente_id: 'patient-id',
        tipo_evento: 'intervento',
        data_evento: '2024-01-15'
        // Missing tipo_intervento
      };

      await expect(createEventoClinico(invalidData)).rejects.toThrow(
        'Tipo intervento obbligatorio per gli interventi chirurgici'
      );
    });

    it('should validate future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        paziente_id: 'patient-id',
        tipo_evento: 'intervento',
        data_evento: futureDate.toISOString().split('T')[0],
        tipo_intervento: 'Test'
      };

      await expect(createEventoClinico(invalidData)).rejects.toThrow(
        'La data dell\'evento non può essere nel futuro'
      );
    });
  });

  describe('updateEventoClinico', () => {
    it('should update evento clinico successfully', async () => {
      const updateData = {
        paziente_id: 'patient-id',
        tipo_evento: 'intervento',
        data_evento: '2024-01-15',
        tipo_intervento: 'Appendicectomia',
        descrizione: 'Updated description'
      };

      const mockUpdatedEvento = {
        id: 'evento-id',
        ...updateData
      };

      eventiCliniciService.updateEvento.mockResolvedValue(mockUpdatedEvento);

      const result = await updateEventoClinico('evento-id', updateData);

      expect(eventiCliniciService.updateEvento).toHaveBeenCalledWith('evento-id', updateData);
      expect(result.descrizione).toBe('Updated description');
    });
  });

  describe('deleteEventoClinico', () => {
    it('should delete evento clinico successfully', async () => {
      eventiCliniciService.deleteEvento.mockResolvedValue();

      const result = await deleteEventoClinico('evento-id');

      expect(eventiCliniciService.deleteEvento).toHaveBeenCalledWith('evento-id');
      expect(result).toBe(true);
    });
  });

  describe('searchPazientiForEvents', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should search patients with debouncing', async () => {
      const mockPazienti = [
        {
          id: 'p1',
          nome: 'Mario',
          cognome: 'Rossi',
          data_ricovero: '2024-01-10',
          reparto_appartenenza: 'Chirurgia'
        }
      ];

      eventiCliniciService.searchPazienti.mockResolvedValue(mockPazienti);

      const searchPromise = searchPazientiForEvents('Mario');
      
      // Fast-forward time to trigger debounced search
      vi.advanceTimersByTime(300);
      
      const result = await searchPromise;

      expect(eventiCliniciService.searchPazienti).toHaveBeenCalledWith('Mario', true);
      expect(result).toHaveLength(1);
      expect(result[0].nomeCompleto).toBe('Mario Rossi');
    });

    it('should return empty array for short search terms', async () => {
      const result = await searchPazientiForEvents('M');

      expect(result).toEqual([]);
      expect(eventiCliniciService.searchPazienti).not.toHaveBeenCalled();
    });

    it('should use cached results', async () => {
      const mockPazienti = [
        {
          id: 'p1',
          nome: 'Mario',
          cognome: 'Rossi',
          data_ricovero: '2024-01-10',
          reparto_appartenenza: 'Chirurgia'
        }
      ];

      eventiCliniciService.searchPazienti.mockResolvedValue(mockPazienti);

      // First search
      const searchPromise1 = searchPazientiForEvents('Mario');
      vi.advanceTimersByTime(300);
      await searchPromise1;

      // Second search with same term should use cache
      const result2 = await searchPazientiForEvents('Mario');

      expect(eventiCliniciService.searchPazienti).toHaveBeenCalledTimes(1);
      expect(result2).toHaveLength(1);
    });
  });

  describe('getGiorniPostOperatori', () => {
    it('should calculate post-operative days successfully', async () => {
      const mockResult = {
        giorni: 7,
        dataUltimoIntervento: '2024-01-10',
        descrizione: 'Giorno post-operatorio 7'
      };

      eventiCliniciService.getGiorniPostOperatori.mockResolvedValue(mockResult);

      const result = await getGiorniPostOperatori('patient-id', '2024-01-17');

      expect(eventiCliniciService.getGiorniPostOperatori).toHaveBeenCalledWith(
        'patient-id',
        '2024-01-17'
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle patients without interventions', async () => {
      eventiCliniciService.getGiorniPostOperatori.mockResolvedValue(null);

      const result = await getGiorniPostOperatori('patient-id');

      expect(result).toBeNull();
    });
  });

  describe('getEventiStats', () => {
    it('should fetch statistics successfully', async () => {
      const mockStats = {
        total: 100,
        interventi: 60,
        infezioni: 40,
        ultimoMese: 25
      };

      eventiCliniciService.getEventiStats.mockResolvedValue(mockStats);

      const result = await getEventiStats();

      expect(eventiCliniciService.getEventiStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOperation(operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await retryOperation(operation, 3, 100);

      expect(operation).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(retryOperation(operation, 2, 100)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data transformation', () => {
    it('should transform evento data correctly', async () => {
      const mockResponse = {
        eventi: [
          {
            id: '1',
            tipo_evento: 'infezione',
            data_evento: '2024-01-15',
            agente_patogeno: 'E. coli'
          }
        ],
        totalCount: 1,
        currentPage: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      const result = await fetchEventiClinici();

      const evento = result.eventi[0];
      expect(evento.dataEventoFormatted).toBe('15/01/2024');
      expect(evento.tipoEventoIcon).toBe('fas fa-virus');
      expect(evento.tipoEventoColor).toBe('warning');
      expect(evento.tipoEventoLabel).toBe('Infezione');
    });

    it('should handle missing patient data', async () => {
      const mockResponse = {
        eventi: [
          {
            id: '1',
            tipo_evento: 'intervento',
            data_evento: '2024-01-15'
            // No pazienti data
          }
        ],
        totalCount: 1,
        currentPage: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      const result = await fetchEventiClinici();

      expect(result.eventi[0].pazienteInfo).toBeNull();
    });
  });
});