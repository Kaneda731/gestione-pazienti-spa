// src/js/views/__tests__/list-state.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { state, resetFilters, persistFilters, loadPersistedFilters, cacheDOMElements } from '../list-state';

// Mock di sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Inizializza il DOM minimo richiesto per i test
document.body.innerHTML = `
  <div id="list-view">
    <div class="filters-container">
      <input id="list-search" />
      <select id="list-filter-reparto"><option value=""></option></select>
      <select id="list-filter-diagnosi"><option value=""></option></select>
      <select id="list-filter-stato"><option value=""></option></select>
      <button id="reset-filters-btn"></button>
    </div>
    <div id="pazienti-table-body"></div>
    <table>
      <thead>
        <tr>
          <th data-sort="nome">Nome</th>
        </tr>
      </thead>
    </table>
    <button id="prev-page-btn"></button>
    <button id="next-page-btn"></button>
    <span id="page-info"></span>
    <button data-view="home"></button>
    <button id="export-csv-btn"></button>
  </div>
`;

describe('Gestione dello stato della lista pazienti (list-state.js)', () => {

  // Resetta lo stato e sessionStorage prima di ogni test
  beforeEach(() => {
    // Popola domElements prima di ogni test
    const viewContainer = document.getElementById('list-view');
    cacheDOMElements(viewContainer);
    
    resetFilters(); // Assicura uno stato di partenza pulito
    sessionStorage.clear();
  });

  it('dovrebbe avere uno stato iniziale corretto', () => {
    expect(state.currentPage).toBe(0);
    expect(state.filters.search).toBe('');
    expect(state.sortColumn).toBe('cognome');
    expect(state.sortDirection).toBe('asc');
  });

  it('resetFilters dovrebbe reimpostare tutti i filtri e la paginazione', () => {
    // 1. Setup: Modifica lo stato attuale
    state.currentPage = 5;
    state.filters.search = 'Mario';
    state.filters.reparto = 'Cardiologia';
    state.sortColumn = 'nome';
    
    // 2. Azione: Esegui la funzione da testare
    resetFilters();

    // 3. Verifica: Controlla che lo stato sia tornato ai valori di default
    expect(state.currentPage).toBe(0);
    expect(state.filters.search).toBe('');
    expect(state.filters.reparto).toBe('');
    expect(state.sortColumn).toBe('cognome'); // Anche l'ordinamento torna a default
  });

  it('persistFilters dovrebbe salvare lo stato corrente in sessionStorage', () => {
    // Setup
    state.currentPage = 2;
    state.filters.stato = 'dimesso';

    // Azione
    persistFilters();

    // Verifica
    const persisted = JSON.parse(sessionStorage.getItem('listFilters'));
    expect(persisted).not.toBeNull();
    expect(persisted.currentPage).toBe(2);
    expect(persisted.filters.stato).toBe('dimesso');
  });

  it('loadPersistedFilters dovrebbe caricare i filtri da sessionStorage se non ci sono parametri URL', () => {
    // Setup: Salva uno stato fittizio in sessionStorage
    const mockState = {
      currentPage: 3,
      filters: { reparto: 'Neurologia' },
      sortColumn: 'cognome',
      sortDirection: 'desc'
    };
    sessionStorage.setItem('listFilters', JSON.stringify(mockState));

    // Azione
    loadPersistedFilters(new URLSearchParams());

    // Verifica
    expect(state.currentPage).toBe(3);
    expect(state.filters.reparto).toBe('Neurologia');
    expect(state.sortColumn).toBe('cognome');
    expect(state.sortDirection).toBe('desc');
  });

  it('loadPersistedFilters dovrebbe dare priorità ai parametri URL', () => {
    // Setup: Salva uno stato diverso in sessionStorage
    const mockState = { currentPage: 1, filters: { reparto: 'Cardiologia' } };
    sessionStorage.setItem('listFilters', JSON.stringify(mockState));

    // Azione: Carica con parametri URL
    const urlParams = new URLSearchParams('reparto=Chirurgia&page=0');
    loadPersistedFilters(urlParams);

    // Verifica: I parametri URL hanno la precedenza
    expect(state.currentPage).toBe(0);
    expect(state.filters.reparto).toBe('Chirurgia');
  });
});
