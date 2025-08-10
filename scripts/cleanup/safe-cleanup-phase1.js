#!/usr/bin/env node

/**
 * FASE 1: Cleanup Sicuro - File a Rischio Minimo
 * Elimina solo file di test, documentazione e script di cleanup
 */

import fs from 'fs/promises';
import path from 'path';

const SAFE_FILES_TO_DELETE = [
  // File di documentazione non critici
  'CLAUDE.md',
  
  // Script di test del sistema di cleanup (non più necessari)
  'scripts/cleanup/test-asset-optimizer.js',
  'scripts/cleanup/test-categorization.js',
  'scripts/cleanup/test-cleanup-summary-generator.js',
  'scripts/cleanup/test-comprehensive-report.js',
  'scripts/cleanup/test-debug-removal.js',
  'scripts/cleanup/test-dependency-tracker.js',
  'scripts/cleanup/test-directory-organizer.js',
  'scripts/cleanup/test-file-deletion-reorganization-integration.js',
  'scripts/cleanup/test-file-reorganizer.js',
  'scripts/cleanup/test-file-scanner.js',
  'scripts/cleanup/test-infrastructure.js',
  'scripts/cleanup/test-integration.js',
  'scripts/cleanup/test-integrity-testing-framework.js',
  'scripts/cleanup/test-obsolete-cleaner.js',
  'scripts/cleanup/test-operation-logger.js',
  'scripts/cleanup/test-post-cleanup-validator.js',
  'scripts/cleanup/test-safe-file-deleter.js',
  'scripts/cleanup/test-validation-integration.js',
  
  // Test E2E obsoleti (possono essere ricreati se necessario)
  '__tests__/e2e/eventi-clinici/accessibility.spec.js',
  '__tests__/e2e/eventi-clinici/clinical-events-crud.spec.js',
  '__tests__/e2e/eventi-clinici/cross-feature-integration.spec.js',
  '__tests__/e2e/eventi-clinici/discharge-transfer-workflow.spec.js',
  '__tests__/e2e/eventi-clinici/performance.spec.js',
  '__tests__/e2e/eventi-clinici/responsive-design.spec.js',
  '__tests__/e2e/eventi-clinici/search-filtering.spec.js',
  
  // File di setup test obsoleto
  '__tests__/setup/test-setup.js',
  
  // Utility di test non utilizzata
  'src/shared/utils/test-utils.js'
];

async function safeCleanupPhase1() {
  console.log('🛡️ FASE 1: Cleanup Sicuro - File a Rischio Minimo');
  console.log('='.repeat(60));
  
  let deletedCount = 0;
  let errors = [];
  
  for (const filePath of SAFE_FILES_TO_DELETE) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`✅ Eliminato: ${filePath}`);
      deletedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`❌ Errore eliminando ${filePath}: ${error.message}`);
        errors.push({ file: filePath, error: error.message });
      } else {
        console.log(`⚠️  File non trovato: ${filePath}`);
      }
    }
  }
  
  console.log('='.repeat(60));
  console.log(`🎉 Fase 1 completata!`);
  console.log(`📊 File eliminati: ${deletedCount}/${SAFE_FILES_TO_DELETE.length}`);
  
  if (errors.length > 0) {
    console.log(`❌ Errori: ${errors.length}`);
    errors.forEach(err => console.log(`   - ${err.file}: ${err.error}`));
  }
  
  console.log('\n💡 Prossimi passi:');
  console.log('   1. Testa l\'applicazione per assicurarti che funzioni');
  console.log('   2. Se tutto ok, procedi con la Fase 2');
  
  return { deleted: deletedCount, errors };
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  safeCleanupPhase1().catch(console.error);
}

export { safeCleanupPhase1 };