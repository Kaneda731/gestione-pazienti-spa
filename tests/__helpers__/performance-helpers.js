/**
 * Helper per monitoring performance test
 */

import { vi } from 'vitest';

/**
 * Monitor performance test con metriche dettagliate
 */
export class TestPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = new Map();
    this.isMonitoring = false;
    this.startTime = null;
  }
  
  /**
   * Inizia monitoring performance
   */
  start(testName = 'default') {
    this.isMonitoring = true;
    this.startTime = this.now();
    
    this.metrics.set(testName, {
      startTime: this.startTime,
      endTime: null,
      duration: null,
      memoryStart: this.getMemoryUsage(),
      memoryEnd: null,
      memoryDelta: null,
      operations: [],
      warnings: []
    });
    
    return testName;
  }
  
  /**
   * Ferma monitoring e calcola metriche
   */
  stop(testName = 'default') {
    if (!this.isMonitoring) return null;
    
    const endTime = this.now();
    const metric = this.metrics.get(testName);
    
    if (metric) {
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.memoryEnd = this.getMemoryUsage();
      
      if (metric.memoryStart && metric.memoryEnd) {
        metric.memoryDelta = metric.memoryEnd.heapUsed - metric.memoryStart.heapUsed;
      }
      
      // Verifica soglie
      this.checkThresholds(testName, metric);
    }
    
    this.isMonitoring = false;
    return metric;
  }
  
  /**
   * Misura performance di una funzione
   */
  async measure(fn, testName = 'measure') {
    this.start(testName);
    
    try {
      const result = await fn();
      const metrics = this.stop(testName);
      
      return {
        result,
        metrics
      };
    } catch (error) {
      this.stop(testName);
      throw error;
    }
  }
  
  /**
   * Benchmark di multiple funzioni
   */
  async benchmark(functions, options = {}) {
    const { iterations = 100, warmup = 10 } = options;
    const results = [];
    
    for (const [name, fn] of Object.entries(functions)) {
      // Warmup
      for (let i = 0; i < warmup; i++) {
        await fn();
      }
      
      // Benchmark
      const times = [];
      const memoryUsages = [];
      
      for (let i = 0; i < iterations; i++) {
        const testName = `${name}_${i}`;
        const { metrics } = await this.measure(fn, testName);
        
        times.push(metrics.duration);
        if (metrics.memoryDelta) {
          memoryUsages.push(metrics.memoryDelta);
        }
      }
      
      const stats = this.calculateStats(times);
      const memoryStats = memoryUsages.length > 0 ? this.calculateStats(memoryUsages) : null;
      
      results.push({
        name,
        iterations,
        time: stats,
        memory: memoryStats
      });
    }
    
    return results;
  }
  
  /**
   * Calcola statistiche da array di valori
   */
  calculateStats(values) {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: this.calculateStdDev(values, sum / values.length)
    };
  }
  
  /**
   * Calcola deviazione standard
   */
  calculateStdDev(values, mean) {
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Imposta soglia performance per test
   */
  setThreshold(testName, thresholdMs, memoryThresholdMB = null) {
    this.thresholds.set(testName, {
      time: thresholdMs,
      memory: memoryThresholdMB ? memoryThresholdMB * 1024 * 1024 : null
    });
  }
  
  /**
   * Verifica soglie performance
   */
  checkThresholds(testName, metrics) {
    const threshold = this.thresholds.get(testName);
    if (!threshold) return;
    
    // Verifica soglia tempo
    if (threshold.time && metrics.duration > threshold.time) {
      metrics.warnings.push({
        type: 'time_threshold_exceeded',
        message: `Test ${testName} exceeded time threshold: ${metrics.duration}ms > ${threshold.time}ms`,
        actual: metrics.duration,
        threshold: threshold.time
      });
    }
    
    // Verifica soglia memoria
    if (threshold.memory && metrics.memoryDelta && metrics.memoryDelta > threshold.memory) {
      metrics.warnings.push({
        type: 'memory_threshold_exceeded',
        message: `Test ${testName} exceeded memory threshold: ${metrics.memoryDelta}B > ${threshold.memory}B`,
        actual: metrics.memoryDelta,
        threshold: threshold.memory
      });
    }
  }
  
  /**
   * Ottiene tempo corrente ad alta precisione
   */
  now() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }
  
  /**
   * Ottiene utilizzo memoria
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        heapLimit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return null;
  }
  
  /**
   * Forza garbage collection se disponibile
   */
  forceGC() {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
  
  /**
   * Ottiene report completo performance
   */
  getReport() {
    const report = {
      summary: {
        totalTests: this.metrics.size,
        slowTests: [],
        memoryHeavyTests: [],
        warnings: []
      },
      details: {}
    };
    
    for (const [testName, metrics] of this.metrics.entries()) {
      report.details[testName] = metrics;
      
      // Identifica test lenti (> 1000ms)
      if (metrics.duration > 1000) {
        report.summary.slowTests.push({
          name: testName,
          duration: metrics.duration
        });
      }
      
      // Identifica test che usano molta memoria (> 10MB)
      if (metrics.memoryDelta && metrics.memoryDelta > 10 * 1024 * 1024) {
        report.summary.memoryHeavyTests.push({
          name: testName,
          memoryDelta: metrics.memoryDelta
        });
      }
      
      // Aggiungi warnings
      if (metrics.warnings.length > 0) {
        report.summary.warnings.push(...metrics.warnings);
      }
    }
    
    return report;
  }
  
  /**
   * Reset di tutte le metriche
   */
  reset() {
    this.metrics.clear();
    this.thresholds.clear();
    this.isMonitoring = false;
    this.startTime = null;
  }
}

