#!/usr/bin/env node

/**
 * Script di Verifica Dipendenze
 * Controlla che i file da eliminare non siano importati da altri file
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

async function checkFileDependencies(filesToCheck) {
  console.log('🔍 Verifica dipendenze in corso...');
  const issues = [];
  
  for (const filePath of filesToCheck) {
    const fileName = path.basename(filePath);
    const fileNameNoExt = path.basename(filePath, path.extname(filePath));
    
    try {
      // Cerca import/require del file
      const searchPatterns = [
        `"${fileName}"`,
        `'${fileName}'`,
        `"${fileNameNoExt}"`,
        `'${fileNameNoExt}'`,
        `@import "${fileName}"`,
        `@import '${fileName}'`,
        `@import "${fileNameNoExt}"`,
        `@import '${fileNameNoExt}'`
      ];
      
      for (const pattern of searchPatterns) {
        try {
          const result = execSync(`grep -r "${pattern}" src/ --exclude-dir=node_modules 2>/dev/null || true`, 
            { encoding: 'utf8' });
          
          if (result.trim()) {
            // Filtra risultati che non sono il file stesso
            const lines = result.split('\n').filter(line => 
              line.trim() && !line.includes(filePath)
            );
            
            if (lines.length > 0) {
              issues.push({
                file: filePath,
                pattern: pattern,
                usages: lines
              });
            }
          }
        } catch (error) {
          // Ignora errori di grep
        }
      }
    } catch (error) {
      console.log(`⚠️  Errore controllando ${filePath}: ${error.message}`);
    }
  }
  
  return issues;
}

async function verifyCleanupSafety() {
  console.log('🛡️ Verifica Sicurezza Cleanup');
  console.log('='.repeat(50));
  
  // File che erano nella lista originale ma potrebbero essere problematici
  const suspiciousFiles = [
    'src/css/modules/_variables.scss',
    'src/core/services/loggerService.js',
    'src/core/services/notificationService.js',
    'src/shared/services/modalService.js'
  ];
  
  const issues = await checkFileDependencies(suspiciousFiles);
  
  if (issues.length === 0) {
    console.log('✅ Nessun problema di dipendenze rilevato');
    return true;
  }
  
  console.log(`❌ Trovati ${issues.length} potenziali problemi:`);
  issues.forEach(issue => {
    console.log(`\n📁 File: ${issue.file}`);
    console.log(`🔍 Pattern: ${issue.pattern}`);
    console.log('📍 Utilizzato in:');
    issue.usages.forEach(usage => {
      console.log(`   ${usage}`);
    });
  });
  
  return false;
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyCleanupSafety().then(safe => {
    if (!safe) {
      console.log('\n⚠️  ATTENZIONE: Problemi rilevati. Controlla prima di procedere con il cleanup.');
      process.exit(1);
    }
  }).catch(console.error);
}

export { verifyCleanupSafety, checkFileDependencies };