/**
 * Test migrato per formatting utilities usando infrastruttura ottimizzata
 */

import { describe, it, expect } from 'vitest';

// Import delle utility da testare
import { slugify } from '../../../../src/shared/utils/formatting.js';

describe('Formatting Utilities', () => {
  describe('slugify', () => {
    it('should convert simple string to slug', () => {
      expect(slugify('Ciao Mondo')).toBe('ciao-mondo');
    });
    
    it('should handle accented characters', () => {
      expect(slugify('Città è già lì')).toBe('citta-e-gia-li');
    });
    
    it('should handle special characters', () => {
      expect(slugify('Hello, world!')).toBe('hello-world');
    });
    
    it('should handle multiple spaces and dashes', () => {
      expect(slugify('  prova   slug---test  ')).toBe('prova-slug-test');
    });
    
    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
    
    it('should handle null and undefined', () => {
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
    });
    
    it('should handle numbers', () => {
      expect(slugify('Test 123 ABC')).toBe('test-123-abc');
    });
    
    it('should handle mixed case with special chars', () => {
      expect(slugify('CamelCase & Special-Chars!')).toBe('camelcase-special-chars');
    });
  });
});