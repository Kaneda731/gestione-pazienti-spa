import { describe, it, expect } from 'vitest';
import { ActionButtons } from '../../../../../src/shared/components/ui/ActionButtons.js';

describe('ActionButtons', () => {
  const activePatient = {
    id: 1,
    data_dimissione: null
  };

  const dischargedPatient = {
    id: 2,
    data_dimissione: '2024-01-15'
  };

  describe('render', () => {
    it('should render table buttons by default', () => {
      const buttons = new ActionButtons(activePatient);
      const html = buttons.render();
      expect(html).toContain('btn-outline-primary');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="dimetti"');
    });

    it('should render mobile buttons when isMobile=true', () => {
      const buttons = new ActionButtons(activePatient, { isMobile: true });
      const html = buttons.render();
      expect(html).toContain('mobile-compact');
    });

    it('should render table buttons when isTable=true', () => {
      const buttons = new ActionButtons(activePatient, { isTable: true });
      const html = buttons.render();
      expect(html).toContain('btn-sm');
    });
  });

  describe('renderTableButtons', () => {
    it('should render dimetti button for active patient', () => {
      const buttons = new ActionButtons(activePatient);
      const html = buttons.renderTableButtons(false);
      expect(html).toContain('data-action="dimetti"');
      expect(html).toContain('event_available');
    });

    it('should render riattiva button for discharged patient', () => {
      const buttons = new ActionButtons(dischargedPatient);
      const html = buttons.renderTableButtons(true);
      expect(html).toContain('data-action="riattiva"');
      expect(html).toContain('undo');
    });

    it('should always include edit and delete buttons', () => {
      const buttons = new ActionButtons(activePatient);
      const html = buttons.renderTableButtons(false);
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });

  describe('renderMobileButtons', () => {
    it('should render compact buttons for mobile', () => {
      const buttons = new ActionButtons(activePatient);
      const html = buttons.renderMobileButtons(false);
      expect(html).toContain('mobile-compact');
      expect(html).toContain('mobile-text-xs');
    });
  });

  describe('renderDesktopButtons', () => {
    it('should render full buttons for desktop', () => {
      const buttons = new ActionButtons(activePatient);
      const html = buttons.renderDesktopButtons(false);
      expect(html).toContain('btn-outline-primary');
      expect(html).toContain('Modifica');
      expect(html).toContain('Dimetti');
    });
  });
});