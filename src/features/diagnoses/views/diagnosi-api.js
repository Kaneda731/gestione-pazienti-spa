// src/features/diagnoses/views/diagnosi-api.js
import { supabase } from '../../../core/services/supabaseClient.js';

/**
 * Recupera tutte le diagnosi dal database.
 * @returns {Promise<Array>} La lista delle diagnosi.
 */
export async function getDiagnosi() {
    const { data, error } = await supabase
        .from('diagnosi')
        .select('id, nome')
        .order('nome', { ascending: true });

    // Aggiungi questi console.log per il debug su Netlify
    console.log('Supabase getDiagnosi - Data:', data);
    console.log('Supabase getDiagnosi - Error:', error);

    if (error) {
        console.error('Errore caricamento diagnosi:', error);
        throw new Error('Impossibile caricare le diagnosi.');
    }
    return data || [];
}

/**
 * Salva una diagnosi (crea se l'id è nullo, altrimenti aggiorna).
 * @param {string|null} id - L'ID della diagnosi da aggiornare o null per crearne una nuova.
 * @param {string} name - Il nome della diagnosi.
 * @returns {Promise<Object>} La diagnosi salvata.
 */
export async function saveDiagnosi(id, name) {
    let result;
    if (id) {
        result = await supabase.from('diagnosi').update({ nome: name }).eq('id', id).select().single();
    } else {
        result = await supabase.from('diagnosi').insert({ nome: name }).select().single();
    }

    if (result.error) {
        console.error('Errore salvataggio diagnosi:', result.error);
        throw new Error('Impossibile salvare la diagnosi.');
    }
    return result.data;
}

/**
 * Elimina una diagnosi.
 * @param {string} id - L'ID della diagnosi da eliminare.
 * @returns {Promise<void>}
 */
export async function deleteDiagnosi(id) {
    const { error } = await supabase.from('diagnosi').delete().eq('id', id);

    if (error) {
        console.error('Errore eliminazione diagnosi:', error);
        throw new Error('Impossibile eliminare la diagnosi.');
    }
}