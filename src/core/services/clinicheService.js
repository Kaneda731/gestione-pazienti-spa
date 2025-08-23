/**
 * Servizio per la gestione dei codici clinica
 */
import { supabase } from "./supabase/supabaseClient.js";
import { logger } from "./logger/loggerService.js";

class ClinicheService {
  /**
   * Recupera tutti i codici clinica attivi
   * @returns {Promise<Array>} Lista dei codici clinica
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("codice_clinica")
        .select("*")
        .eq("attivo", true)
        .order("codice");

      if (error) {
        logger.error("Errore nel recupero codici clinica:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("Errore nel servizio codici clinica:", error);
      throw error;
    }
  }

  /**
   * Recupera un codice clinica per ID
   * @param {number} id - ID del codice clinica
   * @returns {Promise<Object|null>} Codice clinica
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from("codice_clinica")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Errore nel recupero codice clinica:", error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Errore nel servizio codice clinica:", error);
      throw error;
    }
  }

  /**
   * Recupera un codice clinica per codice
   * @param {string} codice - Codice della clinica
   * @returns {Promise<Object|null>} Codice clinica
   */
  async getByCodice(codice) {
    try {
      const { data, error } = await supabase
        .from("codice_clinica")
        .select("*")
        .eq("codice", codice)
        .eq("attivo", true)
        .single();

      if (error) {
        logger.error("Errore nel recupero codice clinica:", error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Errore nel servizio codice clinica:", error);
      throw error;
    }
  }
}

export const clinicheService = new ClinicheService();
