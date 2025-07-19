import { describe, it, expect } from 'vitest';
import { generateId } from '../src/shared/utils/helpers.js';

describe('generateId', () => {
  it('genera un id con prefisso di default', () => {
    const id = generateId();
    expect(id.startsWith('id')).toBe(true);
    expect(id.length).toBeGreaterThan(2);
  });
  it('genera un id con prefisso personalizzato', () => {
    const id = generateId('custom');
    expect(id.startsWith('custom')).toBe(true);
  });
  it('genera id diversi a ogni chiamata', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
