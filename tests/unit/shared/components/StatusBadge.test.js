/**
 * Test migrato per StatusBadge usando infrastruttura ottimizzata
 * Basato sulla struttura reale del componente che prende un patient come parametro
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { samplePatients } from '../../../__fixtures__/patients.js';

// Import del componente da testare
import { StatusBadge } from '../../../../src/shared/components/ui/StatusBadge.js';

describe('StatusBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Instantiation', () => {
    it('should be instantiated with patient data', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      expect(badge).toBeInstanceOf(StatusBadge);
      expect(badge.patient).toBe(patient);
    });
    
    it('should handle different patient types', () => {
      const patients = [
        samplePatients.basic,
        samplePatients.discharged,
        samplePatients.complex
      ];
      
      patients.forEach(patient => {
        const badge = new StatusBadge(patient);
        expect(badge).toBeInstanceOf(StatusBadge);
        expect(badge.patient).toBe(patient);
      });
    });
    
    it('should handle patient without discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: null };
      
      expect(() => new StatusBadge(patient)).not.toThrow();
      
      const badge = new StatusBadge(patient);
      expect(badge).toBeInstanceOf(StatusBadge);
    });
    
    it('should handle patient with discharge date', () => {
      const patient = samplePatients.discharged;
      
      const badge = new StatusBadge(patient);
      expect(badge.patient.data_dimissione).toBeDefined();
      expect(badge.getStatusClass()).toBe('dimesso');
    });
  });
  
  describe('Rendering', () => {
    it('should render HTML string for active patient', () => {
      const patient = samplePatients.basic; // Non ha data_dimissione
      const badge = new StatusBadge(patient);
      
      const html = badge.render();
      
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('badge bg-success');
      expect(html).toContain('Attivo');
    });
    
    it('should render HTML string for discharged patient', () => {
      const patient = samplePatients.discharged; // Ha data_dimissione
      const badge = new StatusBadge(patient);
      
      const html = badge.render();
      
      expect(html).toContain('badge bg-secondary');
      expect(html).toContain('Dimesso');
    });
    
    it('should render for card with correct classes', () => {
      const activePatient = samplePatients.basic;
      const dischargedPatient = samplePatients.discharged;
      
      const activeBadge = new StatusBadge(activePatient);
      const dischargedBadge = new StatusBadge(dischargedPatient);
      
      const activeHtml = activeBadge.renderForCard();
      const dischargedHtml = dischargedBadge.renderForCard();
      
      expect(activeHtml).toContain('patient-status attivo');
      expect(dischargedHtml).toContain('patient-status dimesso');
    });
    
    it('should generate valid HTML structure', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge(patient);
      
      const html = badge.render();
      
      // Verifica struttura HTML base
      expect(html).toContain('<span');
      expect(html).toContain('</span>');
      expect(html).toContain('class="badge');
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
    
    it('should get correct status text', () => {
      const activePatient = samplePatients.basic;
      const dischargedPatient = samplePatients.discharged;
      
      const activeBadge = new StatusBadge(activePatient);
      const dischargedBadge = new StatusBadge(dischargedPatient);
      
      expect(activeBadge.getStatusText()).toBe('Attivo');
      expect(dischargedBadge.getStatusText()).toBe('Dimesso');
    });
  });
  
  describe('Integration with Patient Data', () => {
    it('should correctly determine status from patient data', () => {
      const activePatient = samplePatients.basic;
      const dischargedPatient = samplePatients.discharged;
      
      const activeBadge = new StatusBadge(activePatient);
      const dischargedBadge = new StatusBadge(dischargedPatient);
      
      expect(activeBadge.getStatusClass()).toBe('attivo');
      expect(dischargedBadge.getStatusClass()).toBe('dimesso');
    });
    
    it('should handle complex patient data', () => {
      const patient = samplePatients.complex;
      const badge = new StatusBadge(patient);
      
      // Il paziente complex non ha data_dimissione, quindi dovrebbe essere attivo
      expect(badge.getStatusClass()).toBe('attivo');
      expect(badge.getStatusText()).toBe('Attivo');
    });
    
    it('should work with different patient scenarios', () => {
      const scenarios = [
        { patient: samplePatients.basic, expectedClass: 'attivo', expectedText: 'Attivo' },
        { patient: samplePatients.discharged, expectedClass: 'dimesso', expectedText: 'Dimesso' },
        { patient: samplePatients.pediatric, expectedClass: 'attivo', expectedText: 'Attivo' }
      ];
      
      scenarios.forEach(({ patient, expectedClass, expectedText }) => {
        const badge = new StatusBadge(patient);
        expect(badge.getStatusClass()).toBe(expectedClass);
        expect(badge.getStatusText()).toBe(expectedText);
      });
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle patient with null discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: null };
      
      expect(() => new StatusBadge(patient)).not.toThrow();
      
      const badge = new StatusBadge(patient);
      expect(badge.getStatusClass()).toBe('attivo');
    });
    
    it('should handle patient with empty discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: '' };
      
      const badge = new StatusBadge(patient);
      expect(badge.getStatusClass()).toBe('attivo');
    });
    
    it('should handle patient with undefined discharge date', () => {
      const patient = { ...samplePatients.basic };
      delete patient.data_dimissione;
      
      const badge = new StatusBadge(patient);
      expect(badge.getStatusClass()).toBe('attivo');
    });
    
    it('should handle minimal patient data', () => {
      const minimalPatient = { id: 1, nome: 'Test', cognome: 'Patient' };
      
      expect(() => new StatusBadge(minimalPatient)).not.toThrow();
      
      const badge = new StatusBadge(minimalPatient);
      expect(badge.getStatusClass()).toBe('attivo');
    });
  });
  
  describe('Performance', () => {
    it('should render quickly with many badges', () => {
      const startTime = performance.now();
      
      // Crea molti badge con dati realistici
      for (let i = 0; i < 100; i++) {
        const patient = { ...samplePatients.basic, id: i };
        const badge = new StatusBadge(patient);
        badge.render();
        badge.renderForCard();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Dovrebbe completare in meno di 100ms
      expect(duration).toBeLessThan(100);
    });
    
    it('should handle different patient types efficiently', () => {
      const patients = [
        samplePatients.basic,
        samplePatients.discharged,
        samplePatients.complex,
        samplePatients.pediatric,
        samplePatients.elderly
      ];
      
      const startTime = performance.now();
      
      // Testa con diversi tipi di pazienti
      for (let i = 0; i < 50; i++) {
        const patient = patients[i % patients.length];
        const badge = new StatusBadge(patient);
        badge.render();
        badge.getStatusClass();
        badge.getStatusText();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Dovrebbe essere veloce anche con dati diversi
      expect(duration).toBeLessThan(50);
    });
  });
});