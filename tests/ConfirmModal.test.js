import { describe, it, expect } from 'vitest';
import { ConfirmModal } from '../src/shared/components/ui/ConfirmModal.js';

describe('ConfirmModal', () => {
  it('può essere istanziato', () => {
    const modal = new ConfirmModal({ title: 'Test', message: 'Messaggio' });
    expect(modal).toBeInstanceOf(ConfirmModal);
    expect(modal.options.title).toBe('Test');
  });
  it('render restituisce HTML', () => {
    const modal = new ConfirmModal({ title: 'Test', message: 'Messaggio' });
    const html = modal.render();
    expect(typeof html).toBe('string');
    expect(html).toContain('Test');
  });
});
