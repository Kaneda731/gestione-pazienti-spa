// src/features/patients/views/dimissione-api.js
import { supabase } from '../../../core/services/supabaseClient.js';

/**
 * Cerca i pazienti attivi per cognome.
 * @param {string} searchTerm - Il cognome (o parte di esso) da cercare.
 * @returns {Promise<Array>} La lista dei pazienti trovati.
 */
export async function searchActivePatients(searchTerm) {
    const { data, error } = await supabase
        .from('pazienti')
        .select('id, nome, cognome, data_ricovero, codice_rad')
        .or(`cognome.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%,codice_rad.ilike.%${searchTerm}%`)
        .is('data_dimissione', null) // Cerca solo pazienti non ancora dimessi
        .order('cognome');

    if (error) {
        console.error('Errore nella ricerca pazienti:', error);
        throw new Error('Errore durante la ricerca dei pazienti.');
    }
    return data || [];
}

/**
 * Aggiorna un paziente con la data di dimissione.
 * @param {string} patientId - L'ID del paziente da dimettere.
 * @param {string} dischargeDate - La data di dimissione.
 * @returns {Promise<Object>} I dati del paziente aggiornato.
 */
export async function dischargePatient(patientId, dischargeDate) {
    // Prima verifichiamo se il paziente esiste e non è già dimesso
    const { data: existingPatient, error: checkError } = await supabase
        .from('pazienti')
        .select('id, data_dimissione')
        .eq('id', patientId)
        .is('data_dimissione', null)
        .single();

    if (checkError) {
        console.error('Errore durante la verifica del paziente:', checkError);
        if (checkError.code === 'PGRST116') {
            throw new Error('Paziente non trovato o già dimesso.');
        }
        throw new Error('Errore durante la verifica del paziente.');
    }

    if (!existingPatient) {
        throw new Error('Paziente non trovato o già dimesso.');
    }

    // Procediamo con l'aggiornamento
    const { data, error } = await supabase
        .from('pazienti')
        .update({ data_dimissione: dischargeDate })
        .eq('id', patientId)
        .select()
        .single();

    if (error) {
        console.error('Errore durante la dimissione:', error);
        if (error.code === 'PGRST116') {
            throw new Error('Paziente non trovato durante l\'aggiornamento.');
        }
        throw new Error('Errore durante l\'aggiornamento del paziente.');
    }
    
    return data;
}