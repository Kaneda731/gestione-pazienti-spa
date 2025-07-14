// src/debug/analyze-phantom-patients.js
import { supabase } from '../core/services/supabaseClient.js';

/**
 * Script per analizzare e identificare i pazienti "fantasma"
 * che appaiono nell'UI ma non nel database
 */

async function analyzePhantomPatients() {
    console.log('=== ANALISI PAZIENTI FANTASMA ===\n');

    try {
        // 1. Recupera TUTTI i record dalla tabella pazienti
        console.log('1. Recupero tutti i record dalla tabella pazienti...');
        const { data: allPatients, error: allError } = await supabase
            .from('pazienti')
            .select('*')
            .order('id');

        if (allError) {
            console.error('Errore nel recupero:', allError);
            return;
        }

        console.log(`Totale record trovati: ${allPatients?.length || 0}`);
        
        if (allPatients && allPatients.length > 0) {
            console.log('\n2. Dettaglio di tutti i record:');
            allPatients.forEach((patient, index) => {
                console.log(`\n--- Paziente ${index + 1} ---`);
                console.log('ID:', patient.id);
                console.log('Nome:', patient.nome || 'N/A');
                console.log('Cognome:', patient.cognome || 'N/A');
                console.log('Diagnosi:', patient.diagnosi || 'N/A');
                console.log('Reparto:', patient.reparto_appartenenza || 'N/A');
                console.log('Stato:', patient.stato || 'N/A');
                console.log('Data ricovero:', patient.data_ricovero || 'N/A');
                console.log('Data dimissione:', patient.data_dimissione || 'N/A');
                console.log('Record completo:', JSON.stringify(patient, null, 2));
            });
        }

        // 2. Conta per diagnosi
        console.log('\n3. Conteggio per diagnosi:');
        const diagnosiCount = {};
        if (allPatients) {
            allPatients.forEach(patient => {
                const diagnosi = patient.diagnosi || 'Sconosciuta';
                diagnosiCount[diagnosi] = (diagnosiCount[diagnosi] || 0) + 1;
            });
        }
        console.table(diagnosiCount);

        // 3. Conta per stato
        console.log('\n4. Conteggio per stato:');
        const statoCount = {};
        if (allPatients) {
            allPatients.forEach(patient => {
                const stato = patient.stato || 'Sconosciuto';
                statoCount[stato] = (statoCount[stato] || 0) + 1;
            });
        }
        console.table(statoCount);

        // 4. Verifica record con ID null o undefined
        console.log('\n5. Record con ID problematici:');
        const problematicRecords = allPatients?.filter(p => 
            !p.id || p.id === null || p.id === undefined
        ) || [];
        console.log(`Record con ID problematici: ${problematicRecords.length}`);
        if (problematicRecords.length > 0) {
            console.log('Dettaglio record problematici:', problematicRecords);
        }

        // 5. Verifica record con dati minimi
        console.log('\n6. Record con dati minimi (solo ID e diagnosi):');
        const minimalRecords = allPatients?.filter(p => 
            p.id && p.diagnosi && Object.keys(p).length <= 3
        ) || [];
        console.log(`Record minimi: ${minimalRecords.length}`);
        if (minimalRecords.length > 0) {
            console.log('Dettaglio record minimi:', minimalRecords);
        }

        // 6. Controlla se ci sono viste o tabelle temporanee
        console.log('\n7. Verifica struttura tabella...');
        const { data: tableInfo, error: tableError } = await supabase
            .from('pazienti')
            .select('*')
            .limit(1);

        if (tableInfo && tableInfo.length > 0) {
            console.log('Struttura campi disponibili:', Object.keys(tableInfo[0]));
        }

    } catch (error) {
        console.error('Errore durante l\'analisi:', error);
    }
}

// Esegui l'analisi
analyzePhantomPatients();