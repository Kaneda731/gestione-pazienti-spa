import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateForInput,
  formatName,
  formatNumber,
  truncateText,
  cleanText,
  capitalizeWords,
  generateId,
  slugify
} from '../../../../src/shared/utils/formatting.js';

describe('Formatting Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
      expect(formatDate(new Date('2024-01-15'))).toBe('15/01/2024');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatDateForInput', () => {
    it('should format date for input correctly', () => {
      expect(formatDateForInput('2024-01-15')).toBe('2024-01-15');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
    });
  });

  describe('formatName', () => {
    it('should format name correctly', () => {
      expect(formatName('mario')).toBe('Mario');
      expect(formatName('MARIO')).toBe('Mario');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatName(null)).toBe('');
      expect(formatName(undefined)).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('should format number correctly', () => {
      expect(formatNumber(1000)).toBe('1000');
      expect(formatNumber(1234)).toBe('1234');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatNumber(null)).toBe('');
      expect(formatNumber(undefined)).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('He...');
      expect(truncateText('Hi', 10)).toBe('Hi');
    });

    it('should return empty string for null/undefined', () => {
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText(undefined, 10)).toBe('');
    });
  });

  describe('cleanText', () => {
    it('should clean text correctly', () => {
      expect(cleanText('  hello   world  ')).toBe('hello world');
      expect(cleanText('hello\n\nworld')).toBe('hello world');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize words correctly', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('mario rossi')).toBe('Mario Rossi');
    });
  });

  describe('generateId', () => {
    it('should generate unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^id-\d+-[a-z0-9]+$/);
    });

    it('should use custom prefix', () => {
      const id = generateId('user');
      expect(id).toMatch(/^user-\d+-[a-z0-9]+$/);
    });
  });

  describe('slugify', () => {
    it('should create slug correctly', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Mario Rossi')).toBe('mario-rossi');
      expect(slugify('Caffè & Gelato')).toBe('caffe-gelato');
    });

    it('should return empty string for null/undefined', () => {
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
    });
  });
});