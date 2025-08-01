// __tests__/unit/features/eventi-clinici/views/eventi-clinici-ui.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup mocks before imports
vi.mock('../../../../../src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../../../src/shared/utils/formatting.js', () => ({
  formatDate: vi.fn((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('it-IT');
  })
}));

// Import after mocks
// Import after mocks
import {
  initializeDOMElements,
  renderEventsTimeline,
  showLoading,
  showError,
  renderPatientSearchResults,
  toggleEventTypeFields,
  populateEventForm,
  resetEventForm,
  showFormMessage,
  clearFormMessages,
  updateModalTitle,
  renderEventDetails as renderEventDetailsInModal,
  applyResponsiveDesign,
  getDOMElements
} from '../../../../../src/features/eventi-clinici/views/eventi-clinici-ui.js';

import { logger } from '../../../../../src/core/services/loggerService.js';

describe('Eventi Clinici UI Tests', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create JSDOM instance with the HTML structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="eventi-timeline-container"></div>
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
          
          <!-- Modal elements -->
          <div id="evento-form-modal"></div>
          <div id="evento-detail-modal"></div>
          <form id="evento-form"></form>
          <input id="evento-id" />
          <input id="evento-paziente" />
          <input id="evento-paziente-id" />
          <div id="evento-patient-search-results"></div>
          <select id="evento-tipo">
            <option value="">Select...</option>
            <option value="intervento">Intervento</option>
            <option value="infezione">Infezione</option>
          </select>
          <input id="evento-data" />
          <textarea id="evento-descrizione"></textarea>
          
          <!-- Type-specific fields -->
          <div id="intervento-fields"></div>
          <select id="evento-tipo-intervento">
            <option value="">Select...</option>
            <option value="Chirurgia Generale">Chirurgia Generale</option>
          </select>
          <div id="infezione-fields"></div>
          <input id="evento-agente-patogeno" />
          
          <!-- Modal elements -->
          <span id="evento-modal-title"></span>
          <span id="evento-modal-icon"></span>
          <button id="evento-save-btn"></button>
          <button id="evento-edit-btn"></button>
          <button id="evento-delete-btn"></button>
          <span id="evento-detail-title"></span>
          <span id="evento-detail-icon"></span>
          <div id="evento-detail-content"></div>
          <div id="evento-messaggio-container"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    document = dom.window.document;
    window = dom.window;

    // Set global document and window
    global.document = document;
    global.window = window;

    vi.clearAllMocks();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('initializeDOMElements', () => {
    it('should initialize all DOM element references', () => {
      initializeDOMElements();
      const domElements = getDOMElements();

      expect(domElements.timelineContainer).toBeTruthy();
      expect(domElements.searchPatientInput).toBeTruthy();
      expect(domElements.filterType).toBeTruthy();
      expect(domElements.eventForm).toBeTruthy();
      expect(logger.log).toHaveBeenCalledWith('✅ DOM elements inizializzati per eventi clinici UI');
    });
  });

  describe('renderEventsTimeline', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should render events timeline successfully', () => {
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

      renderEventsTimeline(mockEventsData);

      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain('eventi-timeline');
      expect(container.innerHTML).toContain('timeline-event-card');
      expect(container.innerHTML).toContain('Mario Rossi');
      expect(container.innerHTML).toContain('Intervento');
    });

    it('should render empty state when no events', () => {
      const mockEventsData = {
        eventi: [],
        currentPage: 0,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      };

      renderEventsTimeline(mockEventsData);

      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain('empty-state');
      expect(container.innerHTML).toContain('Nessun evento trovato');
    });

    it('should handle missing container gracefully', () => {
      // Remove container before initializing DOM elements
      document.getElementById('eventi-timeline-container').remove();
      
      // Re-initialize DOM elements to get null reference
      initializeDOMElements();

      const mockEventsData = { eventi: [] };
      
      expect(() => renderEventsTimeline(mockEventsData)).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('❌ Container timeline non trovato');
    });
  });

  describe('showLoading', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should display loading state', () => {
      showLoading();

      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain('loading-state');
      expect(container.innerHTML).toContain('spinner-border');
      expect(container.innerHTML).toContain('Caricamento eventi clinici');
    });
  });

  describe('showError', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should display error state with default message', () => {
      showError();

      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain('error-state');
      expect(container.innerHTML).toContain('fa-exclamation-triangle');
      expect(container.innerHTML).toContain('Errore nel caricamento dei dati');
    });

    it('should display error state with custom message', () => {
      const customMessage = 'Custom error message';
      showError(customMessage);

      const container = document.getElementById('eventi-timeline-container');
      expect(container.innerHTML).toContain(customMessage);
    });
  });

  describe('renderPatientSearchResults', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should render patient search results', () => {
      const mockPatients = [
        {
          id: 'p1',
          nomeCompleto: 'Mario Rossi',
          reparto_appartenenza: 'Chirurgia',
          dataRicoveroFormatted: '15/01/2024',
          isActive: true
        },
        {
          id: 'p2',
          nomeCompleto: 'Luigi Verdi',
          reparto_appartenenza: 'Medicina',
          dataRicoveroFormatted: '10/01/2024',
          isActive: false
        }
      ];

      renderPatientSearchResults(mockPatients, 'patient-search-results');

      const container = document.getElementById('patient-search-results');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Mario Rossi');
      expect(container.innerHTML).toContain('Luigi Verdi');
      expect(container.innerHTML).toContain('Chirurgia');
      expect(container.innerHTML).toContain('badge bg-success');
      expect(container.innerHTML).toContain('badge bg-secondary');
    });

    it('should hide container when no patients', () => {
      renderPatientSearchResults([], 'patient-search-results');

      const container = document.getElementById('patient-search-results');
      expect(container.style.display).toBe('none');
    });
  });

  describe('toggleEventTypeFields', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should show intervention fields for intervento type', () => {
      toggleEventTypeFields('intervento');

      const interventionFields = document.getElementById('intervento-fields');
      const infectionFields = document.getElementById('infezione-fields');
      const interventionType = document.getElementById('evento-tipo-intervento');

      expect(interventionFields.style.display).toBe('block');
      expect(infectionFields.style.display).toBe('none');
      expect(interventionType.required).toBe(true);
    });

    it('should show infection fields for infezione type', () => {
      toggleEventTypeFields('infezione');

      const interventionFields = document.getElementById('intervento-fields');
      const infectionFields = document.getElementById('infezione-fields');

      expect(interventionFields.style.display).toBe('none');
      expect(infectionFields.style.display).toBe('block');
    });

    it('should hide all fields for unknown type', () => {
      toggleEventTypeFields('unknown');

      const interventionFields = document.getElementById('intervento-fields');
      const infectionFields = document.getElementById('infezione-fields');

      expect(interventionFields.style.display).toBe('none');
      expect(infectionFields.style.display).toBe('none');
    });
  });

  describe('populateEventForm', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should populate form with event data', () => {
      const mockEvento = {
        id: 'event-1',
        tipo_evento: 'intervento',
        dataEventoFormatted: '15/01/2024',
        descrizione: 'Test description',
        tipo_intervento: 'Chirurgia Generale',
        pazienteInfo: {
          id: 'p1',
          nomeCompleto: 'Mario Rossi'
        }
      };

      populateEventForm(mockEvento);

      expect(document.getElementById('evento-id').value).toBe('event-1');
      expect(document.getElementById('evento-tipo').value).toBe('intervento');
      expect(document.getElementById('evento-data').value).toBe('15/01/2024');
      expect(document.getElementById('evento-descrizione').value).toBe('Test description');
      expect(document.getElementById('evento-tipo-intervento').value).toBe('Chirurgia Generale');
      expect(document.getElementById('evento-paziente').value).toBe('Mario Rossi');
      expect(document.getElementById('evento-paziente-id').value).toBe('p1');
    });
  });

  describe('resetEventForm', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should reset form and clear all fields', () => {
      // Set some values first
      const eventoId = document.getElementById('evento-id');
      const pazienteId = document.getElementById('evento-paziente-id');
      const descrizione = document.getElementById('evento-descrizione');
      
      eventoId.value = 'test-id';
      pazienteId.value = 'test-patient';
      descrizione.value = 'test description';

      // Mock form reset method
      const form = document.getElementById('evento-form');
      form.reset = vi.fn(() => {
        // Manually reset form fields for test
        eventoId.value = '';
        pazienteId.value = '';
        descrizione.value = '';
      });

      resetEventForm();

      expect(eventoId.value).toBe('');
      expect(pazienteId.value).toBe('');
      expect(descrizione.value).toBe('');
    });
  });

  describe('showFormMessage', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should display form message with default danger type', () => {
      const message = 'Test error message';
      showFormMessage(message);

      const container = document.getElementById('evento-messaggio-container');
      expect(container.innerHTML).toContain('alert-danger');
      expect(container.innerHTML).toContain(message);
    });

    it('should display form message with custom type', () => {
      const message = 'Test success message';
      showFormMessage(message, 'success');

      const container = document.getElementById('evento-messaggio-container');
      expect(container.innerHTML).toContain('alert-success');
      expect(container.innerHTML).toContain(message);
    });
  });

  describe('clearFormMessages', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should clear form messages', () => {
      const container = document.getElementById('evento-messaggio-container');
      container.innerHTML = '<div class="alert">Test message</div>';

      clearFormMessages();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('updateModalTitle', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should update modal title and icon', () => {
      updateModalTitle('Edit Event', 'edit');

      const title = document.getElementById('evento-modal-title');
      const icon = document.getElementById('evento-modal-icon');

      expect(title.textContent).toBe('Edit Event');
      expect(icon.textContent).toBe('edit');
    });

    it('should use default icon when not provided', () => {
      updateModalTitle('New Event');

      const icon = document.getElementById('evento-modal-icon');
      expect(icon.textContent).toBe('add');
    });
  });

  describe('renderEventDetailsInModal', () => {
    beforeEach(() => {
      initializeDOMElements();
    });

    it('should render event details in modal', () => {
      const mockEvento = {
        tipo_evento: 'intervento',
        tipoEventoIcon: 'fas fa-scalpel',
        tipoEventoColor: 'primary',
        tipoEventoLabel: 'Intervento',
        dataEventoFormatted: '15/01/2024',
        descrizione: 'Test description',
        tipo_intervento: 'Chirurgia Generale',
        pazienteInfo: {
          nomeCompleto: 'Mario Rossi',
          reparto: 'Chirurgia'
        },
        created_at: '2024-01-15T10:00:00Z'
      };

      renderEventDetailsInModal(mockEvento);

      const content = document.getElementById('evento-detail-content');
      expect(content.innerHTML).toContain('Intervento');
      expect(content.innerHTML).toContain('15/01/2024');
      expect(content.innerHTML).toContain('Mario Rossi');
      expect(content.innerHTML).toContain('Chirurgia Generale');
      expect(content.innerHTML).toContain('Test description');
    });
  });

  describe('applyResponsiveDesign', () => {
    beforeEach(() => {
      initializeDOMElements();
      
      // Create timeline container with some event cards
      const container = document.getElementById('eventi-timeline-container');
      container.innerHTML = `
        <div class="timeline-event-card"></div>
        <div class="timeline-event-card"></div>
      `;
    });

    it('should apply mobile layout for small screens', () => {
      // Mock window width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      applyResponsiveDesign();

      const container = document.getElementById('eventi-timeline-container');
      const cards = container.querySelectorAll('.timeline-event-card');

      expect(container.classList.contains('mobile-layout')).toBe(true);
      expect(container.classList.contains('tablet-layout')).toBe(false);
      
      cards.forEach(card => {
        expect(card.classList.contains('mobile-card')).toBe(true);
        expect(card.classList.contains('tablet-card')).toBe(false);
      });
    });

    it('should apply tablet layout for medium screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      applyResponsiveDesign();

      const container = document.getElementById('eventi-timeline-container');
      const cards = container.querySelectorAll('.timeline-event-card');

      expect(container.classList.contains('mobile-layout')).toBe(false);
      expect(container.classList.contains('tablet-layout')).toBe(true);
      
      cards.forEach(card => {
        expect(card.classList.contains('mobile-card')).toBe(false);
        expect(card.classList.contains('tablet-card')).toBe(true);
      });
    });

    it('should apply desktop layout for large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      applyResponsiveDesign();

      const container = document.getElementById('eventi-timeline-container');
      const cards = container.querySelectorAll('.timeline-event-card');

      expect(container.classList.contains('mobile-layout')).toBe(false);
      expect(container.classList.contains('tablet-layout')).toBe(false);
      
      cards.forEach(card => {
        expect(card.classList.contains('mobile-card')).toBe(false);
        expect(card.classList.contains('tablet-card')).toBe(false);
      });
    });
  });

  describe('getDOMElements', () => {
    it('should return DOM elements object', () => {
      initializeDOMElements();
      const domElements = getDOMElements();

      expect(domElements).toBeDefined();
      expect(domElements.timelineContainer).toBeTruthy();
      expect(domElements.eventForm).toBeTruthy();
    });
  });
});