// src/debug/test-connection.js
/**
 * Script di debug per verificare la connessione al database
 * e la fonte dei dati pazienti
 */

import { supabase } from '../core/services/supabaseClient.js';
import { patientService } from '../features/patients/services/patientService.js';

class DebugConnection {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: []
        };
    }

    async runAllTests() {
        console.log('🚀 Avvio test di connessione database...');
        
        await this.testSupabaseConnection();
        await this.testPatientTable();
        await this.testPatientService();
        await this.checkMockData();
        await this.checkLocalStorage();
        
        this.printSummary();
        return this.results;
    }

    async testSupabaseConnection() {
        console.log('\n📡 Test connessione Supabase...');
        try {
            const { data, error } = await supabase.auth.getUser();
            this.addResult('Supabase Auth', !error, {
                user: data?.user?.email || null,
                error: error?.message || null
            });
        } catch (error) {
            this.addResult('Supabase Auth', false, { error: error.message });
        }
    }

    async testPatientTable() {
        console.log('\n🏗️ Test tabella pazienti...');
        try {
            const { data, count, error } = await supabase
                .from('pazienti')
                .select('*', { count: 'exact' })
                .limit(5);

            this.addResult('Tabella Pazienti', !error, {
                count: count || 0,
                sampleData: data || [],
                error: error?.message || null
            });
        } catch (error) {
            this.addResult('Tabella Pazienti', false, { error: error.message });
        }
    }

    async testPatientService() {
        console.log('\n🔧 Test PatientService...');
        try {
            const result = await patientService.getPatients({}, { limit: 5 });
            this.addResult('PatientService', true, {
                patientsCount: result.patients.length,
                totalCount: result.totalCount,
                samplePatients: result.patients.slice(0, 2)
            });
        } catch (error) {
            this.addResult('PatientService', false, { error: error.message });
        }
    }

    async checkMockData() {
        console.log('\n🧪 Verifica dati mock...');
        try {
            const { data } = await supabase
                .from('pazienti')
                .select('*');

            const mockPatterns = [
                /test/i,
                /mock/i,
                /demo/i,
                /example/i,
                /sample/i
            ];

            const mockPatients = data?.filter(p => 
                mockPatterns.some(pattern => 
                    pattern.test(p.nome || '') || 
                    pattern.test(p.cognome || '') ||
                    pattern.test(p.email || '')
                )
            ) || [];

            this.addResult('Dati Mock', mockPatients.length > 0, {
                mockCount: mockPatients.length,
                mockPatients: mockPatients.slice(0, 3)
            });
        } catch (error) {
            this.addResult('Dati Mock', false, { error: error.message });
        }
    }

    async checkLocalStorage() {
        console.log('\n💾 Verifica storage locale...');
        
        const storageData = {
            localStorage: {},
            sessionStorage: {}
        };

        // Controlla localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('patient') || key.includes('paziente')) {
                storageData.localStorage[key] = localStorage.getItem(key);
            }
        }

        // Controlla sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.includes('patient') || key.includes('paziente')) {
                storageData.sessionStorage[key] = sessionStorage.getItem(key);
            }
        }

        this.addResult('Storage Locale', true, storageData);
    }

    addResult(testName, success, details = {}) {
        this.results.tests.push({
            name: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    printSummary() {
        console.log('\n📊 Riepilogo Test di Connessione');
        console.log('================================');
        
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.success).length;
        
        console.log(`Test totali: ${totalTests}`);
        console.log(`Test passati: ${passedTests}`);
        console.log(`Test falliti: ${totalTests - passedTests}`);
        
        this.results.tests.forEach(test => {
            const status = test.success ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            if (!test.success || Object.keys(test.details).length > 0) {
                console.log(`   Dettagli:`, test.details);
            }
        });

        console.log('\n🔍 Per ulteriori dettagli, controlla i risultati completi in:');
        console.log('window.debugResults (se eseguito nel browser)');
    }

    // Metodo per eseguire dal browser
    static async runInBrowser() {
        if (typeof window !== 'undefined') {
            const debug = new DebugConnection();
            window.debugResults = await debug.runAllTests();
            return window.debugResults;
        }
    }
}

// Esegui se richiesto
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugConnection;
} else {
    // Per browser - esponi globalmente
    window.DebugConnection = DebugConnection;
    console.log('🎯 DebugConnection caricato. Esegui: await DebugConnection.runInBrowser()');
}

export default DebugConnection;