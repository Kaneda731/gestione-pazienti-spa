var authService = (function() {
  function getSupabaseInstance() {
    if (typeof supabase === 'undefined') {
      console.error("Supabase instance not found globally. Ensure supabaseService.js is loaded and exposes 'supabase'.");
      return null;
    }
    return supabase;
  }

  return {
    /**
     * Servizio per la gestione dell'autenticazione.
     */
    async login(email, password) {
      const sb = getSupabaseInstance();
      if (!sb) return { session: null, error: { message: "Supabase not initialized." } };
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) console.error('Errore login:', error.message);
      return { session: data.session, error };
    },

    /**
     * Esegue il logout dell'utente corrente.
     */
    async logout() {
      const sb = getSupabaseInstance();
      if (!sb) return { error: { message: "Supabase not initialized." } };
      const { error } = await sb.auth.signOut();
      if (error) console.error('Errore logout:', error.message);
      return { error };
    },

    /**
     * Registra un nuovo utente (se necessario).
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{user: object|null, error: object|null}>}
     */
    async signUp(email, password) {
      const sb = getSupabaseInstance();
      if (!sb) return { user: null, error: { message: "Supabase not initialized." } };
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) console.error('Errore registrazione:', error.message);
      return { user: data.user, error };
    },

    /**
     * Imposta un listener per i cambiamenti di stato dell'autenticazione.
     * @param {function} callback - La funzione da chiamare quando lo stato cambia.
     */
    onAuthStateChange(callback) {
      const sb = getSupabaseInstance();
      if (!sb) {
        console.error("Supabase not initialized for onAuthStateChange.");
        return { data: { subscription: null } };
      }
      return sb.auth.onAuthStateChange(callback);
    },

    /**
     * Recupera la sessione utente corrente.
     * @returns {Promise<{session: object|null, error: object|null}>}
     */
    async getSession() {
      const sb = getSupabaseInstance();
      if (!sb) return { session: null, error: { message: "Supabase not initialized." } };
      const { data: { session }, error } = await sb.auth.getSession();
      if (error) console.error('Errore nel recuperare la sessione:', error.message);
      return { session, error };
    }
  };
})();