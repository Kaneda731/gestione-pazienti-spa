import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/dom';

vi.mock('@/shared/services/patientSearchService.js', () => {
  return {
    patientSearchService: {
      search: vi.fn(),
    },
  };
});

import { patientSearchService } from '@/shared/services/patientSearchService.js';
import { attach } from '@/shared/components/ui/PatientAutocomplete.js';

function setupDom() {
  document.body.innerHTML = `
    <input id="auto" />
    <div id="results" role="listbox"></div>
  `;
  return {
    input: document.getElementById('auto'),
    results: document.getElementById('results'),
  };
}

describe('PatientAutocomplete UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('shows RAD in results and sets input + dataset on select', async () => {
    const { input, results } = setupDom();

    patientSearchService.search.mockResolvedValueOnce([
      { id: 10, nome: 'Mario', cognome: 'Rossi', codice_rad: 'RAD999' },
    ]);

    attach({ input, resultsContainer: results, onSelect: vi.fn(), activeOnly: true, minChars: 1, debounceMs: 0 });

    input.value = 'ro';
    fireEvent.input(input);

    // Wait micro + macro tasks to flush async search
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const btn = results.querySelector('.dropdown-item');
    expect(btn).toBeTruthy();
    expect(results.innerHTML).toContain('RAD:');

    // Click result and assert input + dataset
    btn.click();
    expect(input.value).toBe('Rossi Mario');
    expect(input.dataset.patientId).toBe('10');
  });
});
