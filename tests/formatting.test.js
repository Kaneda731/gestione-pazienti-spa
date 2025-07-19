import { describe, it, expect } from 'vitest';
import { slugify } from '../src/shared/utils/formatting.js';

describe('slugify', () => {
  it('converte una stringa semplice in slug', () => {
    expect(slugify('Ciao Mondo')).toBe('ciao-mondo');
  });
  it('gestisce caratteri accentati', () => {
    expect(slugify('Città è già lì')).toBe('citta-e-gia-li');
  });
  it('gestisce caratteri speciali', () => {
    expect(slugify('Hello, world!')).toBe('hello-world');
  });
  it('gestisce spazi multipli e trattini', () => {
    expect(slugify('  prova   slug---test  ')).toBe('prova-slug-test');
  });
  it('gestisce stringa vuota', () => {
    expect(slugify('')).toBe('');
  });
});
