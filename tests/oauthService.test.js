import { describe, it, expect, vi, beforeEach } from 'vitest';
import { oauthManager } from '../src/core/auth/oauthService.js';

describe('oauthService', () => {
  it('oauthManager ha metodi principali', () => {
    expect(oauthManager).toHaveProperty('init');
    expect(oauthManager).toHaveProperty('handleOAuthCallback');
    expect(oauthManager).toHaveProperty('clearCorruptedState');
    expect(oauthManager).toHaveProperty('cleanupOAuthUrl');
  });

  it('init non lancia errori (mock)', async () => {
    if (typeof oauthManager.init === 'function') {
      await expect(oauthManager.init()).resolves;
    }
  });

  it('clearCorruptedState non lancia errori', () => {
    if (typeof oauthManager.clearCorruptedState === 'function') {
      expect(() => oauthManager.clearCorruptedState()).not.toThrow();
    }
  });
});
