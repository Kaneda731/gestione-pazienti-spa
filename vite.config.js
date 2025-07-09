import { defineConfig } from 'vite';

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
  
  // Configurazione per il build di produzione
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Mantieni i nomi dei file per debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['bootstrap'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  
  // Configurazione per la risoluzione dei moduli
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // Configurazione per ottimizzare le dipendenze
  optimizeDeps: {
    include: ['bootstrap', 'google-charts', '@supabase/supabase-js'],
    // Forza la pre-bundling di Supabase per evitare problemi di timing
    force: true
  },
  
  // Configurazione per gestire meglio i reload durante lo sviluppo
  define: {
    // Assicurati che process.env sia definito per compatibilità
    'process.env': {}
  }
});
