import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/patients/services/patientService.js', () => {
  return {
    patientService: {
      searchPatients: vi.fn(),
    },
  };
});

import { patientService } from '@/features/patients/services/patientService.js';
import { patientSearchService } from '@/shared/services/patientSearchService.js';

const fakeList = [
  { id: 1, nome: 'Mario', cognome: 'Rossi', codice_rad: 'RAD123' },
  { id: 2, nome: 'Luca', cognome: 'Bianchi', codice_rad: 'RAD456' },
];

describe('patientSearchService.search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes and caches results', async () => {
    patientService.searchPatients.mockResolvedValueOnce(fakeList);

    const res1 = await patientSearchService.search('ros', { activeOnly: true });
    expect(res1).toHaveLength(2);
    expect(res1[0]).toMatchObject({ id: 1, nome: 'Mario', cognome: 'Rossi', codice_rad: 'RAD123', nomeCompleto: 'Rossi Mario' });
    expect(patientService.searchPatients).toHaveBeenCalledTimes(1);
    expect(patientService.searchPatients).toHaveBeenCalledWith('ros', true);

    // Second call should hit cache
    const res2 = await patientSearchService.search('ros', { activeOnly: true });
    expect(res2).toEqual(res1);
    expect(patientService.searchPatients).toHaveBeenCalledTimes(1);
  });

  it('respects activeOnly flag', async () => {
    patientService.searchPatients.mockResolvedValueOnce([fakeList[0]]);
    await patientSearchService.search('mario', { activeOnly: false });
    expect(patientService.searchPatients).toHaveBeenCalledWith('mario', false);
  });
});
