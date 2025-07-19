/**
 * Test migrato per stateService usando infrastruttura ottimizzata
 * Basato sull'implementazione reale del servizio
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import del servizio da testare
import { stateService } from '../../../src/core/services/stateService.js';

describe('StateService', () => {
  beforeEach(() => {
    // Reset state before each test
    stateService.clearEditPatient();
    stateService.resetFilters();
    stateService.clearFormData();
    
    // Clear localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    // Cleanup after each test
    stateService.clearEditPatient();
    stateService.resetFilters();
    stateService.clearFormData();
    localStorage.clear();
  });
  
  describe('Service Definition', () => {
    it('should have all required methods defined', () => {
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
    
    it('should have methods as functions', () => {
      expect(typeof stateService.setEditPatient).toBe('function');
      expect(typeof stateService.getEditPatientId).toBe('function');
      expect(typeof stateService.clearEditPatient).toBe('function');
      expect(typeof stateService.updateFilters).toBe('function');
      expect(typeof stateService.getFilters).toBe('function');
      expect(typeof stateService.resetFilters).toBe('function');
    });
    
    it('should have core state management methods', () => {
      expect(typeof stateService.getState).toBe('function');
      expect(typeof stateService.setState).toBe('function');
      expect(typeof stateService.subscribe).toBe('function');
    });
  });
  
  describe('Edit Patient State', () => {
    it('should set and get edit patient ID', () => {
      stateService.setEditPatient('test-id');
      
      expect(stateService.getEditPatientId()).toBe('test-id');
    });
    
    it('should clear edit patient ID', () => {
      stateService.setEditPatient('test-id');
      stateService.clearEditPatient();
      
      expect(stateService.getEditPatientId()).toBeNull();
    });
    
    it('should handle null patient ID', () => {
      stateService.setEditPatient(null);
      
      expect(stateService.getEditPatientId()).toBeNull();
    });
    
    it('should handle undefined patient ID', () => {
      stateService.setEditPatient(undefined);
      
      expect(stateService.getEditPatientId()).toBeUndefined();
    });
  });
  
  describe('Filters State', () => {
    it('should update and get filters', () => {
      stateService.updateFilters({ search: 'abc' });
      
      expect(stateService.getFilters().search).toBe('abc');
    });
    
    it('should reset filters to default values', () => {
      stateService.updateFilters({ search: 'abc', reparto: 'cardio' });
      stateService.resetFilters();
      
      const filters = stateService.getFilters();
      expect(filters.search).toBe('');
      expect(filters.reparto).toBe('');
      expect(filters.diagnosi).toBe('');
      expect(filters.stato).toBe('');
      expect(filters.infetto).toBe('');
      expect(filters.page).toBe(0);
      expect(filters.sortColumn).toBe('data_ricovero');
      expect(filters.sortDirection).toBe('desc');
    });
    
    it('should merge filter updates', () => {
      stateService.updateFilters({ search: 'abc' });
      stateService.updateFilters({ reparto: 'cardio' });
      
      const filters = stateService.getFilters();
      expect(filters.search).toBe('abc');
      expect(filters.reparto).toBe('cardio');
    });
    
    it('should handle empty filter updates', () => {
      stateService.updateFilters({});
      
      const filters = stateService.getFilters();
      expect(filters).toBeDefined();
      expect(filters).toHaveProperty('search');
    });
  });
  
  describe('Form Data State', () => {
    it('should set and get form data', () => {
      const formData = { name: 'Test', email: 'test@example.com' };
      stateService.setFormData(formData);
      
      expect(stateService.getFormData()).toEqual(formData);
    });
    
    it('should clear form data to empty object', () => {
      stateService.setFormData({ name: 'Test' });
      stateService.clearFormData();
      
      expect(stateService.getFormData()).toEqual({});
    });
    
    it('should handle null form data', () => {
      stateService.setFormData(null);
      
      expect(stateService.getFormData()).toBeNull();
    });
  });
  
  describe('Loading State', () => {
    it('should set loading state', () => {
      stateService.setLoading(true, 'Loading...');
      
      expect(stateService.getState('isLoading')).toBe(true);
      expect(stateService.getState('loadingMessage')).toBe('Loading...');
    });
    
    it('should clear loading state', () => {
      stateService.setLoading(true, 'Loading...');
      stateService.setLoading(false);
      
      expect(stateService.getState('isLoading')).toBe(false);
      expect(stateService.getState('loadingMessage')).toBe('');
    });
  });
  
  describe('Notifications', () => {
    beforeEach(() => {
      // Clear notifications before each test
      stateService.setState('notifications', []);
    });
    
    it('should add notification', () => {
      const id = stateService.addNotification('success', 'Test message');
      
      expect(typeof id).toBe('number');
      
      const notifications = stateService.getState('notifications');
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        id,
        type: 'success',
        message: 'Test message'
      });
    });
    
    it('should remove notification', () => {
      const id = stateService.addNotification('success', 'Test message');
      stateService.removeNotification(id);
      
      const notifications = stateService.getState('notifications');
      expect(notifications).toHaveLength(0);
    });
    
    it('should auto-remove notification after duration', (done) => {
      const id = stateService.addNotification('success', 'Test message', 100);
      
      setTimeout(() => {
        const notifications = stateService.getState('notifications');
        expect(notifications).toHaveLength(0);
        done();
      }, 150);
    });
  });
  
  describe('State Persistence', () => {
    it('should persist edit patient ID to localStorage', () => {
      stateService.setEditPatient('test-id');
      
      const stored = localStorage.getItem('app_state_editPazienteId');
      expect(JSON.parse(stored)).toBe('test-id');
    });
    
    it('should persist filters to localStorage', () => {
      stateService.updateFilters({ search: 'test' });
      
      const stored = localStorage.getItem('app_state_listFilters');
      const parsedFilters = JSON.parse(stored);
      expect(parsedFilters.search).toBe('test');
    });
  });
  
  describe('State Subscription', () => {
    it('should notify subscribers on state changes', () => {
      const callback = vi.fn();
      const unsubscribe = stateService.subscribe('editPazienteId', callback);
      
      stateService.setEditPatient('test-id');
      
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
    });
    
    it('should not notify unsubscribed callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = stateService.subscribe('editPazienteId', callback);
      
      unsubscribe();
      stateService.setEditPatient('test-id');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
});