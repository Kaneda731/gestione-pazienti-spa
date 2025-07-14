// TEST ELIMINAZIONE PAZIENTE - Esegui nella console (F12)

console.log('🧪 TEST ELIMINAZIONE PAZIENTE');

async function testDeletePatient() {
    try {
        // 1. Ottieni lista pazienti
        const { patientService } = await import('./src/features/patients/services/patientService.js');
        
        console.log('📋 Caricamento pazienti...');
        const patients = await patientService.getPatients();
        console.log(`📊 Trovati ${patients.totalCount} pazienti`);
        
        if (patients.patients.length === 0) {
            console.log('❌ Nessun paziente trovato');
            return;
        }
        
        // 2. Seleziona un paziente da eliminare (l'ultimo per sicurezza)
        const patientToDelete = patients.patients[patients.patients.length - 1];
        console.log('🎯 Paziente selezionato:', patientToDelete.nome, patientToDelete.cognome, 'ID:', patientToDelete.id);
        
        // 3. Conta prima dell'eliminazione
        const beforeCount = patients.totalCount;
        console.log('📊 Conteggio prima:', beforeCount);
        
        // 4. Elimina il paziente
        console.log('🗑️ Eliminazione in corso...');
        await patientService.deletePatient(patientToDelete.id);
        console.log('✅ Paziente eliminato');
        
        // 5. Attendi 1 secondo e verifica
        setTimeout(async () => {
            console.log('⏳ Verifica dopo 1 secondo...');
            const afterPatients = await patientService.getPatients();
            const afterCount = afterPatients.totalCount;
            console.log('📊 Conteggio dopo:', afterCount);
            
            if (afterCount === beforeCount - 1) {
                console.log('🎉 SUCCESSO: Il paziente è stato eliminato correttamente!');
            } else {
                console.log('⚠️ PROBLEMA: Il conteggio non è cambiato come previsto');
                console.log('Aspettato:', beforeCount - 1, 'Reale:', afterCount);
            }
            
            // 6. Verifica direttamente nel database
            const { supabase } = await import('./src/core/services/supabaseClient.js');
            const { count: dbCount } = await supabase
                .from('pazienti')
                .select('*', { count: 'exact' });
                
            console.log('🗄️ Conteggio database:', dbCount);
            
        }, 1000);
        
    } catch (error) {
        console.error('❌ Errore durante test:', error);
    }
}

// Esegui il test
testDeletePatient();