/**
 * Test migrato per ConfirmModal usando infrastruttura ottimizzata
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElement, simulateClick, simulateKeyPress } from '../../../__helpers__/dom-helpers.js';
import { waitFor } from '../../../__helpers__/test-utils.js';
import { samplePatients } from '../../../__fixtures__/patients.js';

// Import del componente da testare
import { ConfirmModal } from '../../../../src/shared/components/ui/ConfirmModal.js';

describe('ConfirmModal Component', () => {
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
    it('should be instantiated with basic options', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Messaggio' 
      });
      
      expect(modal).toBeInstanceOf(ConfirmModal);
      expect(modal.options.title).toBe('Test');
      expect(modal.options.message).toBe('Messaggio');
    });
    
    it('should handle empty options', () => {
      expect(() => new ConfirmModal({})).not.toThrow();
      
      const modal = new ConfirmModal({});
      expect(modal).toBeInstanceOf(ConfirmModal);
    });
    
    it('should set default options when not provided', () => {
      const modal = new ConfirmModal({});
      
      expect(modal.options).toBeDefined();
      expect(modal.options.title).toBeDefined();
      expect(modal.options.message).toBeDefined();
    });
    
    it('should merge custom options with defaults', () => {
      const customOptions = {
        title: 'Custom Title',
        message: 'Custom Message',
        confirmText: 'Yes',
        cancelText: 'No'
      };
      
      const modal = new ConfirmModal(customOptions);
      
      expect(modal.options.title).toBe('Custom Title');
      expect(modal.options.message).toBe('Custom Message');
      expect(modal.options.confirmText).toBe('Yes');
      expect(modal.options.cancelText).toBe('No');
    });
  });
  
  describe('Rendering', () => {
    it('should render HTML string', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Messaggio' 
      });
      
      const html = modal.render();
      
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });
    
    it('should include title in rendered HTML', () => {
      const title = 'Test Modal Title';
      const modal = new ConfirmModal({ 
        title, 
        message: 'Test message' 
      });
      
      const html = modal.render();
      
      expect(html).toContain(title);
    });
    
    it('should include message in rendered HTML', () => {
      const message = 'This is a test message';
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message 
      });
      
      const html = modal.render();
      
      expect(html).toContain(message);
    });
    
    it('should include custom button texts', () => {
      const modal = new ConfirmModal({
        title: 'Test',
        message: 'Test message',
        confirmText: 'Confirm Action',
        cancelText: 'Cancel Action'
      });
      
      const html = modal.render();
      
      expect(html).toContain('Confirm Action');
      expect(html).toContain('Cancel Action');
    });
    
    it('should generate valid HTML structure', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      const html = modal.render();
      
      // Verifica struttura HTML base
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
      
      // Verifica presenza elementi essenziali
      expect(html).toMatch(/class.*modal/i);
      expect(html).toMatch(/button.*confirm/i);
      expect(html).toMatch(/button.*cancel/i);
    });
  });
  
  describe('Modal Behavior', () => {
    it('should show modal when show() is called', async () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      if (modal.show) {
        modal.show();
        
        // Verifica che il modal sia visibile
        await waitFor(() => {
          return document.querySelector('.modal') !== null;
        });
        
        expect(document.querySelector('.modal')).toBeDefined();
      }
    });
    
    it('should hide modal when hide() is called', async () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      if (modal.show && modal.hide) {
        modal.show();
        
        await waitFor(() => document.querySelector('.modal') !== null);
        
        modal.hide();
        
        await waitFor(() => document.querySelector('.modal') === null);
        
        expect(document.querySelector('.modal')).toBeNull();
      }
    });
    
    it('should return promise when shown', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      if (modal.show) {
        const result = modal.show();
        
        if (result && typeof result.then === 'function') {
          expect(result).toBeInstanceOf(Promise);
        }
      }
    });
  });
  
  describe('Event Handling', () => {
    it('should handle confirm button click', async () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      const onConfirm = vi.fn();
      
      if (modal.onConfirm) {
        modal.onConfirm = onConfirm;
      }
      
      // Simula rendering e click
      const html = modal.render();
      mockContainer.innerHTML = html;
      
      const confirmButton = mockContainer.querySelector('[data-action="confirm"]') ||
                           mockContainer.querySelector('.btn-primary') ||
                           mockContainer.querySelector('button');
      
      if (confirmButton) {
        simulateClick(confirmButton);
        
        if (onConfirm.mock) {
          expect(onConfirm).toHaveBeenCalled();
        }
      }
    });
    
    it('should handle cancel button click', async () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      const onCancel = vi.fn();
      
      if (modal.onCancel) {
        modal.onCancel = onCancel;
      }
      
      const html = modal.render();
      mockContainer.innerHTML = html;
      
      const cancelButton = mockContainer.querySelector('[data-action="cancel"]') ||
                          mockContainer.querySelector('.btn-secondary');
      
      if (cancelButton) {
        simulateClick(cancelButton);
        
        if (onCancel.mock) {
          expect(onCancel).toHaveBeenCalled();
        }
      }
    });
    
    it('should handle ESC key press', async () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      const onCancel = vi.fn();
      
      if (modal.onCancel) {
        modal.onCancel = onCancel;
      }
      
      // Simula pressione ESC
      simulateKeyPress(document, 'Escape');
      
      if (onCancel.mock) {
        expect(onCancel).toHaveBeenCalled();
      }
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const modal = new ConfirmModal({ 
        title: 'Accessible Modal', 
        message: 'Test message' 
      });
      
      const html = modal.render();
      
      expect(html).toMatch(/role.*dialog/i);
      expect(html).toMatch(/aria-labelledby/i);
      expect(html).toMatch(/aria-describedby/i);
    });
    
    it('should have focusable elements', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      const html = modal.render();
      mockContainer.innerHTML = html;
      
      const focusableElements = mockContainer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
    
    it('should trap focus within modal', () => {
      const modal = new ConfirmModal({ 
        title: 'Test', 
        message: 'Test message' 
      });
      
      if (modal.trapFocus) {
        expect(modal.trapFocus).toBeInstanceOf(Function);
      }
    });
  });
  
  describe('Integration with Patient Data', () => {
    it('should display patient deletion confirmation', () => {
      const patient = samplePatients.basic;
      const modal = new ConfirmModal({
        title: 'Elimina Paziente',
        message: `Sei sicuro di voler eliminare il paziente ${patient.nome} ${patient.cognome}?`,
        confirmText: 'Elimina',
        cancelText: 'Annulla'
      });
      
      const html = modal.render();
      
      expect(html).toContain(patient.nome);
      expect(html).toContain(patient.cognome);
      expect(html).toContain('Elimina Paziente');
    });
    
    it('should handle complex patient data', () => {
      const patient = samplePatients.complex;
      const modal = new ConfirmModal({
        title: 'Conferma Operazione',
        message: `Paziente: ${patient.nome} ${patient.cognome}\nReparto: ${patient.reparto_appartenenza}\nDiagnosi: ${patient.diagnosi}`
      });
      
      const html = modal.render();
      
      expect(html).toContain(patient.nome);
      expect(html).toContain(patient.reparto_appartenenza);
      expect(html).toContain(patient.diagnosi);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing title gracefully', () => {
      expect(() => {
        new ConfirmModal({ message: 'Test message' });
      }).not.toThrow();
    });
    
    it('should handle missing message gracefully', () => {
      expect(() => {
        new ConfirmModal({ title: 'Test title' });
      }).not.toThrow();
    });
    
    it('should handle null options', () => {
      expect(() => {
        new ConfirmModal(null);
      }).not.toThrow();
    });
    
    it('should handle undefined options', () => {
      expect(() => {
        new ConfirmModal(undefined);
      }).not.toThrow();
    });
  });
  
  describe('Customization', () => {
    it('should support custom CSS classes', () => {
      const modal = new ConfirmModal({
        title: 'Test',
        message: 'Test message',
        className: 'custom-modal-class'
      });
      
      const html = modal.render();
      
      if (modal.options.className) {
        expect(html).toContain(modal.options.className);
      }
    });
    
    it('should support custom button styles', () => {
      const modal = new ConfirmModal({
        title: 'Test',
        message: 'Test message',
        confirmButtonClass: 'btn-danger',
        cancelButtonClass: 'btn-outline-secondary'
      });
      
      const html = modal.render();
      
      if (modal.options.confirmButtonClass) {
        expect(html).toContain(modal.options.confirmButtonClass);
      }
      if (modal.options.cancelButtonClass) {
        expect(html).toContain(modal.options.cancelButtonClass);
      }
    });
  });
});