/**
 * @fileoverview Gestisce la configurazione e l'inizializzazione del client Supabase.
 * Questo file centralizza la creazione del client, leggendo le credenziali in modo sicuro
 * dalle PropertiesService di Google Apps Script e passandole al frontend.
 */

/**
 * Funzione per impostare le credenziali di Supabase.
 * Eseguire questa funzione una sola volta per salvare le credenziali in modo sicuro.
 *
 * @param {string} url - L'URL del tuo progetto Supabase.
 * @param {string} key - La chiave anon (public) del tuo progetto Supabase.
 */
function setSupabaseCredentials(url, key) {
  PropertiesService.getScriptProperties().setProperties({
    'SUPABASE_URL': url,
    'SUPABASE_KEY': key
  });
  console.log('Credenziali Supabase salvate con successo.');
}

/**
 * Fornisce le credenziali di Supabase al codice lato client (HTML).
 * Questa funzione viene chiamata dal frontend tramite `google.script.run`.
 *
 * @returns {{url: string, key: string}|null} Un oggetto contenente l'URL e la chiave di Supabase,
 * o lancia un errore se non sono impostate.
 */
function getSupabaseCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const supabaseUrl = scriptProperties.getProperty('SUPABASE_URL');
  const supabaseKey = scriptProperties.getProperty('SUPABASE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    // Invece di restituire null, lanciamo un errore che può essere catturato
    // dal .withFailureHandler() nel frontend.
    throw new Error('Le credenziali Supabase (URL e KEY) non sono impostate. Contattare l"amministratore.');
  }

  return {
    url: supabaseUrl,
    key: supabaseKey
  };
}

/**
 * Funzione di utilità per chiudere un dialogo o una sidebar.
 * Può essere chiamata dal frontend.
 */
function closeDialog() {
  // Questa funzione è vuota perché il suo unico scopo è essere un punto di aggancio
  // per il frontend per reindirizzare o chiudere la finestra.
  // L'azione di reindirizzamento/chiusura viene gestita nel .withSuccessHandler()
  // nel file HTML.
}

/**
 * Funzione di test per verificare le credenziali di Supabase.
 */
function checkSupabaseCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const supabaseUrl = scriptProperties.getProperty('SUPABASE_URL');
  const supabaseKey = scriptProperties.getProperty('SUPABASE_KEY');

  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_KEY:', supabaseKey);
}