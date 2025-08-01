import { describe, it, expect, vi } from 'vitest';

// Test semplificato per verificare che la funzione esporta correttamente
describe('AuthService', () => {
  it('should export signOut function', async () => {
    const module = await import('../../../../src/core/auth/authService.js');
    expect(typeof module.signOut).toBe('function');
  });

  it('should export currentUser object', async () => {
    const module = await import('../../../../src/core/auth/authService.js');
    expect(module.currentUser).toBeDefined();
    expect(typeof module.currentUser).toBe('object');
  });

  it('should export initAuth function', async () => {
    const module = await import('../../../../src/core/auth/authService.js');
    expect(typeof module.initAuth).toBe('function');
  });

  it('should export signInWithGoogle function', async () => {
    const module = await import('../../../../src/core/auth/authService.js');
    expect(typeof module.signInWithGoogle).toBe('function');
  });
});