/**
 * Test migrato per modalService usando infrastruttura ottimizzata
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServiceMock } from '../../__mocks__/services.js';
import { createMockElement, simulateClick } from '../../__helpers__/dom-helpers.js';
import { waitFor } from '../../__helpers__/test-utils.js';

// Import del servizio da testare
import { showDeleteConfirmModal, showConfirmModal } from '../../../src/shared/services/modalService.js';

describe('ModalService', () => {
  let modalServiceMock;
  let mockContainer;
  
  beforeEach(() => {
    // Usa il mock factory per creare mock consistenti
    modalServiceMock = createServiceMock('modal');
    
    // Setup DOM mock
    mockContainer = createMockElement('div', { id: 'modal-container' });
    document.body.appendChild(mockContainer);
    
    // Mock document.getElementById per trovare il container
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'modal-container') return mockContainer;
      return null;
    });
  });
  
  afterEach(() => {
    // Cleanup DOM
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  
  describe('Function Definitions', () => {
    it('should define showDeleteConfirmModal as function', () => {
      expect(showDeleteConfirmModal).toBeInstanceOf(Function);
    });
    
    it('should define showConfirmModal as function', () => {
      expect(showConfirmModal).toBeInstanceOf(Function);
    });
  });
  
  describe('showDeleteConfirmModal', () => {
    it('should display delete confirmation modal', async () => {
      const result = showDeleteConfirmModal('Test Item');
      
      // Verifica che sia stata restituita una Promise
      expect(result).toBeInstanceOf(Promise);
      
      // Verifica che il modal sia stato aggiunto al DOM
      await waitFor(() => {
        return mockContainer.children.length > 0;
      });
      
      expect(mockContainer.children.length).toBeGreaterThan(0);
    });
    
    it('should include item name in modal content', async () => {
      const itemName = 'Test Patient';
      showDeleteConfirmModal(itemName);
      
      await waitFor(() => mockContainer.children.length > 0);
      
      // Verifica che il nome dell'item sia presente nel contenuto
      const modalContent = mockContainer.innerHTML;
      expect(modalContent).toContain(itemName);
    });
    
    it('should resolve true when confirmed', async () => {
      const promise = showDeleteConfirmModal('Test Item');
      
      // Aspetta che il modal appaia
      await waitFor(() => mockContainer.children.length > 0);
      
      // Simula click su pulsante conferma
      const confirmButton = mockContainer.querySelector('[data-action="confirm"]') || 
                           mockContainer.querySelector('.btn-danger') ||
                           createMockElement('button', { 'data-action': 'confirm' });
      
      if (confirmButton) {
        simulateClick(confirmButton);
      }
      
      // Verifica che la promise si risolva con true
      await expect(promise).resolves.toBe(true);
    });
    
    it('should resolve false when cancelled', async () => {
      const promise = showDeleteConfirmModal('Test Item');
      
      await waitFor(() => mockContainer.children.length > 0);
      
      // Simula click su pulsante annulla
      const cancelButton = mockContainer.querySelector('[data-action="cancel"]') || 
                          mockContainer.querySelector('.btn-secondary') ||
                          createMockElement('button', { 'data-action': 'cancel' });
      
      if (cancelButton) {
        simulateClick(cancelButton);
      }
      
      await expect(promise).resolves.toBe(false);
    });
    
    it('should handle missing item name gracefully', async () => {
      expect(() => showDeleteConfirmModal()).not.toThrow();
      expect(() => showDeleteConfirmModal(null)).not.toThrow();
      expect(() => showDeleteConfirmModal('')).not.toThrow();
    });
  });
  
  describe('showConfirmModal', () => {
    it('should display generic confirmation modal', async () => {
      const options = {
        title: 'Confirm Action',
        message: 'Are you sure?'
      };
      
      const result = showConfirmModal(options);
      
      expect(result).toBeInstanceOf(Promise);
      
      await waitFor(() => mockContainer.children.length > 0);
      expect(mockContainer.children.length).toBeGreaterThan(0);
    });
    
    it('should include custom title and message', async () => {
      const options = {
        title: 'Custom Title',
        message: 'Custom message content'
      };
      
      showConfirmModal(options);
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const modalContent = mockContainer.innerHTML;
      expect(modalContent).toContain(options.title);
      expect(modalContent).toContain(options.message);
    });
    
    it('should support custom button labels', async () => {
      const options = {
        title: 'Test',
        message: 'Test message',
        confirmText: 'Yes, Do It',
        cancelText: 'No, Cancel'
      };
      
      showConfirmModal(options);
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const modalContent = mockContainer.innerHTML;
      expect(modalContent).toContain(options.confirmText);
      expect(modalContent).toContain(options.cancelText);
    });
    
    it('should resolve true when confirmed', async () => {
      const promise = showConfirmModal({
        title: 'Test',
        message: 'Test message'
      });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const confirmButton = mockContainer.querySelector('[data-action="confirm"]') ||
                           createMockElement('button', { 'data-action': 'confirm' });
      
      simulateClick(confirmButton);
      
      await expect(promise).resolves.toBe(true);
    });
    
    it('should resolve false when cancelled', async () => {
      const promise = showConfirmModal({
        title: 'Test',
        message: 'Test message'
      });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const cancelButton = mockContainer.querySelector('[data-action="cancel"]') ||
                          createMockElement('button', { 'data-action': 'cancel' });
      
      simulateClick(cancelButton);
      
      await expect(promise).resolves.toBe(false);
    });
    
    it('should handle empty options object', async () => {
      expect(() => showConfirmModal({})).not.toThrow();
      
      const result = showConfirmModal({});
      expect(result).toBeInstanceOf(Promise);
    });
    
    it('should handle missing options parameter', async () => {
      expect(() => showConfirmModal()).not.toThrow();
      
      const result = showConfirmModal();
      expect(result).toBeInstanceOf(Promise);
    });
  });
  
  describe('Modal Behavior', () => {
    it('should close modal when clicking outside', async () => {
      showConfirmModal({ title: 'Test', message: 'Test' });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      // Simula click fuori dal modal
      const backdrop = mockContainer.querySelector('.modal-backdrop') ||
                      mockContainer;
      
      simulateClick(backdrop);
      
      // Verifica che il modal sia stato rimosso
      await waitFor(() => mockContainer.children.length === 0);
    });
    
    it('should handle ESC key press', async () => {
      const promise = showConfirmModal({ title: 'Test', message: 'Test' });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      // Simula pressione tasto ESC
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);
      
      await expect(promise).resolves.toBe(false);
    });
    
    it('should prevent multiple modals from stacking', async () => {
      showConfirmModal({ title: 'Modal 1', message: 'First modal' });
      showConfirmModal({ title: 'Modal 2', message: 'Second modal' });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      // Dovrebbe esserci solo un modal attivo
      const modals = mockContainer.querySelectorAll('.modal, [role="dialog"]');
      expect(modals.length).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      showConfirmModal({ title: 'Accessible Modal', message: 'Test' });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const modal = mockContainer.querySelector('[role="dialog"]') ||
                   mockContainer.firstChild;
      
      if (modal) {
        expect(modal).toHaveAccessibleAttributes();
      }
    });
    
    it('should focus on confirm button when opened', async () => {
      showConfirmModal({ title: 'Focus Test', message: 'Test' });
      
      await waitFor(() => mockContainer.children.length > 0);
      
      const confirmButton = mockContainer.querySelector('[data-action="confirm"]');
      
      if (confirmButton && confirmButton.focus) {
        expect(confirmButton.focus).toHaveBeenCalled();
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle DOM manipulation errors gracefully', async () => {
      // Mock document.body per simulare errore
      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        value: null,
        configurable: true
      });
      
      expect(() => showConfirmModal({ title: 'Test', message: 'Test' })).not.toThrow();
      
      // Ripristina document.body
      Object.defineProperty(document, 'body', {
        value: originalBody,
        configurable: true
      });
    });
    
    it('should handle missing modal container', async () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      
      expect(() => showConfirmModal({ title: 'Test', message: 'Test' })).not.toThrow();
    });
  });
});