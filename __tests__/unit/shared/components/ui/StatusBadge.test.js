import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../../../../../src/shared/components/ui/StatusBadge.js';

describe('StatusBadge', () => {
  const activePatient = {
    data_dimissione: null
  };

  const dischargedPatient = {
    data_dimissione: '2024-01-15'
  };

  const decedutoPatient = {
    data_dimissione: '2024-02-01',
    tipo_dimissione: 'decesso'
  };

  describe('render', () => {
    it('should render active badge for active patient', () => {
      const badge = new StatusBadge(activePatient);
      const html = badge.render();
      expect(html).toContain('bg-success');
      expect(html).toContain('Attivo');
    });

    it('should render discharged badge for discharged patient', () => {
      const badge = new StatusBadge(dischargedPatient);
      const html = badge.render();
      expect(html).toContain('bg-secondary');
      expect(html).toContain('Dimesso');
    });

    it('should render decesso badge for deceased patient', () => {
      const badge = new StatusBadge(decedutoPatient);
      const html = badge.render();
      expect(html).toContain('bg-dark');
      expect(html).toContain('Decesso');
    });
  });

  describe('renderForCard', () => {
    it('should render card style for active patient', () => {
      const badge = new StatusBadge(activePatient);
      const html = badge.renderForCard();
      expect(html).toContain('patient-status attivo');
      expect(html).toContain('Attivo');
    });

    it('should render card style for discharged patient', () => {
      const badge = new StatusBadge(dischargedPatient);
      const html = badge.renderForCard();
      expect(html).toContain('patient-status dimesso');
      expect(html).toContain('Dimesso');
    });

    it('should render card style for deceased patient', () => {
      const badge = new StatusBadge(decedutoPatient);
      const html = badge.renderForCard();
      expect(html).toContain('patient-status decesso');
      expect(html).toContain('Decesso');
    });
  });

  describe('getStatusClass', () => {
    it('should return "attivo" for active patient', () => {
      const badge = new StatusBadge(activePatient);
      expect(badge.getStatusClass()).toBe('attivo');
    });

    it('should return "dimesso" for discharged patient', () => {
      const badge = new StatusBadge(dischargedPatient);
      expect(badge.getStatusClass()).toBe('dimesso');
    });

    it('should return "decesso" for deceased patient', () => {
      const badge = new StatusBadge(decedutoPatient);
      expect(badge.getStatusClass()).toBe('decesso');
    });
  });

  describe('getStatusText', () => {
    it('should return "Attivo" for active patient', () => {
      const badge = new StatusBadge(activePatient);
      expect(badge.getStatusText()).toBe('Attivo');
    });

    it('should return "Dimesso" for discharged patient', () => {
      const badge = new StatusBadge(dischargedPatient);
      expect(badge.getStatusText()).toBe('Dimesso');
    });

    it('should return "Decesso" for deceased patient', () => {
      const badge = new StatusBadge(decedutoPatient);
      expect(badge.getStatusText()).toBe('Decesso');
    });
  });
});