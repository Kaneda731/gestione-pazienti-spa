// Test per verificare se esiste la tabella diagnosi
import { supabase } from './src/core/services/supabaseClient.js';

async function checkDiagnosiTable() {
    console.log('🔍 Verificando tabella diagnosi...');
    
    try {
        // Prova a fare una query sulla tabella diagnosi
        const { data, error } = await supabase
            .from('diagnosi')
            .select('*')
            .limit(5);
        
        if (error) {
            console.log('❌ Tabella diagnosi non esiste o errore:', error.message);
            return false;
        } else {
            console.log('✅ Tabella diagnosi esiste!');
            console.log('📋 Dati diagnosi:', data);
            return true;
        }
    } catch (err) {
        console.log('❌ Errore durante il test:', err.message);
        return false;
    }
}

// Esegui il test
checkDiagnosiTable().then(exists => {
    if (exists) {
        console.log('✅ La tabella diagnosi è disponibile');
    } else {
        console.log('❌ La tabella diagnosi non è disponibile - potrebbe essere necessario crearla');
    }
});