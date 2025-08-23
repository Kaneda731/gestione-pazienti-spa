/**
 * Servizio per la gestione dei reparti
 */
import { supabase } from './supabase/supabaseClient.js';
import { logger } from './logger/loggerService.js';

class RepartiService {
    /**
     * Recupera tutti i reparti attivi
     * @param {string} tipo - Tipo di reparto ('interno', 'esterno', null per tutti)
     * @returns {Promise<Array>} Lista dei reparti
     */
    async getAll(tipo = null) {
        try {
            let query = supabase
                .from('reparti')
                .select('*')
                .eq('attivo', true)
                .order('nome');

            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Errore nel recupero reparti:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            logger.error('Errore nel servizio reparti:', error);
            throw error;
        }
    }

    /**
     * Recupera i reparti interni (per trasferimenti)
     * @returns {Promise<Array>} Lista dei reparti interni
     */
    async getRepartiInterni() {
        return this.getAll('interno');
    }

    /**
     * Recupera un reparto per ID
     * @param {number} id - ID del reparto
     * @returns {Promise<Object|null>} Reparto
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('reparti')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Errore nel recupero reparto:', error);
                throw error;
            }

            return data;
        } catch (error) {
            logger.error('Errore nel servizio reparto:', error);
            throw error;
        }
    }

    /**
     * Recupera un reparto per nome
     * @param {string} nome - Nome del reparto
     * @returns {Promise<Object|null>} Reparto
     */
    async getByNome(nome) {
        try {
            const { data, error } = await supabase
                .from('reparti')
                .select('*')
                .eq('nome', nome)
                .eq('attivo', true)
                .single();

            if (error) {
                logger.error('Errore nel recupero reparto:', error);
                throw error;
            }

            return data;
        } catch (error) {
            logger.error('Errore nel servizio reparto:', error);
            throw error;
        }
    }
}

export const repartiService = new RepartiService();