import { describe, test, expect, beforeEach } from 'vitest';
import { PatientValidator } from '../../../../../src/features/patients/services/patient-validation/PatientValidator.js';

describe('PatientValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new PatientValidator();
  });

  describe('Patient Data Validation', () => {
    test('should validate complete patient data', () => {
      const validPatient = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '1980-01-01',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = validator.validatePatientData(validPatient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject patient data with missing required fields', () => {
      const incompletePatient = {
        nome: 'Mario'
        // Missing required fields
      };

      const result = validator.validatePatientData(incompletePatient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cognome è obbligatorio');
      expect(result.errors).toContain('Data ricovero è obbligatoria');
      expect(result.errors).toContain('Reparto appartenenza è obbligatorio');
      expect(result.errors).toContain('Diagnosi è obbligatoria');
    });

    test('should validate date formats', () => {
      const patientWithInvalidDates = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: 'invalid-date',
        data_ricovero: '2024-13-45', // Invalid date
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Test'
      };

      const result = validator.validatePatientData(patientWithInvalidDates);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data nascita non è valida');
      expect(result.errors).toContain('Data ricovero non è valida');
    });

    test('should validate logical date relationships', () => {
      const patientWithLogicalErrors = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '2025-01-01', // Future birth date
        data_ricovero: '2024-01-01',
        data_dimissione: '2023-12-31', // Discharge before admission
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Test'
      };

      const result = validator.validatePatientData(patientWithLogicalErrors);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data nascita non può essere nel futuro');
      expect(result.errors).toContain('Data dimissione non può essere precedente alla data ricovero');
    });

    test('should validate string field lengths', () => {
      const patientWithLongFields = {
        nome: 'A'.repeat(101), // Too long
        cognome: 'B'.repeat(101), // Too long
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'C'.repeat(501) // Too long
      };

      const result = validator.validatePatientData(patientWithLongFields);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome non può superare 100 caratteri');
      expect(result.errors).toContain('Cognome non può superare 100 caratteri');
      expect(result.errors).toContain('Diagnosi non può superare 500 caratteri');
    });

    test('should validate department values against Supabase data', async () => {
      // Mock Supabase call to get valid departments
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [
              { nome: 'Medicina' },
              { nome: 'Chirurgia' },
              { nome: 'Cardiologia' }
            ],
            error: null
          }))
        }))
      };

      const validatorWithDb = new PatientValidator(mockSupabase);

      const patientWithInvalidDepartment = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Reparto Inesistente',
        diagnosi: 'Test'
      };

      const result = await validatorWithDb.validatePatientData(patientWithInvalidDepartment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reparto appartenenza non è valido');
      expect(mockSupabase.from).toHaveBeenCalledWith('reparti');
    });

    test('should validate diagnosis values against Supabase data', async () => {
      // Mock Supabase call to get valid diagnoses
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [
              { nome: 'Ipertensione' },
              { nome: 'Diabete' },
              { nome: 'Cardiopatia' }
            ],
            error: null
          }))
        }))
      };

      const validatorWithDb = new PatientValidator(mockSupabase);

      const patientWithInvalidDiagnosis = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Diagnosi Inesistente'
      };

      const result = await validatorWithDb.validatePatientData(patientWithInvalidDiagnosis);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Diagnosi non è valida');
      expect(mockSupabase.from).toHaveBeenCalledWith('diagnosi');
    });
  });

  describe('Filter Validation', () => {
    test('should validate correct filters with database lookup', async () => {
      // Mock Supabase for department validation
      const mockSupabase = {
        from: vi.fn((table) => ({
          select: vi.fn(() => {
            if (table === 'reparti') {
              return Promise.resolve({
                data: [{ nome: 'Medicina' }, { nome: 'Chirurgia' }],
                error: null
              });
            }
            return Promise.resolve({ data: [], error: null });
          })
        }))
      };

      const validatorWithDb = new PatientValidator(mockSupabase);

      const validFilters = {
        reparto_appartenenza: 'Medicina',
        data_ricovero_from: '2024-01-01',
        data_ricovero_to: '2024-12-31',
        attivo: true
      };

      const result = await validatorWithDb.validateFilters(validFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid filter values', () => {
      const invalidFilters = {
        reparto_appartenenza: 123, // Should be string
        data_ricovero_from: 'invalid-date',
        data_ricovero_to: '2024-01-01',
        attivo: 'not-boolean'
      };

      const result = validator.validateFilters(invalidFilters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reparto appartenenza deve essere una stringa');
      expect(result.errors).toContain('Data ricovero from non è valida');
      expect(result.errors).toContain('Attivo deve essere un valore booleano');
    });

    test('should validate date range logic in filters', () => {
      const invalidDateRangeFilters = {
        data_ricovero_from: '2024-12-31',
        data_ricovero_to: '2024-01-01' // End before start
      };

      const result = validator.validateFilters(invalidDateRangeFilters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data ricovero to deve essere successiva a data ricovero from');
    });

    test('should allow unknown filter fields with warning', () => {
      const filtersWithUnknownField = {
        reparto_appartenenza: 'Medicina',
        unknown_field: 'value'
      };

      const result = validator.validateFilters(filtersWithUnknownField);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Campo filtro sconosciuto: unknown_field');
    });
  });

  describe('Pagination Validation', () => {
    test('should validate correct pagination', () => {
      const validPagination = {
        page: 1,
        limit: 20,
        offset: 0
      };

      const result = validator.validatePagination(validPagination);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid pagination values', () => {
      const invalidPagination = {
        page: 0, // Should be >= 1
        limit: 101, // Should be <= 100
        offset: -1 // Should be >= 0
      };

      const result = validator.validatePagination(invalidPagination);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page deve essere maggiore di 0');
      expect(result.errors).toContain('Limit non può superare 100');
      expect(result.errors).toContain('Offset deve essere maggiore o uguale a 0');
    });

    test('should provide default values for missing pagination', () => {
      const result = validator.validatePagination({});

      expect(result.isValid).toBe(true);
      expect(result.sanitized.page).toBe(1);
      expect(result.sanitized.limit).toBe(20);
      expect(result.sanitized.offset).toBe(0);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize string inputs', () => {
      const dirtyInput = {
        nome: '  Mario  ',
        cognome: 'ROSSI',
        diagnosi: '<script>alert("xss")</script>Ipertensione'
      };

      const sanitized = validator.sanitizeInput(dirtyInput);

      expect(sanitized.nome).toBe('Mario');
      expect(sanitized.cognome).toBe('Rossi');
      expect(sanitized.diagnosi).toBe('Ipertensione'); // HTML stripped
    });

    test('should normalize date formats', () => {
      const inputWithDates = {
        data_ricovero: '01/01/2024', // DD/MM/YYYY
        data_dimissione: '2024-1-1' // YYYY-M-D
      };

      const sanitized = validator.sanitizeInput(inputWithDates);

      expect(sanitized.data_ricovero).toBe('2024-01-01');
      expect(sanitized.data_dimissione).toBe('2024-01-01');
    });

    test('should handle null and undefined values', () => {
      const inputWithNulls = {
        nome: 'Mario',
        cognome: null,
        data_dimissione: undefined,
        note: ''
      };

      const sanitized = validator.sanitizeInput(inputWithNulls);

      expect(sanitized.nome).toBe('Mario');
      expect(sanitized.cognome).toBeNull();
      expect(sanitized.data_dimissione).toBeUndefined();
      expect(sanitized.note).toBe('');
    });

    test('should preserve valid data types', () => {
      const inputWithMixedTypes = {
        nome: 'Mario',
        eta: 45,
        attivo: true,
        data_ricovero: '2024-01-01'
      };

      const sanitized = validator.sanitizeInput(inputWithMixedTypes);

      expect(sanitized.nome).toBe('Mario');
      expect(sanitized.eta).toBe(45);
      expect(sanitized.attivo).toBe(true);
      expect(sanitized.data_ricovero).toBe('2024-01-01');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed input gracefully', () => {
      expect(() => {
        validator.validatePatientData(null);
      }).not.toThrow();

      expect(() => {
        validator.validatePatientData('not-an-object');
      }).not.toThrow();
    });

    test('should provide helpful error messages', () => {
      const result = validator.validatePatientData({});

      expect(result.errors.every(error => typeof error === 'string')).toBe(true);
      expect(result.errors.every(error => error.length > 0)).toBe(true);
    });
  });
});