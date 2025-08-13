// src/core/utils/rlsDebugger.js

/**
 * Utility per debuggare problemi RLS in Supabase
 * Aiuta a identificare problemi con Row Level Security
 */

import { supabase } from '../services/supabase/supabaseClient.js';
import { logger } from '../services/logger/loggerService.js';

class RLSDebugger {
  /**
   * Esegue un check completo dello stato RLS
   */
  async checkRLSStatus() {
    logger.log('🔒 Controllo stato RLS...');
    
    try {
      const results = {
        user: await this.checkCurrentUser(),
        rlsEnabled: await this.checkRLSEnabled(),
        policies: await this.checkPolicies(),
        dataAccess: await this.checkDataAccess(),
        recommendations: []
      };

      this.generateRecommendations(results);
      this.logResults(results);
      
      return results;
    } catch (error) {
      logger.error('❌ Errore durante il check RLS:', error);
      return { error: error.message };
    }
  }

  /**
   * Verifica l'utente corrente
   */
  async checkCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      let userRole = null;
      if (user) {
        // Ottieni il ruolo dal profilo
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        userRole = profile?.role || 'viewer';
      }
      
      return {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email,
        role: userRole
      };
    } catch (error) {
      return {
        authenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica se RLS è abilitato sulle tabelle
   */
  async checkRLSEnabled() {
    try {
      const { data, error } = await supabase.rpc('check_rls_status');
      
      if (error) {
        // Se la funzione non esiste, proviamo una query diretta
        const { data: tables, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['pazienti', 'eventi_clinici']);
          
        if (tableError) throw tableError;
        
        return {
          available: false,
          message: 'Impossibile verificare RLS - funzione non disponibile',
          tables: tables?.map(t => t.table_name) || []
        };
      }
      
      return data;
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica le policy esistenti
   */
  async checkPolicies() {
    try {
      // Tenta di ottenere informazioni sulle policy
      // Nota: questo potrebbe non funzionare se l'utente non ha i permessi
      const { data, error } = await supabase.rpc('get_table_policies');
      
      if (error) {
        return {
          available: false,
          message: 'Impossibile verificare le policy - permessi insufficienti'
        };
      }
      
      return {
        available: true,
        policies: data || []
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Testa l'accesso ai dati
   */
  async checkDataAccess() {
    const results = {
      pazienti: await this.testTableAccess('pazienti'),
      eventi_clinici: await this.testTableAccess('eventi_clinici')
    };
    
    return results;
  }

  /**
   * Testa l'accesso a una specifica tabella
   */
  async testTableAccess(tableName) {
    const result = {
      table: tableName,
      select: false,
      insert: false,
      update: false,
      delete: false,
      errors: []
    };

    // Test SELECT
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        result.errors.push(`SELECT: ${error.message}`);
      } else {
        result.select = true;
        result.selectCount = data?.length || 0;
      }
    } catch (error) {
      result.errors.push(`SELECT: ${error.message}`);
    }

    // Test INSERT (con dati fittizi)
    if (tableName === 'pazienti') {
      try {
        const testData = {
          nome: 'Test RLS',
          cognome: 'Debug',
          data_nascita: '1990-01-01',
          data_ricovero: new Date().toISOString().split('T')[0],
          diagnosi: 'Test Diagnosis',
          reparto_appartenenza: 'Test Department'
        };

        const { error } = await supabase
          .from(tableName)
          .insert([testData])
          .select();
          
        if (error) {
          result.errors.push(`INSERT: ${error.message}`);
        } else {
          result.insert = true;
          // Cleanup - elimina il record di test
          await supabase
            .from(tableName)
            .delete()
            .eq('nome', 'Test RLS')
            .eq('cognome', 'Debug');
        }
      } catch (error) {
        result.errors.push(`INSERT: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Genera raccomandazioni basate sui risultati
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (!results.user.authenticated) {
      recommendations.push({
        type: 'error',
        message: 'Utente non autenticato - effettua il login'
      });
    }

    if (!results.rlsEnabled.available) {
      recommendations.push({
        type: 'warning',
        message: 'Impossibile verificare lo stato RLS - controlla i permessi'
      });
    }

    if (results.dataAccess.pazienti.errors.length > 0) {
      recommendations.push({
        type: 'error',
        message: 'Problemi di accesso alla tabella pazienti - verifica le policy RLS',
        details: results.dataAccess.pazienti.errors
      });
    }

    if (results.dataAccess.eventi_clinici.errors.length > 0) {
      recommendations.push({
        type: 'error',
        message: 'Problemi di accesso alla tabella eventi_clinici - verifica le policy RLS',
        details: results.dataAccess.eventi_clinici.errors
      });
    }

    if (!results.dataAccess.pazienti.insert) {
      const userRole = results.user.role;
      if (userRole === 'viewer') {
        recommendations.push({
          type: 'info',
          message: 'Non puoi inserire pazienti perché hai ruolo "viewer" - chiedi a un admin di promuoverti a "editor"'
        });
      } else {
        recommendations.push({
          type: 'error',
          message: 'Impossibile inserire pazienti - applica le policy RLS dal file migrations/003_setup_rls_policies.sql'
        });
      }
    }

    results.recommendations = recommendations;
  }

  /**
   * Logga i risultati in modo leggibile
   */
  logResults(results) {
    logger.log('📊 Risultati check RLS:');
    
    // User status
    if (results.user.authenticated) {
      logger.log(`✅ Utente autenticato: ${results.user.email} (${results.user.userId})`);
      logger.log(`🎭 Ruolo utente: ${results.user.role || 'non definito (default: viewer)'}`);
    } else {
      logger.log('❌ Utente non autenticato');
    }

    // Data access
    Object.entries(results.dataAccess).forEach(([table, access]) => {
      logger.log(`\n📋 Tabella ${table}:`);
      logger.log(`  SELECT: ${access.select ? '✅' : '❌'}`);
      logger.log(`  INSERT: ${access.insert ? '✅' : '❌'}`);
      
      if (access.errors.length > 0) {
        logger.log('  Errori:');
        access.errors.forEach(error => logger.log(`    - ${error}`));
      }
    });

    // Recommendations
    if (results.recommendations.length > 0) {
      logger.log('\n💡 Raccomandazioni:');
      results.recommendations.forEach(rec => {
        const icon = rec.type === 'error' ? '❌' : '⚠️';
        logger.log(`${icon} ${rec.message}`);
        if (rec.details) {
          rec.details.forEach(detail => logger.log(`   - ${detail}`));
        }
      });
    } else {
      logger.log('\n✅ Tutto sembra funzionare correttamente!');
    }
  }

  /**
   * Metodo di utilità per testare rapidamente RLS
   */
  async quickTest() {
    logger.log('🚀 Test rapido RLS...');
    
    try {
      // Test semplice: prova a leggere i pazienti
      const { data, error } = await supabase
        .from('pazienti')
        .select('id, nome, cognome')
        .limit(5);
        
      if (error) {
        logger.log(`❌ Errore lettura pazienti: ${error.message}`);
        
        if (error.message.includes('permission denied')) {
          logger.log('💡 Suggerimento: Applica le policy RLS dal file migrations/003_setup_rls_policies.sql');
        }
        
        return false;
      }
      
      logger.log(`✅ Lettura pazienti OK (${data.length} record)`);
      
      // Test scrittura
      const testPatient = {
        nome: 'Test',
        cognome: 'RLS Quick',
        data_nascita: '1990-01-01',
        data_ricovero: new Date().toISOString().split('T')[0],
        diagnosi: 'Test',
        reparto_appartenenza: 'Test'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('pazienti')
        .insert([testPatient])
        .select();
        
      if (insertError) {
        logger.log(`❌ Errore inserimento: ${insertError.message}`);
        return false;
      }
      
      logger.log('✅ Inserimento paziente OK');
      
      // Cleanup
      if (insertData && insertData[0]) {
        await supabase
          .from('pazienti')
          .delete()
          .eq('id', insertData[0].id);
        logger.log('✅ Cleanup completato');
      }
      
      return true;
    } catch (error) {
      logger.log(`❌ Errore durante il test: ${error.message}`);
      return false;
    }
  }
}

// Istanza singleton disponibile globalmente per debug/manuale
const rlsDebugger = new RLSDebugger();
if (typeof window !== 'undefined') {
  window.rlsDebugger = rlsDebugger;
  // Funzioni rapide in console
  window.checkRLS = () => rlsDebugger.quickTest();
  window.fullRLSCheck = () => rlsDebugger.checkRLSStatus();
}