import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PatientCache } from '../../../../../src/features/patients/services/patient-cache/PatientCache.js';

describe('PatientCache', () => {
  let cache;
  let originalSetTimeout;
  let originalClearTimeout;

  beforeEach(() => {
    // Mock timers
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    vi.useFakeTimers();
    
    cache = new PatientCache(5000); // 5 second timeout for testing
  });

  afterEach(() => {
    cache.clear();
    vi.useRealTimers();
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Basic Cache Operations', () => {
    test('should store and retrieve values', () => {
      const testData = { id: 1, nome: 'Mario', cognome: 'Rossi' };
      
      cache.set('patient_1', testData);
      const retrieved = cache.get('patient_1');
      
      expect(retrieved).toEqual(testData);
    });

    test('should return undefined for non-existent keys', () => {
      const result = cache.get('non_existent_key');
      
      expect(result).toBeUndefined();
    });

    test('should overwrite existing values', () => {
      const originalData = { id: 1, nome: 'Mario' };
      const updatedData = { id: 1, nome: 'Luigi' };
      
      cache.set('patient_1', originalData);
      cache.set('patient_1', updatedData);
      
      const retrieved = cache.get('patient_1');
      expect(retrieved).toEqual(updatedData);
    });
  });

  describe('Cache Expiration', () => {
    test('should expire entries after timeout', () => {
      const testData = { id: 1, nome: 'Mario' };
      
      cache.set('patient_1', testData);
      
      // Verify data is initially available
      expect(cache.get('patient_1')).toEqual(testData);
      
      // Fast-forward time beyond timeout
      vi.advanceTimersByTime(6000);
      
      // Data should be expired and removed
      expect(cache.get('patient_1')).toBeUndefined();
    });

    test('should not expire entries before timeout', () => {
      const testData = { id: 1, nome: 'Mario' };
      
      cache.set('patient_1', testData);
      
      // Fast-forward time but not beyond timeout
      vi.advanceTimersByTime(3000);
      
      // Data should still be available
      expect(cache.get('patient_1')).toEqual(testData);
    });

    test('should reset expiration timer when accessing entry', () => {
      const testData = { id: 1, nome: 'Mario' };
      
      cache.set('patient_1', testData);
      
      // Fast-forward time close to timeout
      vi.advanceTimersByTime(4000);
      
      // Access the entry (should reset timer)
      cache.get('patient_1');
      
      // Fast-forward another 4 seconds (total 8, but timer was reset)
      vi.advanceTimersByTime(4000);
      
      // Data should still be available
      expect(cache.get('patient_1')).toEqual(testData);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate specific entries', () => {
      const testData1 = { id: 1, nome: 'Mario' };
      const testData2 = { id: 2, nome: 'Luigi' };
      
      cache.set('patient_1', testData1);
      cache.set('patient_2', testData2);
      
      cache.invalidate('patient_1');
      
      expect(cache.get('patient_1')).toBeUndefined();
      expect(cache.get('patient_2')).toEqual(testData2);
    });

    test('should handle invalidation of non-existent keys', () => {
      expect(() => {
        cache.invalidate('non_existent_key');
      }).not.toThrow();
    });

    test('should clear expiration timer when invalidating', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      cache.set('patient_1', { id: 1 });
      cache.invalidate('patient_1');
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Cache Clearing', () => {
    test('should clear all entries', () => {
      cache.set('patient_1', { id: 1 });
      cache.set('patient_2', { id: 2 });
      cache.set('patients_list', []);
      
      cache.clear();
      
      expect(cache.get('patient_1')).toBeUndefined();
      expect(cache.get('patient_2')).toBeUndefined();
      expect(cache.get('patients_list')).toBeUndefined();
    });

    test('should clear all expiration timers', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      cache.set('patient_1', { id: 1 });
      cache.set('patient_2', { id: 2 });
      
      cache.clear();
      
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('patient_1', { id: 1 });
      expect(cache.size()).toBe(1);
      
      cache.set('patient_2', { id: 2 });
      expect(cache.size()).toBe(2);
      
      cache.invalidate('patient_1');
      expect(cache.size()).toBe(1);
    });

    test('should provide cache keys', () => {
      cache.set('patient_1', { id: 1 });
      cache.set('patients_list', []);
      
      const keys = cache.keys();
      
      expect(keys).toContain('patient_1');
      expect(keys).toContain('patients_list');
      expect(keys).toHaveLength(2);
    });

    test('should check if key exists', () => {
      cache.set('patient_1', { id: 1 });
      
      expect(cache.has('patient_1')).toBe(true);
      expect(cache.has('non_existent')).toBe(false);
    });
  });

  describe('Memory Management', () => {
    test('should handle large datasets', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        nome: `Patient${i}`,
        data: 'x'.repeat(1000)
      }));
      
      cache.set('large_dataset', largeDataset);
      
      const retrieved = cache.get('large_dataset');
      expect(retrieved).toHaveLength(1000);
      expect(retrieved[0].nome).toBe('Patient0');
    });

    test('should handle cache size limits', () => {
      const limitedCache = new PatientCache(5000, { maxSize: 3 });
      
      limitedCache.set('key1', 'value1');
      limitedCache.set('key2', 'value2');
      limitedCache.set('key3', 'value3');
      limitedCache.set('key4', 'value4'); // Should evict oldest
      
      expect(limitedCache.has('key1')).toBe(false); // Evicted
      expect(limitedCache.has('key2')).toBe(true);
      expect(limitedCache.has('key3')).toBe(true);
      expect(limitedCache.has('key4')).toBe(true);
    });
  });

  describe('Configuration', () => {
    test('should use custom timeout', () => {
      const customCache = new PatientCache(1000); // 1 second timeout
      
      customCache.set('test_key', 'test_value');
      
      // Fast-forward 500ms - should still exist
      vi.advanceTimersByTime(500);
      expect(customCache.get('test_key')).toBe('test_value');
      
      // Fast-forward another 600ms - should be expired
      vi.advanceTimersByTime(600);
      expect(customCache.get('test_key')).toBeUndefined();
    });

    test('should handle zero timeout (no expiration)', () => {
      const noExpirationCache = new PatientCache(0);
      
      noExpirationCache.set('persistent_key', 'persistent_value');
      
      // Fast-forward a long time
      vi.advanceTimersByTime(100000);
      
      // Should still exist
      expect(noExpirationCache.get('persistent_key')).toBe('persistent_value');
    });
  });

  describe('Error Handling', () => {
    test('should handle circular references in data', () => {
      const circularData = { id: 1, nome: 'Mario' };
      circularData.self = circularData;
      
      expect(() => {
        cache.set('circular_key', circularData);
      }).not.toThrow();
      
      const retrieved = cache.get('circular_key');
      expect(retrieved.id).toBe(1);
      expect(retrieved.nome).toBe('Mario');
    });

    test('should handle undefined and null values', () => {
      cache.set('null_key', null);
      cache.set('undefined_key', undefined);
      
      expect(cache.get('null_key')).toBeNull();
      expect(cache.get('undefined_key')).toBeUndefined();
    });

    test('should handle invalid keys gracefully', () => {
      expect(() => {
        cache.set(null, 'value');
      }).not.toThrow();
      
      expect(() => {
        cache.get(undefined);
      }).not.toThrow();
    });
  });
});