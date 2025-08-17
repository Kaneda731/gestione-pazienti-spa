// src/features/patients/views/dimissione-api.js
import { supabase } from '../../../core/services/supabase/supabaseClient.js';
import { logger } from '../../../core/services/logger/loggerService.js';

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
 * @deprecated Use dischargePatientWithTransfer instead
 */
export async function dischargePatient(patientId, dischargeDate) {
    return dischargePatientWithTransfer(patientId, { 
        data_dimissione: dischargeDate,
        tipo_dimissione: 'dimissione',
        codice_dimissione: '3'
    });
}

/**
 * Aggiorna un paziente con i dati di dimissione/trasferimento completi.
 * @param {string} patientId - L'ID del paziente da dimettere.
 * @param {Object} dischargeData - I dati di dimissione/trasferimento.
 * @returns {Promise<Object>} I dati del paziente aggiornato.
 */
export async function dischargePatientWithTransfer(patientId, dischargeData) {
    // Valida i dati di dimissione
    const validationResult = validateDischargeData(dischargeData);
    if (!validationResult.isValid) {
        throw new Error(`Dati di dimissione non validi: ${validationResult.errors.join(', ')}`);
    }

    // Log input validato (solo dev/test)
    try {
        logger.group('[DimissioneAPI] Input validato');
        logger.log({ patientId, ...dischargeData });
        logger.groupEnd();
    } catch (_) { /* no-op */ }

    // Prima verifichiamo se il paziente esiste e non è già dimesso
    const { data: existingPatient, error: checkError } = await supabase
        .from('pazienti')
        .select('id, data_dimissione, data_ricovero')
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

    // Prepara i dati per l'aggiornamento
    const updateData = prepareDischargeUpdateData(dischargeData, existingPatient);

    // Log dati di update calcolati (solo dev/test)
    try {
        logger.group('[DimissioneAPI] Update payload');
        logger.log(updateData);
        logger.groupEnd();
    } catch (_) { /* no-op */ }

    // Procediamo con l'aggiornamento
    const { data, error } = await supabase
        .from('pazienti')
        .update(updateData)
        .eq('id', patientId)
        .select();

    if (error) {
        console.error('Errore durante la dimissione:', error);
        throw new Error('Errore durante l\'aggiornamento del paziente.');
    }
    
    if (!data || data.length === 0) {
        throw new Error('Paziente non trovato durante l\'aggiornamento.');
    }
    
    // Log risultato dell'update con focus su codice_clinica
    try {
        const updated = data[0] || {};
        logger.group('[DimissioneAPI] Update result');
        logger.log({ id: updated.id, tipo_dimissione: updated.tipo_dimissione, codice_clinica: updated.codice_clinica, codice_dimissione: updated.codice_dimissione });
        logger.groupEnd();
    } catch (_) { /* no-op */ }

    return data[0];
}

/**
 * Valida i dati di dimissione/trasferimento.
 * @param {Object} dischargeData - I dati da validare.
 * @returns {Object} Risultato della validazione con isValid e errors.
 */
export function validateDischargeData(dischargeData) {
    const errors = [];
    
    // Validazione campi obbligatori
    if (!dischargeData.data_dimissione) {
        errors.push('La data di dimissione è obbligatoria');
    }
    
    if (!dischargeData.tipo_dimissione) {
        errors.push('Il tipo di dimissione è obbligatorio');
    }
    
    if (dischargeData.tipo_dimissione !== 'decesso' && !dischargeData.codice_dimissione) {
        errors.push('Il codice dimissione è obbligatorio');
    }
    
    // Validazione valori consentiti
    const tipiDimissioneValidi = ['dimissione', 'trasferimento_interno', 'trasferimento_esterno', 'decesso'];
    if (dischargeData.tipo_dimissione && !tipiDimissioneValidi.includes(dischargeData.tipo_dimissione)) {
        errors.push('Tipo di dimissione non valido');
    }
    
    const codiciDimissioneValidi = ['3', '6'];
    if (dischargeData.codice_dimissione && !codiciDimissioneValidi.includes(dischargeData.codice_dimissione)) {
        errors.push('Codice dimissione non valido');
    }
    
    // Validazioni specifiche per tipo di dimissione
    if (dischargeData.tipo_dimissione === 'trasferimento_interno') {
        if (!dischargeData.reparto_destinazione || dischargeData.reparto_destinazione.trim() === '') {
            errors.push('Il reparto di destinazione è obbligatorio per i trasferimenti interni');
        }
    }
    
    if (dischargeData.tipo_dimissione === 'trasferimento_esterno') {
        if (!dischargeData.clinica_destinazione || dischargeData.clinica_destinazione.trim() === '') {
            errors.push('La clinica di destinazione è obbligatoria per i trasferimenti esterni');
        }
        
        if (!dischargeData.codice_clinica) {
            errors.push('Il codice clinica è obbligatorio per i trasferimenti esterni');
        }
        
        const codiciClinicaValidi = ['56', '60'];
        if (dischargeData.codice_clinica && !codiciClinicaValidi.includes(dischargeData.codice_clinica)) {
            errors.push('Codice clinica non valido');
        }
    }
    
    // Validazione formato data
    if (dischargeData.data_dimissione) {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(dischargeData.data_dimissione)) {
            errors.push('Formato data dimissione non valido (utilizzare gg/mm/aaaa)');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Prepara i dati per l'aggiornamento del database.
 * @param {Object} dischargeData - I dati di dimissione.
 * @param {Object} existingPatient - I dati del paziente esistente.
 * @returns {Object} I dati preparati per l'aggiornamento.
 */
function prepareDischargeUpdateData(dischargeData, existingPatient) {
    // Normalizza la data come nell'inserimento paziente
    let normalizedDate = dischargeData.data_dimissione;
    if (typeof normalizedDate === 'string' && normalizedDate.includes('/')) {
        const [day, month, year] = normalizedDate.split('/');
        normalizedDate = `${year}-${month}-${day}`;
    }
    
    // Validazione data dimissione non precedente al ricovero
    if (existingPatient.data_ricovero) {
        const ricoveroDate = new Date(existingPatient.data_ricovero);
        const dimissioneDate = new Date(normalizedDate);
        
        if (dimissioneDate < ricoveroDate) {
            throw new Error('La data di dimissione non può essere precedente alla data di ricovero');
        }
    }
    
    const updateData = {
        data_dimissione: normalizedDate,
        tipo_dimissione: dischargeData.tipo_dimissione,
        codice_dimissione: dischargeData.codice_dimissione
    };

    // Per decesso, il codice_dimissione non è previsto
    if (dischargeData.tipo_dimissione === 'decesso') {
        updateData.codice_dimissione = null;
    }
    
    // Aggiungi campi specifici in base al tipo di dimissione
    if (dischargeData.tipo_dimissione === 'trasferimento_interno') {
        updateData.reparto_destinazione = dischargeData.reparto_destinazione;
        // Pulisci i campi di trasferimento esterno
        updateData.clinica_destinazione = null;
        updateData.codice_clinica = null;
    } else if (dischargeData.tipo_dimissione === 'trasferimento_esterno') {
        updateData.clinica_destinazione = dischargeData.clinica_destinazione;
        updateData.codice_clinica = dischargeData.codice_clinica;
        // Pulisci i campi di trasferimento interno
        updateData.reparto_destinazione = null;
    } else {
        // Per dimissione normale o decesso, pulisci tutti i campi di trasferimento
        updateData.reparto_destinazione = null;
        updateData.clinica_destinazione = null;
        updateData.codice_clinica = null;
    }
    
    return updateData;
}