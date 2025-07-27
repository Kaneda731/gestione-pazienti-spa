
import { createClient } from '@supabase/supabase-js';

// Le variabili d'ambiente sono l'unica fonte di verità.
// Devono essere impostate sia in locale (.env) che in produzione (Netlify).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Supabase URL o Anon Key non definite. Assicurati di aver configurato le variabili d'ambiente.");
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

