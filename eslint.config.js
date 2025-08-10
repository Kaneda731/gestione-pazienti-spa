// ESLint flat config per ESLint v9+
// Focus: rilevare export non utilizzati (import/no-unused-modules) in ambiente browser
import js from "@eslint/js";

const importPlugin = await import("eslint-plugin-import");

export default [
  js.configs.recommended,
  // Applichiamo i globals browser e disattiviamo i warning generici su tutto src
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        requestAnimationFrame: "readonly",
        requestIdleCallback: "readonly",
        CustomEvent: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        URL: "readonly",
        performance: "readonly",
        alert: "readonly",
        confirm: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
  "no-prototype-builtins": "off",
      "no-case-declarations": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/reports/**",
      "**/playwright-report/**",
      "**/backups/**",
      "__tests__/**",
      "tests/**",
      "docs/**",
      "scripts/**",
      "src/debug/**",
    ],
  },
  {
    files: [
      "src/app/**/*.js",
      "src/core/**/*.js",
      "src/shared/utils/**/*.js",
      "src/shared/services/**/*.js",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        requestAnimationFrame: "readonly",
        requestIdleCallback: "readonly",
        CustomEvent: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        URL: "readonly",
        performance: "readonly",
        alert: "readonly",
        confirm: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
      },
    },
    plugins: {
      import: importPlugin.default || importPlugin,
    },
  rules: {
      // Riduciamo il rumore: vogliamo solo il report sugli export inutilizzati
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-useless-catch": "off",
      "no-async-promise-executor": "off",
      "import/no-unused-modules": [
        "error",
        {
          unusedExports: true,
          missingExports: false,
      src: ["src/**/*.js"],
          // File aggregator o con export duplicati da ignorare nel conteggio
          ignoreExports: [
            // Aggregatori di export
            "src/shared/components/notifications/index.js",
            "src/shared/components/ui/index.js",
            "src/features/charts/index.js",
            // Config/Costanti spesso importate indirettamente o non ancora usate
            "src/app/config/constants.js",
            "src/app/config/environment.js",
          ],
        },
      ],
    },
  },
];
