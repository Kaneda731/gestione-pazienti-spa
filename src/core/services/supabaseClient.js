// src/js/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const debugContainer = document.getElementById('debug-container');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  if (debugContainer) {
    debugContainer.style.display = 'block';
    debugContainer.innerHTML = '<b>Errore Critico:</b> Variabili d\'ambiente Supabase non trovate! Controlla la configurazione di Netlify.';
  }
  console.error("Supabase URL o Anon Key non definite. Assicurati di aver configurato le variabili d'ambiente.");
  // Non blocchiamo l'app, ma la lasciamo in uno stato di errore visibile.
} else {
  if (debugContainer) {
    debugContainer.style.background = '#28a745';
    debugContainer.style.color = 'white';
    debugContainer.style.display = 'block';
    debugContainer.innerHTML = '<b>OK:</b> Variabili d\'ambiente Supabase caricate correttamente.';
    setTimeout(() => { debugContainer.style.display = 'none'; }, 5000);
  }
}

// Ottieni la porta corrente dinamicamente
const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
const currentHost = `${window.location.protocol}//${window.location.hostname}:${currentPort}`;

// Configurazione ottimizzata per Vite e ambiente di sviluppo
const supabaseOptions = {
  auth: {
    // Configurazione per OAuth in ambiente di sviluppo
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    // Usa localStorage per consistenza
    storage: window.localStorage,
    // Configurazione per prevenire problemi di CORS
    storageKey: 'supabase.auth.token',
    // Debug mode per individuare problemi
    debug: import.meta.env.VITE_OAUTH_DEBUG === 'true'
  },
  // Configurazione per migliorare la gestione delle richieste
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-vite'
    }
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, supabaseOptions);

