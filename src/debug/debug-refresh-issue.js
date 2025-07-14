// DEBUG REFRESH DOPO ELIMINAZIONE - Esegui nella console (F12)

console.log('🔍 DEBUG REFRESH LISTA DOPO ELIMINAZIONE');

async function debugRefreshAfterDelete() {
    try {
        // 1. Importa i servizi necessari
        const { patientService } = await import('./src/features/patients/services/patientService.js');
        const { supabase } = await import('./src/core/services/supabaseClient.js');
        
        console.log('=== ANALISI PROBLEMA REFRESH ===');
        
        // 2. Conta pazienti iniziali
        const initialResult = await patientService.getPatients();
        console.log('📊 Pazienti iniziali:', initialResult.totalCount);
        
        // 3. Seleziona un paziente test
        const testPatient = initialResult.patients.find(p => p.nome?.includes('TEST') || p.cognome?.includes('TEST'));
        if (!testPatient) {
            console.log('❌ Nessun paziente TEST trovato, uso il primo');
            const firstPatient = initialResult.patients[0];
            if (!firstPatient) {
                console.log('❌ Nessun paziente disponibile');
                return;
            }
            console.log('🎯 Paziente selezionato:', firstPatient.nome, firstPatient.cognome);
        } else {
            console.log('🎯 Paziente TEST trovato:', testPatient.nome, testPatient.cognome);
        }
        
        const patientId = testPatient?.id || initialResult.patients[0].id;
        
        // 4. Verifica prima dell'eliminazione
        const { data: beforeDelete, count: beforeCount } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
        
        console.log('🗄️ Database prima:', beforeCount);
        
        // 5. Elimina il paziente
        console.log('🗑️ Eliminazione paziente ID:', patientId);
        await patientService.deletePatient(patientId);
        console.log('✅ Eliminazione completata');
        
        // 6. Verifica immediatamente nel database
        const { data: afterDelete, count: afterCount } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
        
        console.log('🗄️ Database dopo:', afterCount);
        console.log('📉 Differenza:', beforeCount - afterCount);
        
        // 7. Verifica cache
        console.log('💾 Cache dopo eliminazione:', patientService.cache.size);
        
        // 8. Test refresh lista
        console.log('🔄 Test refresh lista...');
        const refreshedResult = await patientService.getPatients();
        console.log('📊 Lista refreshata:', refreshedResult.totalCount);
        
        // 9. Confronto finale
        console.log('=== RISULTATI ===');
        console.log('Database:', beforeCount, '→', afterCount, '(differenza:', beforeCount - afterCount, ')');
        console.log('Lista servizio:', initialResult.totalCount, '→', refreshedResult.totalCount, '(differenza:', initialResult.totalCount - refreshedResult.totalCount, ')');
        
        if (beforeCount - afterCount === 1 && initialResult.totalCount - refreshedResult.totalCount === 1) {
            console.log('🎉 TUTTO FUNZIONA CORRETTAMENTE!');
            console.log('Il paziente è stato eliminato sia dal database che dalla lista.');
        } else {
            console.log('⚠️ DISCREPANZA RILEVATA');
            console.log('Il database riflette la cancellazione ma la lista potrebbe avere problemi di cache.');
        }
        
    } catch (error) {
        console.error('❌ Errore durante debug:', error);
    }
}

// Funzione per forzare refresh cache
async function forceRefresh() {
    console.log('🔄 Forzatura refresh cache...');
    const { patientService } = await import('./src/features/patients/services/patientService.js');
    patientService.invalidateCache();
    console.log('✅ Cache invalidata');
    
    const refreshed = await patientService.getPatients();
    console.log('📊 Lista dopo refresh forzato:', refreshed.totalCount);
}

// Comandi disponibili:
console.log('🎯 COMANDI DISPONIBILI:');
console.log('- debugRefreshAfterDelete() - Test completo eliminazione');
console.log('- forceRefresh() - Forza refresh cache');

// Esegui automaticamente
setTimeout(debugRefreshAfterDelete, 1000);