/**
 * Servizio per la gestione dei timezone ottimizzato
 * Sostituisce le query lente su pg_timezone_names con una tabella dedicata
 */

import { supabase } from "../config/supabase.js";
import { trackSupabaseQuery } from "../utils/performanceMonitor.js";

class TimezoneService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 ora
  }

  /**
   * Ottiene tutti i timezone disponibili (con cache)
   * @returns {Promise<Array>} Lista dei timezone
   */
  async getTimezones() {
    // Controlla se la cache è ancora valida
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const { data, error } = await trackSupabaseQuery("getTimezones", () =>
        supabase
          .from("app_timezones")
          .select("name, display_name, utc_offset, is_default")
          .order("sort_order")
      );

      if (error) throw error;

      // Aggiorna la cache
      this.cache = data;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return data;
    } catch (error) {
      console.error("Errore nel caricamento timezone:", error);
      throw error;
    }
  }

  /**
   * Ottiene il timezone predefinito
   * @returns {Promise<Object|null>} Timezone predefinito
   */
  async getDefaultTimezone() {
    const timezones = await this.getTimezones();
    return timezones.find((tz) => tz.is_default) || timezones[0];
  }

  /**
   * Cerca timezone per nome
   * @param {string} searchTerm - Termine di ricerca
   * @returns {Promise<Array>} Timezone filtrati
   */
  async searchTimezones(searchTerm) {
    const timezones = await this.getTimezones();
    const term = searchTerm.toLowerCase();

    return timezones.filter(
      (tz) =>
        tz.name.toLowerCase().includes(term) ||
        tz.display_name.toLowerCase().includes(term)
    );
  }

  /**
   * Invalida la cache (utile dopo aggiornamenti)
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }
}

// Esporta un'istanza singleton
export const timezoneService = new TimezoneService();
