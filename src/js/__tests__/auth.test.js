// src/js/__tests__/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock delle dipendenze
vi.mock('../supabase.js');
vi.mock('../auth-ui.js');

import { initAuth, signOut, cleanOAuthParamsFromURL, enableDevelopmentBypass, checkDevelopmentBypass } from '../auth.js';
import { supabase } from '../supabase.js';
import { updateAuthUI } from '../auth-ui.js';

// Mock di localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock di history.replaceState
Object.defineProperty(window, 'history', {
  value: { replaceState: vi.fn() },
  writable: true
});


describe('Auth Logic', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initAuth dovrebbe impostare il listener onAuthStateChange', () => {
    const mockCallback = vi.fn();
    initAuth(mockCallback);
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('onAuthStateChange dovrebbe chiamare updateAuthUI e il callback', () => {
    const mockSession = { user: { email: 'test@test.com' } };
    const mockCallback = vi.fn();
    
    // Cattura il callback passato a onAuthStateChange
    let authStateChangeCallback;
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    initAuth(mockCallback);
    
    // Simula un evento di cambio stato
    authStateChangeCallback('SIGNED_IN', mockSession);

    expect(updateAuthUI).toHaveBeenCalledWith(mockSession);
    expect(mockCallback).toHaveBeenCalledWith(mockSession);
  });

  it('signOut dovrebbe chiamare supabase.auth.signOut', async () => {
    await signOut();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('cleanOAuthParamsFromURL dovrebbe rimuovere i token dall-URL', () => {
    // Simula un URL con parametri OAuth
    const originalUrl = 'http://localhost/?access_token=123&other=abc';
    Object.defineProperty(window, 'location', {
      value: new URL(originalUrl),
      writable: true
    });

    cleanOAuthParamsFromURL();

    // Verifica che replaceState sia stato chiamato con l'URL pulito
    expect(history.replaceState).toHaveBeenCalledWith(null, '', 'http://localhost/?other=abc');
  });
  
  describe('Development Bypass', () => {
    it('enableDevelopmentBypass dovrebbe impostare i dati corretti in localStorage', () => {
      enableDevelopmentBypass();
      expect(localStorage.getItem('user.bypass.enabled')).toBe('true');
      expect(localStorage.getItem('supabase.auth.session')).toContain('dev-user-123');
    });

    it('checkDevelopmentBypass dovrebbe restituire la sessione fittizia se il bypass è attivo', () => {
      enableDevelopmentBypass();
      const session = checkDevelopmentBypass();
      expect(session).not.toBeNull();
      expect(session.user.id).toBe('dev-user-123');
    });

    it('checkDevelopmentBypass dovrebbe restituire null se il bypass non è attivo', () => {
      const session = checkDevelopmentBypass();
      expect(session).toBeNull();
    });
  });
});
