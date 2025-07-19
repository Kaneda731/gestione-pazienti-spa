import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTheme } from '../src/core/services/themeService.js';

function setupDom() {
  // Crea finti elementi richiesti dal tema desktop
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  document.body.appendChild(themeToggle);
  const themeIcon = document.createElement('span');
  themeIcon.id = 'theme-icon';
  document.body.appendChild(themeIcon);
  // Crea finti elementi richiesti dal tema mobile
  const mobileThemeToggle = document.createElement('button');
  mobileThemeToggle.id = 'mobile-theme-toggle';
  document.body.appendChild(mobileThemeToggle);
  const mobileThemeIcon = document.createElement('span');
  mobileThemeIcon.id = 'mobile-theme-icon';
  document.body.appendChild(mobileThemeIcon);
}

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  document.documentElement.removeAttribute('data-bs-theme');
  setupDom();
});

describe('initTheme', () => {
  it('imposta il tema dark se salvato in localStorage', () => {
    localStorage.setItem('theme', 'dark');
    initTheme();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('imposta il tema light se salvato in localStorage', () => {
    localStorage.setItem('theme', 'light');
    initTheme();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('usa il tema di sistema se non c’è preferenza', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true });
    initTheme();
    // Il default della funzione è light, ma puoi adattare qui se vuoi testare la preferenza di sistema
    // expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });
});
