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
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "tests/**",
        "node_modules/**",
        "dist/**",
        "**/*.config.js",
        "**/*.config.ts",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 70,
          statements: 70,
        },
      },
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
