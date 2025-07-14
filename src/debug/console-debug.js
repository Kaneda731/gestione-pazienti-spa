// DEBUG CONSOLE - Esegui questi comandi nella console del browser (F12)
// Per verificare perché i pazienti ricompaiono dopo la cancellazione

console.log('🚀 DEBUG TOOL caricato! Esegui questi comandi:');

// 1. Verifica connessione database
window.debugDB = async function() {
    console.log('=== DEBUG DATABASE ===');
    
    try {
        // Importa i servizi necessari
        const { supabase } = await import('../core/services/supabaseClient.js');
        const { currentUser } = await import('../core/auth/authService.js');
        const { patientService } = await import('../features/patients/services/patientService.js');
        
        console.log('👤 Utente:', currentUser?.session?.user?.email || 'Non autenticato');
        
        // Conta pazienti reali nel database
        const { data: realPatients, error: dbError, count } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
            
        console.log('📊 Pazienti REALI nel database:', count);
        console.log('📋 Dettagli:', realPatients?.slice(0, 3));
        
        if (dbError) {
            console.error('❌ Errore database:', dbError);
        }
        
        // Verifica se stai usando dati mock
        const mockData = localStorage.getItem('mockPatients');
        console.log('🎭 Dati mock in localStorage:', mockData ? 'Presenti' : 'Assenti');
        
        return { realCount: count, mockExists: !!mockData };
        
    } catch (error) {
        console.error('❌ Errore debug:', error);
    }
};

// 2. Pulisci tutti i dati locali
window.clearAllData = function() {
    console.log('🧹 Pulizia dati locali...');
    
    localStorage.clear();
    sessionStorage.clear();
    
    // Invalida cache del servizio pazienti
    if (window.patientService) {
        window.patientService.invalidateCache();
    }
    
    console.log('✅ Dati locali puliti! Ricarica la pagina.');
};

// 3. Crea un paziente di test reale
window.createTestPatient = async function() {
    try {
        const { patientService } = await import('../features/patients/services/patientService.js');
        
        const testPatient = {
            nome: 'TEST',
            cognome: 'PAZIENTE',
            codice_rad: 'TEST001',
            data_nascita: '1990-01-01',
            reparto_appartenenza: 'Cardiologia',
            diagnosi: 'Test',
            infetto: false
        };
        
        const result = await patientService.createPatient(testPatient);
        console.log('✅ Paziente test creato:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Errore creazione:', error);
    }
};

// 4. Lista tutti i pazienti con fonte
window.listAllPatients = async function() {
    console.log('=== LISTA PAZIENTI ===');
    
    try {
        const { patientService } = await import('../features/patients/services/patientService.js');
        const { supabase } = await import('../core/services/supabaseClient.js');
        
        // Da servizio (quello che vedi nell'app)
        const servicePatients = await patientService.getPatients();
        console.log('📱 Pazienti dal servizio:', servicePatients.data?.length);
        
        // Da database diretto
        const { data: dbPatients, count } = await supabase
            .from('pazienti')
            .select('*', { count: 'exact' });
            
        console.log('🗄️ Pazienti dal database:', count);
        
        // Confronta
        console.log('🔍 Confronto:');
        console.log('- Servizio:', servicePatients.data?.length || 0);
        console.log('- Database:', count || 0);
        
        return { service: servicePatients.data, database: dbPatients };
        
    } catch (error) {
        console.error('❌ Errore:', error);
    }
};

// 5. Cancella un paziente e verifica
window.deleteAndVerify = async function(patientId) {
    console.log('🗑️ Eliminazione paziente:', patientId);
    
    try {
        const { patientService } = await import('../features/patients/services/patientService.js');
        
        // Prima del delete
        const before = await patientService.getPatients();
        console.log('📊 Prima:', before.data?.length);
        
        // Delete
        await patientService.deletePatient(patientId);
        console.log('✅ Paziente eliminato');
        
        // Dopo 2 secondi
        setTimeout(async () => {
            const after = await patientService.getPatients();
            console.log('📊 Dopo:', after.data?.length);
            
            // Verifica database
            const { supabase } = await import('../core/services/supabaseClient.js');
            const { count } = await supabase
                .from('pazienti')
                .select('*', { count: 'exact' });
                
            console.log('🗄️ Database count:', count);
            
        }, 2000);
        
    } catch (error) {
        console.error('❌ Errore eliminazione:', error);
    }
};

console.log('🎯 COMANDI DISPONIBILI:');
console.log('- debugDB() - Verifica connessione database');
console.log('- clearAllData() - Pulisce dati locali');
console.log('- createTestPatient() - Crea paziente test');
console.log('- listAllPatients() - Lista tutti i pazienti');
console.log('- deleteAndVerify(id) - Cancella e verifica');

// Esegui automaticamente il debug
setTimeout(() => {
    console.log('🔄 Esecuzione debug automatico...');
    debugDB();
}, 1000);