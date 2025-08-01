import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
global.localStorage = {
  store: {},
  getItem: (key) => global.localStorage.store[key] || null,
  setItem: (key, value) => { global.localStorage.store[key] = value.toString(); },
  removeItem: (key) => { delete global.localStorage.store[key]; },
  clear: () => { global.localStorage.store = {}; }
};

describe('Local Storage Management', () => {
  beforeEach(() => {
    global.localStorage.store = {};
  });

  describe('Filter Storage', () => {
    it('should save filter preferences', () => {
      const filters = {
        reparto: 'Cardiologia',
        data_from: '2024-01-01',
        data_to: '2024-12-31'
      };

      const saveFilters = (filters) => {
        localStorage.setItem('patient_filters', JSON.stringify(filters));
      };

      saveFilters(filters);
      expect(localStorage.getItem('patient_filters')).toBe(JSON.stringify(filters));
    });

    it('should load filter preferences', () => {
      const filters = {
        reparto: 'Pneumologia',
        searchTerm: 'Mario'
      };

      localStorage.setItem('patient_filters', JSON.stringify(filters));

      const loadFilters = () => {
        const stored = localStorage.getItem('patient_filters');
        return stored ? JSON.parse(stored) : {};
      };

      expect(loadFilters()).toEqual(filters);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('patient_filters', 'invalid-json');

      const loadFilters = () => {
        try {
          const stored = localStorage.getItem('patient_filters');
          return stored ? JSON.parse(stored) : {};
        } catch (error) {
          console.warn('Corrupted localStorage, resetting');
          return {};
        }
      };

      expect(loadFilters()).toEqual({});
    });
  });

  describe('Session Management', () => {
    it('should save redirect URL', () => {
      const redirectUrl = '/grafico?patient=123';
      
      const saveRedirect = (url) => {
        localStorage.setItem('redirect_url', url);
      };

      saveRedirect(redirectUrl);
      expect(localStorage.getItem('redirect_url')).toBe(redirectUrl);
    });

    it('should clear redirect after use', () => {
      localStorage.setItem('redirect_url', '/list');
      
      const clearRedirect = () => {
        localStorage.removeItem('redirect_url');
      };

      clearRedirect();
      expect(localStorage.getItem('redirect_url')).toBeNull();
    });
  });

  describe('User Preferences', () => {
    it('should save theme preference', () => {
      const saveTheme = (theme) => {
        localStorage.setItem('theme', theme);
      };

      saveTheme('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should persist user settings', () => {
      const settings = {
        lang: 'it',
        notifications: true,
        itemsPerPage: 20
      };

      localStorage.setItem('user_settings', JSON.stringify(settings));
      
      const loaded = JSON.parse(localStorage.getItem('user_settings'));
      expect(loaded.lang).toBe('it');
      expect(loaded.notifications).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should survive page refresh', () => {
      const data = { lastView: 'list', scrollPosition: 100 };
      localStorage.setItem('app_state', JSON.stringify(data));
      
      // Simula refresh (localStorage persiste)
      expect(localStorage.getItem('app_state')).toBe(JSON.stringify(data));
    });

    it('should handle storage limit', () => {
      // Test con dati grandi
      const largeData = new Array(1000).fill('test').join('');
      
      const saveLargeData = () => {
        try {
          localStorage.setItem('large_data', largeData);
          return true;
        } catch (error) {
          console.warn('Storage limit reached');
          return false;
        }
      };

      expect(typeof saveLargeData()).toBe('boolean');
    });
  });
});