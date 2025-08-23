/**
 * Servizio per la gestione dei codici di dimissione
 */
import { supabase } from './supabase/supabaseClient.js';
import { loggerService } from './logger/loggerService.js';

class CodiciDimissioneService {
    /**
     * Recupera tutti i codici di dimissione attivi
     * @returns {Promise<Array>} Lista dei codici di dimissione
     */
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('codici_dimissione')
                .select('*')
                .eq('attivo', true)
                .order('codice');

            if (error) {
                loggerService.error('Errore nel recupero codici dimissione:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            loggerService.error('Errore nel servizio codici dimissione:', error);
            throw error;
        }
    }

    /**
     * Recupera un codice di dimissione per ID
     * @param {number} id - ID del codice
     * @returns {Promise<Object|null>} Codice di dimissione
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('codici_dimissione')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                loggerService.error('Errore nel recupero codice dimissione:', error);
                throw error;
            }

            return data;
        } catch (error) {
            loggerService.error('Errore nel servizio codice dimissione:', error);
            throw error;
        }
    }

    /**
     * Recupera un codice di dimissione per codice
     * @param {string} codice - Codice di dimissione
     * @returns {Promise<Object|null>} Codice di dimissione
     */
    async getByCodice(codice) {
        try {
            const { data, error } = await supabase
                .from('codici_dimissione')
                .select('*')
                .eq('codice', codice)
                .eq('attivo', true)
                .single();

            if (error) {
                loggerService.error('Errore nel recupero codice dimissione:', error);
                throw error;
            }

            return data;
        } catch (error) {
            loggerService.error('Errore nel servizio codice dimissione:', error);
            throw error;
        }
    }
}

export const codiciDimissioneService = new CodiciDimissioneService();