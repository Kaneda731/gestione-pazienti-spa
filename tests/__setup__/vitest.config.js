import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/__setup__/global-setup.js',
      './tests/__setup__/test-environment.js'
    ],
    
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2
      }
    },
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // File patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'tests/__setup__/**',
      'tests/__mocks__/**',
      'tests/__fixtures__/**',
      'tests/__helpers__/**',
      'tests/templates/**',
      'node_modules/**',
      'dist/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'tests/**',
        'node_modules/**',
        'dist/**',
        '**/*.config.js',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@tests': resolve(__dirname, '../'),
      '@mocks': resolve(__dirname, '../__mocks__'),
      '@fixtures': resolve(__dirname, '../__fixtures__'),
      '@helpers': resolve(__dirname, '../__helpers__')
    }
  }
});