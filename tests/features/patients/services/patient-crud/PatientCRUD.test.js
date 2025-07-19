import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PatientCRUD } from '../../../../../src/features/patients/services/patient-crud/PatientCRUD.js';

describe('PatientCRUD', () => {
  let patientCRUD;
  let mockSupabaseClient;
  let mockValidator;
  let mockCache;

  beforeEach(() => {
    // Mock Supabase client with chainable methods
    const createMockChain = (finalResult = { data: [], error: null }) => ({
      select: vi.fn(() => createMockChain(finalResult)),
      eq: vi.fn(() => createMockChain(finalResult)),
      neq: vi.fn(() => createMockChain(finalResult)),
      gt: vi.fn(() => createMockChain(finalResult)),
      lt: vi.fn(() => createMockChain(finalResult)),
      gte: vi.fn(() => createMockChain(finalResult)),
      lte: vi.fn(() => createMockChain(finalResult)),
      like: vi.fn(() => createMockChain(finalResult)),
      ilike: vi.fn(() => createMockChain(finalResult)),
      is: vi.fn(() => createMockChain(finalResult)),
      not: vi.fn(() => createMockChain(finalResult)),
      or: vi.fn(() => createMockChain(finalResult)),
      order: vi.fn(() => createMockChain(finalResult)),
      range: vi.fn(() => createMockChain(finalResult)),
      single: vi.fn(() => Promise.resolve(finalResult)),
      then: vi.fn((callback) => Promise.resolve(finalResult).then(callback)),
      catch: vi.fn((callback) => Promise.resolve(finalResult).catch(callback))
    });

    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => createMockChain({ data: [], error: null })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    };

    mockValidator = {
      validatePatientData: vi.fn(() => ({ isValid: true, errors: [] })),
      validateFilters: vi.fn(() => ({ isValid: true, errors: [] })),
      validatePagination: vi.fn(() => ({ isValid: true, errors: [] })),
      sanitizeInput: vi.fn((input) => input)
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      invalidatePattern: vi.fn(),
      clear: vi.fn()
    };

    patientCRUD = new PatientCRUD(mockSupabaseClient, mockValidator, mockCache);
  });

  describe('Get Patients', () => {
    test('should get patients with filters and pagination from Supabase', async () => {
      const mockPatients = [
        { 
          id: 1, 
          nome: 'Mario', 
          cognome: 'Rossi', 
          reparto_appartenenza: 'Medicina',
          diagnosi: 'Ipertensione',
          data_ricovero: '2024-01-01'
        },
        { 
          id: 2, 
          nome: 'Luigi', 
          cognome: 'Verdi', 
          reparto_appartenenza: 'Chirurgia',
          diagnosi: 'Appendicite',
          data_ricovero: '2024-01-02'
        }
      ];

      mockSupabaseClient.from().select().then = vi.fn(() => 
        Promise.resolve({ data: mockPatients, error: null })
      );

      const filters = { 
        reparto_appartenenza: 'Medicina',
        data_ricovero_from: '2024-01-01',
        data_ricovero_to: '2024-12-31'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await patientCRUD.getPatients(filters, pagination);

      expect(mockValidator.validateFilters).toHaveBeenCalledWith(filters);
      expect(mockValidator.validatePagination).toHaveBeenCalledWith(pagination);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pazienti');
      expect(result).toEqual(mockPatients);
    });

    test('should use cache when available', async () => {
      const cachedData = [{ id: 1, nome: 'Cached', cognome: 'Patient' }];
      mockCache.get.mockReturnValue(cachedData);

      const result = await patientCRUD.getPatients({}, {});

      expect(mockCache.get).toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      mockValidator.validateFilters.mockReturnValue({
        isValid: false,
        errors: ['Invalid filter']
      });

      await expect(patientCRUD.getPatients({ invalid: 'filter' }, {}))
        .rejects.toThrow('Invalid filter');
    });
  });

  describe('Get Patient By ID', () => {
    test('should get patient by ID', async () => {
      const mockPatient = { id: 1, nome: 'Mario', cognome: 'Rossi' };
      
      mockSupabaseClient.from().select().eq().single = vi.fn(() =>
        Promise.resolve({ data: mockPatient, error: null })
      );

      const result = await patientCRUD.getPatientById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pazienti');
      expect(result).toEqual(mockPatient);
    });

    test('should use cache for individual patient', async () => {
      const cachedPatient = { id: 1, nome: 'Cached', cognome: 'Patient' };
      mockCache.get.mockReturnValue(cachedPatient);

      const result = await patientCRUD.getPatientById(1);

      expect(mockCache.get).toHaveBeenCalledWith('patient_1');
      expect(result).toEqual(cachedPatient);
    });

    test('should handle patient not found', async () => {
      mockSupabaseClient.from().select().eq().single = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: 'PGRST116' } })
      );

      await expect(patientCRUD.getPatientById(999))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('Create Patient', () => {
    test('should create new patient', async () => {
      const patientData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_ricovero: '2024-01-01',
        reparto_appartenenza: 'Medicina',
        diagnosi: 'Test diagnosis'
      };

      const createdPatient = { id: 1, ...patientData };
      
      mockSupabaseClient.from().insert().select().single = vi.fn(() =>
        Promise.resolve({ data: createdPatient, error: null })
      );

      const result = await patientCRUD.createPatient(patientData);

      expect(mockValidator.validatePatientData).toHaveBeenCalledWith(patientData);
      expect(mockValidator.sanitizeInput).toHaveBeenCalledWith(patientData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pazienti');
      expect(mockCache.invalidate).toHaveBeenCalledWith('patients_list');
      expect(result).toEqual(createdPatient);
    });

    test('should handle validation errors on create', async () => {
      mockValidator.validatePatientData.mockReturnValue({
        isValid: false,
        errors: ['Nome is required']
      });

      await expect(patientCRUD.createPatient({}))
        .rejects.toThrow('Nome is required');
    });

    test('should handle database errors on create', async () => {
      const patientData = { nome: 'Mario', cognome: 'Rossi' };
      
      mockSupabaseClient.from().insert().select().single = vi.fn(() =>
        Promise.resolve({ data: null, error: { message: 'Database error' } })
      );

      await expect(patientCRUD.createPatient(patientData))
        .rejects.toThrow('Database error');
    });
  });

  describe('Update Patient', () => {
    test('should update existing patient', async () => {
      const updateData = { nome: 'Mario Updated' };
      const updatedPatient = { id: 1, nome: 'Mario Updated', cognome: 'Rossi' };
      
      mockSupabaseClient.from().update().eq().select().single = vi.fn(() =>
        Promise.resolve({ data: updatedPatient, error: null })
      );

      const result = await patientCRUD.updatePatient(1, updateData);

      expect(mockValidator.validatePatientData).toHaveBeenCalledWith(updateData);
      expect(mockValidator.sanitizeInput).toHaveBeenCalledWith(updateData);
      expect(mockCache.invalidate).toHaveBeenCalledWith('patient_1');
      expect(mockCache.invalidate).toHaveBeenCalledWith('patients_list');
      expect(result).toEqual(updatedPatient);
    });

    test('should handle patient not found on update', async () => {
      mockSupabaseClient.from().update().eq().select().single = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: 'PGRST116' } })
      );

      await expect(patientCRUD.updatePatient(999, { nome: 'Test' }))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('Delete Patient', () => {
    test('should delete patient', async () => {
      mockSupabaseClient.from().delete().eq = vi.fn(() =>
        Promise.resolve({ data: null, error: null })
      );

      await patientCRUD.deletePatient(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pazienti');
      expect(mockCache.invalidate).toHaveBeenCalledWith('patient_1');
      expect(mockCache.invalidate).toHaveBeenCalledWith('patients_list');
    });

    test('should handle delete errors', async () => {
      mockSupabaseClient.from().delete().eq = vi.fn(() =>
        Promise.resolve({ data: null, error: { message: 'Delete failed' } })
      );

      await expect(patientCRUD.deletePatient(1))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockSupabaseClient.from = vi.fn(() => {
        throw new Error('Network error');
      });

      await expect(patientCRUD.getPatients({}, {}))
        .rejects.toThrow('Network error');
    });

    test('should handle cache errors gracefully', async () => {
      mockCache.get.mockImplementation(() => {
        throw new Error('Cache error');
      });

      // Should fallback to database query
      mockSupabaseClient.from().select().then = vi.fn(() =>
        Promise.resolve({ data: [], error: null })
      );

      const result = await patientCRUD.getPatients({}, {});
      
      expect(result).toEqual([]);
    });
  });
});