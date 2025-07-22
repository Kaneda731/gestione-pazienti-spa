// vitest.config.js
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Environment setup
    environment: "jsdom",
    globals: true,

    // Setup files - usa la nostra infrastruttura ottimizzata
    setupFiles: [
      "./tests/__config__/global-setup.js",
      "./tests/__config__/test-environment.js",
      "./tests/__config__/matchers.js",
    ],

    // Performance optimizations
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2,
      },
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // File patterns
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "tests/__config__/**",
      "tests/__mocks__/**",
      "tests/__fixtures__/**",
      "tests/__helpers__/**",
      "tests/templates/**",
      "tests/analyze-tests.cjs",
      "node_modules/**",
      "dist/**",
      ".idea/**",
      ".git/**",
      "backup/**",
      "tests-backup*/**",
      "**/temp/**",
      "**/legacy/**",
      "**/deprecated/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json", "html", "lcov", "cobertura"],
      reportsDirectory: "./coverage",
      // Abilita il report dettagliato per ogni file
      all: true,
      // Includi i file sorgente anche se non sono stati testati
      include: ["src/**/*.{js,jsx,ts,tsx,vue}"],
      exclude: [
        // Test files e cartelle di supporto
        "tests/**",
        "tests-backup*/**",

        // File di configurazione
        "**/*.config.js",
        "**/*.config.ts",

        // Cartelle di build e dipendenze
        "node_modules/**",
        "dist/**",

        // Risorse statiche e asset
        "src/css/**",
        "src/favicon.svg",
        "**/*.svg",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
        "**/*.ico",

        // Cartelle di sistema e strumenti
        "backup/**",
        "**/temp/**",
        "**/legacy/**",
        "**/deprecated/**",
        ".github/**",
        ".netlify/**",
        "docs/**",
        "scripts/**",
        ".kiro/**",
        ".vscode/**",
        ".git/**",
        ".DS_Store",

        // Eventuali file di mock o fixture
        "**/__mocks__/**",
        "**/__fixtures__/**",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 70,
          statements: 70,
        },
        // Soglie per directory specifiche (più stringenti per componenti critici)
        './src/core/': {
          branches: 80,
          functions: 85,
          lines: 80,
          statements: 80,
        },
        './src/features/': {
          branches: 75,
          functions: 80,
          lines: 75,
          statements: 75,
        },
      },
      // Genera report per ogni file
      perFile: true,
      // Mostra i file che non hanno coverage
      skipFull: false,
    },

    // Reporter configuration
    reporter: ["verbose"],

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
      "@tests": resolve(process.cwd(), "tests"),
      "@mocks": resolve(process.cwd(), "tests/__mocks__"),
      "@fixtures": resolve(process.cwd(), "tests/__fixtures__"),
      "@helpers": resolve(process.cwd(), "tests/__helpers__"),
    },
  },
});
