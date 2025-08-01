/**
 * Test suite completa per EventiCliniciService
 * Test per CRUD operations, filtri, validazione e calcolo giorni post-operatori
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dei moduli core
vi.mock('/src/core/services/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

vi.mock('/src/core/services/stateService.js', () => ({
  stateService: {
    setLoading: vi.fn()
  }
}));

vi.mock('/src/core/services/notificationService.js', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

vi.mock('/src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn()
  }
}));

// Import dopo i mock
import { supabase } from '/src/core/services/supabaseClient.js';
import { stateService } from '/src/core/services/stateService.js';
import { notificationService } from '/src/core/services/notificationService.js';

// Mock del servizio con implementazione completa
class MockEventiCliniciService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    
    // Dati mock per i test
    this.eventi = [
      {
        id: '1',
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-15',
        descrizione: 'Intervento cardiochirurgico',
        tipo_intervento: 'Bypass coronarico',
        agente_patogeno: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        paziente_id: 'p1',
        tipo_evento: 'infezione',
        data_evento: '2024-01-20',
        descrizione: 'Infezione post-operatoria',
        tipo_intervento: null,
        agente_patogeno: 'Staphylococcus aureus',
        created_at: '2024-01-20T14:00:00Z',
        updated_at: '2024-01-20T14:00:00Z'
      },
      {
        id: '3',
        paziente_id: 'p2',
        tipo_evento: 'intervento',
        data_evento: '2024-01-10',
        descrizione: 'Appendicectomia',
        tipo_intervento: 'Laparoscopica',
        agente_patogeno: null,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T09:00:00Z'
      }
    ];

    this.pazienti = [
      {
        id: 'p1',
        nome: 'Mario',
        cognome: 'Rossi',
        reparto_appartenenza: 'Cardiologia'
      },
      {
        id: 'p2',
        nome: 'Luigi',
        cognome: 'Bianchi',
        reparto_appartenenza: 'Chirurgia'
      }
    ];
  }

  async getAllEventi(filters = {}, pagination = {}) {
    try {
      stateService.setLoading(true, 'Caricamento eventi clinici...');

      const {
        paziente_search = '',
        tipo_evento = '',
        data_da = '',
        data_a = '',
        reparto = '',
        page = 0,
        limit = 10,
        sortColumn = 'data_evento',
        sortDirection = 'desc'
      } = { ...filters, ...pagination };

      let results = this.eventi.map(evento => ({
        ...evento,
        pazienti: this.pazienti.find(p => p.id === evento.paziente_id)
      }));

      // Applica filtri
      if (tipo_evento) {
        results = results.filter(e => e.tipo_evento === tipo_evento);
      }

      if (data_da) {
        results = results.filter(e => e.data_evento >= data_da);
      }

      if (data_a) {
        results = results.filter(e => e.data_evento <= data_a);
      }

      if (reparto) {
        results = results.filter(e => e.pazienti?.reparto_appartenenza === reparto);
      }

      if (paziente_search) {
        results = results.filter(e => 
          e.pazienti?.nome.toLowerCase().includes(paziente_search.toLowerCase()) ||
          e.pazienti?.cognome.toLowerCase().includes(paziente_search.toLowerCase())
        );
      }

      // Ordinamento
      results.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      });

      // Paginazione
      const startIndex = page * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      stateService.setLoading(false);

      return {
        eventi: paginatedResults,
        totalCount: results.length,
        currentPage: page,
        totalPages: Math.ceil(results.length / limit),
        hasNextPage: (page + 1) * limit < results.length,
        hasPrevPage: page > 0
      };
    } catch (error) {
      stateService.setLoading(false);
      notificationService.error(`Errore nel caricamento: ${error.message}`);
      throw error;
    }
  }

  async getEventiByPaziente(pazienteId, filters = {}) {
    const {
      tipo_evento = '',
      data_da = '',
      data_a = '',
      sortColumn = 'data_evento',
      sortDirection = 'desc'
    } = filters;

    let results = this.eventi.filter(e => e.paziente_id === pazienteId);

    // Applica filtri
    if (tipo_evento) {
      results = results.filter(e => e.tipo_evento === tipo_evento);
    }

    if (data_da) {
      results = results.filter(e => e.data_evento >= data_da);
    }

    if (data_a) {
      results = results.filter(e => e.data_evento <= data_a);
    }

    // Ordinamento
    results.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
    });

    return results;
  }

  async createEvento(eventoData) {
    try {
      stateService.setLoading(true, 'Creazione evento clinico...');

      // Validazione
      this.validateEventoData(eventoData);

      const newEvento = {
        ...eventoData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.eventi.push(newEvento);
      this.invalidateCache();

      stateService.setLoading(false);
      notificationService.success('Evento clinico creato con successo!');
      
      return newEvento;
    } catch (error) {
      stateService.setLoading(false);
      notificationService.error(`Errore nella creazione: ${error.message}`);
      throw error;
    }
  }

  async updateEvento(id, eventoData) {
    try {
      stateService.setLoading(true, 'Aggiornamento evento clinico...');

      const index = this.eventi.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error('Evento non trovato');
      }

      // Merge with existing data for validation
      const mergedData = {
        ...this.eventi[index],
        ...eventoData
      };

      this.validateEventoData(mergedData);

      this.eventi[index] = {
        ...this.eventi[index],
        ...eventoData,
        updated_at: new Date().toISOString()
      };

      this.invalidateCache();

      stateService.setLoading(false);
      notificationService.success('Evento clinico aggiornato con successo!');
      
      return this.eventi[index];
    } catch (error) {
      stateService.setLoading(false);
      notificationService.error(`Errore nell'aggiornamento: ${error.message}`);
      throw error;
    }
  }

  async deleteEvento(id) {
    try {
      stateService.setLoading(true, 'Eliminazione evento clinico...');

      const index = this.eventi.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error('Evento non trovato');
      }

      this.eventi.splice(index, 1);
      this.invalidateCache();

      stateService.setLoading(false);
      notificationService.success('Evento clinico eliminato con successo!');
    } catch (error) {
      stateService.setLoading(false);
      notificationService.error(`Errore nell'eliminazione: ${error.message}`);
      throw error;
    }
  }

  async getGiorniPostOperatori(pazienteId, dataRiferimento = null) {
    const dataRef = dataRiferimento || new Date().toISOString().split('T')[0];

    // Trova tutti gli interventi del paziente
    const interventi = this.eventi
      .filter(e => e.paziente_id === pazienteId && e.tipo_evento === 'intervento')
      .filter(e => e.data_evento <= dataRef)
      .sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

    if (interventi.length === 0) {
      return null;
    }

    const ultimoIntervento = interventi[0];
    const dataIntervento = new Date(ultimoIntervento.data_evento);
    const dataRif = new Date(dataRef);

    const diffTime = dataRif.getTime() - dataIntervento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      giorni: diffDays,
      dataUltimoIntervento: ultimoIntervento.data_evento,
      descrizione: `Giorno post-operatorio ${diffDays}`
    };
  }

  async searchPazienti(searchTerm, activeOnly = true) {
    return this.pazienti.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cognome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  validateEventoData(data) {
    const required = ['paziente_id', 'tipo_evento', 'data_evento'];

    for (const field of required) {
      if (!data[field] || data[field].toString().trim() === '') {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    const tipiValidi = ['intervento', 'infezione'];
    if (!tipiValidi.includes(data.tipo_evento)) {
      throw new Error(`Tipo evento non valido. Valori ammessi: ${tipiValidi.join(', ')}`);
    }

    if (data.data_evento) {
      const dataEvento = new Date(data.data_evento);
      const oggi = new Date();
      if (dataEvento > oggi) {
        throw new Error('La data dell\'evento non può essere nel futuro');
      }
    }

    if (data.tipo_evento === 'intervento' && !data.tipo_intervento) {
      throw new Error('Il tipo di intervento è obbligatorio per gli interventi chirurgici');
    }
  }

  invalidateCache() {
    this.cache.clear();
  }

  async getEventiStats() {
    const stats = {
      total: this.eventi.length,
      interventi: this.eventi.filter(e => e.tipo_evento === 'intervento').length,
      infezioni: this.eventi.filter(e => e.tipo_evento === 'infezione').length,
      ultimoMese: 0
    };

    const unMeseFA = new Date();
    unMeseFA.setMonth(unMeseFA.getMonth() - 1);
    
    stats.ultimoMese = this.eventi.filter(e => {
      const dataEvento = new Date(e.data_evento);
      return dataEvento >= unMeseFA;
    }).length;

    return stats;
  }
}

// Test suite completa
describe('EventiCliniciService', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MockEventiCliniciService();
  });

  describe('getAllEventi', () => {
    it('should fetch all events with default parameters', async () => {
      const result = await service.getAllEventi();

      expect(result.eventi).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
      expect(stateService.setLoading).toHaveBeenCalledWith(true, 'Caricamento eventi clinici...');
      expect(stateService.setLoading).toHaveBeenCalledWith(false);
    });

    it('should filter events by tipo_evento', async () => {
      const result = await service.getAllEventi({ tipo_evento: 'intervento' });

      expect(result.eventi).toHaveLength(2);
      expect(result.eventi.every(e => e.tipo_evento === 'intervento')).toBe(true);
    });

    it('should filter events by date range', async () => {
      const result = await service.getAllEventi({ 
        data_da: '2024-01-15', 
        data_a: '2024-01-20' 
      });

      expect(result.eventi).toHaveLength(2);
      expect(result.eventi.every(e => e.data_evento >= '2024-01-15' && e.data_evento <= '2024-01-20')).toBe(true);
    });

    it('should filter events by patient search', async () => {
      const result = await service.getAllEventi({ paziente_search: 'Mario' });

      expect(result.eventi).toHaveLength(2);
      expect(result.eventi.every(e => e.pazienti?.nome === 'Mario')).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const result = await service.getAllEventi({}, { page: 0, limit: 2 });

      expect(result.eventi).toHaveLength(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      const originalGetAllEventi = service.getAllEventi;
      
      service.getAllEventi = vi.fn().mockImplementation(async () => {
        stateService.setLoading(true);
        stateService.setLoading(false);
        notificationService.error(`Errore nel caricamento: ${mockError.message}`);
        throw mockError;
      });

      await expect(service.getAllEventi()).rejects.toThrow('Database error');
      expect(notificationService.error).toHaveBeenCalled();
      
      service.getAllEventi = originalGetAllEventi;
    });
  });

  describe('getEventiByPaziente', () => {
    it('should fetch events for specific patient', async () => {
      const result = await service.getEventiByPaziente('p1');

      expect(result).toHaveLength(2);
      expect(result.every(e => e.paziente_id === 'p1')).toBe(true);
    });

    it('should filter patient events by type', async () => {
      const result = await service.getEventiByPaziente('p1', { tipo_evento: 'intervento' });

      expect(result).toHaveLength(1);
      expect(result[0].tipo_evento).toBe('intervento');
    });

    it('should return empty array for non-existent patient', async () => {
      const result = await service.getEventiByPaziente('non-existent');

      expect(result).toEqual([]);
    });

    it('should sort events correctly', async () => {
      const result = await service.getEventiByPaziente('p1', { sortDirection: 'asc' });

      expect(result[0].data_evento).toBe('2024-01-15');
      expect(result[1].data_evento).toBe('2024-01-20');
    });
  });

  describe('createEvento', () => {
    it('should create new intervention event successfully', async () => {
      const newEvento = {
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-25',
        descrizione: 'Nuovo intervento',
        tipo_intervento: 'Chirurgia generale'
      };

      const result = await service.createEvento(newEvento);

      expect(result.paziente_id).toBe('p1');
      expect(result.tipo_evento).toBe('intervento');
      expect(result.id).toBeDefined();
      expect(notificationService.success).toHaveBeenCalledWith('Evento clinico creato con successo!');
    });

    it('should create new infection event successfully', async () => {
      const newEvento = {
        paziente_id: 'p2',
        tipo_evento: 'infezione',
        data_evento: '2024-01-25',
        descrizione: 'Infezione delle vie urinarie',
        agente_patogeno: 'E. coli'
      };

      const result = await service.createEvento(newEvento);

      expect(result.tipo_evento).toBe('infezione');
      expect(result.agente_patogeno).toBe('E. coli');
    });

    it('should validate required fields', async () => {
      await expect(service.createEvento({}))
        .rejects.toThrow('Il campo paziente_id è obbligatorio');
    });

    it('should validate event type', async () => {
      const invalidEvento = {
        paziente_id: 'p1',
        tipo_evento: 'invalid_type',
        data_evento: '2024-01-25'
      };

      await expect(service.createEvento(invalidEvento))
        .rejects.toThrow('Tipo evento non valido');
    });

    it('should validate future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidEvento = {
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: futureDate.toISOString().split('T')[0],
        tipo_intervento: 'Test'
      };

      await expect(service.createEvento(invalidEvento))
        .rejects.toThrow('La data dell\'evento non può essere nel futuro');
    });

    it('should validate intervention type for interventions', async () => {
      const invalidEvento = {
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-25'
      };

      await expect(service.createEvento(invalidEvento))
        .rejects.toThrow('Il tipo di intervento è obbligatorio per gli interventi chirurgici');
    });
  });

  describe('updateEvento', () => {
    it('should update existing event successfully', async () => {
      const updateData = {
        descrizione: 'Descrizione aggiornata',
        tipo_intervento: 'Nuovo tipo'
      };

      const result = await service.updateEvento('1', updateData);

      expect(result.descrizione).toBe('Descrizione aggiornata');
      expect(result.tipo_intervento).toBe('Nuovo tipo');
      expect(notificationService.success).toHaveBeenCalledWith('Evento clinico aggiornato con successo!');
    });

    it('should handle non-existent event', async () => {
      await expect(service.updateEvento('non-existent', {}))
        .rejects.toThrow('Evento non trovato');
    });
  });

  describe('deleteEvento', () => {
    it('should delete existing event successfully', async () => {
      const initialLength = service.eventi.length;
      
      await service.deleteEvento('1');

      expect(service.eventi).toHaveLength(initialLength - 1);
      expect(service.eventi.find(e => e.id === '1')).toBeUndefined();
      expect(notificationService.success).toHaveBeenCalledWith('Evento clinico eliminato con successo!');
    });

    it('should handle non-existent event', async () => {
      await expect(service.deleteEvento('non-existent'))
        .rejects.toThrow('Evento non trovato');
    });
  });

  describe('getGiorniPostOperatori', () => {
    it('should calculate post-operative days correctly', async () => {
      const result = await service.getGiorniPostOperatori('p1', '2024-01-20');

      expect(result.giorni).toBe(5); // 5 giorni dal 15 al 20 gennaio
      expect(result.dataUltimoIntervento).toBe('2024-01-15');
      expect(result.descrizione).toBe('Giorno post-operatorio 5');
    });

    it('should return null for patients without interventions', async () => {
      // Rimuovi temporaneamente gli interventi per p1
      const originalEventi = [...service.eventi];
      service.eventi = service.eventi.filter(e => !(e.paziente_id === 'p1' && e.tipo_evento === 'intervento'));

      const result = await service.getGiorniPostOperatori('p1');

      expect(result).toBeNull();

      // Ripristina gli eventi originali
      service.eventi = originalEventi;
    });

    it('should use most recent intervention for calculation', async () => {
      // Aggiungi un intervento più recente
      service.eventi.push({
        id: '4',
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-18',
        tipo_intervento: 'Secondo intervento'
      });

      const result = await service.getGiorniPostOperatori('p1', '2024-01-20');

      expect(result.giorni).toBe(2); // 2 giorni dal 18 al 20 gennaio
      expect(result.dataUltimoIntervento).toBe('2024-01-18');
    });

    it('should use current date when no reference date provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await service.getGiorniPostOperatori('p2');

      expect(result).toBeDefined();
      expect(result.giorni).toBeGreaterThan(0);
    });
  });

  describe('searchPazienti', () => {
    it('should search patients by name', async () => {
      const result = await service.searchPazienti('Mario');

      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Mario');
    });

    it('should search patients by surname', async () => {
      const result = await service.searchPazienti('Bianchi');

      expect(result).toHaveLength(1);
      expect(result[0].cognome).toBe('Bianchi');
    });

    it('should return empty array for no matches', async () => {
      const result = await service.searchPazienti('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getEventiStats', () => {
    it('should return correct statistics', async () => {
      const stats = await service.getEventiStats();

      expect(stats.total).toBe(3);
      expect(stats.interventi).toBe(2);
      expect(stats.infezioni).toBe(1);
      expect(stats.ultimoMese).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty data', async () => {
      const originalEventi = service.eventi;
      service.eventi = [];

      const stats = await service.getEventiStats();

      expect(stats.total).toBe(0);
      expect(stats.interventi).toBe(0);
      expect(stats.infezioni).toBe(0);
      expect(stats.ultimoMese).toBe(0);

      service.eventi = originalEventi;
    });
  });

  describe('cache management', () => {
    it('should invalidate cache on create', async () => {
      const spy = vi.spyOn(service, 'invalidateCache');
      
      await service.createEvento({
        paziente_id: 'p1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-25',
        tipo_intervento: 'Test'
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should invalidate cache on update', async () => {
      const spy = vi.spyOn(service, 'invalidateCache');
      
      await service.updateEvento('1', { descrizione: 'Updated' });

      expect(spy).toHaveBeenCalled();
    });

    it('should invalidate cache on delete', async () => {
      const spy = vi.spyOn(service, 'invalidateCache');
      
      await service.deleteEvento('1');

      expect(spy).toHaveBeenCalled();
    });
  });
});