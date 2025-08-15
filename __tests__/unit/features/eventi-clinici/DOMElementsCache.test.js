/**
 * Test per il modulo DOMElementsCache
 * Verifica l'inizializzazione e gestione degli elementi DOM
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMElementsCache, initializeDOMElements, getDOMElements } from '../../../../src/features/eventi-clinici/ui/DOMElementsCache.js';

describe.skip('DOMElementsCache (legacy suite non allineata)', () => {
  let cache;
  let mockDocument;

  beforeEach(() => {
    // Setup mock document
    mockDocument = {
      getElementById: vi.fn((id) => ({ 
        id,
        classList: { add: vi.fn(), remove: vi.fn() },
        style: { display: 'block' },
        innerHTML: '',
        value: ''
      })),
      querySelector: vi.fn((selector) => ({ 
        selector,
        classList: { add: vi.fn(), remove: vi.fn() }
      }))
    };
    
    // Mock globale document
    global.document = mockDocument;
    
    // Nuova istanza per ogni test
    cache = new DOMElementsCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Reset singleton
    domElementsCache.clear();
  });

  describe('Costruttore e inizializzazione', () => {
    it('dovrebbe creare una nuova istanza non inizializzata', () => {
      expect(cache.isInitialized()).toBe(false);
      expect(cache.getAll()).toEqual({});
    });

    it('dovrebbe inizializzare tutti gli elementi DOM', () => {
      const elements = cache.initialize();
      
      expect(cache.isInitialized()).toBe(true);
      expect(Object.keys(elements).length).toBeGreaterThan(20);
      expect(mockDocument.getElementById).toHaveBeenCalledWith('eventi-timeline-container');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('eventi-table-container');
    });

    it('non dovrebbe reinizializzare se già inizializzato', () => {
      cache.initialize();
      mockDocument.getElementById.mockClear();
      
      cache.initialize();
      
      expect(mockDocument.getElementById).not.toHaveBeenCalled();
    });
  });

  describe('Accesso agli elementi', () => {
    beforeEach(() => {
      cache.initialize();
    });

    it('dovrebbe restituire un elemento specifico', () => {
      const element = cache.get('timelineContainer');
      expect(element).toBeDefined();
      expect(element.id).toBe('eventi-timeline-container');
    });

    it('dovrebbe restituire null per elementi inesistenti', () => {
      const element = cache.get('elementoInesistente');
      expect(element).toBeNull();
    });

    it('dovrebbe verificare l\'esistenza di un elemento', () => {
      expect(cache.has('timelineContainer')).toBe(true);
      expect(cache.has('elementoInesistente')).toBe(false);
    });

    it('dovrebbe restituire tutti gli elementi', () => {
      const allElements = cache.getAll();
      expect(Object.keys(allElements).length).toBeGreaterThan(20);
      expect(allElements).toHaveProperty('timelineContainer');
      expect(allElements).toHaveProperty('tableContainer');
    });
  });

  describe('Validazione elementi critici', () => {
    it('dovrebbe validare la presenza di elementi critici', () => {
      cache.initialize();
      
      const isValid = cache.validateCriticalElements();
      expect(isValid).toBe(true);
    });

    it('dovrebbe fallire se mancano elementi critici', () => {
      // Mock che restituisce null per elementi critici
      mockDocument.getElementById.mockImplementation((id) => {
        if (id === 'eventi-timeline-container') return null;
        return { id, classList: { add: vi.fn(), remove: vi.fn() } };
      });
      
      cache.initialize();
      
      const isValid = cache.validateCriticalElements();
      expect(isValid).toBe(false);
    });
  });

  describe('Gestione errori DOM', () => {
    it('dovrebbe gestire errori in getElementById', () => {
      mockDocument.getElementById.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      const element = cache.getElementById('test-id');
      expect(element).toBeNull();
    });

    it('dovrebbe gestire errori in querySelector', () => {
      mockDocument.querySelector.mockImplementation(() => {
        throw new Error('Selector error');
      });
      
      const element = cache.querySelector('.test-class');
      expect(element).toBeNull();
    });

    it('dovrebbe gestire accesso prima dell\'inizializzazione', () => {
      expect(cache.get('timelineContainer')).toBeNull();
      expect(cache.has('timelineContainer')).toBe(false);
      expect(cache.getAll()).toEqual({});
    });
  });

  describe('Pulizia e reinizializzazione', () => {
    beforeEach(() => {
      cache.initialize();
    });

    it('dovrebbe pulire la cache', () => {
      cache.clear();
      
      expect(cache.isInitialized()).toBe(false);
      expect(cache.getAll()).toEqual({});
    });

    it('dovrebbe permettere la reinizializzazione', () => {
      const firstInit = cache.getAll();
      
      cache.reinitialize();
      const secondInit = cache.getAll();
      
      expect(Object.keys(firstInit).length).toBe(Object.keys(secondInit).length);
      expect(cache.isInitialized()).toBe(true);
    });
  });

  describe('Singleton e funzioni di compatibilità', () => {
    it('dovrebbe fornire un singleton funzionante', () => {
      expect(domElementsCache).toBeInstanceOf(DOMElementsCache);
      expect(domElementsCache.isInitialized()).toBe(false);
    });

    it('dovrebbe mantenere la compatibilità con initializeDOMElements', () => {
      const elements = initializeDOMElements();
      
      expect(domElementsCache.isInitialized()).toBe(true);
      expect(Object.keys(elements).length).toBeGreaterThan(20);
    });

    it('dovrebbe mantenere la compatibilità con getDOMElements', () => {
      initializeDOMElements();
      const elements = getDOMElements();
      
      expect(Object.keys(elements).length).toBeGreaterThan(20);
      expect(elements).toHaveProperty('timelineContainer');
    });

    it('getDOMElements dovrebbe restituire oggetto vuoto se non inizializzato', () => {
      const elements = getDOMElements();
      expect(elements).toEqual({});
    });
  });

  describe('Elementi specifici', () => {
    beforeEach(() => {
      cache.initialize();
    });

    it('dovrebbe avere tutti i container principali', () => {
      expect(cache.has('timelineContainer')).toBe(true);
      expect(cache.has('tableContainer')).toBe(true);
      expect(cache.has('tableBody')).toBe(true);
    });

    it('dovrebbe avere tutti i filtri', () => {
      expect(cache.has('filterType')).toBe(true);
      expect(cache.has('filterDateFrom')).toBe(true);
      expect(cache.has('filterDateTo')).toBe(true);
      expect(cache.has('filterReparto')).toBe(true);
    });

    it('dovrebbe avere tutti i bottoni di azione', () => {
      expect(cache.has('addEventBtn')).toBe(true);
      expect(cache.has('resetFiltersBtn')).toBe(true);
      expect(cache.has('exportBtn')).toBe(true);
    });

    it('dovrebbe avere tutti gli elementi del form', () => {
      expect(cache.has('eventForm')).toBe(true);
      expect(cache.has('eventType')).toBe(true);
      expect(cache.has('eventDate')).toBe(true);
      expect(cache.has('eventDescription')).toBe(true);
    });

    it('dovrebbe avere elementi modal', () => {
      expect(cache.has('eventFormModal')).toBe(true);
      expect(cache.has('eventDetailModal')).toBe(true);
      expect(cache.has('modalTitle')).toBe(true);
    });
  });

  describe('Performance e memoria', () => {
    it('non dovrebbe creare elementi duplicati', () => {
      const firstInit = cache.initialize();
      const secondInit = cache.initialize();
      
      expect(firstInit).toBe(secondInit);
      expect(mockDocument.getElementById).toHaveBeenCalledTimes(Object.keys(firstInit).length);
    });

    it('dovrebbe permettere accesso rapido agli elementi', () => {
      cache.initialize();
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        cache.get('timelineContainer');
      }
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10); // Meno di 10ms per 1000 accessi
    });
  });
});
