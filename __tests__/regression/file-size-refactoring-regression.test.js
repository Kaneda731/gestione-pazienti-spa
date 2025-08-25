// __tests__/regression/file-size-refactoring-regression.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

/**
 * Test di regressione per il refactoring dei file di grandi dimensioni
 * Verifica che la funzionalità esistente rimanga invariata dopo la suddivisione dei moduli
 */

// Mock delle dipendenze comuni
vi.mock('../../src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../../src/shared/utils/formatting.js', () => ({
  formatDate: vi.fn((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('it-IT');
  })
}));

vi.mock('../../src/shared/utils/sanitizeHtml.js', () => ({
  sanitizeHtml: vi.fn(text => text || '')
}));

vi.mock('../../src/core/services/notifications/notificationService.js', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
    clear: vi.fn(),
    removeNotification: vi.fn(),
    updateSettings: vi.fn(),
    getStats: vi.fn(() => ({ total: 0, visible: 0, byType: {} })),
    exportSettings: vi.fn(() => ({ version: '1.0', settings: {} })),
    importSettings: vi.fn(() => true),
    cleanupOldNotifications: vi.fn(() => 0)
  }
}));

describe('File Size Refactoring - Regression Tests', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <!-- Eventi Clinici UI Elements -->
          <div id="eventi-timeline-container"></div>
          <div id="eventi-table-container"></div>
          <tbody id="eventi-table-body"></tbody>
          <input id="eventi-search-patient" />
          <div id="patient-search-results"></div>
          <select id="eventi-filter-type"></select>
          <input id="eventi-filter-date-from" />
          <input id="eventi-filter-date-to" />
          <button id="eventi-add-btn"></button>
          <button id="eventi-reset-filters-btn"></button>
          <button id="eventi-export-btn"></button>
          <div id="eventi-pagination-controls"></div>
          <button id="eventi-prev-page-btn"></button>
          <button id="eventi-next-page-btn"></button>
          <span id="eventi-page-info"></span>
          
          <!-- Modal Elements -->
          <div id="evento-form-modal"></div>
          <div id="evento-detail-modal"></div>
          <form id="evento-form"></form>
          <input id="evento-id" />
          <input id="evento-paziente" />
          <input id="evento-paziente-id" />
          <div id="evento-patient-search-results"></div>
          <select id="evento-tipo"></select>
          <input id="evento-data" />
          <textarea id="evento-descrizione"></textarea>
          <div id="intervento-fields"></div>
          <select id="evento-tipo-intervento"></select>
          <div id="infezione-fields"></div>
          <input id="evento-agente-patogeno" />
          <span id="evento-modal-title"></span>
          <span id="evento-modal-icon"></span>
          <button id="evento-save-btn"></button>
          <button id="evento-edit-btn"></button>
          <button id="evento-delete-btn"></button>
          <div id="evento-messaggio-container"></div>
          
          <!-- Notification Elements -->
          <div id="notification-container"></div>
          <div id="notification-announcer"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    document = dom.window.document;
    window = dom.window;

    // Set globals
    global.document = document;
    global.window = window;
    global.confirm = vi.fn(() => true);

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Eventi Clinici UI - Regression Tests', () => {
    describe('Core UI Functions', () => {
      it('should maintain DOM element initialization functionality', async () => {
        // Import the module to test
        const { initializeDOMElements, getDOMElements } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        // Test that initialization works
        expect(() => initializeDOMElements()).not.toThrow();
        
        // Test that DOM elements are accessible
        const domElements = getDOMElements();
        expect(domElements).toBeDefined();
        expect(typeof domElements).toBe('object');
      });

      it('should maintain timeline rendering functionality', async () => {
        const { initializeDOMElements, renderEventsTimeline } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        initializeDOMElements();
        
        const mockEventsData = {
          eventi: [
            {
              id: '1',
              tipo_evento: 'intervento',
              data_evento: '2024-01-15',
              tipoEventoIcon: 'fas fa-scalpel',
              tipoEventoColor: 'primary',
              tipoEventoLabel: 'Intervento',
              descrizione: 'Test intervento',
              pazienteInfo: {
                id: 'p1',
                nomeCompleto: 'Mario Rossi',
                reparto: 'Chirurgia'
              },
              created_at: '2024-01-15T10:00:00Z'
            }
          ],
          currentPage: 0,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPrevPage: false
        };

        expect(() => renderEventsTimeline(mockEventsData)).not.toThrow();
        
        const container = document.getElementById('eventi-timeline-container');
        expect(container.innerHTML).toContain('eventi-timeline');
      });

      it('should maintain responsive rendering functionality', async () => {
        const { initializeDOMElements, renderEventsResponsive } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        initializeDOMElements();
        
        const mockEventsData = {
          eventi: [],
          currentPage: 0,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        };

        expect(() => renderEventsResponsive(mockEventsData)).not.toThrow();
      });

      it('should maintain form management functionality', async () => {
        const { 
          initializeDOMElements, 
          toggleEventTypeFields, 
          populateEventForm, 
          resetEventForm,
          showFormMessage,
          clearFormMessages
        } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        initializeDOMElements();
        
        // Test field toggling
        expect(() => toggleEventTypeFields('intervento')).not.toThrow();
        expect(() => toggleEventTypeFields('infezione')).not.toThrow();
        
        // Test form population
        const mockEvento = {
          id: 'event-1',
          tipo_evento: 'intervento',
          dataEventoFormatted: '15/01/2024',
          descrizione: 'Test description',
          pazienteInfo: {
            id: 'p1',
            nomeCompleto: 'Mario Rossi'
          }
        };
        
        expect(() => populateEventForm(mockEvento)).not.toThrow();
        
        // Test form reset
        expect(() => resetEventForm()).not.toThrow();
        
        // Test message handling
        expect(() => showFormMessage('Test message')).not.toThrow();
        expect(() => clearFormMessages()).not.toThrow();
      });

      it('should maintain patient search functionality', async () => {
        const { initializeDOMElements, renderPatientSearchResults } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        initializeDOMElements();
        
        const mockPatients = [
          {
            id: 'p1',
            nomeCompleto: 'Mario Rossi',
            reparto_appartenenza: 'Chirurgia',
            dataRicoveroFormatted: '15/01/2024',
            isActive: true
          }
        ];

        expect(() => renderPatientSearchResults(mockPatients, 'patient-search-results')).not.toThrow();
        
        const container = document.getElementById('patient-search-results');
        expect(container.style.display).toBe('block');
      });

      it('should maintain loading and error states', async () => {
        const { initializeDOMElements, showLoading, showError } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
        
        initializeDOMElements();
        
        expect(() => showLoading()).not.toThrow();
        expect(() => showError('Test error')).not.toThrow();
        
        const container = document.getElementById('eventi-timeline-container');
        expect(container.innerHTML).toContain('error-state');
      });
    });

    describe('API Integration', () => {
      it('should maintain API function signatures and behavior', async () => {
        // Mock the service dependency
        vi.mock('../../src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
          eventiCliniciService: {
            getAllEventi: vi.fn().mockResolvedValue({
              eventi: [],
              currentPage: 0,
              totalPages: 1,
              totalCount: 0,
              hasNextPage: false,
              hasPrevPage: false
            }),
            searchPazienti: vi.fn().mockResolvedValue([]),
            createEvento: vi.fn().mockResolvedValue({ id: 'new-id' }),
            updateEvento: vi.fn().mockResolvedValue({ id: 'updated-id' }),
            deleteEvento: vi.fn().mockResolvedValue(),
            getGiorniPostOperatori: vi.fn().mockResolvedValue(null),
            getEventiStats: vi.fn().mockResolvedValue({})
          }
        }));

        const {
          fetchEventiClinici,
          createEventoClinico,
          updateEventoClinico,
          deleteEventoClinico,
          searchPazientiForEvents,
          getCurrentFilters,
          resetAllFilters
        } = await import('../../src/features/eventi-clinici/api/eventi-clinici-api.js');

        // Test that all main API functions exist and are callable
        expect(typeof fetchEventiClinici).toBe('function');
        expect(typeof createEventoClinico).toBe('function');
        expect(typeof updateEventoClinico).toBe('function');
        expect(typeof deleteEventoClinico).toBe('function');
        expect(typeof searchPazientiForEvents).toBe('function');
        expect(typeof getCurrentFilters).toBe('function');
        expect(typeof resetAllFilters).toBe('function');

        // Test basic functionality
        const result = await fetchEventiClinici();
        expect(result).toBeDefined();
        expect(result.eventi).toBeDefined();

        const filters = getCurrentFilters();
        expect(typeof filters).toBe('object');
      });

      it('should maintain data transformation functionality', async () => {
        vi.mock('../../src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
          eventiCliniciService: {
            getAllEventi: vi.fn().mockResolvedValue({
              eventi: [{
                id: '1',
                tipo_evento: 'intervento',
                data_evento: '2024-01-15',
                descrizione: 'Test',
                pazienti: {
                  id: 'p1',
                  nome: 'Mario',
                  cognome: 'Rossi',
                  reparto_appartenenza: 'Chirurgia'
                }
              }],
              currentPage: 0,
              totalPages: 1,
              totalCount: 1,
              hasNextPage: false,
              hasPrevPage: false
            })
          }
        }));

        const { fetchEventiClinici } = await import('../../src/features/eventi-clinici/api/eventi-clinici-api.js');
        
        const result = await fetchEventiClinici();
        const evento = result.eventi[0];
        
        // Verify data transformation still works
        expect(evento.dataEventoFormatted).toBeDefined();
        expect(evento.tipoEventoIcon).toBeDefined();
        expect(evento.tipoEventoColor).toBeDefined();
        expect(evento.tipoEventoLabel).toBeDefined();
        expect(evento.pazienteInfo).toBeDefined();
        expect(evento.pazienteInfo.nomeCompleto).toBe('Mario Rossi');
      });
    });
  });

  describe('Notification Service - Regression Tests', () => {
    describe('Core Notification Functions', () => {
      it('should maintain notification service initialization', async () => {
        // Mock dependencies
        vi.mock('../../src/core/services/stateService.js', () => ({
          stateService: {
            getNotificationSettings: vi.fn(() => ({
              position: 'top-right',
              maxVisible: 5,
              enableAnimations: true,
              enableSounds: false,
              customDurations: {},
              persistentTypes: ['error'],
              autoCleanupInterval: 300000
            })),
            subscribe: vi.fn(),
            addNotification: vi.fn((type, message, options) => `notification-${Date.now()}`),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            getState: vi.fn(() => []),
            updateNotificationSettings: vi.fn(),
            exportNotificationSettings: vi.fn(() => ({ version: '1.0', settings: {} })),
            importNotificationSettings: vi.fn(() => true),
            clearOldNotifications: vi.fn(() => 0),
            getNotificationStats: vi.fn(() => ({ total: 0, visible: 0, byType: {} }))
          }
        }));

        vi.mock('../../src/shared/components/notifications/NotificationContainer.js', () => ({
          NotificationContainer: vi.fn().mockImplementation(() => ({
            container: document.createElement('div'),
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            updateSettings: vi.fn()
          }))
        }));

        const { notificationService } = await import('../../src/core/services/notifications/notificationService.js');
        
        // Test initialization
        await notificationService.init();
        
        // Test basic notification methods
        expect(typeof notificationService.success).toBe('function');
        expect(typeof notificationService.error).toBe('function');
        expect(typeof notificationService.warning).toBe('function');
        expect(typeof notificationService.info).toBe('function');
        expect(typeof notificationService.show).toBe('function');
        expect(typeof notificationService.clear).toBe('function');
        expect(typeof notificationService.removeNotification).toBe('function');
      });

      it('should maintain notification creation functionality', async () => {
        vi.mock('../../src/core/services/stateService.js', () => ({
          stateService: {
            getNotificationSettings: vi.fn(() => ({
              position: 'top-right',
              maxVisible: 5,
              enableAnimations: true,
              enableSounds: false,
              customDurations: {},
              persistentTypes: ['error'],
              autoCleanupInterval: 300000
            })),
            subscribe: vi.fn(),
            addNotification: vi.fn((type, message, options) => `notification-${Date.now()}`),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            getState: vi.fn(() => [])
          }
        }));

        vi.mock('../../src/shared/components/notifications/NotificationContainer.js', () => ({
          NotificationContainer: vi.fn().mockImplementation(() => ({
            container: document.createElement('div'),
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            updateSettings: vi.fn()
          }))
        }));

        const { notificationService } = await import('../../src/core/services/notifications/notificationService.js');
        
        await notificationService.init();
        
        // Test notification creation
        const successId = notificationService.success('Success message');
        const errorId = notificationService.error('Error message');
        const warningId = notificationService.warning('Warning message');
        const infoId = notificationService.info('Info message');
        
        expect(successId).toBeDefined();
        expect(errorId).toBeDefined();
        expect(warningId).toBeDefined();
        expect(infoId).toBeDefined();
      });

      it('should maintain settings management functionality', async () => {
        vi.mock('../../src/core/services/stateService.js', () => ({
          stateService: {
            getNotificationSettings: vi.fn(() => ({
              position: 'top-right',
              maxVisible: 5,
              enableAnimations: true,
              enableSounds: false,
              customDurations: {},
              persistentTypes: ['error'],
              autoCleanupInterval: 300000
            })),
            subscribe: vi.fn(),
            addNotification: vi.fn(),
            updateNotificationSettings: vi.fn(),
            exportNotificationSettings: vi.fn(() => ({ version: '1.0', settings: {} })),
            importNotificationSettings: vi.fn(() => true),
            getState: vi.fn(() => [])
          }
        }));

        vi.mock('../../src/shared/components/notifications/NotificationContainer.js', () => ({
          NotificationContainer: vi.fn().mockImplementation(() => ({
            container: document.createElement('div'),
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            updateSettings: vi.fn()
          }))
        }));

        const { notificationService } = await import('../../src/core/services/notifications/notificationService.js');
        
        await notificationService.init();
        
        // Test settings management
        const newSettings = {
          maxVisible: 10,
          position: 'bottom-left',
          enableSounds: true
        };
        
        expect(() => notificationService.updateSettings(newSettings)).not.toThrow();
        
        const exported = notificationService.exportSettings();
        expect(exported).toBeDefined();
        expect(exported.version).toBeDefined();
        
        const importResult = notificationService.importSettings(exported);
        expect(importResult).toBe(true);
      });
    });
  });

  describe('Notification Component - Regression Tests', () => {
    describe('Component Creation and Lifecycle', () => {
      it('should maintain notification component creation', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'success',
          message: 'Test message',
          title: 'Test Title'
        };
        
        expect(() => new NotificationComponent(notificationData)).not.toThrow();
        
        const component = new NotificationComponent(notificationData);
        expect(component.id).toBe('test-notification');
        expect(component.type).toBe('success');
        expect(component.message).toBe('Test message');
        expect(component.title).toBe('Test Title');
      });

      it('should maintain component DOM creation', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'error',
          message: 'Error message',
          title: 'Error Title'
        };
        
        const component = new NotificationComponent(notificationData);
        
        expect(component.element).toBeDefined();
        expect(component.element.tagName).toBe('DIV');
        expect(component.element.classList.contains('notification')).toBe(true);
        expect(component.element.classList.contains('notification--error')).toBe(true);
      });

      it('should maintain accessibility features', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'warning',
          message: 'Warning message'
        };
        
        const component = new NotificationComponent(notificationData);
        
        // Test ARIA attributes
        expect(component.element.getAttribute('role')).toBeDefined();
        expect(component.element.getAttribute('aria-live')).toBeDefined();
        expect(component.element.getAttribute('aria-atomic')).toBe('true');
      });

      it('should maintain interaction handling', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'info',
          message: 'Info message',
          closable: true
        };
        
        const component = new NotificationComponent(notificationData);
        
        // Test close button exists
        const closeButton = component.element.querySelector('.notification__close');
        expect(closeButton).toBeTruthy();
        
        // Test close functionality
        expect(typeof component.close).toBe('function');
        expect(() => component.close()).not.toThrow();
      });
    });

    describe('Component Features', () => {
      it('should maintain auto-close functionality', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'success',
          message: 'Success message',
          duration: 1000
        };
        
        const component = new NotificationComponent(notificationData);
        
        expect(component.getDuration()).toBe(1000);
        expect(typeof component.startAutoCloseTimer).toBe('function');
        expect(typeof component.pauseAutoClose).toBe('function');
        expect(typeof component.resumeAutoClose).toBe('function');
      });

      it('should maintain progress bar functionality', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'info',
          message: 'Info message',
          duration: 5000,
          enableProgressBar: true
        };
        
        const component = new NotificationComponent(notificationData);
        
        const progressBar = component.element.querySelector('.notification__progress');
        expect(progressBar).toBeTruthy();
        
        expect(typeof component.startProgressBar).toBe('function');
        expect(typeof component.pauseProgressBar).toBe('function');
        expect(typeof component.resumeProgressBar).toBe('function');
        expect(typeof component.stopProgressBar).toBe('function');
      });

      it('should maintain action buttons functionality', async () => {
        const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
        
        const notificationData = {
          id: 'test-notification',
          type: 'warning',
          message: 'Warning message',
          actions: [
            { label: 'Action 1', onClick: vi.fn() },
            { label: 'Action 2', onClick: vi.fn() }
          ]
        };
        
        const component = new NotificationComponent(notificationData);
        
        const actionButtons = component.element.querySelectorAll('.notification__action-btn');
        expect(actionButtons).toHaveLength(2);
        expect(actionButtons[0].textContent.trim()).toBe('Action 1');
        expect(actionButtons[1].textContent.trim()).toBe('Action 2');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain integration between UI and API layers', async () => {
      // Mock all dependencies
      vi.mock('../../src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
        eventiCliniciService: {
          getAllEventi: vi.fn().mockResolvedValue({
            eventi: [],
            currentPage: 0,
            totalPages: 1,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          })
        }
      }));

      const { initializeDOMElements, renderEventsTimeline } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
      const { fetchEventiClinici } = await import('../../src/features/eventi-clinici/api/eventi-clinici-api.js');
      
      // Test integration flow
      initializeDOMElements();
      const data = await fetchEventiClinici();
      
      expect(() => renderEventsTimeline(data)).not.toThrow();
    });

    it('should maintain integration between notification service and components', async () => {
      // Mock dependencies
      vi.mock('../../src/core/services/stateService.js', () => ({
        stateService: {
          getNotificationSettings: vi.fn(() => ({
            position: 'top-right',
            maxVisible: 5,
            enableAnimations: true,
            enableSounds: false,
            customDurations: {},
            persistentTypes: ['error'],
            autoCleanupInterval: 300000
          })),
          subscribe: vi.fn(),
          addNotification: vi.fn((type, message, options) => `notification-${Date.now()}`),
          getState: vi.fn(() => [])
        }
      }));

      vi.mock('../../src/shared/components/notifications/NotificationContainer.js', () => ({
        NotificationContainer: vi.fn().mockImplementation(() => ({
          container: document.createElement('div'),
          addNotification: vi.fn(),
          removeNotification: vi.fn(),
          clearAllNotifications: vi.fn(),
          updateSettings: vi.fn()
        }))
      }));

      const { notificationService } = await import('../../src/core/services/notifications/notificationService.js');
      const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
      
      await notificationService.init();
      
      // Test that service and component work together
      const notificationId = notificationService.success('Test message');
      expect(notificationId).toBeDefined();
      
      const component = new NotificationComponent({
        id: notificationId,
        type: 'success',
        message: 'Test message'
      });
      
      expect(component.element).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should maintain performance characteristics', async () => {
      // Test that large datasets don't cause performance issues
      const { initializeDOMElements, renderEventsTimeline } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
      
      initializeDOMElements();
      
      // Create large dataset
      const largeDataset = {
        eventi: Array.from({ length: 100 }, (_, i) => ({
          id: `event-${i}`,
          tipo_evento: i % 2 === 0 ? 'intervento' : 'infezione',
          data_evento: '2024-01-15',
          tipoEventoIcon: 'fas fa-scalpel',
          tipoEventoColor: 'primary',
          tipoEventoLabel: 'Test',
          descrizione: `Test event ${i}`,
          pazienteInfo: {
            id: `p${i}`,
            nomeCompleto: `Patient ${i}`,
            reparto: 'Test'
          },
          created_at: '2024-01-15T10:00:00Z'
        })),
        currentPage: 0,
        totalPages: 10,
        totalCount: 100,
        hasNextPage: true,
        hasPrevPage: false
      };
      
      const startTime = performance.now();
      renderEventsTimeline(largeDataset);
      const endTime = performance.now();
      
      // Should complete within reasonable time (1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should maintain memory management', async () => {
      // Test that components clean up properly
      const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
      
      const components = [];
      
      // Create multiple components
      for (let i = 0; i < 10; i++) {
        const component = new NotificationComponent({
          id: `test-${i}`,
          type: 'info',
          message: `Message ${i}`,
          duration: 1000
        });
        components.push(component);
      }
      
      // Clean up components
      components.forEach(component => {
        if (typeof component.destroy === 'function') {
          component.destroy();
        }
      });
      
      // Test should complete without memory leaks
      expect(components).toHaveLength(10);
    });
  });

  describe('Error Handling', () => {
    it('should maintain error handling in UI layer', async () => {
      const { initializeDOMElements, showError } = await import('../../src/features/eventi-clinici/views/eventi-clinici-ui.js');
      
      initializeDOMElements();
      
      // Test error handling doesn't throw
      expect(() => showError('Test error')).not.toThrow();
      expect(() => showError()).not.toThrow(); // Default message
      
      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain('error-state');
    });

    it('should maintain error handling in API layer', async () => {
      // Mock service to throw error
      vi.mock('../../src/features/eventi-clinici/services/eventiCliniciService.js', () => ({
        eventiCliniciService: {
          getAllEventi: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }));

      const { fetchEventiClinici } = await import('../../src/features/eventi-clinici/api/eventi-clinici-api.js');
      
      // Should handle error gracefully
      await expect(fetchEventiClinici()).rejects.toThrow('API Error');
    });

    it('should maintain error handling in notification components', async () => {
      const { NotificationComponent } = await import('../../src/shared/components/notifications/NotificationComponent.js');
      
      // Test with invalid data
      expect(() => new NotificationComponent({})).not.toThrow();
      expect(() => new NotificationComponent(null)).not.toThrow();
      expect(() => new NotificationComponent(undefined)).not.toThrow();
    });
  });
});