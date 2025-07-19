#!/usr/bin/env node

/**
 * Script per analizzare i test esistenti
 */

const fs = require('fs');
const path = require('path');

function analyzeTests() {
  const testFiles = [];
  const analysis = {
    totalFiles: 0,
    categories: {
      unit: [],
      integration: [],
      component: [],
      service: [],
      utility: []
    },
    issues: {
      emptyTests: [],
      missingAssertions: [],
      duplicatedMocks: []
    }
  };

  // Scansiona file di test
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['__setup__', '__mocks__', '__fixtures__', '__helpers__'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (item.endsWith('.test.js') || item.endsWith('.spec.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          testFiles.push({
            path: fullPath,
            name: item,
            content,
            size: stat.size
          });
        }
      }
    } catch (error) {
      console.warn(`Cannot scan ${dir}:`, error.message);
    }
  }

  // Categorizza test
  function categorizeTest(testFile) {
    const { path: filePath, content } = testFile;
    
    if (filePath.includes('integration') || content.includes('integration')) {
      return 'integration';
    }
    
    if (filePath.includes('components') || content.includes('Component')) {
      return 'component';
    }
    
    if (filePath.includes('services') || content.includes('Service') || testFile.name.includes('Service')) {
      return 'service';
    }
    
    if (filePath.includes('utils') || filePath.includes('helpers')) {
      return 'utility';
    }
    
    return 'unit';
  }

  // Analizza problemi
  function analyzeIssues(testFile) {
    const { content, name } = testFile;
    
    // Test senza asserzioni
    const hasAssertions = /expect\(|assert\.|should\.|toBe|toEqual|toHaveBeenCalled/.test(content);
    if (!hasAssertions && content.includes('it(')) {
      analysis.issues.missingAssertions.push(name);
    }
    
    // Test molto corti (probabilmente vuoti)
    const itBlocks = content.match(/(it|test)\(['"`][^'"`]+['"`][^}]+}/g) || [];
    for (const block of itBlocks) {
      if (block.length < 80) {
        analysis.issues.emptyTests.push({
          file: name,
          block: block.substring(0, 50) + '...'
        });
      }
    }
  }

  // Esegui analisi
  scanDirectory('.');
  
  for (const testFile of testFiles) {
    const category = categorizeTest(testFile);
    analysis.categories[category].push(testFile);
    analyzeIssues(testFile);
  }
  
  analysis.totalFiles = testFiles.length;

  // Stampa risultati
  console.log('\n=== ANALISI TEST ESISTENTI ===\n');
  console.log(`📊 File di test totali: ${analysis.totalFiles}`);
  
  console.log('\n📂 Categorizzazione:');
  Object.entries(analysis.categories).forEach(([category, files]) => {
    console.log(`  ${category}: ${files.length} files`);
    if (files.length > 0) {
      files.forEach(f => console.log(`    - ${f.name}`));
    }
  });
  
  console.log('\n⚠️  Problemi identificati:');
  console.log(`  Test senza asserzioni: ${analysis.issues.missingAssertions.length}`);
  if (analysis.issues.missingAssertions.length > 0) {
    analysis.issues.missingAssertions.forEach(file => console.log(`    - ${file}`));
  }
  
  console.log(`  Test potenzialmente vuoti: ${analysis.issues.emptyTests.length}`);
  if (analysis.issues.emptyTests.length > 0) {
    analysis.issues.emptyTests.forEach(test => console.log(`    - ${test.file}: ${test.block}`));
  }
  
  console.log('\n💡 Raccomandazioni:');
  console.log('  1. Migrare test servizi alla nuova struttura con mock centralizzati');
  console.log('  2. Consolidare test componenti UI con helper DOM');
  console.log('  3. Migliorare test vuoti o senza asserzioni');
  console.log('  4. Standardizzare pattern di test');
  
  console.log('\n===============================\n');
  
  return analysis;
}

// Esegui se chiamato direttamente
if (require.main === module) {
  analyzeTests();
}

module.exports = { analyzeTests };