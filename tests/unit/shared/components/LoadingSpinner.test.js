/**
 * Test migrato per LoadingSpinner usando infrastruttura ottimizzata
 * Basato sull'implementazione reale del componente
 */

import { describe, it, expect } from 'vitest';

// Import del componente da testare
import { LoadingSpinner } from '../../../../src/shared/components/ui/LoadingSpinner.js';

describe('LoadingSpinner Component', () => {
  describe('Instantiation', () => {
    it('should be instantiated successfully', () => {
      const spinner = new LoadingSpinner();
      
      expect(spinner).toBeInstanceOf(LoadingSpinner);
      expect(spinner.options).toBeDefined();
    });
    
    it('should be instantiated with default options', () => {
      const spinner = new LoadingSpinner();
      
      expect(spinner.options.size).toBe('normal');
      expect(spinner.options.text).toBe('Caricamento...');
      expect(spinner.options.centered).toBe(true);
    });
    
    it('should be instantiated with custom options', () => {
      const options = { size: 'large', text: 'Loading...', centered: false };
      const spinner = new LoadingSpinner(options);
      
      expect(spinner.options.size).toBe('large');
      expect(spinner.options.text).toBe('Loading...');
      expect(spinner.options.centered).toBe(false);
    });
  });
  
  describe('Rendering', () => {
    it('should render spinner HTML with default options', () => {
      const spinner = new LoadingSpinner();
      const html = spinner.render();
      
      expect(html).toContain('spinner-border');
      expect(html).toContain('text-center');
      expect(html).toContain('Caricamento...');
      expect(html).toContain('visually-hidden');
    });
    
    it('should render with custom size', () => {
      const spinner = new LoadingSpinner({ size: 'large' });
      const html = spinner.render();
      
      expect(html).toContain('spinner-border-lg');
      expect(html).toContain('spinner-border');
    });
    
    it('should render with small size', () => {
      const spinner = new LoadingSpinner({ size: 'small' });
      const html = spinner.render();
      
      expect(html).toContain('spinner-border-sm');
    });
    
    it('should render without centering', () => {
      const spinner = new LoadingSpinner({ centered: false });
      const html = spinner.render();
      
      expect(html).not.toContain('text-center');
      expect(html).toContain('spinner-border');
    });
    
    it('should render with custom text', () => {
      const spinner = new LoadingSpinner({ text: 'Custom loading...' });
      const html = spinner.render();
      
      expect(html).toContain('Custom loading...');
    });
  });
  
  describe('Specialized Rendering Methods', () => {
    it('should render for table', () => {
      const spinner = new LoadingSpinner();
      const html = spinner.renderForTable(5);
      
      expect(html).toContain('<tr>');
      expect(html).toContain('colspan="5"');
      expect(html).toContain('spinner-border');
    });
    
    it('should render for cards', () => {
      const spinner = new LoadingSpinner();
      const html = spinner.renderForCards();
      
      expect(html).toContain('text-center p-4');
      expect(html).toContain('spinner-border');
    });
    
    it('should render for button', () => {
      const spinner = new LoadingSpinner();
      const html = spinner.renderForButton();
      
      expect(html).toContain('spinner-border-sm');
      expect(html).toContain('me-2');
    });
  });
  
  describe('Size Class Method', () => {
    it('should return correct size class for small', () => {
      const spinner = new LoadingSpinner({ size: 'small' });
      
      expect(spinner.getSizeClass()).toBe('spinner-border-sm');
    });
    
    it('should return correct size class for large', () => {
      const spinner = new LoadingSpinner({ size: 'large' });
      
      expect(spinner.getSizeClass()).toBe('spinner-border-lg');
    });
    
    it('should return empty string for normal size', () => {
      const spinner = new LoadingSpinner({ size: 'normal' });
      
      expect(spinner.getSizeClass()).toBe('');
    });
  });
  
  describe('Static Methods', () => {
    it('should create spinner for button', () => {
      const html = LoadingSpinner.forButton('Loading...');
      
      expect(html).toContain('spinner-border-sm');
      expect(html).toContain('Loading...');
    });
    
    it('should create spinner for table', () => {
      const html = LoadingSpinner.forTable(3);
      
      expect(html).toContain('colspan="3"');
      expect(html).toContain('spinner-border');
    });
    
    it('should create spinner for cards', () => {
      const html = LoadingSpinner.forCards('Loading data...');
      
      expect(html).toContain('text-center p-4');
      expect(html).toContain('Loading data...');
    });
    
    it('should create spinner for cards without text', () => {
      const html = LoadingSpinner.forCards();
      
      expect(html).toContain('text-center p-4');
      expect(html).toContain('spinner-border');
    });
  });
});