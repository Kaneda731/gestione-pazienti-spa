import { describe, it, expect } from 'vitest';
import { FormField } from '../src/shared/components/ui/FormField.js';

describe('FormField', () => {
  it('può essere istanziato', () => {
    const field = new FormField({ name: 'test', required: true });
    expect(field).toBeInstanceOf(FormField);
  });
  it('getCommonAttributes restituisce una stringa', () => {
    const field = new FormField({ name: 'test', required: true });
    expect(typeof field.getCommonAttributes()).toBe('string');
  });
});
