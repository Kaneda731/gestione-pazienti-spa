// src/js/components/__tests__/CustomSelect.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomSelect } from '../CustomSelect';

// Mock di appLogger per evitare errori in console
window.appLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

describe('CustomSelect Component', () => {
  let selectElement, customSelectInstance;

  beforeEach(() => {
    // Mock di scrollIntoView che non è implementato in jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Crea il DOM per ogni test
    document.body.innerHTML = `
      <select id="test-select">
        <option value="">Seleziona...</option>
        <option value="1">Opzione 1</option>
        <option value="2" selected>Opzione 2</option>
        <option value="3">Opzione 3</option>
      </select>
    `;
    selectElement = document.getElementById('test-select');
    customSelectInstance = new CustomSelect(selectElement);
  });

  afterEach(() => {
    // Pulisci il DOM
    document.body.innerHTML = '';
    customSelectInstance.destroy();
  });

  it('dovrebbe inizializzare correttamente nascondendo l-originale e creando il wrapper', () => {
    expect(selectElement.style.display).toBe('none');
    const wrapper = document.querySelector('.custom-select-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('dovrebbe impostare il valore iniziale basato sull-attributo "selected"', () => {
    const label = document.querySelector('.custom-select-label');
    expect(label.textContent).toBe('Opzione 2');
    expect(customSelectInstance.selectedValue).toBe('2');
  });

  it('dovrebbe aprire il dropdown al click sul trigger', () => {
    const trigger = document.querySelector('.custom-select-trigger');
    trigger.click();
    const wrapper = document.querySelector('.custom-select-wrapper');
    expect(wrapper.classList.contains('open')).toBe(true);
  });

  it('dovrebbe chiudere il dropdown al secondo click sul trigger', () => {
    const trigger = document.querySelector('.custom-select-trigger');
    trigger.click(); // Apre
    trigger.click(); // Chiude
    const wrapper = document.querySelector('.custom-select-wrapper');
    expect(wrapper.classList.contains('open')).toBe(false);
  });

  it('dovrebbe selezionare un-opzione e chiudere il dropdown al click', () => {
    const trigger = document.querySelector('.custom-select-trigger');
    trigger.click(); // Apre

    const optionToSelect = document.querySelector('.custom-select-option[data-value="3"]');
    optionToSelect.click();

    const wrapper = document.querySelector('.custom-select-wrapper');
    const label = document.querySelector('.custom-select-label');

    expect(wrapper.classList.contains('open')).toBe(false);
    expect(label.textContent).toBe('Opzione 3');
    expect(selectElement.value).toBe('3');
  });

  it('dovrebbe chiudere il dropdown cliccando fuori dal componente', () => {
    const trigger = document.querySelector('.custom-select-trigger');
    trigger.click(); // Apre

    document.body.click(); // Simula un click esterno

    const wrapper = document.querySelector('.custom-select-wrapper');
    expect(wrapper.classList.contains('open')).toBe(false);
  });
  
  it('dovrebbe impostare un valore programmaticamente con setValue', () => {
    customSelectInstance.setValue('1');
    
    const label = document.querySelector('.custom-select-label');
    expect(label.textContent).toBe('Opzione 1');
    expect(selectElement.value).toBe('1');
  });

  it('dovrebbe essere navigabile con la tastiera', () => {
    const wrapper = document.querySelector('.custom-select-wrapper');
    
    // Apre con Enter
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(wrapper.classList.contains('open')).toBe(true);

    // Naviga giù
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    let focused = document.querySelector('.custom-select-option.focused');
    expect(focused.textContent).toBe('Opzione 1');

    // Naviga ancora giù
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    focused = document.querySelector('.custom-select-option.focused');
    expect(focused.textContent).toBe('Opzione 2');
    
    // Chiude con Escape
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.classList.contains('open')).toBe(false);
  });
});
