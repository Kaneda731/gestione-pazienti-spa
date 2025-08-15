// __tests__/unit/features/eventi-clinici/utils/utils-barrel.test.js
import { describe, it, expect } from 'vitest';
import * as utils from '../../../../../src/features/eventi-clinici/views/utils/index.js';

/**
 * Smoke test per il barrel delle utility degli Eventi Clinici.
 * Verifica che le funzioni chiave siano esportate e siano funzioni.
 */
describe('Eventi Clinici utils barrel', () => {
  it('should export expected functions', () => {
    const expected = [
      'debounce',
      'rafDebounce',
      'convertDateToISO',
      'hideAllSearchResults',
      'hideSearchResults',
      'getFormData',
      'validateFormData',
    ];

    for (const name of expected) {
      expect(typeof utils[name]).toBe('function');
    }
  });
});
