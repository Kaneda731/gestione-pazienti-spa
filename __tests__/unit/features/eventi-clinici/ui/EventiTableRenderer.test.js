import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventiTableRenderer } from '../../../../../src/features/eventi-clinici/views/ui/EventiTableRenderer.js';

// Mock delle dipendenze
vi.mock('../../../../../src/core/services/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../../../src/shared/utils/sanitizeHtml.js', () => ({
  sanitizeHtml: vi.fn((html) => html)
}));

vi.mock('../../../../../src/shared/utils/formatting.js', () => ({
  formatDate: vi.fn((date) => `formatted-${date}`)
}));

describe('EventiTableRenderer', () => {
  let renderer;
  let mockDomElements;
  let mockCallbacks;

  beforeEach(() => {
    // Reset di tutti i mock
    vi.clearAllMocks();

    // Mock degli elementi DOM
    mockDomElements = {
      tableBody: {
        innerHTML: '',
        appendChild: vi.fn(),
        querySelector: vi.fn()
      },
      paginationControls: {
        style: { display: '' }
      },
      prevPageBtn: {
        disabled: false
      },
      nextPageBtn: {
        disabled: false
      },
      pageInfo: {
        textContent: ''
      }
    };

    // Mock dei callbacks
    mockCallbacks = {
      showError: vi.fn()
    };

    // Crea istanza del renderer
    renderer = new EventiTableRenderer(mockDomElements, mockCallbacks);
  });

  describe('Inizializzazione', () => {
    it('dovrebbe creare un\'istanza correttamente', () => {
      expect(renderer).toBeInstanceOf(EventiTableRenderer);
      expect(renderer.domElements).toBe(mockDomElements);
      expect(renderer.callbacks).toBe(mockCallbacks);
    });

    it('dovrebbe gestire elementi DOM mancanti', () => {
      const rendererWithoutDOM = new EventiTableRenderer({}, mockCallbacks);
      expect(rendererWithoutDOM.domElements).toEqual({});
    });

    it('dovrebbe gestire callbacks mancanti', () => {
      const rendererWithoutCallbacks = new EventiTableRenderer(mockDomElements, {});
      expect(rendererWithoutCallbacks.callbacks).toEqual({});
    });
  });

  describe('renderTable', () => {
    it('dovrebbe gestire container table body mancante', () => {
      const rendererWithoutTableBody = new EventiTableRenderer({}, mockCallbacks);
      
      expect(() => {
        rendererWithoutTableBody.renderTable({ eventi: [] });
      }).not.toThrow();
    });

    it('dovrebbe renderizzare stato vuoto quando non ci sono eventi', () => {
      const eventsData = { eventi: [] };
      
      renderer.renderTable(eventsData);
      
      expect(mockDomElements.tableBody.appendChild).toHaveBeenCalled();
      expect(mockDomElements.paginationControls.style.display).toBe('none');
    });

    it('dovrebbe renderizzare eventi quando presenti', () => {
      const mockEventi = [
        {
          id: '1',
          tipo_evento: 'intervento',
          data_evento: '2024-01-01',
          tipo_intervento: 'Chirurgia',
          descrizione: 'Test intervento',
          pazienteInfo: {
            nomeCompleto: 'Mario Rossi',
            reparto: 'Cardiologia'
          }
        }
      ];
      
      const eventsData = { 
        eventi: mockEventi,
        currentPage: 0,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPrevPage: false
      };
      
      renderer.renderTable(eventsData);
      
      expect(mockDomElements.tableBody.innerHTML).toContain('Mario Rossi');
      expect(mockDomElements.tableBody.innerHTML).toContain('Chirurgia');
      expect(mockDomElements.pageInfo.textContent).toContain('1-1 di 1 eventi');
    });

    it('dovrebbe gestire errori nel rendering', () => {
      // Simula errore
      mockDomElements.tableBody.innerHTML = '';
      Object.defineProperty(mockDomElements.tableBody, 'innerHTML', {
        set: () => { throw new Error('DOM error'); }
      });
      
      const eventsData = { eventi: [{ id: '1' }] };
      
      renderer.renderTable(eventsData);
      
      expect(mockCallbacks.showError).toHaveBeenCalledWith('Errore nel rendering della tabella');
    });
  });

  describe('clearTable', () => {
    it('dovrebbe pulire il contenuto della tabella', () => {
      renderer.clearTable();
      
      expect(mockDomElements.tableBody.innerHTML).toBe('');
    });

    it('dovrebbe gestire table body mancante senza errori', () => {
      const rendererWithoutTableBody = new EventiTableRenderer({}, mockCallbacks);
      
      expect(() => {
        rendererWithoutTableBody.clearTable();
      }).not.toThrow();
    });
  });

  describe('createTableRow', () => {
    it('dovrebbe creare riga per evento intervento', () => {
      const evento = {
        id: '1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-01',
        tipo_intervento: 'Chirurgia',
        descrizione: 'Test descrizione',
        pazienteInfo: {
          nomeCompleto: 'Mario Rossi',
          reparto: 'Cardiologia'
        },
        tipoEventoColor: 'primary',
        tipoEventoLabel: 'Intervento',
        tipoEventoIcon: 'medical_services'
      };

      const row = renderer.createTableRow(evento);

      expect(row).toContain('data-evento-id="1"');
      expect(row).toContain('Mario Rossi');
      expect(row).toContain('Chirurgia');
      expect(row).toContain('badge bg-primary');
    });

    it('dovrebbe creare riga per evento infezione attiva', () => {
      const evento = {
        id: '2',
        tipo_evento: 'infezione',
        data_evento: '2024-01-02',
        agente_patogeno: 'E. coli',
        descrizione: 'Infezione in corso',
        pazienteInfo: {
          nomeCompleto: 'Lucia Bianchi',
          reparto: 'Medicina'
        },
        tipoEventoColor: 'warning',
        tipoEventoLabel: 'Infezione',
        tipoEventoIcon: 'warning'
      };

      const row = renderer.createTableRow(evento);

      expect(row).toContain('data-evento-id="2"');
      expect(row).toContain('Lucia Bianchi');
      expect(row).toContain('E. coli');
      expect(row).toContain('badge bg-danger');
      expect(row).toContain('event-resolve-btn');
    });

    it('dovrebbe creare riga per evento infezione risolta', () => {
      const evento = {
        id: '3',
        tipo_evento: 'infezione',
        data_evento: '2024-01-03',
        data_fine_evento: '2024-01-10',
        dataFineEventoFormatted: '10/01/2024',
        agente_patogeno: 'Staph aureus',
        pazienteInfo: {
          nomeCompleto: 'Giuseppe Verdi',
          reparto: 'Chirurgia'
        }
      };

      const row = renderer.createTableRow(evento);

      expect(row).toContain('Giuseppe Verdi');
      expect(row).toContain('badge bg-success');
      expect(row).toContain('Risolta');
      expect(row).not.toContain('event-resolve-btn');
    });

    it('dovrebbe gestire dati paziente mancanti', () => {
      const evento = {
        id: '4',
        tipo_evento: 'intervento',
        data_evento: '2024-01-04',
        tipo_intervento: 'Test',
        pazienteInfo: null
      };

      const row = renderer.createTableRow(evento);

      expect(row).toContain('data-evento-id="4"');
      expect(row).toContain('<td>-</td>'); // Nome paziente mancante
    });
  });

  describe('getTipoBadge', () => {
    it('dovrebbe creare badge per intervento', () => {
      const evento = {
        tipo_evento: 'intervento',
        tipoEventoColor: 'primary',
        tipoEventoLabel: 'Intervento',
        tipoEventoIcon: 'medical_services'
      };

      const badge = renderer.getTipoBadge(evento);

      expect(badge).toContain('badge bg-primary');
      expect(badge).toContain('Intervento');
      expect(badge).toContain('medical_services');
    });

    it('dovrebbe creare badge per infezione con valori di default', () => {
      const evento = {
        tipo_evento: 'infezione'
      };

      const badge = renderer.getTipoBadge(evento);

      expect(badge).toContain('badge bg-warning');
      expect(badge).toContain('Infezione');
    });

    it('dovrebbe gestire evento con tipo sconosciuto', () => {
      const evento = {
        tipo_evento: 'diagnostica'  // Tipo non mappato
      };

      const badge = renderer.getTipoBadge(evento);

      expect(badge).toContain('badge bg-secondary'); // Secondary per tipi sconosciuti
      expect(badge).toContain('Tipo: diagnostica'); // Fallback
    });

    it('dovrebbe gestire evento senza tipo_evento', () => {
      const evento = {
        id: '999'
        // Nessun tipo_evento
      };

      const badge = renderer.getTipoBadge(evento);

      expect(badge).toContain('badge bg-secondary'); // Secondary per sconosciuti
      expect(badge).toContain('Sconosciuto'); // Fallback finale
    });
  });

  describe('renderEventIcon', () => {
    it('dovrebbe renderizzare icona specifica', () => {
      const icon = renderer.renderEventIcon('surgery', 'intervento', 'white', 'test-class');
      
      expect(icon).toContain('surgery');
      expect(icon).toContain('text-white');
      expect(icon).toContain('test-class');
    });

    it('dovrebbe usare icona di default per intervento', () => {
      const icon = renderer.renderEventIcon(null, 'intervento');
      
      expect(icon).toContain('medical_services');
    });

    it('dovrebbe usare icona di default per infezione', () => {
      const icon = renderer.renderEventIcon(null, 'infezione');
      
      expect(icon).toContain('warning');
    });
  });

  describe('updatePaginationControls', () => {
    it('dovrebbe aggiornare i controlli di paginazione', () => {
      const eventsData = {
        currentPage: 1,
        totalPages: 3,
        totalCount: 25,
        hasNextPage: true,
        hasPrevPage: true
      };

      renderer.updatePaginationControls(eventsData);

      expect(mockDomElements.prevPageBtn.disabled).toBe(false);
      expect(mockDomElements.nextPageBtn.disabled).toBe(false);
      expect(mockDomElements.pageInfo.textContent).toContain('11-20 di 25 eventi');
      expect(mockDomElements.paginationControls.style.display).toBe('flex');
    });

    it('dovrebbe nascondere paginazione per pagina singola', () => {
      const eventsData = {
        currentPage: 0,
        totalPages: 1,
        totalCount: 5,
        hasNextPage: false,
        hasPrevPage: false
      };

      renderer.updatePaginationControls(eventsData);

      expect(mockDomElements.paginationControls.style.display).toBe('none');
    });

    it('dovrebbe gestire pagination controls mancanti', () => {
      const rendererWithoutPagination = new EventiTableRenderer({}, mockCallbacks);
      
      expect(() => {
        rendererWithoutPagination.updatePaginationControls({});
      }).not.toThrow();
    });
  });

  describe('updateTableRow', () => {
    beforeEach(() => {
      const mockRow = document.createElement('tr');
      mockRow.replaceWith = vi.fn();
      mockDomElements.tableBody.querySelector.mockReturnValue(mockRow);
    });

    it('dovrebbe aggiornare una riga esistente', () => {
      const evento = {
        id: '1',
        tipo_evento: 'intervento',
        data_evento: '2024-01-01',
        tipo_intervento: 'Aggiornato',
        pazienteInfo: {
          nomeCompleto: 'Mario Rossi',
          reparto: 'Cardiologia'
        }
      };

      renderer.updateTableRow(evento);

      expect(mockDomElements.tableBody.querySelector).toHaveBeenCalledWith('[data-evento-id="1"]');
    });

    it('dovrebbe gestire riga non trovata', () => {
      mockDomElements.tableBody.querySelector.mockReturnValue(null);

      const evento = { id: '999', tipo_evento: 'intervento' };

      expect(() => {
        renderer.updateTableRow(evento);
      }).not.toThrow();
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire errori DOM gracefully', () => {
      // Simula errore nella creazione righe
      const evento = { id: '1', tipo_evento: 'intervento' };
      
      expect(() => {
        renderer.updateTableRow(evento);
      }).not.toThrow();
    });

    it('dovrebbe gestire callback mancanti', () => {
      const rendererWithoutCallbacks = new EventiTableRenderer(mockDomElements, {});
      
      expect(() => {
        rendererWithoutCallbacks.renderTable({ eventi: null });
      }).not.toThrow();
    });
  });
});
