// __tests__/unit/features/eventi-clinici/ui/EventiTimelineRenderer.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventiTimelineRenderer } from '../../../../../src/features/eventi-clinici/views/ui/EventiTimelineRenderer.js';

// Mock dei moduli esterni
vi.mock('../../../../../src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../../../src/shared/utils/formatting.js', () => ({
  formatDate: vi.fn(date => `formatted-${date}`)
}));

vi.mock('../../../../../src/shared/utils/sanitizeHtml.js', () => ({
  sanitizeHtml: vi.fn(html => html)
}));

describe('EventiTimelineRenderer', () => {
  let renderer;
  let mockDomElements;
  let mockCallbacks;

  beforeEach(() => {
    // Mock del DOM elements
    mockDomElements = {
      timelineContainer: {
        innerHTML: '',
        appendChild: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn()
      }
    };

    // Mock dei callbacks
    mockCallbacks = {
      showError: vi.fn(),
      updatePaginationControls: vi.fn()
    };

    // Reset dei mock
    vi.clearAllMocks();
    
    // Creazione istanza
    renderer = new EventiTimelineRenderer(mockDomElements, mockCallbacks);
  });

  describe('Inizializzazione', () => {
    it('dovrebbe creare un\'istanza correttamente', () => {
      expect(renderer).toBeInstanceOf(EventiTimelineRenderer);
      expect(renderer.domElements).toBe(mockDomElements);
      expect(renderer.callbacks).toBe(mockCallbacks);
    });

    it('dovrebbe gestire elementi DOM mancanti', () => {
      const rendererWithNull = new EventiTimelineRenderer({}, mockCallbacks);
      expect(rendererWithNull.domElements).toEqual({});
    });

    it('dovrebbe gestire callbacks mancanti', () => {
      const rendererWithoutCallbacks = new EventiTimelineRenderer(mockDomElements, {});
      expect(rendererWithoutCallbacks.callbacks).toEqual({});
    });
  });

  describe('renderTimeline', () => {
    it('dovrebbe gestire container timeline mancante', () => {
      const rendererNoContainer = new EventiTimelineRenderer({}, mockCallbacks);
      
      const eventsData = { eventi: [] };
      rendererNoContainer.renderTimeline(eventsData);
      
      expect(mockCallbacks.showError).not.toHaveBeenCalled();
    });

    it('dovrebbe renderizzare stato vuoto quando non ci sono eventi', () => {
      const eventsData = { eventi: [] };
      
      renderer.renderTimeline(eventsData);
      
      expect(mockDomElements.timelineContainer.innerHTML).toBe('');
      expect(mockDomElements.timelineContainer.appendChild).toHaveBeenCalled();
    });

    it('dovrebbe renderizzare eventi quando presenti', () => {
      const mockEventi = [
        {
          id: '1',
          tipo_evento: 'intervento',
          data_evento: '2024-01-01',
          descrizione: 'Test evento',
          created_at: '2024-01-01T10:00:00Z'
        }
      ];
      
      const eventsData = { eventi: mockEventi };
      
      renderer.renderTimeline(eventsData);
      
      expect(mockDomElements.timelineContainer.innerHTML).toBe('');
      expect(mockDomElements.timelineContainer.appendChild).toHaveBeenCalled();
      expect(mockCallbacks.updatePaginationControls).toHaveBeenCalledWith(eventsData);
    });

    it('dovrebbe gestire errori nel rendering', () => {
      // Simula errore nel appendChild
      mockDomElements.timelineContainer.appendChild.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const eventsData = { eventi: [] };
      
      renderer.renderTimeline(eventsData);
      
      expect(mockCallbacks.showError).toHaveBeenCalledWith('Errore nel rendering della timeline');
    });
  });

  describe('clearTimeline', () => {
    it('dovrebbe pulire il container timeline', () => {
      renderer.clearTimeline();
      
      expect(mockDomElements.timelineContainer.innerHTML).toBe('');
    });

    it('dovrebbe gestire container mancante senza errori', () => {
      const rendererNoContainer = new EventiTimelineRenderer({}, mockCallbacks);
      
      expect(() => {
        rendererNoContainer.clearTimeline();
      }).not.toThrow();
    });
  });

  describe('updateTimelineItem', () => {
    beforeEach(() => {
      // Mock querySelector per trovare elementi esistenti
      mockDomElements.timelineContainer.querySelector = vi.fn();
    });

    it('dovrebbe aggiornare un elemento esistente', () => {
      const mockElement = {
        replaceWith: vi.fn(),
        dataset: { eventoId: '1' }
      };
      
      mockDomElements.timelineContainer.querySelector.mockReturnValue(mockElement);

      const evento = {
        id: '1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-01',
        descrizione: 'Updated evento'
      };

      renderer.updateTimelineItem(evento);

      expect(mockDomElements.timelineContainer.querySelector).toHaveBeenCalledWith('[data-evento-id="1"]');
      expect(mockElement.replaceWith).toHaveBeenCalled();
    });

    it('dovrebbe gestire elemento non trovato', () => {
      mockDomElements.timelineContainer.querySelector.mockReturnValue(null);

      const evento = {
        id: '999',
        tipo_evento: 'intervento',
        data_evento: '2024-01-01',
        descrizione: 'Non existent evento'
      };

      expect(() => {
        renderer.updateTimelineItem(evento);
      }).not.toThrow();
    });
  });

  describe('groupEventsByDate', () => {
    it('dovrebbe raggruppare eventi per data correttamente', () => {
      const eventi = [
        { id: '1', data_evento: '2024-01-01', descrizione: 'Evento 1' },
        { id: '2', data_evento: '2024-01-01', descrizione: 'Evento 2' },
        { id: '3', data_evento: '2024-01-02', descrizione: 'Evento 3' }
      ];

      const grouped = renderer.groupEventsByDate(eventi);

      expect(grouped).toEqual({
        '2024-01-01': [
          { id: '1', data_evento: '2024-01-01', descrizione: 'Evento 1' },
          { id: '2', data_evento: '2024-01-01', descrizione: 'Evento 2' }
        ],
        '2024-01-02': [
          { id: '3', data_evento: '2024-01-02', descrizione: 'Evento 3' }
        ]
      });
    });

    it('dovrebbe gestire array vuoto', () => {
      const grouped = renderer.groupEventsByDate([]);
      expect(grouped).toEqual({});
    });
  });

  describe('createEventCard', () => {
    it('dovrebbe creare card evento per intervento', () => {
      const evento = {
        id: '1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-01',
        descrizione: 'Test intervento',
        tipoEventoIcon: 'medical_services',
        tipoEventoColor: 'primary'
      };

      const card = renderer.createEventCard(evento);

      expect(card).toBeDefined();
      expect(card.tagName).toBe('DIV');
      expect(card.className).toContain('timeline-event-card');
      expect(card.dataset.eventoId).toBe('1');
    });

    it('dovrebbe creare card evento per infezione', () => {
      const evento = {
        id: '2',
        tipo_evento: 'infezione',
        data_evento: '2024-01-01',
        descrizione: 'Test infezione',
        agente_patogeno: 'Test pathogen'
      };

      const card = renderer.createEventCard(evento);

      expect(card).toBeDefined();
      expect(card.tagName).toBe('DIV');
      expect(card.className).toContain('timeline-event-card');
      expect(card.dataset.eventoId).toBe('2');
    });

    it('dovrebbe gestire dati evento mancanti gracefully', () => {
      const evento = {
        id: '3',
        tipo_evento: 'intervento'
        // Mancano altri campi
      };

      expect(() => {
        const card = renderer.createEventCard(evento);
        expect(card).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('renderEmptyState', () => {
    it('dovrebbe renderizzare stato vuoto correttamente', () => {
      renderer.renderEmptyState();

      expect(mockDomElements.timelineContainer.innerHTML).toBe('');
      expect(mockDomElements.timelineContainer.appendChild).toHaveBeenCalled();
      
      // Verifica che sia stato aggiunto l'elemento empty state
      const call = mockDomElements.timelineContainer.appendChild.mock.calls[0];
      const emptyElement = call[0];
      expect(emptyElement.className).toContain('empty-state');
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire errori DOM gracefully', () => {
      // Simula errore nel DOM
      mockDomElements.timelineContainer.appendChild.mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });

      const eventsData = { eventi: [] };
      
      expect(() => {
        renderer.renderTimeline(eventsData);
      }).not.toThrow();
      
      expect(mockCallbacks.showError).toHaveBeenCalled();
    });

    it('dovrebbe gestire callback mancanti', () => {
      const rendererNoCallbacks = new EventiTimelineRenderer(mockDomElements, {});
      
      const eventsData = { eventi: [] };
      
      expect(() => {
        rendererNoCallbacks.renderTimeline(eventsData);
      }).not.toThrow();
    });
  });
});
