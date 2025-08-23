/**
 * Servizio per la gestione delle cliniche
 */
import { supabase } from '../config/supabaseClient.js';
import { loggerService } from './loggerService.js';

class ClinicheService {
    /**
     * Recupera tutte le cliniche attive
     * @returns {Promise<Array>} Lista delle cliniche
     */
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('cliniche')
                .select('*')
                .eq('attivo', true)
                .order('codice');

            if (error) {
                loggerService.error('Errore nel recupero cliniche:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            loggerService.error('Errore nel servizio cliniche:', error);
            throw error;
        }
    }

    /**
     * Recupera una clinica per ID
     * @param {number} id - ID della clinica
     * @returns {Promise<Object|null>} Clinica
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('cliniche')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                loggerService.error('Errore nel recupero clinica:', error);
                throw error;
            }

            return data;
        } catch (error) {
            loggerService.error('Errore nel servizio clinica:', error);
            throw error;
        }
    }

    /**
     * Recupera una clinica per codice
     * @param {string} codice - Codice della clinica
     * @returns {Promise<Object|null>} Clinica
     */
    async getByCodice(codice) {
        try {
            const { data, error } = await supabase
                .from('cliniche')
                .select('*')
                .eq('codice', codice)
                .eq('attivo', true)
                .single();

            if (error) {
                loggerService.error('Errore nel recupero clinica:', error);
                throw error;
            }

            return data;
        } catch (error) {
            loggerService.error('Errore nel servizio clinica:', error);
            throw error;
        }
    }
}

export const clinicheService = new ClinicheService();