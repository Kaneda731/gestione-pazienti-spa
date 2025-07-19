import { describe, it, expect } from 'vitest';
import { ErrorMessage } from '../src/shared/components/ui/ErrorMessage.js';

describe('ErrorMessage', () => {
  it('può essere istanziato', () => {
    const err = new ErrorMessage('Errore');
    expect(err).toBeInstanceOf(ErrorMessage);
  });
  it('renderCompact restituisce HTML', () => {
    const err = new ErrorMessage('Errore');
    const html = err.renderCompact();
    expect(typeof html).toBe('string');
    expect(html).toContain('Errore');
  });
});
