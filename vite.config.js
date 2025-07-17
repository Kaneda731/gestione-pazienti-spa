import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Configurazione per il server di sviluppo
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    open: false,
    // Configurazione CORS semplificata e corretta per Supabase OAuth
    cors: {
      origin: ['http://localhost:5174', 'http://localhost:5173', 'https://aiguzywadjzyrwandgba.supabase.co'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  },
  
  // Aggiunta per sopprimere i warning di deprecazione di Sass
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },

  // Configurazione per il build di produzione
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Configurazione minificazione con terser
    minify: 'terser',
    terserOptions: {
      compress: {
        // Rimuovi debugger statements
        drop_debugger: true,
        // Rimuovi console statements ma mantieni console.error
        drop_console: false, // Gestito da pure_funcs per maggiore controllo
        // Rimuovi codice morto e semplifica condizioni
        dead_code: true,
        // Ottimizza le condizioni booleane
        conditionals: true,
        // Rimuovi codice non raggiungibile
        unused: true,
        // Abilita tree shaking aggressivo
        side_effects: false,
        // Ottimizza le chiamate di funzione
        inline: 2,
        // Rimuovi specifici console statements ma mantieni console.error
        pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug'],
        // Ottimizza le stringhe
        join_vars: true,
        // Rimuovi codice non utilizzato
        pure_getters: true
      },
      mangle: {
        // Mantieni nomi delle funzioni per stack traces leggibili in produzione
        keep_fnames: false,
        // Abilita mangling delle proprietà per riduzione dimensioni
        properties: false
      },
      format: {
        // Rimuovi commenti per ridurre dimensioni
        comments: false
      }
    },
    // Mantieni i nomi dei file per debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries - loaded on every page
          vendor: ['bootstrap', '@popperjs/core'],
          // Supabase - authentication and database operations
          supabase: ['@supabase/supabase-js'],
          // Utils - form utilities and date pickers
          utils: ['flatpickr']
          // Note: google-charts removed as it's loaded dynamically via script tag
        }
      }
    }
  },
  
  // Plugins per analisi e ottimizzazione
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // Visualizzazione treemap per analisi dettagliata
    })
  ],
  
  // Configurazione per la risoluzione dei moduli
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // Configurazione per ottimizzare le dipendenze
  optimizeDeps: {
    include: ['bootstrap', '@popperjs/core', '@supabase/supabase-js', 'flatpickr']
    // Rimosso force: true per evitare rebuild inutili
  },
  
  // Configurazione per gestire meglio i reload durante lo sviluppo
  define: {
    // Assicurati che process.env sia definito per compatibilità
    'process.env': {}
  }
});
