import { describe, it, expect } from 'vitest';
import { initErrorHandling } from '../src/core/services/errorService.js';

describe('errorService', () => {
  it('initErrorHandling è definita e non lancia errori', () => {
    expect(initErrorHandling).toBeInstanceOf(Function);
    expect(() => initErrorHandling()).not.toThrow();
  });
});
