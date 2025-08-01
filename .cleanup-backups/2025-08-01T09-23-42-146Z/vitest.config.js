import { defineConfig } from 'vitest/config';
import { sharedResolve } from './shared.config.js';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      '__tests__/unit/**/*.test.js',
      '__tests__/integration/**/*.test.js'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '__tests__/e2e/**'
    ],
    setupFiles: ['./__tests__/setup/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '__tests__/**',
        '**/*.config.js',
        'vite.config.js'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 85,
          lines: 80,
          statements: 80
        }
      }
    },
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  resolve: sharedResolve
});