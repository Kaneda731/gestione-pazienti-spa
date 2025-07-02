/**
 * QUESTO È UN FILE DI SETUP TEMPORANEO.
 * ESEGUIRE LA FUNZIONE 'configuraSupabase' UNA SOLA VOLTA
 * DALL'EDITOR DI GOOGLE APPS SCRIPT PER SALVARE LE CREDENZIALI.
 * DOPO L'ESECUZIONE, QUESTO FILE PUÒ ESSERE CANCELLATO.
 */
function configuraSupabase() {
  const supabaseUrl = "https://aiguzywadjzyrwandgba.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw";

  try {
    // Chiama la funzione definita in supabaseConfig.js
    setSupabaseCredentials(supabaseUrl, supabaseKey);
    Logger.log("SUCCESS: Credenziali Supabase salvate correttamente nelle Script Properties.");
    SpreadsheetApp.getUi().alert("Successo", "Le credenziali Supabase sono state salvate correttamente.");
  } catch (e) {
    Logger.log("ERROR: Impossibile salvare le credenziali Supabase. Errore: " + e.message);
    SpreadsheetApp.getUi().alert("Errore", "Impossibile salvare le credenziali Supabase: " + e.message);
  }
}
