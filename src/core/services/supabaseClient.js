// src/js/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Usa le variabili di ambiente se disponibili, altrimenti valori hardcoded
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

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

