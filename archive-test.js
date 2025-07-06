#!/usr/bin/env node

/**
 * Script Node.js per archiviare test approvati
 * Uso: node archive-test.js nome-file-test.html
 */

const fs = require('fs');
const path = require('path');

// Parsing argomenti
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('❌ Errore: Specificare il nome del file di test da archiviare');
    console.log('💡 Uso: node archive-test.js test-nome-file.html');
    process.exit(1);
}

const testFile = args[0];
const sourcePath = path.join('tests', testFile);
const destPath = path.join('tests', 'approvati', testFile);
const approvedDir = path.join('tests', 'approvati');
const readmePath = path.join(approvedDir, 'README.md');

/**
 * Funzione principale di archiviazione
 */
async function archiveTest() {
    try {
        // Verifica che il file sorgente esista
        if (!fs.existsSync(sourcePath)) {
            console.log(`❌ Errore: File ${sourcePath} non trovato`);
            process.exit(1);
        }

        // Crea directory se non esiste
        if (!fs.existsSync(approvedDir)) {
            console.log('📁 Creazione directory tests/approvati/');
            fs.mkdirSync(approvedDir, { recursive: true });
        }

        // Leggi il contenuto del file per analisi
        const fileContent = fs.readFileSync(sourcePath, 'utf8');
        const testInfo = extractTestInfo(fileContent);

        console.log('📦 Archiviazione test:', testFile);
        console.log('📋 Info test:', testInfo.title || 'Test senza titolo');

        // Sposta il file
        fs.renameSync(sourcePath, destPath);

        // Aggiorna README
        updateReadme(testFile, testInfo);

        console.log('✅ Test', testFile, 'archiviato con successo in tests/approvati/');
        console.log('📝 Il file è ora ignorato da Git come configurato in .gitignore');
        console.log('🎉 Archiviazione completata!');

    } catch (error) {
        console.error('❌ Errore durante l\'archiviazione:', error.message);
        process.exit(1);
    }
}

/**
 * Estrae informazioni dal file di test
 */
function extractTestInfo(content) {
    const info = {};
    
    // Estrai titolo
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    info.title = titleMatch ? titleMatch[1] : null;
    
    // Estrai descrizione se presente
    const descMatch = content.match(/<meta name="description" content="(.*?)"/i);
    info.description = descMatch ? descMatch[1] : null;
    
    return info;
}

/**
 * Aggiorna il README dei test approvati
 */
function updateReadme(testFile, testInfo) {
    const timestamp = new Date().toLocaleString('it-IT');
    const title = testInfo.title || 'Test senza titolo';
    
    let readmeContent = '';
    
    if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf8');
    }
    
    // Aggiungi voce al README se non esiste già
    const entryPattern = new RegExp(`- \`${testFile}\``);
    if (!entryPattern.test(readmeContent)) {
        const newEntry = `- \`${testFile}\` - ${title} (✅ Approvato il ${timestamp})\n`;
        
        // Trova la sezione "## Struttura" e aggiungi dopo
        if (readmeContent.includes('## Struttura')) {
            readmeContent = readmeContent.replace(
                /(## Struttura\n)/,
                `$1${newEntry}`
            );
        } else {
            readmeContent += `\n${newEntry}`;
        }
        
        fs.writeFileSync(readmePath, readmeContent);
        console.log('📋 README aggiornato con informazioni del test');
    }
}

// Esegui archiviazione
archiveTest();
