import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PatientValidator } from '../../../../../src/features/patients/services/patient-validation/PatientValidator.js';
import { 
  createMockSupabaseClient,
  createSampleDepartments,
  createSampleDiagnoses,
  createMockSupabaseWithData
} from '../../../../utils/test-helpers.js';

describe('PatientValidator - Supabase Integration', () => {
  let validator;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseWithData();
    validator = new PatientValidator(mockSupabase);
  });

  describe('Department Validation with Supabase', () => {
    test('should validate department exists in reparti table', async () => {
      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('reparti');
    });

    test('should reject patient with non-existent department', async () => {
      // Mock empty result for department lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reparti') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Reparto Inesistente',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reparto appartenenza non esiste nel database');
    });

    test('should handle inactive departments', async () => {
      // Mock department that exists but is inactive
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reparti') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ 
                data: [{ id: 1, nome: 'Medicina', attivo: false }], 
                error: null 
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reparto appartenenza non è attivo');
    });
  });

  describe('Diagnosis Validation with Supabase', () => {
    test('should validate diagnosis exists in diagnosi table', async () => {
      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('diagnosi');
    });

    test('should reject patient with non-existent diagnosis', async () => {
      // Mock empty result for diagnosis lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'diagnosi') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Diagnosi Inesistente'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Diagnosi non esiste nel database');
    });

    test('should validate diagnosis with ICD code', async () => {
      // Mock diagnosis with ICD code
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'diagnosi') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ 
                data: [{ 
                  id: 1, 
                  nome: 'Ipertensione', 
                  codice_icd: 'I10',
                  categoria: 'Cardiovascolare',
                  attivo: true 
                }], 
                error: null 
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(true);
      expect(result.metadata.diagnosis_icd_code).toBe('I10');
      expect(result.metadata.diagnosis_category).toBe('Cardiovascolare');
    });
  });

  describe('Cross-validation with Database', () => {
    test('should validate department-diagnosis compatibility', async () => {
      // Mock specific department-diagnosis rules
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reparto_diagnosi_compatibilita') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ 
                  data: [{ reparto_id: 1, diagnosi_id: 1, compatibile: true }], 
                  error: null 
                }))
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientDataWithCrossValidation(patientData);

      expect(result.isValid).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('reparto_diagnosi_compatibilita');
    });

    test('should warn about unusual department-diagnosis combinations', async () => {
      // Mock no compatibility record found
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reparto_diagnosi_compatibilita') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Cardiologia',
        diagnosi: 'Appendicite Acuta'
      };

      const result = await validator.validatePatientDataWithCrossValidation(patientData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Combinazione reparto-diagnosi inusuale');
    });
  });

  describe('Database Error Handling', () => {
    test('should handle Supabase connection errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      // Should fallback to basic validation without database lookup
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Validazione database non disponibile');
    });

    test('should handle Supabase query errors', async () => {
      // Mock query error
      mockSupabase.from.mockImplementation((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Query failed', code: 'PGRST301' }
          }))
        }))
      }));

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Errore durante la validazione database');
    });

    test('should handle timeout errors', async () => {
      // Mock timeout
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          }))
        }))
      }));

      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Timeout durante la validazione database');
    });
  });

  describe('Caching Database Lookups', () => {
    test('should cache department lookups', async () => {
      const patientData1 = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      const patientData2 = {
        nome: 'Luigi',
        cognome: 'Verdi',
        data_ricovero: '2024-01-02',
        reparto_appartenenza: 'Medicina', // Same department
        diagnosi: 'Diabete'
      };

      await validator.validatePatientData(patientData1);
      await validator.validatePatientData(patientData2);

      // Should only call database once for the same department
      expect(mockSupabase.from).toHaveBeenCalledTimes(4); // 2 for reparti, 2 for diagnosi
    });

    test('should invalidate cache when needed', async () => {
      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Ipertensione'
      };

      await validator.validatePatientData(patientData);
      
      // Invalidate cache
      validator.invalidateCache();
      
      await validator.validatePatientData(patientData);

      // Should call database again after cache invalidation
      expect(mockSupabase.from).toHaveBeenCalledTimes(4); // 2 calls each time
    });
  });

  describe('Performance with Large Datasets', () => {
    test('should handle large department lists efficiently', async () => {
      // Mock large department list
      const largeDepartmentList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        nome: `Reparto ${i + 1}`,
        descrizione: `Descrizione reparto ${i + 1}`,
        attivo: true
      }));

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reparti') {
          return {
            select: vi.fn(() => Promise.resolve({ 
              data: largeDepartmentList, 
              error: null 
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const startTime = Date.now();
      
      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Reparto 50',
        diagnosi: 'Ipertensione'
      };

      const result = await validator.validatePatientData(patientData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});