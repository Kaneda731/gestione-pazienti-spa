import { describe, it, expect, beforeEach, vi } from 'vitest';
import infectionDataManager, { InfectionDataManager } from '../../../../../src/features/patients/services/infectionDataManager.js';

describe('InfectionDataManager', () => {
  let manager;

  beforeEach(() => {
    // Crea una nuova istanza per ogni test per evitare interferenze
    manager = new InfectionDataManager();
  });

  describe('Inizializzazione', () => {
    it('dovrebbe inizializzare con stato vuoto', () => {
      expect(manager.getInfectionData()).toBeNull();
      expect(manager.hasInfectionData()).toBe(false);
      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.getValidationErrors()).toEqual([]);
    });

    it('dovrebbe fornire un\'istanza singleton', () => {
      expect(infectionDataManager).toBeInstanceOf(InfectionDataManager);
    });
  });

  describe('setInfectionData', () => {
    it('dovrebbe impostare dati validi correttamente', () => {
      const validData = {
        data_evento: '2024-01-15',
        agente_patogeno: 'Staphylococcus aureus',
        descrizione: 'Infezione post-operatoria'
      };

      manager.setInfectionData(validData);

      const storedData = manager.getInfectionData();
      expect(storedData.data_evento).toBe(validData.data_evento);
      expect(storedData.agente_patogeno).toBe(validData.agente_patogeno);
      expect(storedData.descrizione).toBe(validData.descrizione);
      expect(storedData.timestamp).toBeTypeOf('number');
    });

    it('dovrebbe gestire dati null pulendo lo stato', () => {
      // Prima imposta alcuni dati
      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test'
      });
      expect(manager.hasInfectionData()).toBe(true);

      // Poi pulisce con null
      manager.setInfectionData(null);
      expect(manager.hasInfectionData()).toBe(false);
      expect(manager.getInfectionData()).toBeNull();
    });

    it('dovrebbe gestire dati undefined pulendo lo stato', () => {
      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test'
      });
      
      manager.setInfectionData(undefined);
      expect(manager.hasInfectionData()).toBe(false);
    });

    it('dovrebbe impostare valori di default per campi mancanti', () => {
      manager.setInfectionData({
        data_evento: '2024-01-15'
        // agente_patogeno e descrizione mancanti
      });

      const data = manager.getInfectionData();
      expect(data.data_evento).toBe('2024-01-15');
      expect(data.agente_patogeno).toBe('');
      expect(data.descrizione).toBe('');
    });
  });

  describe('getInfectionData', () => {
    it('dovrebbe restituire null quando non ci sono dati', () => {
      expect(manager.getInfectionData()).toBeNull();
    });

    it('dovrebbe restituire una copia dei dati per evitare mutazioni', () => {
      const originalData = {
        data_evento: '2024-01-15',
        agente_patogeno: 'Test pathogen'
      };

      manager.setInfectionData(originalData);
      const retrievedData = manager.getInfectionData();
      
      // Modifica i dati recuperati
      retrievedData.agente_patogeno = 'Modified';
      
      // I dati originali non dovrebbero essere modificati
      const freshData = manager.getInfectionData();
      expect(freshData.agente_patogeno).toBe('Test pathogen');
    });
  });

  describe('clearInfectionData', () => {
    it('dovrebbe pulire tutti i dati e lo stato', () => {
      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test'
      });

      expect(manager.hasInfectionData()).toBe(true);
      
      manager.clearInfectionData();
      
      expect(manager.getInfectionData()).toBeNull();
      expect(manager.hasInfectionData()).toBe(false);
      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.getValidationErrors()).toEqual([]);
    });
  });

  describe('Validazione data evento', () => {
    it('dovrebbe validare data corretta', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      manager.setInfectionData({
        data_evento: dateString,
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('data_evento')).toBe(false);
    });

    it('dovrebbe rifiutare data futura', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      manager.setInfectionData({
        data_evento: dateString,
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('data_evento')).toBe(true);
      
      const errors = manager.getFieldErrors('data_evento');
      expect(errors[0].message).toContain('non può essere futura');
    });

    it('dovrebbe accettare data di oggi', () => {
      const today = new Date().toISOString().split('T')[0];

      manager.setInfectionData({
        data_evento: today,
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('data_evento')).toBe(false);
    });

    it('dovrebbe rifiutare data vuota', () => {
      manager.setInfectionData({
        data_evento: '',
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('data_evento')).toBe(true);
      
      const errors = manager.getFieldErrors('data_evento');
      expect(errors[0].message).toContain('obbligatoria');
    });

    it('dovrebbe rifiutare formato data invalido', () => {
      manager.setInfectionData({
        data_evento: 'invalid-date',
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('data_evento')).toBe(true);
      
      const errors = manager.getFieldErrors('data_evento');
      expect(errors[0].message).toContain('Formato data non valido');
    });
  });

  describe('Validazione agente patogeno', () => {
    const validDate = '2024-01-15';

    it('dovrebbe validare agente patogeno corretto', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: 'Staphylococcus aureus'
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('agente_patogeno')).toBe(false);
    });

    it('dovrebbe rifiutare agente patogeno vuoto', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: ''
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('agente_patogeno')).toBe(true);
      
      const errors = manager.getFieldErrors('agente_patogeno');
      expect(errors[0].message).toContain('obbligatorio');
    });

    it('dovrebbe rifiutare agente patogeno con solo spazi', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: '   '
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('agente_patogeno')).toBe(true);
    });

    it('dovrebbe rifiutare agente patogeno troppo corto', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: 'A'
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('agente_patogeno')).toBe(true);
      
      const errors = manager.getFieldErrors('agente_patogeno');
      expect(errors[0].message).toContain('almeno 2 caratteri');
    });

    it('dovrebbe rifiutare agente patogeno troppo lungo', () => {
      const longPathogen = 'A'.repeat(101);
      
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: longPathogen
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('agente_patogeno')).toBe(true);
      
      const errors = manager.getFieldErrors('agente_patogeno');
      expect(errors[0].message).toContain('100 caratteri');
    });

    it('dovrebbe accettare agente patogeno al limite massimo', () => {
      const maxLengthPathogen = 'A'.repeat(100);
      
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: maxLengthPathogen
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('agente_patogeno')).toBe(false);
    });
  });

  describe('Validazione descrizione', () => {
    const validDate = '2024-01-15';
    const validPathogen = 'Test pathogen';

    it('dovrebbe accettare descrizione vuota (opzionale)', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: validPathogen,
        descrizione: ''
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('descrizione')).toBe(false);
    });

    it('dovrebbe accettare descrizione valida', () => {
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: validPathogen,
        descrizione: 'Infezione post-operatoria con complicazioni'
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('descrizione')).toBe(false);
    });

    it('dovrebbe rifiutare descrizione troppo lunga', () => {
      const longDescription = 'A'.repeat(501);
      
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: validPathogen,
        descrizione: longDescription
      });

      expect(manager.hasValidInfectionData()).toBe(false);
      expect(manager.hasFieldError('descrizione')).toBe(true);
      
      const errors = manager.getFieldErrors('descrizione');
      expect(errors[0].message).toContain('500 caratteri');
    });

    it('dovrebbe accettare descrizione al limite massimo', () => {
      const maxLengthDescription = 'A'.repeat(500);
      
      manager.setInfectionData({
        data_evento: validDate,
        agente_patogeno: validPathogen,
        descrizione: maxLengthDescription
      });

      expect(manager.hasValidInfectionData()).toBe(true);
      expect(manager.hasFieldError('descrizione')).toBe(false);
    });
  });

  describe('Gestione errori di validazione', () => {
    it('dovrebbe restituire tutti gli errori di validazione', () => {
      manager.setInfectionData({
        data_evento: '',
        agente_patogeno: '',
        descrizione: 'A'.repeat(501)
      });

      const errors = manager.getValidationErrors();
      expect(errors).toHaveLength(3);
      
      const fieldNames = errors.map(e => e.field);
      expect(fieldNames).toContain('data_evento');
      expect(fieldNames).toContain('agente_patogeno');
      expect(fieldNames).toContain('descrizione');
    });

    it('dovrebbe restituire errori per campo specifico', () => {
      manager.setInfectionData({
        data_evento: 'invalid-date',
        agente_patogeno: 'Valid pathogen'
      });

      const dateErrors = manager.getFieldErrors('data_evento');
      const pathogenErrors = manager.getFieldErrors('agente_patogeno');
      
      expect(dateErrors).toHaveLength(1);
      expect(pathogenErrors).toHaveLength(0);
      expect(dateErrors[0].field).toBe('data_evento');
    });

    it('dovrebbe verificare presenza errori per campo', () => {
      manager.setInfectionData({
        data_evento: '',
        agente_patogeno: 'Valid pathogen'
      });

      expect(manager.hasFieldError('data_evento')).toBe(true);
      expect(manager.hasFieldError('agente_patogeno')).toBe(false);
      expect(manager.hasFieldError('descrizione')).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('dovrebbe restituire stato corretto per dati vuoti', () => {
      const status = manager.getStatus();
      
      expect(status.hasData).toBe(false);
      expect(status.isValid).toBe(false);
      expect(status.errorCount).toBe(0);
      expect(status.timestamp).toBeNull();
    });

    it('dovrebbe restituire stato corretto per dati validi', () => {
      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test pathogen'
      });

      const status = manager.getStatus();
      
      expect(status.hasData).toBe(true);
      expect(status.isValid).toBe(true);
      expect(status.errorCount).toBe(0);
      expect(status.timestamp).toBeTypeOf('number');
    });

    it('dovrebbe restituire stato corretto per dati invalidi', () => {
      manager.setInfectionData({
        data_evento: '',
        agente_patogeno: ''
      });

      const status = manager.getStatus();
      
      expect(status.hasData).toBe(true);
      expect(status.isValid).toBe(false);
      expect(status.errorCount).toBe(2);
      expect(status.timestamp).toBeTypeOf('number');
    });
  });

  describe('cleanupExpiredData', () => {
    beforeEach(() => {
      // Mock Date.now per controllare il tempo
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('dovrebbe pulire dati scaduti (più vecchi di 1 ora)', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Imposta dati
      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test pathogen'
      });

      expect(manager.hasInfectionData()).toBe(true);

      // Avanza il tempo di 2 ore
      vi.setSystemTime(now + (2 * 60 * 60 * 1000));

      const wasCleanedUp = manager.cleanupExpiredData();
      
      expect(wasCleanedUp).toBe(true);
      expect(manager.hasInfectionData()).toBe(false);
    });

    it('non dovrebbe pulire dati recenti', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      manager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test pathogen'
      });

      // Avanza il tempo di 30 minuti
      vi.setSystemTime(now + (30 * 60 * 1000));

      const wasCleanedUp = manager.cleanupExpiredData();
      
      expect(wasCleanedUp).toBe(false);
      expect(manager.hasInfectionData()).toBe(true);
    });

    it('dovrebbe gestire assenza di dati senza errori', () => {
      const wasCleanedUp = manager.cleanupExpiredData();
      
      expect(wasCleanedUp).toBe(false);
      expect(manager.hasInfectionData()).toBe(false);
    });
  });

  describe('Istanza singleton', () => {
    it('dovrebbe mantenere stato tra accessi multipli', () => {
      infectionDataManager.setInfectionData({
        data_evento: '2024-01-15',
        agente_patogeno: 'Test pathogen'
      });

      expect(infectionDataManager.hasInfectionData()).toBe(true);
      
      // Simula accesso da altro modulo
      const sameInstance = infectionDataManager;
      expect(sameInstance.hasInfectionData()).toBe(true);
      expect(sameInstance.getInfectionData().agente_patogeno).toBe('Test pathogen');
    });
  });
});