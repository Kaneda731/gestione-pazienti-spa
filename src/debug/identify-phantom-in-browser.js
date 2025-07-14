// src/debug/identify-phantom-in-browser.js
// Script da eseguire nella console del browser per identificare i 4 pazienti

/**
 * Esegui queste istruzioni nella console del browser (F12 -> Console)
 * quando sei sulla pagina dell'applicazione
 */

// Metodo 1: Usa il client Supabase già caricato
async function identifyPhantomPatients() {
    console.log('=== IDENTIFICAZIONE PAZIENTI FANTASMA ===');
    
    try {
        // Usa il client Supabase già disponibile nell'applicazione
        const { data, error } = await window.supabaseClient
            .from('pazienti')
            .select('*')
            .order('id');
            
        if (error) {
            console.error('Errore:', error);
            return;
        }
        
        console.log(`Totale pazienti trovati: ${data.length}`);
        console.log('Elenco completo:');
        
        data.forEach((patient, index) => {
            console.log(`${index + 1}. ID: ${patient.id}, Nome: ${patient.nome || 'N/A'}, Cognome: ${patient.cognome || 'N/A'}, Diagnosi: ${patient.diagnosi || 'N/A'}`);
        });
        
        // Identifica record sospetti
        const suspicious = data.filter(p => 
            !p.nome || !p.cognome || !p.diagnosi || 
            p.nome === '' || p.cognome === '' || p.diagnosi === ''
        );
        
        console.log('\n=== RECORD SOSPETTI ===');
        console.log(`Trovati ${suspicious.length} record sospetti:`, suspicious);
        
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Metodo 2: Query specifica per record fittizi
async function findTestRecords() {
    console.log('=== RICERCA RECORD DI TEST ===');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('pazienti')
            .select('*')
            .or('nome.is.null,nome.eq.,cognome.is.null,cognome.eq.,diagnosi.is.null,diagnosi.eq.');
            
        if (error) {
            console.error('Errore:', error);
            return;
        }
        
        console.log(`Record fittizi trovati: ${data.length}`);
        console.log('Dettagli:', data);
        
        // Mostra gli ID per facilitare la rimozione
        if (data.length > 0) {
            const ids = data.map(p => p.id);
            console.log('ID da rimuovere:', ids.join(','));
            
            // Crea query di rimozione
            console.log('Query di rimozione:');
            console.log(`DELETE FROM pazienti WHERE id IN (${ids.join(',')});`);
        }
        
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Metodo 3: Conta per stato
async function countByStatus() {
    console.log('=== CONTEGGIO PER STATO ===');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('pazienti')
            .select('stato');
            
        if (error) {
            console.error('Errore:', error);
            return;
        }
        
        const counts = {};
        data.forEach(p => {
            const stato = p.stato || 'sconosciuto';
            counts[stato] = (counts[stato] || 0) + 1;
        });
        
        console.log('Conteggio per stato:', counts);
        
    } catch (error) {
        console.error('Errore:', error);
    }
}

// Istruzioni per l'utente
console.log('=== ISTRUZIONI PER IDENTIFICARE I PAZIENTI FANTASMA ===');
console.log('1. Vai sulla pagina web dell\'applicazione');
console.log('2. Apri la console (F12)');
console.log('3. Incolla e premi Invio per una di queste funzioni:');
console.log('   identifyPhantomPatients()  - mostra tutti i pazienti');
console.log('   findTestRecords()          - trova solo record fittizi');
console.log('   countByStatus()            - conta per stato');

// Rendi le funzioni disponibili globalmente
if (typeof window !== 'undefined') {
    window.identifyPhantomPatients = identifyPhantomPatients;
    window.findTestRecords = findTestRecords;
    window.countByStatus = countByStatus;
}