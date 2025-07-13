// check-schema.js
import { createClient } from '@supabase/supabase-js';

// Leggi le variabili d'ambiente dal file .env
const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    console.log('🔍 Verifica schema tabella pazienti...');
    
    try {
        // Prova a leggere una riga per vedere la struttura
        const { data, error } = await supabase
            .from('pazienti')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Errore nella query:', error.message);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ Schema attuale della tabella pazienti:');
            console.log('Colonne trovate:', Object.keys(data[0]));
            
            // Confronta con i campi richiesti
            const requiredFields = ['nome', 'cognome', 'data_ricovero', 'diagnosi', 'reparto_appartenenza', 'user_id'];
            const optionalFields = ['data_dimissione', 'codice_rad', 'reparto_provenienza', 'livello_assistenza'];
            
            const actualFields = Object.keys(data[0]);
            
            console.log('\n📋 Analisi campi richiesti:');
            requiredFields.forEach(field => {
                const exists = actualFields.includes(field);
                console.log(`${exists ? '✅' : '❌'} ${field}`);
            });
            
            console.log('\n📋 Analisi campi opzionali:');
            optionalFields.forEach(field => {
                const exists = actualFields.includes(field);
                console.log(`${exists ? '✅' : '❌'} ${field}`);
            });
            
            // Campi extra non documentati
            const extraFields = actualFields.filter(field => 
                !requiredFields.includes(field) && !optionalFields.includes(field)
            );
            
            if (extraFields.length > 0) {
                console.log('\n⚠️  Campi extra non documentati:', extraFields);
            }
            
        } else {
            console.log('ℹ️  Tabella vuota, provo a ottenere info sulle colonne...');
            
            // Prova un'altra strategia
            const { data: columns, error: colError } = await supabase
                .from('pazienti')
                .select('*');
                
            if (colError) {
                console.error('❌ Errore:', colError.message);
            } else {
                console.log('📊 Struttura tabella non disponibile direttamente');
            }
        }
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
    }
}

checkSchema();