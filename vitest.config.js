// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Usa jsdom per simulare l'ambiente del browser
    environment: 'jsdom',
    // Includi tutti i file che terminano con .test.js o .spec.js
    include: ['**/*.{test,spec}.js'],
    // Opzionale: escludi node_modules e altre cartelle
    exclude: ['node_modules', 'dist', '.idea', '.git', 'backup'],
  },
});
