import { describe, it, expect } from 'vitest';
import { validatePatientData } from '../../../../src/features/patients/services/patientValidation.js';

describe('Patient Data Validation', () => {
  const validPatient = {
    nome: 'Mario',
    cognome: 'Rossi',
    data_nascita: '1990-01-15',
    data_ricovero: '2024-01-10',
    diagnosi: 'Infarto',
    reparto_appartenenza: 'Cardiologia'
  };

  describe('Required Fields Validation', () => {
    it('should accept valid patient data', () => {
      expect(() => validatePatientData(validPatient)).not.toThrow();
    });

    it('should reject empty nome', () => {
      const invalid = { ...validPatient, nome: '' };
      expect(() => validatePatientData(invalid))
        .toThrow('Il campo nome è obbligatorio');
    });

    it('should reject missing cognome', () => {
      const invalid = { ...validPatient };
      delete invalid.cognome;
      expect(() => validatePatientData(invalid))
        .toThrow('Il campo cognome è obbligatorio');
    });

    it('should reject whitespace-only values', () => {
      const invalid = { ...validPatient, diagnosi: '   ' };
      expect(() => validatePatientData(invalid))
        .toThrow('Il campo diagnosi è obbligatorio');
    });
  });

  describe('Date Validation', () => {
    it('should reject future birth date', () => {
      const invalid = { ...validPatient, data_nascita: '2050-01-01' };
      expect(() => validatePatientData(invalid))
        .toThrow('La data di nascita non può essere nel futuro');
    });

    it('should reject future admission date', () => {
      const invalid = { ...validPatient, data_ricovero: '2050-01-01' };
      expect(() => validatePatientData(invalid))
        .toThrow('La data di ricovero non può essere nel futuro');
    });

    it('should reject discharge date before admission', () => {
      const invalid = {
        ...validPatient,
        data_ricovero: '2024-01-10',
        data_dimissione: '2024-01-05'
      };
      expect(() => validatePatientData(invalid))
        .toThrow('La data di dimissione non può essere precedente alla data di ricovero');
    });

    it('should accept discharge date after admission', () => {
      const valid = {
        ...validPatient,
        data_ricovero: '2024-01-10',
        data_dimissione: '2024-01-15'
      };
      expect(() => validatePatientData(valid)).not.toThrow();
    });

    it('should accept null discharge date', () => {
      const valid = { ...validPatient, data_dimissione: null };
      expect(() => validatePatientData(valid)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string dates gracefully', () => {
      const invalid = { ...validPatient, data_nascita: '' };
      expect(() => validatePatientData(invalid))
        .toThrow('Il campo data_nascita è obbligatorio');
    });

    it('should handle missing required fields', () => {
      const invalid = { ...validPatient };
      delete invalid.reparto_appartenenza;
      expect(() => validatePatientData(invalid))
        .toThrow('Il campo reparto_appartenenza è obbligatorio');
    });
  });
});