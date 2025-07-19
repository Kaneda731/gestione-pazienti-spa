  it('searchPatients restituisce array di pazienti', async () => {
    const results = await patientService.searchPatients('Mario');
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toHaveProperty('id');
  });

  it('exportPatients non lancia errori e chiama downloadCSV', async () => {
    const spy = vi.spyOn(patientService, 'downloadCSV').mockImplementation(() => {});
    await expect(patientService.exportPatients({ reparto: 'Medicina' })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
import { describe, it, expect, vi } from 'vitest';
import { patientService } from '../src/features/patients/services/patientService.js';

vi.mock('../src/core/services/supabaseClient.js', () => {
  // Helper per catena select().eq().single()
  const selectChain = {
    eq: vi.fn(() => selectChain),
    single: vi.fn(() => ({ data: { id: 1 }, error: null })),
    not: vi.fn(() => selectChain),
    is: vi.fn(() => selectChain),
    order: vi.fn(() => selectChain),
    range: vi.fn(() => selectChain),
    or: vi.fn(() => selectChain),
    select: vi.fn(() => selectChain),
    from: vi.fn(() => selectChain),
    data: [{ id: 1 }],
    error: null
  };
  // Helper per update().eq().select().single()
  const updateChain = {
    eq: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    single: vi.fn(() => ({ data: { id: 1 }, error: null })),
    data: { id: 1 },
    error: null
  };
  // Helper per delete().eq()
  const deleteChain = {
    eq: vi.fn(() => ({ data: { id: 1 }, error: null })),
    data: { id: 1 },
    error: null
  };
  // Helper per insert().select().single()
  const insertChain = {
    select: vi.fn(() => ({
      single: vi.fn(() => ({ data: { id: 2 }, error: null }))
    }))
  };
  return {
    supabase: {
      from: vi.fn((table) => ({
        select: vi.fn(() => selectChain),
        insert: vi.fn(() => insertChain),
        update: vi.fn(() => updateChain),
        delete: vi.fn(() => deleteChain),
        eq: vi.fn(() => selectChain),
        not: vi.fn(() => selectChain),
        is: vi.fn(() => selectChain),
        order: vi.fn(() => selectChain),
        range: vi.fn(() => selectChain),
        or: vi.fn(() => selectChain)
      })),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } } })),
      }
    }
  };
});

describe('patientService', () => {
  it('ha metodi principali definiti', () => {
    expect(patientService).toHaveProperty('createPatient');
    expect(patientService).toHaveProperty('getPatientById');
    expect(patientService).toHaveProperty('updatePatient');
    expect(patientService).toHaveProperty('deletePatient');
    expect(patientService).toHaveProperty('getPatientStats');
  });

  it('createPatient restituisce dati', async () => {
    const paziente = {
      nome: 'Mario',
      cognome: 'Rossi',
      data_nascita: '2000-01-01',
      data_ricovero: '2023-01-01',
      diagnosi: 'Test',
      reparto_appartenenza: 'Medicina'
    };
    const data = await patientService.createPatient(paziente);
    expect(data).toBeDefined();
  });

  it('createPatient lancia errore se mancano dati obbligatori', async () => {
    await expect(patientService.createPatient({ nome: 'Mario' })).rejects.toThrow('obbligatorio');
  });

  it('updatePatient restituisce dati aggiornati', async () => {
    const updated = await patientService.updatePatient(1, {
      nome: 'Luigi',
      cognome: 'Verdi',
      data_nascita: '1995-05-05',
      data_ricovero: '2023-01-01',
      diagnosi: 'Test',
      reparto_appartenenza: 'Medicina'
    });
    expect(updated).toBeDefined();
    expect(updated.id).toBe(1);
  });

  it('deletePatient non lancia errori', async () => {
    await expect(patientService.deletePatient(1)).resolves.toBeUndefined();
  });

  it('getPatientById restituisce dati', async () => {
    const paziente = await patientService.getPatientById(1);
    expect(paziente).toBeDefined();
    expect(paziente.id).toBe(1);
  });

  it('getPatientStats restituisce oggetto statistiche', async () => {
    const stats = await patientService.getPatientStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('discharged');
    expect(stats).toHaveProperty('byDiagnosis');
    expect(stats).toHaveProperty('byDepartment');
  });

  it('dischargePatient chiama updatePatient senza errori', async () => {
    // Mock updatePatient per intercettare la chiamata
    const spy = vi.spyOn(patientService, 'updatePatient').mockResolvedValue({});
    await expect(patientService.dischargePatient(1, '2024-01-01')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(1, { data_dimissione: '2024-01-01' });
    spy.mockRestore();
  });

  it('reactivatePatient chiama updatePatient senza errori', async () => {
    const spy = vi.spyOn(patientService, 'updatePatient').mockResolvedValue({});
    await expect(patientService.reactivatePatient(1)).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(1, { data_dimissione: null });
    spy.mockRestore();
  });
});
