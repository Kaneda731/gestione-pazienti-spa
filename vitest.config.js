import { defineConfig } from 'vitest/config';
import { sharedResolve } from './shared.config.js';

export default defineConfig({
  test: {
    // Ambiente di test - verify existing JSDOM configuration handles all test requirements
    environment: 'jsdom',
    
    // Enhanced JSDOM configuration for better test environment consistency
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:5173',
        pretendToBeVisual: true,
        resources: 'usable'
      }
    },
    
    // Setup files
    setupFiles: ['__tests__/setup/__setup__/vitest.setup.js'],
    
    // Globals per i test
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        '__tests__/**',
        'coverage/**',
        'dist/**',
        'docs/**',
        'scripts/**',
        'src/debug/**',
        '**/*.config.js',
        '**/*.config.ts'
      ],
      // Soglie di coverage
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 80,
        statements: 80
      }
    },
    
    // Include/exclude patterns
    include: ['__tests__/unit/**/*.test.js', '__tests__/integration/**/*.test.js'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'docs/**',
      'scripts/**',
      '__tests__/e2e/**'
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-results.html'
    }
  },
  
  // Usa la configurazione condivisa per resolve
  resolve: sharedResolve,
  
  // Definizioni globali per compatibilità
  define: {
    'process.env': {}
  }
});