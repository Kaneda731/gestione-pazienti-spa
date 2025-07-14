// src/features/charts/views/grafico-api.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { getFilterOptions } from '../../../shared/utils/index.js';

/**
 * Recupera i dati per il grafico in base ai filtri forniti.
 * @param {object} filters - Un oggetto contenente i filtri da applicare.
 * @returns {Promise<Array>} I dati per il grafico.
 */
export async function getChartData(filters) {
    let query = supabase.from('pazienti').select('diagnosi');

    if (filters.reparto) query = query.eq('reparto_appartenenza', filters.reparto);
    if (filters.provenienza) query = query.eq('reparto_provenienza', filters.provenienza);
    if (filters.diagnosi) query = query.eq('diagnosi', filters.diagnosi);
    if (filters.assistenza) query = query.eq('livello_assistenza', filters.assistenza);
    if (filters.startDate) query = query.gte('data_ricovero', filters.startDate);
    if (filters.endDate) query = query.lte('data_ricovero', filters.endDate);

    const { data, error } = await query;

    if (error) {
        console.error('Errore nel recuperare i dati del grafico:', error);
        throw new Error('Impossibile caricare i dati per il grafico.');
    }

    // Assicurati che i dati siano validi e filtra eventuali record non validi
    const validData = (data || []).filter(item =>
        item &&
        typeof item === 'object' &&
        item.diagnosi && // Assicurati che ci sia una diagnosi valida
        item.diagnosi !== null &&
        String(item.diagnosi).trim() !== '' // Escludi diagnosi vuote
    );

    console.log(`Dati validi trovati: ${validData.length} pazienti`);
    return validData;
}

/**
 * Recupera le opzioni per i select dei filtri.
 * @returns {Promise<Object>} Un oggetto contenente le opzioni per reparto, provenienza e diagnosi.
 */
export async function getFilterOptionsForChart() {
    try {
        const [repartoOptions, provenienzaOptions, diagnosiOptions] = await Promise.all([
            getFilterOptions('reparto_appartenenza'),
            getFilterOptions('reparto_provenienza'),
            getFilterOptions('diagnosi')
        ]);
        return { repartoOptions, provenienzaOptions, diagnosiOptions };
    } catch (error) {
        console.error('Errore nel recuperare le opzioni dei filtri:', error);
        throw new Error('Impossibile caricare le opzioni per i filtri.');
    }
}