// check-schema-sql.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTableSchema() {
    console.log('🔍 Verifica schema tabella pazienti con SQL...');
    
    try {
        // Lista dei campi basata sulla documentazione e sul codice
        const documentedFields = [
            'nome', 'cognome', 'data_ricovero', 'diagnosi', 'reparto_appartenenza', 'user_id',
            'data_dimissione', 'codice_rad', 'reparto_provenienza', 'livello_assistenza'
        ];
        
        const formFields = [
            'nome', 'cognome', 'data_nascita', 'data_ricovero', 'diagnosi', 'codice_rad',
            'data_dimissione', 'infetto', 'reparto_appartenenza', 'reparto_provenienza', 'livello_assistenza'
        ];
        
        console.log('\n📋 ANALISI CAMPI:');
        console.log('================');
        
        console.log('\n📄 Campi documentati in docs/campi-inserimento-paziente.md:');
        documentedFields.forEach(field => console.log(`   - ${field}`));
        
        console.log('\n📝 Campi presenti nel form HTML:');
        formFields.forEach(field => console.log(`   - ${field}`));
        
        console.log('\n⚠️  DISCREPANZE IDENTIFICATE:');
        console.log('============================');
        
        // Campi nel form ma non documentati
        const extraInForm = formFields.filter(field => !documentedFields.includes(field));
        if (extraInForm.length > 0) {
            console.log('\n❗ Campi nel form ma non documentati:');
            extraInForm.forEach(field => console.log(`   - ${field}`));
        }
        
        // Campi documentati ma non nel form
        const missingInForm = documentedFields.filter(field => !formFields.includes(field));
        if (missingInForm.length > 0) {
            console.log('\n❗ Campi documentati ma non nel form:');
            missingInForm.forEach(field => console.log(`   - ${field}`));
        }
        
        console.log('\n🎯 RISULTATO:');
        console.log('==============');
        console.log('Per verificare lo schema reale della tabella, esegui questa query SQL su Supabase:');
        console.log('\n```sql');
        console.log('SELECT column_name, data_type, is_nullable, column_default');
        console.log('FROM information_schema.columns');
        console.log("WHERE table_name = 'pazienti'");
        console.log('ORDER BY ordinal_position;');
        console.log('```');
        
        console.log('\n📋 SQL per aggiungere campi mancanti:');
        console.log('=====================================');
        
        // Genera SQL per aggiungere campi mancanti - ottimizzato per 11 caratteri
        const fieldsToAdd = [
            { name: 'data_nascita', type: 'DATE', nullable: 'NULL' },
            { name: 'infetto', type: 'BOOLEAN', nullable: 'NULL', default: 'false' },
            { name: 'codice_rad', type: 'VARCHAR(11)', nullable: 'NULL' }
        ];
        
        fieldsToAdd.forEach(field => {
            console.log(`\n-- Aggiungi campo ${field.name}`);
            console.log(`ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS ${field.name} ${field.type} ${field.nullable}${field.default ? ` DEFAULT ${field.default}` : ''};`);
        });
        
        console.log('\n✅ SQL per verificare campi esistenti:');
        console.log('======================================');
        console.log('\n```sql');
        console.log('-- Verifica tutte le colonne della tabella');
        console.log('\\d pazienti');
        console.log('\n-- Oppure');
        console.log("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pazienti';");
        console.log('```');
        
        console.log('\n📏 FORMATO CAMPI:');
        console.log('=================');
        console.log('codice_rad: VARCHAR(11) per codici esattamente di 11 caratteri numerici');
        console.log('data_nascita: DATE per formato data');
        console.log('infetto: BOOLEAN per true/false');
        
    } catch (error) {
        console.error('❌ Errore generale:', error.message);
    }
}

checkTableSchema();