/**
 * Test migrato per ActionButtons usando infrastruttura ottimizzata
 * Basato sull'implementazione reale del componente
 */

import { describe, it, expect } from 'vitest';
import { samplePatients } from '../../../__fixtures__/patients.js';

// Import del componente da testare
import { ActionButtons } from '../../../../src/shared/components/ui/ActionButtons.js';

describe('ActionButtons Component', () => {
  describe('Instantiation', () => {
    it('should be instantiated with patient data', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient);
      
      expect(buttons).toBeInstanceOf(ActionButtons);
      expect(buttons.patient).toBe(patient);
    });
    
    it('should be instantiated with default options', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient);
      
      expect(buttons.options.isMobile).toBe(false);
      expect(buttons.options.isTable).toBe(false);
    });
    
    it('should be instantiated with custom options', () => {
      const patient = samplePatients.basic;
      const options = { isMobile: true, isTable: true };
      const buttons = new ActionButtons(patient, options);
      
      expect(buttons.options.isMobile).toBe(true);
      expect(buttons.options.isTable).toBe(true);
    });
  });
  
  describe('Desktop Rendering', () => {
    it('should render desktop buttons for active patient', () => {
      const patient = samplePatients.basic; // Non ha data_dimissione
      const buttons = new ActionButtons(patient);
      const html = buttons.render();
      
      expect(html).toContain('btn-outline-primary');
      expect(html).toContain('btn-outline-warning');
      expect(html).toContain('btn-outline-danger');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="dimetti"');
      expect(html).toContain('data-action="delete"');
      expect(html).toContain('Modifica');
      expect(html).toContain('Dimetti');
      expect(html).toContain('Elimina');
    });
    
    it('should render desktop buttons for discharged patient', () => {
      const patient = samplePatients.discharged; // Ha data_dimissione
      const buttons = new ActionButtons(patient);
      const html = buttons.render();
      
      expect(html).toContain('btn-outline-primary');
      expect(html).toContain('btn-outline-success');
      expect(html).toContain('btn-outline-danger');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="riattiva"');
      expect(html).toContain('data-action="delete"');
      expect(html).toContain('Modifica');
      expect(html).toContain('Riattiva');
      expect(html).toContain('Elimina');
    });
  });
  
  describe('Table Rendering', () => {
    it('should render table buttons for active patient', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient, { isTable: true });
      const html = buttons.render();
      
      expect(html).toContain('btn-sm');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="dimetti"');
      expect(html).toContain('data-action="delete"');
      expect(html).toContain('material-icons');
      expect(html).toContain('edit');
      expect(html).toContain('event_available');
      expect(html).toContain('delete');
    });
    
    it('should render table buttons for discharged patient', () => {
      const patient = samplePatients.discharged;
      const buttons = new ActionButtons(patient, { isTable: true });
      const html = buttons.render();
      
      expect(html).toContain('btn-sm');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="riattiva"');
      expect(html).toContain('data-action="delete"');
      expect(html).toContain('material-icons');
      expect(html).toContain('undo');
    });
  });
  
  describe('Mobile Rendering', () => {
    it('should render mobile buttons for active patient', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient, { isMobile: true });
      const html = buttons.render();
      
      expect(html).toContain('mobile-compact');
      expect(html).toContain('mobile-text-xs');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="dimetti"');
      expect(html).toContain('data-action="delete"');
    });
    
    it('should render mobile buttons for discharged patient', () => {
      const patient = samplePatients.discharged;
      const buttons = new ActionButtons(patient, { isMobile: true });
      const html = buttons.render();
      
      expect(html).toContain('mobile-compact');
      expect(html).toContain('mobile-text-xs');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="riattiva"');
      expect(html).toContain('data-action="delete"');
    });
  });
  
  describe('Patient ID Integration', () => {
    it('should include patient ID in all buttons', () => {
      const patient = { ...samplePatients.basic, id: 'test-123' };
      const buttons = new ActionButtons(patient);
      const html = buttons.render();
      
      expect(html).toContain('data-id="test-123"');
      // Verifica che l'ID sia presente in tutti i pulsanti
      const idMatches = html.match(/data-id="test-123"/g);
      expect(idMatches).toHaveLength(3); // edit, dimetti/riattiva, delete
    });
  });
  
  describe('Specialized Rendering Methods', () => {
    it('should render table buttons correctly', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient);
      const html = buttons.renderTableButtons(false);
      
      expect(html).toContain('btn-sm');
      expect(html).toContain('btn-outline-warning'); // dimetti button for active patient
    });
    
    it('should render mobile buttons correctly', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient);
      const html = buttons.renderMobileButtons(false);
      
      expect(html).toContain('mobile-compact');
      expect(html).toContain('mobile-text-xs');
    });
    
    it('should render desktop buttons correctly', () => {
      const patient = samplePatients.basic;
      const buttons = new ActionButtons(patient);
      const html = buttons.renderDesktopButtons(false);
      
      expect(html).toContain('Modifica');
      expect(html).toContain('Dimetti');
      expect(html).toContain('Elimina');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle patient without ID', () => {
      const patient = { ...samplePatients.basic };
      delete patient.id;
      const buttons = new ActionButtons(patient);
      
      expect(() => buttons.render()).not.toThrow();
    });
    
    it('should handle patient with null discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: null };
      const buttons = new ActionButtons(patient);
      const html = buttons.render();
      
      expect(html).toContain('data-action="dimetti"');
      expect(html).not.toContain('data-action="riattiva"');
    });
    
    it('should handle patient with empty discharge date', () => {
      const patient = { ...samplePatients.basic, data_dimissione: '' };
      const buttons = new ActionButtons(patient);
      const html = buttons.render();
      
      expect(html).toContain('data-action="dimetti"');
      expect(html).not.toContain('data-action="riattiva"');
    });
  });
});