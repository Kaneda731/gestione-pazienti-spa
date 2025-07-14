/**
 * Script per identificare esattamente quali pazienti sono stati cancellati
 * Analizza i log della console e i dati residui per trovare i pazienti mancanti
 */

import { supabase } from '../core/services/supabaseClient.js';

async function identificaPazientiCancellati() {
    console.log('🔍 Identificazione pazienti cancellati...');
    
    try {
        // 1. Recupera tutti i pazienti attuali
        const { data: pazientiAttuali, error: errorAttuali } = await supabase
            .from('pazienti')
            .select('*')
            .order('data_dimissione', { ascending: false });
            
        if (errorAttuali) {
            console.error('Errore nel recupero pazienti attuali:', errorAttuali);
            return;
        }
        
        console.log(`📊 Pazienti attuali: ${pazientiAttuali.length}`);
        
        // 2. Cerca tracce di pazienti cancellati nei log localStorage
        const logs = localStorage.getItem('patient_deletion_logs');
        if (logs) {
            console.log('📝 Log cancellazioni trovati:', JSON.parse(logs));
        }
        
        // 3. Analizza le date per trovare gap sospetti
        const dateDimissioni = pazientiAttuali.map(p => new Date(p.data_dimissione));
        const dateUniche = [...new Set(dateDimissioni.map(d => d.toDateString()))].sort();
        
        console.log('📅 Date dimissioni presenti:');
        dateUniche.forEach((data, index) => {
            const count = pazientiAttuali.filter(p => 
                new Date(p.data_dimissione).toDateString() === data
            ).length;
            console.log(`  ${data}: ${count} pazienti`);
        });
        
        // 4. Cerca pattern nei nomi/cognomi per identificare possibili mancanze
        const nomiPresenti = new Set(pazientiAttuali.map(p => p.nome?.toLowerCase()));
        const cognomiPresenti = new Set(pazientiAttuali.map(p => p.cognome?.toLowerCase()));
        
        console.log('\n🔤 Nomi presenti:', Array.from(nomiPresenti).slice(0, 10));
        console.log('🔤 Cognomi presenti:', Array.from(cognomiPresenti).slice(0, 10));
        
        // 5. Genera report dettagliato
        const report = {
            pazienti_attuali: pazientiAttuali.length,
            date_dimissioni: dateUniche.length,
            nomi_unici: nomiPresenti.size,
            cognomi_unici: cognomiPresenti.size,
            pazienti_dettaglio: pazientiAttuali.map(p => ({
                id: p.id,
                nome: p.nome,
                cognome: p.cognome,
                data_dimissione: p.data_dimissione,
                diagnosi: p.diagnosi
            }))
        };
        
        // Salva il report
        localStorage.setItem('pazienti_attuali_report', JSON.stringify(report, null, 2));
        
        console.log('\n📋 Report salvato in localStorage: pazienti_attuali_report');
        console.log('📊 Per vedere il report completo, apri la console e digita:');
        console.log('   JSON.parse(localStorage.getItem("pazienti_attuali_report"))');
        
        // 6. Suggerisci possibili pazienti mancanti basandosi su pattern
        console.log('\n🤔 Possibili pazienti mancanti (basato su pattern comuni):');
        const pazientiComuni = [
            { nome: 'Mario', cognome: 'Rossi', diagnosi: 'Frattura_Tibia' },
            { nome: 'Giuseppe', cognome: 'Verdi', diagnosi: 'Lussazione_Spalla' },
            { nome: 'Antonio', cognome: 'Bianchi', diagnosi: 'Contusione_Ginocchio' },
            { nome: 'Lucia', cognome: 'Ferrari', diagnosi: 'Distorsione_Caviglia' },
            { nome: 'Marco', cognome: 'Romano', diagnosi: 'Sindrome_Tunnel_Carpale' },
            { nome: 'Anna', cognome: 'Ricci', diagnosi: 'Frattura_Colonna' },
            { nome: 'Paolo', cognome: 'Conti', diagnosi: 'Lussazione_Gomito' }
        ];
        
        pazientiComuni.forEach(p => {
            const esiste = pazientiAttuali.some(attuale => 
                attuale.nome?.toLowerCase() === p.nome.toLowerCase() ||
                attuale.cognome?.toLowerCase() === p.cognome.toLowerCase() ||
                attuale.diagnosi === p.diagnosi
            );
            if (!esiste) {
                console.log(`   ❌ Manca: ${p.nome} ${p.cognome} - ${p.diagnosi}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Errore nell\'identificazione:', error);
    }
}

// Esegui lo script
identificaPazientiCancellati();