/**
 * Istanza globale del monitor
 */
export const performanceMonitor = new TestPerformanceMonitor();

/**
 * Decorator per misurare performance di test
 */
export function measurePerformance(testName, threshold) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      if (threshold) {
        performanceMonitor.setThreshold(testName, threshold);
      }
      
      const { result, metrics } = await performanceMonitor.measure(
        () => originalMethod.apply(this, args),
        testName
      );
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Helper per test di performance specifici
 */
export const performanceHelpers = {
  /**
   * Testa performance rendering componenti
   */
  async testRenderingPerformance(renderFn, iterations = 100) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performanceMonitor.now();
      await renderFn();
      const end = performanceMonitor.now();
      times.push(end - start);
    }
    
    return performanceMonitor.calculateStats(times);
  },
  
  /**
   * Testa performance operazioni CRUD
   */
  async testCRUDPerformance(crudOperations, dataSize = 100) {
    const results = {};
    
    // Genera dati di test
    const testData = Array.from({ length: dataSize }, (_, i) => ({
      id: i,
      name: `Test Item ${i}`,
      value: Math.random() * 100
    }));
    
    // Test CREATE
    if (crudOperations.create) {
      const { metrics } = await performanceMonitor.measure(async () => {
        for (const item of testData) {
          await crudOperations.create(item);
        }
      }, 'crud_create');
      
      results.create = {
        totalTime: metrics.duration,
        avgTimePerItem: metrics.duration / dataSize,
        itemsPerSecond: (dataSize / metrics.duration) * 1000
      };
    }
    
    // Test READ
    if (crudOperations.read) {
      const { metrics } = await performanceMonitor.measure(async () => {
        for (let i = 0; i < dataSize; i++) {
          await crudOperations.read(i);
        }
      }, 'crud_read');
      
      results.read = {
        totalTime: metrics.duration,
        avgTimePerItem: metrics.duration / dataSize,
        itemsPerSecond: (dataSize / metrics.duration) * 1000
      };
    }
    
    // Test UPDATE
    if (crudOperations.update) {
      const { metrics } = await performanceMonitor.measure(async () => {
        for (let i = 0; i < dataSize; i++) {
          await crudOperations.update(i, { name: `Updated Item ${i}` });
        }
      }, 'crud_update');
      
      results.update = {
        totalTime: metrics.duration,
        avgTimePerItem: metrics.duration / dataSize,
        itemsPerSecond: (dataSize / metrics.duration) * 1000
      };
    }
    
    // Test DELETE
    if (crudOperations.delete) {
      const { metrics } = await performanceMonitor.measure(async () => {
        for (let i = 0; i < dataSize; i++) {
          await crudOperations.delete(i);
        }
      }, 'crud_delete');
      
      results.delete = {
        totalTime: metrics.duration,
        avgTimePerItem: metrics.duration / dataSize,
        itemsPerSecond: (dataSize / metrics.duration) * 1000
      };
    }
    
    return results;
  },
  
  /**
   * Testa performance con dataset di dimensioni crescenti
   */
  async testScalability(testFn, dataSizes = [10, 100, 1000]) {
    const results = [];
    
    for (const size of dataSizes) {
      const { metrics } = await performanceMonitor.measure(
        () => testFn(size),
        `scalability_${size}`
      );
      
      results.push({
        dataSize: size,
        duration: metrics.duration,
        memoryDelta: metrics.memoryDelta,
        throughput: (size / metrics.duration) * 1000 // items per second
      });
    }
    
    return results;
  },
  
  /**
   * Testa memory leaks
   */
  async testMemoryLeaks(testFn, iterations = 50) {
    const memorySnapshots = [];
    
    // Baseline
    performanceMonitor.forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    memorySnapshots.push(performanceMonitor.getMemoryUsage());
    
    // Esegui test multiple volte
    for (let i = 0; i < iterations; i++) {
      await testFn();
      
      if (i % 10 === 0) {
        performanceMonitor.forceGC();
        await new Promise(resolve => setTimeout(resolve, 100));
        memorySnapshots.push(performanceMonitor.getMemoryUsage());
      }
    }
    
    // Analizza trend memoria
    const memoryTrend = memorySnapshots.map((snapshot, index) => ({
      iteration: index * 10,
      heapUsed: snapshot ? snapshot.heapUsed : 0
    }));
    
    // Calcola slope per rilevare memory leak
    const slope = this.calculateMemorySlope(memoryTrend);
    
    return {
      memoryTrend,
      slope,
      hasLeak: slope > 1000, // Soglia arbitraria per memory leak
      totalMemoryIncrease: memoryTrend[memoryTrend.length - 1].heapUsed - memoryTrend[0].heapUsed
    };
  },
  
  /**
   * Calcola slope del trend memoria
   */
  calculateMemorySlope(memoryTrend) {
    if (memoryTrend.length < 2) return 0;
    
    const n = memoryTrend.length;
    const sumX = memoryTrend.reduce((sum, point) => sum + point.iteration, 0);
    const sumY = memoryTrend.reduce((sum, point) => sum + point.heapUsed, 0);
    const sumXY = memoryTrend.reduce((sum, point) => sum + point.iteration * point.heapUsed, 0);
    const sumXX = memoryTrend.reduce((sum, point) => sum + point.iteration * point.iteration, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
};

/**
 * Assertions per performance
 */
export const performanceAssertions = {
  /**
   * Verifica che una funzione si esegua entro una soglia
   */
  async expectWithinTime(fn, thresholdMs, message) {
    const start = performanceMonitor.now();
    await fn();
    const duration = performanceMonitor.now() - start;
    
    if (duration > thresholdMs) {
      throw new Error(
        message || `Expected execution within ${thresholdMs}ms, but took ${duration}ms`
      );
    }
    
    return duration;
  },
  
  /**
   * Verifica che una funzione non usi troppa memoria
   */
  async expectMemoryUsageBelow(fn, thresholdMB, message) {
    const memoryBefore = performanceMonitor.getMemoryUsage();
    await fn();
    performanceMonitor.forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));
    const memoryAfter = performanceMonitor.getMemoryUsage();
    
    if (memoryBefore && memoryAfter) {
      const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const thresholdBytes = thresholdMB * 1024 * 1024;
      
      if (memoryDelta > thresholdBytes) {
        throw new Error(
          message || `Expected memory usage below ${thresholdMB}MB, but used ${memoryDelta / 1024 / 1024}MB`
        );
      }
      
      return memoryDelta;
    }
    
    return 0;
  },
  
  /**
   * Verifica che il throughput sia sopra una soglia
   */
  async expectThroughputAbove(fn, itemCount, minItemsPerSecond, message) {
    const start = performanceMonitor.now();
    await fn();
    const duration = performanceMonitor.now() - start;
    
    const actualThroughput = (itemCount / duration) * 1000;
    
    if (actualThroughput < minItemsPerSecond) {
      throw new Error(
        message || `Expected throughput above ${minItemsPerSecond} items/sec, but got ${actualThroughput}`
      );
    }
    
    return actualThroughput;
  }
};

/**
 * Utilities per profiling
 */
export const profiling = {
  /**
   * Profila chiamate a funzioni
   */
  profileFunction(fn, name = 'function') {
    const calls = [];
    
    return function(...args) {
      const start = performanceMonitor.now();
      const result = fn.apply(this, args);
      const duration = performanceMonitor.now() - start;
      
      calls.push({
        args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
        duration,
        timestamp: Date.now()
      });
      
      // Aggiungi metodo per ottenere statistiche
      if (!result || typeof result !== 'object') {
        return result;
      }
      
      result.getProfileStats = () => ({
        name,
        totalCalls: calls.length,
        totalTime: calls.reduce((sum, call) => sum + call.duration, 0),
        avgTime: calls.reduce((sum, call) => sum + call.duration, 0) / calls.length,
        calls: [...calls]
      });
      
      return result;
    };
  },
  
  /**
   * Crea flame graph semplificato
   */
  createFlameGraph(profileData) {
    // Implementazione semplificata per test environment
    return {
      name: profileData.name,
      totalTime: profileData.totalTime,
      children: profileData.calls.map(call => ({
        name: `Call ${call.timestamp}`,
        duration: call.duration,
        args: call.args
      }))
    };
  }
};