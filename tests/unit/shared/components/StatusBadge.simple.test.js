/**
 * Test semplificato per StatusBadge basato sulla struttura reale
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { samplePatients } from '../../../__fixtures__/patients.js';
import { StatusBadge } from '../../../../src/shared/components/ui/StatusBadge.js';

describe('StatusBadge Component', () => {
  describe('Instantiation', () => {
    it('should be instantiated with patient data', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      expect(badge).toBeInstanceOf(StatusBadge);
      expect(badge.patient).toBe(patient);
    });
  });
  
  describe('Rendering', () => {
    it('should render active status for admitted patient', () => {
      const patient = samplePatients.basic; // Non ha data_dimissione
      const badge = new StatusBadge(patient);
      
      const html = badge.render();
      
      expect(html).toContain('badge bg-success');
      expect(html).toContain('Attivo');
    });
    
    it('should render discharged status for discharged patient', () => {
      const patient = samplePatients.discharged; // Ha data_dimissione
      const badge = new StatusBadge(patient);
      
      const html = badge.render();
      
      expect(html).toContain('badge bg-secondary');
      expect(html).toContain('Dimesso');
    });
  });
  
  describe('Card Rendering', () => {
    it('should render for card with active patient', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      const html = badge.renderForCard();
      
      expect(html).toContain('patient-status attivo');
      expect(html).toContain('Attivo');
    });
    
    it('should render for card with discharged patient', () => {
      const patient = samplePatients.discharged;
      const badge = new StatusBadge(patient);
      
      const html = badge.renderForCard();
      
      expect(html).toContain('patient-status dimesso');
      expect(html).toContain('Dimesso');
    });
  });
  
  describe('Status Methods', () => {
    it('should get correct status class for active patient', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusClass()).toBe('attivo');
    });
    
    it('should get correct status class for discharged patient', () => {
      const patient = samplePatients.discharged;
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusClass()).toBe('dimesso');
    });
    
    it('should get correct status text for active patient', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusText()).toBe('Attivo');
    });
    
    it('should get correct status text for discharged patient', () => {
      const patient = samplePatients.discharged;
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusText()).toBe('Dimesso');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle patient without discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: null };
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusClass()).toBe('attivo');
      expect(badge.getStatusText()).toBe('Attivo');
    });
    
    it('should handle patient with empty discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: '' };
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusClass()).toBe('attivo');
      expect(badge.getStatusText()).toBe('Attivo');
    });
    
    it('should handle patient with discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: '2024-01-15' };
      const badge = new StatusBadge(patient);
      
      expect(badge.getStatusClass()).toBe('dimesso');
      expect(badge.getStatusText()).toBe('Dimesso');
    });
  });
});