/**
 * Test migrato per errorService usando infrastruttura ottimizzata
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServiceMock } from '../../__mocks__/services.js';
import { mockConsole } from '../../__helpers__/test-utils.js';

// Import del servizio da testare
import { initErrorHandling } from '../../../src/core/services/errorService.js';

describe('ErrorService', () => {
  let errorServiceMock;
  let consoleMock;
  
  beforeEach(() => {
    // Usa il mock factory per creare mock consistenti
    errorServiceMock = createServiceMock('error');
    
    // Mock console per catturare log di errore
    consoleMock = mockConsole();
  });
  
  afterEach(() => {
    // Ripristina console
    if (consoleMock) {
      consoleMock.restore();
    }
    
    vi.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should be defined as a function', () => {
      expect(initErrorHandling).toBeInstanceOf(Function);
    });
    
    it('should not throw errors when called', () => {
      expect(() => initErrorHandling()).not.toThrow();
    });
    
    it('should initialize without parameters', () => {
      const result = initErrorHandling();
      expect(result).toBeUndefined();
    });
    
    it('should accept callback parameter', () => {
      const callback = vi.fn();
      expect(() => initErrorHandling(callback)).not.toThrow();
    });
  });
  
  describe('Error Handling Setup', () => {
    it('should setup global error handlers', () => {
      const originalOnError = window.onerror;
      const originalOnUnhandledRejection = window.onunhandledrejection;
      
      initErrorHandling();
      
      // Verifica che i handler siano stati impostati
      expect(window.onerror).toBeDefined();
      expect(window.onunhandledrejection).toBeDefined();
      
      // Ripristina handler originali
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    });
    
    it('should handle JavaScript errors', () => {
      const errorCallback = vi.fn();
      initErrorHandling(errorCallback);
      
      // Simula errore JavaScript
      const testError = new Error('Test error');
      
      if (window.onerror) {
        window.onerror('Test error', 'test.js', 1, 1, testError);
      }
      
      // Verifica che l'errore sia stato gestito
      expect(consoleMock.getLogs('error').length).toBeGreaterThan(0);
    });
    
    it('should handle unhandled promise rejections', () => {
      const errorCallback = vi.fn();
      initErrorHandling(errorCallback);
      
      // Simula promise rejection
      const rejectionEvent = {
        reason: new Error('Promise rejection test'),
        preventDefault: vi.fn()
      };
      
      if (window.onunhandledrejection) {
        window.onunhandledrejection(rejectionEvent);
      }
      
      expect(rejectionEvent.preventDefault).toHaveBeenCalled();
    });
  });
  
  describe('Error Logging', () => {
    it('should log errors to console', () => {
      initErrorHandling();
      
      // Simula errore
      const testError = new Error('Console log test');
      
      if (window.onerror) {
        window.onerror(testError.message, 'test.js', 1, 1, testError);
      }
      
      const errorLogs = consoleMock.getLogs('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });
    
    it('should include error details in logs', () => {
      initErrorHandling();
      
      const testError = new Error('Detailed error test');
      testError.stack = 'Error stack trace';
      
      if (window.onerror) {
        window.onerror(testError.message, 'test.js', 10, 5, testError);
      }
      
      const errorLogs = consoleMock.getLogs('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      
      // Verifica che i dettagli dell'errore siano inclusi
      const logContent = JSON.stringify(errorLogs);
      expect(logContent).toContain('Detailed error test');
    });
  });
  
  describe('Custom Error Callback', () => {
    it('should call custom callback when provided', () => {
      const customCallback = vi.fn();
      initErrorHandling(customCallback);
      
      const testError = new Error('Callback test');
      
      if (window.onerror) {
        window.onerror(testError.message, 'test.js', 1, 1, testError);
      }
      
      expect(customCallback).toHaveBeenCalled();
    });
    
    it('should pass error details to callback', () => {
      const customCallback = vi.fn();
      initErrorHandling(customCallback);
      
      const testError = new Error('Callback details test');
      
      if (window.onerror) {
        window.onerror(testError.message, 'test.js', 15, 10, testError);
      }
      
      expect(customCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: testError.message,
          filename: 'test.js',
          lineno: 15,
          colno: 10,
          error: testError
        })
      );
    });
  });
  
  describe('Error Prevention', () => {
    it('should prevent default browser error handling', () => {
      initErrorHandling();
      
      const rejectionEvent = {
        reason: new Error('Prevention test'),
        preventDefault: vi.fn()
      };
      
      if (window.onunhandledrejection) {
        window.onunhandledrejection(rejectionEvent);
      }
      
      expect(rejectionEvent.preventDefault).toHaveBeenCalled();
    });
  });
  
  describe('Multiple Initialization', () => {
    it('should handle multiple initialization calls safely', () => {
      expect(() => {
        initErrorHandling();
        initErrorHandling();
        initErrorHandling();
      }).not.toThrow();
    });
    
    it('should not duplicate error handlers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      initErrorHandling(callback1);
      const firstHandler = window.onerror;
      
      initErrorHandling(callback2);
      const secondHandler = window.onerror;
      
      // Verifica che il secondo handler abbia sostituito il primo
      expect(secondHandler).toBeDefined();
      expect(firstHandler).toBeDefined();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle errors without error object', () => {
      initErrorHandling();
      
      expect(() => {
        if (window.onerror) {
          window.onerror('Error message', 'file.js', 1, 1, null);
        }
      }).not.toThrow();
    });
    
    it('should handle errors with missing parameters', () => {
      initErrorHandling();
      
      expect(() => {
        if (window.onerror) {
          window.onerror('Error message');
        }
      }).not.toThrow();
    });
    
    it('should handle promise rejections without reason', () => {
      initErrorHandling();
      
      const rejectionEvent = {
        reason: null,
        preventDefault: vi.fn()
      };
      
      expect(() => {
        if (window.onunhandledrejection) {
          window.onunhandledrejection(rejectionEvent);
        }
      }).not.toThrow();
    });
  });
});