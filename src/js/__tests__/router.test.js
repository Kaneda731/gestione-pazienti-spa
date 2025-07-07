// src/js/__tests__/router.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock delle dipendenze prima di importare il router
vi.mock('../supabase.js');
vi.mock('../views/form.js');
vi.mock('../views/list.js');
vi.mock('../views/grafico.js');
vi.mock('../views/dimissione.js');
vi.mock('../views/diagnosi.js');

import { renderView, navigateTo } from '../router.js';
import { supabase } from '../supabase.js';
import { initListView } from '../views/list.js';

// Mock di fetch globale
global.fetch = vi.fn();

describe('Router', () => {
  
  beforeEach(() => {
    // Pulisci i mock e il DOM prima di ogni test
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app-container"></div>';
    window.location.hash = ''; // Resetta l'hash
    sessionStorage.clear();

    // Mock di default per fetch
    fetch.mockImplementation(async (url) => {
      if (url.includes('home.html')) {
        return new Response('<div class="view">Home View</div>', { status: 200 });
      }
      if (url.includes('list.html')) {
        return new Response('<div class="view">List View</div>', { status: 200 });
      }
      if (url.includes('login-required.html')) {
        return new Response('<div class="view">Login Required</div>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });
  });

  it('navigateTo dovrebbe aggiornare window.location.hash', () => {
    navigateTo('test-view');
    expect(window.location.hash).toBe('#test-view');
  });

  it('renderView dovrebbe mostrare la vista home di default', async () => {
    await renderView();
    const appContainer = document.getElementById('app-container');
    expect(appContainer.innerHTML).toContain('Home View');
  });

  it('renderView dovrebbe caricare una vista protetta se l-utente è loggato', async () => {
    // Setup: Simula una sessione utente valida
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: {} } } });
    window.location.hash = '#list';

    await renderView();

    const appContainer = document.getElementById('app-container');
    expect(appContainer.innerHTML).toContain('List View');
    // Verifica che la funzione di inizializzazione della vista sia stata chiamata
    expect(initListView).toHaveBeenCalledTimes(1);
  });

  it('renderView dovrebbe mostrare la vista login-required per una vista protetta se l-utente non è loggato', async () => {
    // Setup: Simula un utente non loggato
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    window.location.hash = '#list';

    await renderView();

    const appContainer = document.getElementById('app-container');
    expect(appContainer.innerHTML).toContain('Login Required');
    // Verifica che l'URL di reindirizzamento sia stato salvato
    expect(sessionStorage.getItem('redirectUrl')).toBe('list');
  });
  
  it('renderView dovrebbe passare i parametri URL alla funzione di inizializzazione', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: {} } } });
    window.location.hash = '#list?reparto=Cardiologia&page=2';

    await renderView();

    expect(initListView).toHaveBeenCalledTimes(1);
    // Verifica che i parametri siano stati passati correttamente
    const expectedParams = new URLSearchParams('reparto=Cardiologia&page=2');
    expect(initListView).toHaveBeenCalledWith(expectedParams);
  });

  afterEach(() => {
    // Pulisce l'hash per non influenzare altri test
    window.location.hash = '';
  });
});
