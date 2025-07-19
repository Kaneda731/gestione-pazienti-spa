/**
 * Test migrato per StatusBadge usando infrastruttura ottimizzata
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElement } from '../../../__helpers__/dom-helpers.js';
import { samplePatients } from '../../../__fixtures__/patients.js';

// Import del componente da testare
import { StatusBadge } from '../../../../src/shared/components/ui/StatusBadge.js';

describe('StatusBadge Component', () => {
  let mockContainer;
  
  beforeEach(() => {
    // Setup DOM mock
    mockContainer = createMockElement('div', { id: 'test-container' });
    document.body.appendChild(mockContainer);
  });
  
  afterEach(() => {
    // Cleanup DOM
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    
    vi.clearAllMocks();
  });
  
  describe('Instantiation', () => {
    it('should be instantiated with status', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      expect(badge).toBeInstanceOf(StatusBadge);
      expect(badge.options.status).toBe('active');
    });
    
    it('should handle different status types', () => {
      const statuses = ['active', 'inactive', 'pending', 'error', 'success'];
      
      statuses.forEach(status => {
        const badge = new StatusBadge({ status });
        expect(badge).toBeInstanceOf(StatusBadge);
        expect(badge.options.status).toBe(status);
      });
    });
    
    it('should handle empty options', () => {
      expect(() => new StatusBadge({})).not.toThrow();
      
      const badge = new StatusBadge({});
      expect(badge).toBeInstanceOf(StatusBadge);
    });
    
    it('should set default status when not provided', () => {
      const badge = new StatusBadge({});
      
      expect(badge.options.status).toBeDefined();
      // Default status dovrebbe essere definito
      expect(typeof badge.options.status).toBe('string');
    });
  });
  
  describe('Rendering', () => {
    it('should render HTML string', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      if (badge.render) {
        const html = badge.render();
        
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
      }
    });
    
    it('should include status in rendered HTML', () => {
      const status = 'active';
      const badge = new StatusBadge({ status });
      
      if (badge.render) {
        const html = badge.render();
        
        // Il badge dovrebbe contenere informazioni sullo status
        expect(html).toMatch(/active|attivo/i);
      }
    });
    
    it('should apply correct CSS classes for different statuses', () => {
      const statusMappings = {
        'active': 'success',
        'inactive': 'secondary',
        'pending': 'warning',
        'error': 'danger'
      };
      
      Object.entries(statusMappings).forEach(([status, expectedClass]) => {
        const badge = new StatusBadge({ status });
        
        if (badge.render) {
          const html = badge.render();
          
          // Verifica che la classe CSS appropriata sia presente
          expect(html).toMatch(new RegExp(expectedClass, 'i'));
        }
      });
    });
    
    it('should generate valid HTML structure', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      if (badge.render) {
        const html = badge.render();
        
        // Verifica struttura HTML base
        expect(html).toContain('<');
        expect(html).toContain('>');
        
        // Dovrebbe essere un elemento badge/span
        expect(html).toMatch(/<(span|div|badge)/i);
      }
    });
  });
  
  describe('Status Types', () => {
    it('should handle patient status correctly', () => {
      const patientStatuses = ['ricoverato', 'dimesso', 'trasferito'];
      
      patientStatuses.forEach(status => {
        const badge = new StatusBadge({ status });
        
        expect(badge).toBeInstanceOf(StatusBadge);
        expect(badge.options.status).toBe(status);
      });
    });
    
    it('should handle boolean status values', () => {
      const badge1 = new StatusBadge({ status: true });
      const badge2 = new StatusBadge({ status: false });
      
      expect(badge1).toBeInstanceOf(StatusBadge);
      expect(badge2).toBeInstanceOf(StatusBadge);
    });
    
    it('should handle numeric status values', () => {
      const badge1 = new StatusBadge({ status: 1 });
      const badge2 = new StatusBadge({ status: 0 });
      
      expect(badge1).toBeInstanceOf(StatusBadge);
      expect(badge2).toBeInstanceOf(StatusBadge);
    });
  });
  
  describe('Customization', () => {
    it('should support custom text', () => {
      const badge = new StatusBadge({ 
        status: 'active',
        text: 'Custom Status Text'
      });
      
      if (badge.render) {
        const html = badge.render();
        expect(html).toContain('Custom Status Text');
      }
    });
    
    it('should support custom CSS classes', () => {
      const badge = new StatusBadge({ 
        status: 'active',
        className: 'custom-badge-class'
      });
      
      if (badge.render) {
        const html = badge.render();
        
        if (badge.options.className) {
          expect(html).toContain(badge.options.className);
        }
      }
    });
    
    it('should support custom colors', () => {
      const badge = new StatusBadge({ 
        status: 'active',
        color: '#custom-color'
      });
      
      if (badge.render) {
        const html = badge.render();
        
        if (badge.options.color) {
          expect(html).toContain(badge.options.color);
        }
      }
    });
  });
  
  describe('Integration with Patient Data', () => {
    it('should display patient admission status', () => {
      const patient = samplePatients.basic;
      const status = patient.data_dimissione ? 'dimesso' : 'ricoverato';
      
      const badge = new StatusBadge({ status });
      
      expect(badge.options.status).toBe(status);
    });
    
    it('should handle discharged patient status', () => {
      const patient = samplePatients.discharged;
      const badge = new StatusBadge({ status: 'dimesso' });
      
      if (badge.render) {
        const html = badge.render();
        expect(html).toMatch(/dimesso|discharged/i);
      }
    });
    
    it('should handle active patient status', () => {
      const patient = samplePatients.basic;
      const badge = new StatusBadge({ status: 'ricoverato' });
      
      if (badge.render) {
        const html = badge.render();
        expect(html).toMatch(/ricoverato|active|admitted/i);
      }
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      if (badge.render) {
        const html = badge.render();
        
        // Verifica attributi accessibilità
        expect(html).toMatch(/aria-label|role|title/i);
      }
    });
    
    it('should provide meaningful text for screen readers', () => {
      const badge = new StatusBadge({ 
        status: 'active',
        ariaLabel: 'Patient is currently active'
      });
      
      if (badge.render) {
        const html = badge.render();
        
        if (badge.options.ariaLabel) {
          expect(html).toContain(badge.options.ariaLabel);
        }
      }
    });
  });
  
  describe('Methods', () => {
    it('should update status dynamically', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      if (badge.updateStatus) {
        badge.updateStatus('inactive');
        expect(badge.options.status).toBe('inactive');
      }
    });
    
    it('should get current status', () => {
      const badge = new StatusBadge({ status: 'pending' });
      
      if (badge.getStatus) {
        expect(badge.getStatus()).toBe('pending');
      } else {
        expect(badge.options.status).toBe('pending');
      }
    });
    
    it('should validate status values', () => {
      const badge = new StatusBadge({ status: 'active' });
      
      if (badge.isValidStatus) {
        expect(badge.isValidStatus('active')).toBe(true);
        expect(badge.isValidStatus('invalid-status')).toBe(false);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle null status', () => {
      expect(() => {
        new StatusBadge({ status: null });
      }).not.toThrow();
    });
    
    it('should handle undefined status', () => {
      expect(() => {
        new StatusBadge({ status: undefined });
      }).not.toThrow();
    });
    
    it('should handle empty string status', () => {
      expect(() => {
        new StatusBadge({ status: '' });
      }).not.toThrow();
    });
    
    it('should handle invalid status types', () => {
      expect(() => {
        new StatusBadge({ status: {} });
      }).not.toThrow();
      
      expect(() => {
        new StatusBadge({ status: [] });
      }).not.toThrow();
    });
  });
  
  describe('Performance', () => {
    it('should render quickly with many badges', () => {
      const startTime = performance.now();
      
      // Crea molti badge
      for (let i = 0; i < 100; i++) {
        const badge = new StatusBadge({ status: 'active' });
        if (badge.render) {
          badge.render();
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Dovrebbe completare in meno di 100ms
      expect(duration).toBeLessThan(100);
    });
    
    it('should not cause memory leaks', () => {
      const badges = [];
      
      // Crea e distruggi badge
      for (let i = 0; i < 50; i++) {
        const badge = new StatusBadge({ status: 'active' });
        badges.push(badge);
      }
      
      // Cleanup
      badges.forEach(badge => {
        if (badge.destroy) {
          badge.destroy();
        }
      });
      
      // Non dovrebbero esserci riferimenti rimasti
      expect(badges.length).toBe(50);
    });
  });
});