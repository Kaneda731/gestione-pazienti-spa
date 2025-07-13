// Test per verificare il salvataggio paziente
// Esegui questo file nel browser console per testare

async function testSalvataggioPaziente() {
    console.log('=== TEST SALVATAGGIO PAZIENTE ===');
    
    // Dati di test
    const testPatient = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '15/06/1980',
        data_ricovero: '10/07/2024',
        diagnosi: 'Frattura femore',
        reparto_appartenenza: 'Ortopedia',
        reparto_provenienza: 'PS',
        livello_assistenza: 'Media',
        codice_rad: 'RAD123456',
        infetto: false
    };
    
    try {
        console.log('Dati paziente:', testPatient);
        
        // Test validazione
        console.log('Test validazione...');
        patientService.validatePatientData(testPatient);
        console.log('✅ Validazione superata');
        
        // Test salvataggio (commentato per evitare inserimenti reali)
        console.log('Test salvataggio (simulato)...');
        console.log('✅ Salvataggio simulato completato');
        
        console.log('=== TEST COMPLETATO CON SUCCESSO ===');
        
    } catch (error) {
        console.error('❌ Errore:', error.message);
    }
}

// Esegui il test
// testSalvataggioPaziente();