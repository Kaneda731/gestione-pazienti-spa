/**
 * Test suite per le nuove funzionalità di dimissione/trasferimento del PatientService
 * Test per dischargePatientWithTransfer, getTransferHistory e validateDischargeData
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dei moduli core
vi.mock('@/core/services/supabase/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

vi.mock('@/core/services/state/stateService.js', () => ({
  stateService: {
    setLoading: vi.fn()
  }
}));

vi.mock('@/core/services/notifications/notificationService.js', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

vi.mock('@/core/services/logger/loggerService.js', () => ({
  logger: {
    log: vi.fn()
  }
}));

// Import dopo i mock
import { supabase } from '@/core/services/supabase/supabaseClient.js';
import { stateService } from '@/core/services/state/stateService.js';
import { notificationService } from '@/core/services/notifications/notificationService.js';

// Mock esteso del PatientService con le nuove funzionalità
class MockPatientServiceExtended {
  constructor() {
    this.cache = new Map();
    this.patients = [
      {
        id: 'p1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        data_dimissione: null,
        tipo_dimissione: null,
        reparto_destinazione: null,
        clinica_destinazione: null,
        codice_clinica: null,
        codice_dimissione: null
      },
      {
        id: 'p2',
        nome: 'Luigi',
        cognome: 'Bianchi',
        data_ricovero: '2024-01-02',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Cardiologia',
        clinica_destinazione: null,
        codice_clinica: null,
        codice_dimissione: '3'
      }
    ];
  }

  async getPatientById(id) {
    const patient = this.patients.find(p => p.id === id);
    if (!patient) {
      throw new Error('Paziente non trovato');
    }
    return patient;
  }

  async dischargePatientWithTransfer(id, dischargeData) {
    try {
      stateService.setLoading(true, 'Dimissione paziente...');

      // Validazione dati dimissione/trasferimento
      this.validateDischargeData(dischargeData);

      const patientIndex = this.patients.findIndex(p => p.id === id);
      if (patientIndex === -1) {
        throw new Error('Paziente non trovato');
      }

      // Aggiorna il paziente
      this.patients[patientIndex] = {
        ...this.patients[patientIndex],
        ...dischargeData
      };

      // Invalida cache per questo paziente
      this.cache.delete(`patient_${id}`);

      const tipoMessage = dischargeData.tipo_dimissione === 'dimissione' 
        ? 'dimesso' 
        : 'trasferito';
      
      stateService.setLoading(false);
      notificationService.success(`Paziente ${tipoMessage} con successo!`);
      
      return this.patients[patientIndex];
    } catch (error) {
      stateService.setLoading(false);
      notificationService.error(`Errore nella dimissione: ${error.message}`);
      throw error;
    }
  }

  async getTransferHistory(pazienteId) {
    try {
      const patient = await this.getPatientById(pazienteId);
      
      const transferHistory = [];
      
      // Se il paziente è stato dimesso/trasferito, aggiungi alla cronologia
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
      notificationService.error(`Errore nel caricamento cronologia: ${error.message}`);
      throw error;
    }
  }

  validateDischargeData(dischargeData) {
    // Campi obbligatori base
    const required = ['data_dimissione', 'tipo_dimissione'];

    for (const field of required) {
      if (!dischargeData[field] || dischargeData[field].toString().trim() === '') {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    // Validazione tipo dimissione
    const tipiValidi = ['dimissione', 'trasferimento_interno', 'trasferimento_esterno'];
    if (!tipiValidi.includes(dischargeData.tipo_dimissione)) {
      throw new Error(`Tipo dimissione non valido. Valori ammessi: ${tipiValidi.join(', ')}`);
    }

    // Validazione data dimissione
    if (dischargeData.data_dimissione) {
      const dimissioneDate = new Date(dischargeData.data_dimissione);
      const oggi = new Date();
      if (dimissioneDate > oggi) {
        throw new Error('La data di dimissione non può essere nel futuro');
      }
    }

    // Validazioni specifiche per tipo dimissione
    if (dischargeData.tipo_dimissione === 'trasferimento_interno') {
      if (!dischargeData.reparto_destinazione || dischargeData.reparto_destinazione.trim() === '') {
        throw new Error('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
      }
    }

    if (dischargeData.tipo_dimissione === 'trasferimento_esterno') {
      if (!dischargeData.clinica_destinazione || dischargeData.clinica_destinazione.trim() === '') {
        throw new Error('La clinica di destinazione è obbligatoria per i trasferimenti esterni');
      }
      
      if (!dischargeData.codice_clinica) {
        throw new Error('Il codice clinica è obbligatorio per i trasferimenti esterni');
      }

      // Validazione codici clinica
      const codiciValidi = ['56', '60'];
      if (!codiciValidi.includes(dischargeData.codice_clinica)) {
        throw new Error(`Codice clinica non valido. Valori ammessi: ${codiciValidi.join(', ')}`);
      }
    }

    // Validazione codice dimissione (sempre obbligatorio)
    if (!dischargeData.codice_dimissione) {
      throw new Error('Il codice dimissione è obbligatorio');
    }

    const codiciDimissioneValidi = ['0', '3', '6'];
    if (!codiciDimissioneValidi.includes(dischargeData.codice_dimissione)) {
      throw new Error(`Codice dimissione non valido. Valori ammessi: ${codiciDimissioneValidi.join(', ')}`);
    }
  }
}

// Test suite completa
describe('PatientService - Discharge/Transfer Extensions', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MockPatientServiceExtended();
  });

  describe('dischargePatientWithTransfer', () => {
    it('should discharge patient successfully', async () => {
      const dischargeData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: '3'
      };

      const result = await service.dischargePatientWithTransfer('p1', dischargeData);

      expect(result.data_dimissione).toBe('2024-01-20');
      expect(result.tipo_dimissione).toBe('dimissione');
      expect(result.codice_dimissione).toBe('3');
      expect(notificationService.success).toHaveBeenCalledWith('Paziente dimesso con successo!');
      expect(stateService.setLoading).toHaveBeenCalledWith(true, 'Dimissione paziente...');
      expect(stateService.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle internal transfer successfully', async () => {
      const transferData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Neurologia',
        codice_dimissione: '6'
      };

      const result = await service.dischargePatientWithTransfer('p1', transferData);

      expect(result.tipo_dimissione).toBe('trasferimento_interno');
      expect(result.reparto_destinazione).toBe('Neurologia');
      expect(notificationService.success).toHaveBeenCalledWith('Paziente trasferito con successo!');
    });

    it('should handle external transfer successfully', async () => {
      const transferData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Clinica Riabilitazione',
        codice_clinica: '56',
        codice_dimissione: '3'
      };

      const result = await service.dischargePatientWithTransfer('p1', transferData);

      expect(result.tipo_dimissione).toBe('trasferimento_esterno');
      expect(result.clinica_destinazione).toBe('Clinica Riabilitazione');
      expect(result.codice_clinica).toBe('56');
      expect(notificationService.success).toHaveBeenCalledWith('Paziente trasferito con successo!');
    });

    it('should handle non-existent patient', async () => {
      const dischargeData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: '3'
      };

      await expect(service.dischargePatientWithTransfer('non-existent', dischargeData))
        .rejects.toThrow('Paziente non trovato');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        data_dimissione: '2024-01-20'
        // Missing tipo_dimissione
      };

      await expect(service.dischargePatientWithTransfer('p1', invalidData))
        .rejects.toThrow('Il campo tipo_dimissione è obbligatorio');
      
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('getTransferHistory', () => {
    it('should return transfer history for discharged patient', async () => {
      const history = await service.getTransferHistory('p2');

      expect(history).toHaveLength(1);
      expect(history[0].data).toBe('2024-01-15');
      expect(history[0].tipo).toBe('trasferimento_interno');
      expect(history[0].reparto_destinazione).toBe('Cardiologia');
      expect(history[0].codice_dimissione).toBe('3');
    });

    it('should return empty history for active patient', async () => {
      const history = await service.getTransferHistory('p1');

      expect(history).toEqual([]);
    });

    it('should handle non-existent patient', async () => {
      await expect(service.getTransferHistory('non-existent'))
        .rejects.toThrow('Paziente non trovato');
      
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('validateDischargeData', () => {
    it('should validate required fields', () => {
      expect(() => service.validateDischargeData({}))
        .toThrow('Il campo data_dimissione è obbligatorio');

      expect(() => service.validateDischargeData({ data_dimissione: '2024-01-20' }))
        .toThrow('Il campo tipo_dimissione è obbligatorio');
    });

    it('should validate discharge type', () => {
      const invalidData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'invalid_type'
      };

      expect(() => service.validateDischargeData(invalidData))
        .toThrow('Tipo dimissione non valido');
    });

    it('should validate future discharge date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidData = {
        data_dimissione: futureDate.toISOString().split('T')[0],
        tipo_dimissione: 'dimissione'
      };

      expect(() => service.validateDischargeData(invalidData))
        .toThrow('La data di dimissione non può essere nel futuro');
    });

    it('should validate internal transfer requirements', () => {
      const invalidData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_interno',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(invalidData))
        .toThrow('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
    });

    it('should validate external transfer requirements', () => {
      const invalidData1 = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_esterno',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(invalidData1))
        .toThrow('La clinica di destinazione è obbligatoria per i trasferimenti esterni');

      const invalidData2 = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Test Clinic',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(invalidData2))
        .toThrow('Il codice clinica è obbligatorio per i trasferimenti esterni');
    });

    it('should validate clinic codes', () => {
      const invalidData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Test Clinic',
        codice_clinica: 'invalid',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(invalidData))
        .toThrow('Codice clinica non valido');
    });

    it('should validate discharge codes', () => {
      const invalidData = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione'
      };

      expect(() => service.validateDischargeData(invalidData))
        .toThrow('Il codice dimissione è obbligatorio');

      const invalidData2 = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: 'invalid'
      };

      expect(() => service.validateDischargeData(invalidData2))
        .toThrow('Codice dimissione non valido');
    });

    it('should pass validation for valid discharge data', () => {
      const validDischarge = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(validDischarge)).not.toThrow();

      const validInternalTransfer = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Cardiologia',
        codice_dimissione: '6'
      };

      expect(() => service.validateDischargeData(validInternalTransfer)).not.toThrow();

      const validExternalTransfer = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Clinica Riabilitazione',
        codice_clinica: '56',
        codice_dimissione: '3'
      };

      expect(() => service.validateDischargeData(validExternalTransfer)).not.toThrow();
    });

    it('should handle ordinary discharge with code 0', async () => {
      const ordinaryDischarge = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: '0'
      };

      const result = await service.dischargePatientWithTransfer('p1', ordinaryDischarge);

      expect(result.tipo_dimissione).toBe('dimissione');
      expect(result.codice_dimissione).toBe('0');
      expect(notificationService.success).toHaveBeenCalledWith('Paziente dimesso con successo!');
    });

    it('should validate new discharge code 0 as valid', () => {
      const validOrdinaryDischarge = {
        data_dimissione: '2024-01-20',
        tipo_dimissione: 'dimissione',
        codice_dimissione: '0'
      };

      expect(() => service.validateDischargeData(validOrdinaryDischarge)).not.toThrow();
    });
  });
});