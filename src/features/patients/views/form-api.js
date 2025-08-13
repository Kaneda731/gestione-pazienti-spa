// src/features/patients/views/form-api.js
import { supabase } from '../../../core/services/supabase/supabaseClient.js';

/**
 * Recupera le opzioni per il campo diagnosi.
 * @returns {Promise<Array>} Una lista di opzioni per la diagnosi.
 */
export async function getDiagnosiOptions() {
    const { data, error } = await supabase
        .from('diagnosi')
        .select('nome')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Error loading diagnosi options:', error.message);
        throw new Error('Impossibile caricare le opzioni di diagnosi.');
    }

    return data || [];
}

/**
 * Recupera i dati di un singolo paziente per la modifica.
 * @param {string} patientId - L'ID del paziente da caricare.
 * @returns {Promise<Object|null>} I dati del paziente o null se non trovato.
 */
export async function getPatientById(patientId) {
    if (!patientId) return null;

    const { data, error } = await supabase
        .from('pazienti')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        console.error('Error loading patient for editing:', error.message);
        throw new Error('Impossibile caricare i dati del paziente.');
    }

    return data;
}

/**
 * Salva i dati del paziente (creazione o aggiornamento).
 * @param {Object} patientData - I dati del paziente da salvare.
 * @param {string|null} patientId - L'ID del paziente se in modalità modifica, altrimenti null.
 * @returns {Promise<Object>} I dati del paziente salvato.
 */
export async function savePatient(patientData, patientId) {
    // Pulisci i dati per rimuovere campi vuoti non necessari
    const cleanData = {};
    Object.keys(patientData).forEach(key => {
        if (patientData[key] !== '' && patientData[key] !== null && patientData[key] !== undefined) {
            cleanData[key] = patientData[key];
        }
    });
    
    // Assicurati che infetto sia un booleano
    cleanData.infetto = Boolean(cleanData.infetto);
    
    let result;
    if (patientId) {
        // Modalità modifica
        result = await supabase.from('pazienti').update(cleanData).eq('id', patientId).select().single();
    } else {
        // Modalità inserimento
        result = await supabase.from('pazienti').insert(cleanData).select().single();
    }

    if (result.error) {
        console.error('Error saving patient:', result.error.message);
        throw new Error(`Errore durante il salvataggio: ${result.error.message}`);
    }

    return result.data;
}