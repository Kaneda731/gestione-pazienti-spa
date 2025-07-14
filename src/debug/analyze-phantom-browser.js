// src/debug/analyze-phantom-browser.js
// Script da eseguire nella console del browser per analizzare i pazienti fantasma

/**
 * Funzione da eseguire nella console del browser (F12 -> Console)
 * per identificare l'origine dei 4 pazienti fantasma
 */

async function analyzePhantomPatients() {
    console.log('=== ANALISI PAZIENTI FANTASMA (Browser) ===\n');

    try {
        // 1. Recupera TUTTI i record dalla tabella pazienti
        console.log('1. Recupero tutti i record dalla tabella pazienti...');
        
        // Usa fetch diretto per bypassare eventuali filtri
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/pazienti?select=*`, {
            headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
        });
        
        const allPatients = await response.json();
        
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

        // 5. Verifica record minimi
        console.log('\n6. Record con dati minimi:');
        const minimalRecords = allPatients?.filter(p => 
            p.id && p.diagnosi && Object.keys(p).length <= 3
        ) || [];
        console.log(`Record minimi: ${minimalRecords.length}`);
        if (minimalRecords.length > 0) {
            console.log('Dettaglio record minimi:', minimalRecords);
        }

    } catch (error) {
        console.error('Errore durante l\'analisi:', error);
    }
}

// Funzione alternativa usando Supabase client
async function analyzeWithSupabase() {
    console.log('=== ANALISI CON SUPABASE CLIENT ===\n');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('pazienti')
            .select('*');
            
        if (error) {
            console.error('Errore Supabase:', error);
            return;
        }
        
        console.log('Dati completi:', data);
        console.log('Numero record:', data?.length || 0);
        
        // Mostra solo i campi essenziali
        if (data) {
            data.forEach(p => {
                console.log(`ID: ${p.id}, Diagnosi: ${p.diagnosi}, Stato: ${p.stato}`);
            });
        }
        
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Istruzioni per l'utente
console.log('=== ISTRUZIONI ===');
console.log('1. Apri la pagina web dell\'applicazione');
console.log('2. Premi F12 per aprire la console');
console.log('3. Copia e incolla una delle seguenti funzioni:');
console.log('   - analyzePhantomPatients()  // per analisi dettagliata');
console.log('   - analyzeWithSupabase()     // per analisi con Supabase');
console.log('4. Premi Invio per eseguire');

// Per eseguire automaticamente quando il DOM è pronto
if (typeof window !== 'undefined') {
    window.analyzePhantomPatients = analyzePhantomPatients;
    window.analyzeWithSupabase = analyzeWithSupabase;
}