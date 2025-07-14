/**
 * RECUPERO DATI ORIGINALI DEI PAZIENTI CANCELLATI
 * ===============================================
 * Questo script aiuta a recuperare i dati reali dei pazienti cancellati
 * senza creare dati falsi
 */

import { supabase } from '../core/services/supabaseClient.js';

async function identificaDatiMancanti() {
    console.log('🔍 IDENTIFICAZIONE DATI MANCANTI - PAZIENTI REALI');
    console.log('================================================\n');
    
    try {
        // 1. Verifica quanti pazienti ci sono attualmente
        const { data: pazientiAttuali, error: errorAttuali } = await supabase
            .from('pazienti')
            .select('*')
            .order('data_dimissione', { ascending: false });
            
        if (errorAttuali) {
            console.error('❌ Errore nel recupero:', errorAttuali);
            return;
        }
        
        const totaleAttuale = pazientiAttuali.length;
        console.log(`📊 Pazienti attuali: ${totaleAttuale}`);
        console.log(`📉 Mancano: ${86 - totaleAttuale} pazienti reali\n`);
        
        // 2. Cerca eventuali backup nei log
        console.log('🔍 Ricerca backup e log...');
        
        // Verifica se esiste una tabella di log
        const { data: logData, error: logError } = await supabase
            .from('pazienti_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (!logError && logData) {
            console.log(`📋 Trovati ${logData.length} record nei log`);
            logData.forEach(log => {
                console.log(`   ${log.created_at}: ${log.azione} - ID: ${log.paziente_id}`);
            });
        }
        
        // 3. Esporta i dati attuali per confronto
        const datiAttuali = pazientiAttuali.map(p => ({
            id: p.id,
            nome: p.nome,
            cognome: p.cognome,
            diagnosi: p.diagnosi,
            data_dimissione: p.data_dimissione,
            reparto: p.reparto_appartenenza
        }));
        
        console.log('\n📋 PAZIENTI ATTUALI:');
        datiAttuali.forEach((p, index) => {
            console.log(`   ${index + 1}. ${p.nome || 'N/A'} ${p.cognome || 'N/A'} - ${p.diagnosi || 'N/A'} (${p.data_dimissione || 'N/A'})`);
        });
        
        // 4. Cerca gap nelle date
        const dateUniche = [...new Set(pazientiAttuali.map(p => p.data_dimissione))].sort();
        console.log('\n📅 Date presenti:');
        dateUniche.forEach(data => {
            const count = pazientiAttuali.filter(p => p.data_dimissione === data).length;
            console.log(`   ${data}: ${count} pazienti`);
        });
        
        // 5. Salva report per confronto
        const report = {
            timestamp: new Date().toISOString(),
            pazienti_attuali: totaleAttuale,
            pazienti_mancanti: 86 - totaleAttuale,
            pazienti_dettaglio: datiAttuali,
            date_presenti: dateUniche
        };
        
        // Salva in localStorage per accesso facile
        localStorage.setItem('report_pazienti_mancanti', JSON.stringify(report, null, 2));
        
        console.log('\n✅ REPORT SALVATO');
        console.log('================');
        console.log('📁 Report salvato in: localStorage.report_pazienti_mancanti');
        console.log('📋 Per vedere il report completo:');
        console.log('   console.log(JSON.parse(localStorage.getItem("report_pazienti_mancanti")))');
        
        // 6. Istruzioni per il recupero
        console.log('\n🔄 OPZIONI DI RECUPERO:');
        console.log('===================');
        console.log('1. Verifica se hai un backup del database');
        console.log('2. Controlla se Supabase ha backup automatici');
        console.log('3. Contatta l\'amministratore del database');
        console.log('4. Verifica i log di sistema per data/ora esatta della cancellazione');
        
        // 7. Suggerisci query per recupero
        console.log('\n📊 QUERY UTILI:');
        console.log('==============');
        console.log('-- Verifica ultimi pazienti cancellati:');
        console.log('SELECT * FROM pazienti WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC;');
        console.log('');
        console.log('-- Verifica eventuali tabelle di audit:');
        console.log('SELECT * FROM pazienti_audit ORDER BY created_at DESC LIMIT 20;');
        
    } catch (error) {
        console.error('❌ Errore:', error);
    }
}

// Esegui l'identificazione
identificaDatiMancanti();