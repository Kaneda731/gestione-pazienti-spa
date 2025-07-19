import { describe, it, expect } from 'vitest';
import * as dom from '../src/shared/utils/dom.js';

describe('dom utils', () => {
  it('createElement crea un elemento', () => {
    const el = dom.createElement('div', { className: 'test' }, 'ciao');
    expect(el).toBeInstanceOf(Element);
    expect(el.className).toBe('test');
    expect(el.innerHTML).toBe('ciao');
  });
  it('addClass aggiunge una classe', () => {
    const el = document.createElement('div');
    dom.addClass(el, 'pippo');
    expect(el.classList.contains('pippo')).toBe(true);
  });
  it('removeClass rimuove una classe', () => {
    const el = document.createElement('div');
    el.className = 'pippo';
    dom.removeClass(el, 'pippo');
    expect(el.classList.contains('pippo')).toBe(false);
  });
});
