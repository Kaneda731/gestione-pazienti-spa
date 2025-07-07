// src/js/__mocks__/supabase.js
import { vi } from 'vitest';

// Esporta un oggetto finto che simula il client Supabase,
// includendo le funzioni che vengono chiamate nel codice testato.
export const supabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => Promise.resolve({ error: null })),
    delete: vi.fn(() => Promise.resolve({ error: null })),
  })),
};
