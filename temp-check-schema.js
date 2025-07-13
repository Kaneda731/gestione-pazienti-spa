// temp-check-schema.js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Le variabili d'ambiente SUPABASE_URL e SUPABASE_KEY devono essere impostate.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientSchema() {
    try {
        const { data, error } = await supabase
            .from('pazienti')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log("La tabella 'pazienti' è vuota, ma la struttura può essere letta. Colonne non disponibili con questo metodo.");
                // Provo a leggere lo schema in un altro modo
                const { data: tableData, error: tableError } = await supabase.rpc('get_table_columns', { p_table_name: 'pazienti' });
                if(tableError) throw tableError;
                console.log("Colonne trovate:", tableData.map(c => c.column_name));
                return;
            }
            throw error;
        }

        if (data) {
            console.log("Schema della tabella 'pazienti' (basato sulla prima riga):");
            console.log(Object.keys(data));
        } else {
            console.log("La tabella 'pazienti' è vuota. Impossibile determinare lo schema dalla prima riga.");
        }
    } catch (error) {
        console.error("Errore durante la verifica dello schema:", error.message);
    }
}

checkPatientSchema();
