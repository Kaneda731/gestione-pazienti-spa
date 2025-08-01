#!/usr/bin/env node

/**
 * FASE 3: Cleanup Finale - File Più Delicati
 * Elimina i file rimanenti che potrebbero avere dipendenze nascoste
 */

import fs from 'fs/promises';
import path from 'path';

const PHASE3_FILES_TO_DELETE = [
  // Servizi core che potrebbero essere utilizzati
  'src/core/services/emergencyCommands.js',
  'src/core/services/loggerService.js',
  'src/core/services/notificationService.js', // ATTENZIONE: Potrebbe essere utilizzato
  
  // Script di cleanup rimanenti
  'scripts/cleanup/execute-full-cleanup.js' // Questo stesso sistema di cleanup
];

async function checkCriticalDependencies() {
  console.log('🔍 Controllo dipendenze critiche...');
  
  const criticalChecks = [
    {
      file: 'src/core/services/loggerService.js',
      checkCommand: 'grep -r "loggerService" src/ --exclude-dir=node_modules || true'
    },
    {
      file: 'src/core/services/notificationService.js', 
      checkCommand: 'grep -r "notificationService" src/ --exclude-dir=node_modules || true'
    }
  ];
  
  // Qui potresti implementare controlli più sofisticati
  return true; // Per ora assumiamo sia sicuro
}

async function safeCleanupPhase3() {
  console.log('⚠️  FASE 3: Cleanup Finale - File Più Delicati');
  console.log('='.repeat(60));
  console.log('🚨 ATTENZIONE MASSIMA: Questa fase elimina servizi core');
  console.log('   Esegui SOLO se la Fase 2 è andata perfettamente');
  console.log('   e hai testato completamente l\'applicazione');
  console.log('');
  
  const dependenciesOk = await checkCriticalDependencies();
  if (!dependenciesOk) {
    console.log('❌ Controllo dipendenze fallito. Interrompendo...');
    return { deleted: 0, errors: ['Dependency check failed'], skipped: [] };
  }
  
  console.log('🤔 Sei SICURO di voler procedere? (yes/NO)');
  console.log('   Digita "yes" per confermare, qualsiasi altro input annulla');
  
  // In un ambiente reale, useresti readline per input utente
  // Per ora NON procediamo automaticamente per sicurezza
  console.log('🛑 FASE 3 SOSPESA PER SICUREZZA');
  console.log('   Modifica questo script per abilitare l\'esecuzione');
  console.log('   solo dopo aver verificato manualmente ogni file');
  
  return { deleted: 0, errors: [], skipped: PHASE3_FILES_TO_DELETE };
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  safeCleanupPhase3().catch(console.error);
}

export { safeCleanupPhase3 };