import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { writeFileSync } from 'fs';
import { join } from 'path';

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
    // Plugin personalizzato per generare _redirects per Netlify
    {
      name: 'netlify-redirects',
      writeBundle() {
        const redirectsContent = `# JavaScript modules - serve directly if they exist
/assets/*.js  /assets/:splat.js  200
/*.js         /:splat.js         200

# API routes (if any)
/api/*        /api/:splat        200

# SPA fallback - only for HTML routes
/*            /index.html        200`;
        
        writeFileSync(join('dist', '_redirects'), redirectsContent);
        console.log('✅ File _redirects generato per Netlify');
      }
    },
    // Bundle analyzer principale con visualizzazione treemap
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
      title: 'Bundle Analysis - Gestione Pazienti SPA',
      projectRoot: process.cwd()
    }),
    // Generatore di dati JSON per analisi programmatica
    visualizer({
      filename: 'dist/bundle-analysis.json',
      template: 'raw-data',
      gzipSize: true,
      brotliSize: true
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
