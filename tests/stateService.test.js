import { describe, it, expect } from 'vitest';
import { stateService } from '../src/core/services/stateService.js';

describe('stateService', () => {
  it('ha metodi principali definiti', () => {
    expect(stateService).toHaveProperty('setEditPatient');
    expect(stateService).toHaveProperty('getEditPatientId');
    expect(stateService).toHaveProperty('clearEditPatient');
    expect(stateService).toHaveProperty('updateFilters');
    expect(stateService).toHaveProperty('getFilters');
    expect(stateService).toHaveProperty('resetFilters');
    expect(stateService).toHaveProperty('setFormData');
    expect(stateService).toHaveProperty('getFormData');
    expect(stateService).toHaveProperty('clearFormData');
    expect(stateService).toHaveProperty('setLoading');
    expect(stateService).toHaveProperty('addNotification');
    expect(stateService).toHaveProperty('removeNotification');
  });

  it('setEditPatient e getEditPatientId funzionano', () => {
    stateService.setEditPatient('test-id');
    expect(stateService.getEditPatientId()).toBe('test-id');
    stateService.clearEditPatient();
    expect(stateService.getEditPatientId()).toBeNull();
  });

  it('updateFilters e getFilters funzionano', () => {
    stateService.updateFilters({ search: 'abc' });
    expect(stateService.getFilters().search).toBe('abc');
    stateService.resetFilters();
    expect(stateService.getFilters().search).toBe('');
  });
});
