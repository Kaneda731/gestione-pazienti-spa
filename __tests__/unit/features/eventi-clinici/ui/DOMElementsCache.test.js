import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DOMElementsCache, initializeDOMElements, getDOMElements } from '../../../../../src/features/eventi-clinici/ui/DOMElementsCache.js';

// Mock del logger corretto
vi.mock('../../../../../src/core/services/logger/loggerService.js', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper per creare elementi con id
const el = (id) => {
  const d = document.createElement('div');
  d.id = id;
  return d;
};

describe('DOMElementsCache (semplificato)', () => {
  let cache;

  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset singleton
    DOMElementsCache._instance = null;

    // Crea DOM minimo richiesto dalla cache (elementi critici)
    document.body.appendChild(el('eventi-table-container'));
    document.body.appendChild(el('eventi-timeline-container'));
    // Alcuni elementi non critici presenti nel mapping
    document.body.appendChild(el('eventi-table-body'));
    document.body.appendChild(el('eventi-add-btn'));
    document.body.appendChild(el('eventi-reset-filters-btn'));

    cache = DOMElementsCache.getInstance();
  });

  afterEach(() => {
    DOMElementsCache._instance = null;
    document.body.innerHTML = '';
  });

  describe('Singleton', () => {
    it('getInstance restituisce sempre la stessa istanza', () => {
      const a = DOMElementsCache.getInstance();
      const b = DOMElementsCache.getInstance();
      expect(a).toBe(b);
    });

    it('il costruttore diretto è consentito solo se non esiste già un\'istanza', () => {
      // Crea instanza iniziale
      DOMElementsCache._instance = DOMElementsCache.getInstance();
      expect(() => new DOMElementsCache()).toThrow('Use DOMElementsCache.getInstance() instead');
    });
  });

  describe('Inizializzazione', () => {
    it('inizializza con elementi critici presenti', () => {
      cache.initialize();
      expect(cache.isInitialized).toBe(true);
      const all = cache.getAll();
      expect(all.tableContainer).toBe(document.getElementById('eventi-table-container'));
      expect(all.timelineContainer).toBe(document.getElementById('eventi-timeline-container'));
    });

    it('lancia errore se mancano elementi critici', () => {
      document.getElementById('eventi-table-container')?.remove();
      expect(() => cache.initialize()).toThrow(/Elementi DOM critici mancanti/);
    });

    it('non reinizializza se già inizializzato e DOM invariato', () => {
      const first = cache.initialize();
      const second = cache.initialize();
      expect(second).toBe(first);
      expect(cache.isInitialized).toBe(true);
    });
  });

  describe('Accesso alla cache', () => {
    beforeEach(() => {
      cache.initialize();
    });

    it('get restituisce elemento esistente o null', () => {
      expect(cache.get('tableContainer')).toBe(document.getElementById('eventi-table-container'));
      expect(cache.get('nonEsiste')).toBeNull();
    });

    it('has verifica correttamente', () => {
      expect(cache.has('timelineContainer')).toBe(true);
      expect(cache.has('nonEsiste')).toBe(false);
    });

    it('getAll restituisce una shallow copy', () => {
      const a = cache.getAll();
      const b = cache.getAll();
      expect(a).not.toBe(b);
      expect(Object.keys(a).length).toBeGreaterThan(0);
    });

    it('clear resetta lo stato', () => {
      cache.clear();
      expect(cache.isInitialized).toBe(false);
      expect(cache.getAll()).toEqual({});
    });
  });

  describe('Funzioni di compatibilità', () => {
    it('initializeDOMElements restituisce la cache inizializzata', () => {
      const result = initializeDOMElements();
      expect(result).toBe(cache);
      expect(cache.isInitialized).toBe(true);
    });

    it('getDOMElements inizializza se necessario', () => {
      // Reset stato
      cache.clear();
      const els = getDOMElements();
      expect(Object.keys(els).length).toBeGreaterThan(0);
      expect(cache.isInitialized).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('DOM vuoto -> initialize lancia errore', () => {
      document.body.innerHTML = '';
      expect(() => cache.initialize()).toThrow(/Elementi DOM critici mancanti/);
    });

    it('chiamate multiple a clear() sono idempotenti', () => {
      cache.initialize();
      cache.clear();
      cache.clear();
      expect(cache.isInitialized).toBe(false);
      expect(cache.getAll()).toEqual({});
    });
  });
});
