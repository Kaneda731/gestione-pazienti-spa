#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Esecuzione dei test con coverage...');

try {
  // Esegui i test con coverage
  execSync('npx vitest run --coverage', { stdio: 'inherit' });
  
  // Verifica se la cartella coverage è stata creata
  const coverageDir = path.resolve(process.cwd(), 'coverage');
  
  if (fs.existsSync(coverageDir)) {
    console.log('✅ La cartella coverage è stata creata con successo!');
    console.log(`📊 Puoi trovare i report in: ${coverageDir}`);
    
    // Elenca i file nella cartella coverage
    const files = fs.readdirSync(coverageDir);
    console.log('\nFile nella cartella coverage:');
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Migliora automaticamente il report
    console.log('\n🔍 Miglioramento del report di coverage...');
    try {
      execSync('node tests/tools/coverage-report-enhancer.js', { stdio: 'inherit' });
      console.log('✅ Report migliorato con successo!');
      console.log(`📊 Puoi visualizzare il report avanzato in: ${path.join(coverageDir, 'index.html')}`);
      
      // Apri automaticamente il report nel browser
      const platform = process.platform;
      let command;
      
      if (platform === 'darwin') {  // macOS
        command = `open ${path.join(coverageDir, 'index.html')}`;
      } else if (platform === 'win32') {  // Windows
        command = `start ${path.join(coverageDir, 'index.html')}`;
      } else {  // Linux
        command = `xdg-open ${path.join(coverageDir, 'index.html')}`;
      }
      
      execSync(command, { stdio: 'ignore' });
      console.log('🌐 Report aperto nel browser');
    } catch (enhanceError) {
      console.error(`❌ Errore durante il miglioramento del report: ${enhanceError.message}`);
    }
  } else {
    console.error('❌ La cartella coverage non è stata creata.');
    console.error('Verifica la configurazione di Vitest.');
  }
} catch (error) {
  console.error(`❌ Errore durante l'esecuzione dei test: ${error.message}`);
  process.exit(1);
}