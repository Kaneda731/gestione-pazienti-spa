import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DOMElementsCache, initializeDOMElements, getDOMElements } from '../../../../../src/features/eventi-clinici/ui/DOMElementsCache.js';

// Mock del logger
vi.mock('../../../../../src/core/services/logger.js', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock degli elementi DOM per i test
const createMockElement = (id) => {
  const element = document.createElement('div');
  element.id = id;
  return element;
};

describe('DOMElementsCache', () => {
  let cache;

  beforeEach(() => {
    // Pulisci il DOM
    document.body.innerHTML = '';
    
    // Reset singleton
    DOMElementsCache._instance = null;
    
    // Crea elementi DOM di test
    const mockElements = [
      'eventiContainer',
      'eventiTableContainer',
      'eventiTimelineContainer',
      'eventiCards',
      'loadingContainer',
      'eventiTable',
      'eventiTableBody',
      'noEventiMessage',
      'paginationContainer',
      'paginationInfo',
      'filterForm',
      'patientSelect',
      'startDateInput',
      'endDateInput',
      'eventTypeSelect',
      'activeOnlyCheckbox',
      'clearFiltersBtn',
      'refreshBtn',
      'addEventBtn',
      'exportBtn',
      'eventModal',
      'eventForm',
      'eventFormContainer',
      'eventModalTitle',
      'eventPatientSelect',
      'eventTypeInput',
      'eventDateInput',
      'eventDescriptionInput',
      'eventDetailsInput',
      'eventEndDateInput',
      'eventActiveToggle',
      'saveEventBtn',
      'editEventBtn',
      'deleteEventBtn',
      'closeEventBtn',
      'eventiStats',
      'totalEventiCount',
      'activeEventiCount',
      'inactiveEventiCount',
      'eventiThisMonth',
      'searchInput',
      'viewToggleBtn',
      'sortSelect',
      'itemsPerPageSelect',
      'firstPageBtn',
      'prevPageBtn',
      'nextPageBtn',
      'lastPageBtn',
      'currentPageSpan',
      'totalPagesSpan',
      'fromEntrySpan',
      'toEntrySpan',
      'totalEntriesSpan',
      'eventiHeader',
      'backBtn',
      'errorContainer',
      'errorMessage',
      'successContainer',
      'successMessage',
      'confirmModal',
      'confirmModalBody',
      'confirmYesBtn',
      'confirmNoBtn'
    ];

    mockElements.forEach(id => {
      const element = createMockElement(id);
      document.body.appendChild(element);
    });

    cache = DOMElementsCache.getInstance();
  });

  afterEach(() => {
    // Reset singleton per test isolati
    DOMElementsCache._instance = null;
    document.body.innerHTML = '';
  });

  describe('Singleton Pattern', () => {
    it('dovrebbe implementare il pattern singleton', () => {
      const instance1 = DOMElementsCache.getInstance();
      const instance2 = DOMElementsCache.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('non dovrebbe permettere la creazione diretta con new', () => {
      expect(() => new DOMElementsCache()).toThrow('Use DOMElementsCache.getInstance() instead');
    });

    it('dovrebbe mantenere lo stato tra accessi multipli', () => {
      const instance1 = DOMElementsCache.getInstance();
      instance1.initialize();
      
      const instance2 = DOMElementsCache.getInstance();
      expect(instance2.isInitialized).toBe(true);
    });
  });

  describe('Inizializzazione', () => {
    it('dovrebbe inizializzare correttamente tutti gli elementi DOM', () => {
      cache.initialize();
      
      expect(cache.isInitialized).toBe(true);
      expect(cache.elements.size).toBeGreaterThan(0);
    });

    it('dovrebbe trovare tutti gli elementi critici', () => {
      cache.initialize();
      
      const criticalElements = [
        'eventiContainer',
        'loadingContainer',
        'filterForm',
        'eventModal'
      ];

      criticalElements.forEach(id => {
        expect(cache.has(id)).toBe(true);
        expect(cache.get(id)).toBeTruthy();
      });
    });

    it('dovrebbe gestire elementi mancanti senza errori', () => {
      // Rimuovi un elemento critico
      document.getElementById('eventiContainer')?.remove();
      
      cache.initialize();
      
      expect(cache.isInitialized).toBe(true);
      expect(cache.get('eventiContainer')).toBeNull();
    });

    it('non dovrebbe reinizializzare se già inizializzato', () => {
      cache.initialize();
      const firstSize = cache.elements.size;
      
      // Aggiungi un nuovo elemento al DOM
      const newElement = createMockElement('newTestElement');
      document.body.appendChild(newElement);
      
      cache.initialize();
      
      // La dimensione dovrebbe rimanere la stessa
      expect(cache.elements.size).toBe(firstSize);
    });
  });

  describe('Gestione Cache', () => {
    beforeEach(() => {
      cache.initialize();
    });

    it('dovrebbe restituire elementi esistenti', () => {
      const element = cache.get('eventiContainer');
      expect(element).toBe(document.getElementById('eventiContainer'));
    });

    it('dovrebbe restituire null per elementi inesistenti', () => {
      const element = cache.get('nonExistentElement');
      expect(element).toBeNull();
    });

    it('dovrebbe verificare correttamente la presenza di elementi', () => {
      expect(cache.has('eventiContainer')).toBe(true);
      expect(cache.has('nonExistentElement')).toBe(false);
    });

    it('dovrebbe restituire tutti gli elementi', () => {
      const allElements = cache.getAll();
      expect(allElements).toBeInstanceOf(Object);
      expect(Object.keys(allElements).length).toBeGreaterThan(0);
      expect(allElements.eventiContainer).toBe(document.getElementById('eventiContainer'));
    });

    it('dovrebbe pulire correttamente la cache', () => {
      expect(cache.elements.size).toBeGreaterThan(0);
      
      cache.clear();
      
      expect(cache.elements.size).toBe(0);
      expect(cache.isInitialized).toBe(false);
    });
  });

  describe('Validazione Elementi Critici', () => {
    it('dovrebbe validare elementi critici presenti', () => {
      cache.initialize();
      
      const validation = cache.validateCriticalElements();
      expect(validation.isValid).toBe(true);
      expect(validation.missing).toHaveLength(0);
      expect(validation.found).toHaveLength(4); // eventiContainer, loadingContainer, filterForm, eventModal
    });

    it('dovrebbe rilevare elementi critici mancanti', () => {
      // Rimuovi elementi critici
      document.getElementById('eventiContainer')?.remove();
      document.getElementById('filterForm')?.remove();
      
      cache.initialize();
      
      const validation = cache.validateCriticalElements();
      expect(validation.isValid).toBe(false);
      expect(validation.missing).toContain('eventiContainer');
      expect(validation.missing).toContain('filterForm');
      expect(validation.found).toHaveLength(2); // loadingContainer, eventModal
    });
  });

  describe('Funzioni di Compatibilità', () => {
    it('initializeDOMElements dovrebbe funzionare correttamente', () => {
      const result = initializeDOMElements();
      
      expect(result).toBe(cache);
      expect(cache.isInitialized).toBe(true);
    });

    it('getDOMElements dovrebbe restituire tutti gli elementi', () => {
      cache.initialize();
      
      const elements = getDOMElements();
      
      expect(elements).toBeInstanceOf(Object);
      expect(elements.eventiContainer).toBe(document.getElementById('eventiContainer'));
    });

    it('getDOMElements dovrebbe inizializzare se necessario', () => {
      expect(cache.isInitialized).toBe(false);
      
      const elements = getDOMElements();
      
      expect(cache.isInitialized).toBe(true);
      expect(elements).toBeInstanceOf(Object);
    });
  });

  describe('Comportamento Edge Cases', () => {
    it('dovrebbe gestire DOM vuoto', () => {
      document.body.innerHTML = '';
      
      cache.initialize();
      
      expect(cache.isInitialized).toBe(true);
      expect(cache.elements.size).toBe(0);
    });

    it('dovrebbe gestire elementi duplicati nel DOM', () => {
      // Crea elementi duplicati (stessi ID)
      const duplicate = createMockElement('eventiContainer');
      document.body.appendChild(duplicate);
      
      cache.initialize();
      
      // Dovrebbe prendere il primo elemento trovato
      expect(cache.get('eventiContainer')).toBe(document.getElementById('eventiContainer'));
    });

    it('dovrebbe gestire chiamate multiple a clear()', () => {
      cache.initialize();
      
      cache.clear();
      cache.clear();
      
      expect(cache.isInitialized).toBe(false);
      expect(cache.elements.size).toBe(0);
    });
  });

  describe('Performance', () => {
    it('dovrebbe avere performance accettabili per grandi quantità di elementi', () => {
      // Aggiungi molti elementi al DOM
      for (let i = 0; i < 1000; i++) {
        const element = createMockElement(`testElement${i}`);
        document.body.appendChild(element);
      }

      const startTime = performance.now();
      cache.initialize();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Dovrebbe completare in meno di 100ms
    });

    it('dovrebbe avere accesso rapido agli elementi cached', () => {
      cache.initialize();

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        cache.get('eventiContainer');
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Accesso molto rapido
    });
  });
});
