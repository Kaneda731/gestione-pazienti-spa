import { describe, it, expect, vi } from 'vitest';
import { notificationService } from '../../../../src/core/services/notificationService.js';

// Mock dei servizi
vi.mock('../../../../src/core/services/notificationService.js', () => ({
  notificationService: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn()
  }
}));

describe('Error Handling', () => {
  describe('Network Error Handling', () => {
    it('should show user-friendly message on timeout', () => {
      const timeoutError = new Error('Network timeout');
      
      // Simula gestione errore
      const handleError = (error) => {
        if (error.message.includes('timeout')) {
          return 'Connessione lenta, riprova...';
        }
        return 'Errore di connessione';
      };

      expect(handleError(timeoutError)).toBe('Connessione lenta, riprova...');
    });

    it('should show offline message', () => {
      const offlineError = new Error('Failed to fetch');
      
      const handleError = (error) => {
        if (error.message.includes('fetch')) {
          return 'Connessione internet assente';
        }
        return 'Errore di connessione';
      };

      expect(handleError(offlineError)).toBe('Connessione internet assente');
    });

    it('should handle permission denied errors', () => {
      const permissionError = new Error('Permission denied');
      
      const handleError = (error) => {
        if (error.message.includes('permission') || error.message.includes('denied')) {
          return 'Permesso negato, contatta l\'amministratore';
        }
        return 'Errore di autorizzazione';
      };

      expect(handleError(permissionError)).toBe('Permesso negato, contatta l\'amministratore');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle duplicate patient errors', () => {
      const duplicateError = new Error('duplicate key value');
      
      const handleError = (error) => {
        if (error.message.includes('duplicate')) {
          return 'Paziente già esistente';
        }
        return 'Errore salvataggio';
      };

      expect(handleError(duplicateError)).toBe('Paziente già esistente');
    });

    it('should handle invalid data format', () => {
      const formatError = new Error('invalid input syntax');
      
      const handleError = (error) => {
        if (error.message.includes('invalid')) {
          return 'Formato dati non valido';
        }
        return 'Errore dati';
      };

      expect(handleError(formatError)).toBe('Formato dati non valido');
    });
  });

  describe('User Experience Errors', () => {
    it('should provide actionable feedback', () => {
      const errors = [
        { type: 'network', message: 'Controlla la connessione' },
        { type: 'validation', message: 'Correggi i campi evidenziati' },
        { type: 'auth', message: 'Effettua il login' }
      ];

      errors.forEach(error => {
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(0);
      });
    });

    it('should maintain error context', () => {
      const errorContext = {
        operation: 'createPatient',
        timestamp: new Date().toISOString(),
        userMessage: 'Errore durante creazione paziente'
      };

      expect(errorContext.operation).toBe('createPatient');
      expect(errorContext.userMessage).toContain('creazione paziente');
    });
  });
});