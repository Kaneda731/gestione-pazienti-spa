// __tests__/integration/features/patients/dimissione-api.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    dischargePatient,
    dischargePatientWithTransfer,
    validateDischargeData
} from '../../../../src/features/patients/views/dimissione-api.js';
import { supabase } from '../../../../src/core/services/supabaseClient.js';

vi.mock('../../../../src/core/services/supabaseClient.js', () => ({
    supabase: {
        from: vi.fn(),
    }
}));

describe('Enhanced Dimissione API', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateDischargeData', () => {
        it('should validate basic discharge data successfully', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require mandatory fields', () => {
            const dischargeData = {};
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('La data di dimissione è obbligatoria');
            expect(result.errors).toContain('Il tipo di dimissione è obbligatorio');
            expect(result.errors).toContain('Il codice dimissione è obbligatorio');
        });

        it('should validate tipo_dimissione values', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'invalid_type',
                codice_dimissione: '3'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Tipo di dimissione non valido');
        });

        it('should validate codice_dimissione values', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '99'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Codice dimissione non valido');
        });

        it('should validate internal transfer fields', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_interno',
                codice_dimissione: '6',
                reparto_destinazione: ''
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
        });

        it('should validate external transfer fields', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '6',
                clinica_destinazione: '',
                codice_clinica: ''
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('La clinica di destinazione è obbligatoria per i trasferimenti esterni');
            expect(result.errors).toContain('Il codice clinica è obbligatorio per i trasferimenti esterni');
        });

        it('should validate codice_clinica values', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '6',
                clinica_destinazione: 'Clinica Test',
                codice_clinica: '99'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Codice clinica non valido');
        });

        it('should validate date format', () => {
            const dischargeData = {
                data_dimissione: '2025-01-01',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Formato data dimissione non valido (utilizzare gg/mm/aaaa)');
        });

        it('should pass validation for complete internal transfer', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_interno',
                codice_dimissione: '6',
                reparto_destinazione: 'Cardiologia'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation for complete external transfer', () => {
            const dischargeData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '6',
                clinica_destinazione: 'Clinica San Giuseppe',
                codice_clinica: '56'
            };
            
            const result = validateDischargeData(dischargeData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('dischargePatientWithTransfer', () => {
        const mockPatient = {
            id: 'patient-123',
            data_ricovero: '2024-12-01',
            data_dimissione: null
        };

        const setupMocks = (selectResult, updateResult) => {
            const updateChain = {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn(),
            };

            const selectChain = {
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                single: vi.fn(),
            };

            const fromChain = {
                select: vi.fn().mockReturnValue(selectChain),
                update: vi.fn().mockReturnValue(updateChain),
            };

            supabase.from.mockReturnValue(fromChain);

            selectChain.single.mockResolvedValue(selectResult);
            if (updateResult) {
                updateChain.select.mockResolvedValue(updateResult);
            }
            
            return { fromChain, selectChain, updateChain };
        };

        it('should reject invalid discharge data', async () => {
            const invalidData = {
                data_dimissione: '',
                tipo_dimissione: '',
                codice_dimissione: ''
            };

            await expect(dischargePatientWithTransfer('patient-123', invalidData))
                .rejects.toThrow('Dati di dimissione non validi');
        });

        it('should handle patient not found error', async () => {
            setupMocks({ data: null, error: { code: 'PGRST116' } });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };

            await expect(dischargePatientWithTransfer('patient-123', validData))
                .rejects.toThrow('Paziente non trovato o già dimesso');
        });

        it('should handle already discharged patient', async () => {
            setupMocks({ data: null, error: null });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };

            await expect(dischargePatientWithTransfer('patient-123', validData))
                .rejects.toThrow('Paziente non trovato o già dimesso');
        });

        it('should reject discharge date before admission date', async () => {
            setupMocks({ data: mockPatient, error: null });
            const validData = {
                data_dimissione: '01/11/2024', // Before admission date
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };

            await expect(dischargePatientWithTransfer('patient-123', validData))
                .rejects.toThrow('La data di dimissione non può essere precedente alla data di ricovero');
        });

        it('should successfully discharge patient with basic data', async () => {
            const updatedPatient = { 
                ...mockPatient, 
                data_dimissione: '2025-01-01',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };
            
            const { updateChain } = setupMocks({ data: mockPatient, error: null }, { data: [updatedPatient], error: null });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };

            const result = await dischargePatientWithTransfer('patient-123', validData);
            
            expect(result).toEqual(updatedPatient);
            expect(updateChain.eq).toHaveBeenCalledWith('id', 'patient-123');
        });

        it('should successfully process internal transfer', async () => {
            const updatedPatient = { 
                ...mockPatient, 
                data_dimissione: '2025-01-01',
                tipo_dimissione: 'trasferimento_interno',
                reparto_destinazione: 'Cardiologia',
                codice_dimissione: '6'
            };
            
            const { updateChain } = setupMocks({ data: mockPatient, error: null }, { data: [updatedPatient], error: null });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_interno',
                codice_dimissione: '6',
                reparto_destinazione: 'Cardiologia'
            };

            const result = await dischargePatientWithTransfer('patient-123', validData);
            
            expect(result).toEqual(updatedPatient);
            expect(updateChain.eq).toHaveBeenCalledWith('id', 'patient-123');
        });

        it('should successfully process external transfer', async () => {
            const updatedPatient = { 
                ...mockPatient, 
                data_dimissione: '2025-01-01',
                tipo_dimissione: 'trasferimento_esterno',
                clinica_destinazione: 'Clinica San Giuseppe',
                codice_clinica: '56',
                codice_dimissione: '6'
            };
            
            const { updateChain } = setupMocks({ data: mockPatient, error: null }, { data: [updatedPatient], error: null });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'trasferimento_esterno',
                codice_dimissione: '6',
                clinica_destinazione: 'Clinica San Giuseppe',
                codice_clinica: '56'
            };

            const result = await dischargePatientWithTransfer('patient-123', validData);
            
            expect(result).toEqual(updatedPatient);
            expect(updateChain.eq).toHaveBeenCalledWith('id', 'patient-123');
        });

        it('should handle database update errors', async () => {
            setupMocks({ data: mockPatient, error: null }, { data: null, error: { message: 'Update failed' } });

            const validData = {
                data_dimissione: '01/01/2025',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };

            await expect(dischargePatientWithTransfer('patient-123', validData))
                .rejects.toThrow('Errore durante l\'aggiornamento del paziente.');
        });
    });

    describe('dischargePatient (legacy)', () => {
        it('should call dischargePatientWithTransfer with basic data', async () => {
            const mockPatient = {
                id: 'patient-123',
                data_ricovero: '2024-12-01',
                data_dimissione: null
            };

            const updatedPatient = { 
                ...mockPatient, 
                data_dimissione: '2025-01-01',
                tipo_dimissione: 'dimissione',
                codice_dimissione: '3'
            };
            
            const updateChain = {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: [updatedPatient], error: null }),
            };

            const selectChain = {
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockPatient, error: null }),
            };

            const fromChain = {
                select: vi.fn().mockReturnValue(selectChain),
                update: vi.fn().mockReturnValue(updateChain),
            };

            supabase.from.mockReturnValue(fromChain);

            const result = await dischargePatient('patient-123', '01/01/2025');
            
            expect(result).toEqual(updatedPatient);
            expect(updateChain.eq).toHaveBeenCalledWith('id', 'patient-123');
        });
    });
});