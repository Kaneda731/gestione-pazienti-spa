import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentUser, signInWithGoogle, signOut, initAuth } from '../src/core/auth/authService.js';

// Mock delle dipendenze esterne (es. supabase)
vi.mock('../src/core/services/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(() => Promise.resolve({ data: { session: { user: { id: '1' } } } })),
      signOut: vi.fn(() => Promise.resolve({})),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1', email: 'test@example.com' } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: '1', email: 'test@example.com' } } } })),
      onAuthStateChange: vi.fn((cb) => { cb('SIGNED_IN', { user: { id: '1', email: 'test@example.com' } }); return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { username: 'test', full_name: 'Test User', role: 'editor' },
            error: null,
            status: 200
          }))
        }))
      }))
    })),
  }
}));

describe('authService', () => {
  it('currentUser ha struttura corretta', () => {
    expect(currentUser).toHaveProperty('session');
    expect(currentUser).toHaveProperty('profile');
  });

  

  it('signInWithGoogle chiama il provider e restituisce dati', async () => {
    const result = await signInWithGoogle();
    expect(result).toHaveProperty('data');
  });

  it('signOut chiama il provider di logout', async () => {
    await expect(signOut()).resolves.toBeDefined();
  });

  it('initAuth non lancia errori', async () => {
    await expect(initAuth(() => {})).resolves.toBeUndefined();
  });
});
