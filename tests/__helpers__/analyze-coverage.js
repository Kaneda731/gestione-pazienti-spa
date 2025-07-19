#!/usr/bin/env node

/**
 * Script per analizzare la coverage attuale del progetto
 * Identifica file senza test e aree critiche per migliorare la coverage
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, relative } from 'path';

class CoverageAnalyzer {
  constructor() {
    this.srcDir = 'src';
    this.testsDir = 'tests';
    this.excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'coverage',
      'backup'
    ];
    this.sourceFiles = [];
    this.testFiles = [];
    this.coverageData = null;
  }

  /**
   * Esegue l'analisi completa della coverage
   */
  async analyze() {
    console.log('🔍 Analizzando la coverage del progetto...\n');
    
    // 1. Scansiona i file sorgente
    this.scanSourceFiles();
    console.log(`📁 Trovati ${this.sourceFiles.length} file sorgente`);
    
    // 2. Scansiona i file di test
    this.scanTestFiles();
    console.log(`🧪 Trovati ${this.testFiles.length} file di test`);
    
    // 3. Esegui coverage sui test funzionanti
    await this.runCoverageOnWorkingTests();
    
    // 4. Identifica file senza test
    const filesWithoutTests = this.findFilesWithoutTests();
    console.log(`❌ ${filesWithoutTests.length} file senza test`);
    
    // 5. Analizza priorità
    const priorities = this.analyzePriorities(filesWithoutTests);
    
    // 6. Genera report
    this.generateReport(filesWithoutTests, priorities);
    
    console.log('\n✅ Analisi completata! Controlla il file coverage-analysis.md');
  }

  /**
   * Scansiona tutti i file sorgente JavaScript
   */
  scanSourceFiles() {
    this.sourceFiles = this.scanDirectory(this.srcDir, ['.js', '.mjs'])
      .filter(file => !this.shouldExclude(file));
  }

  /**
   * Scansiona tutti i file di test
   */
  scanTestFiles() {
    this.testFiles = this.scanDirectory(this.testsDir, ['.js', '.mjs'])
      .filter(file => file.includes('.test.') || file.includes('.spec.'));
  }

  /**
   * Scansiona una directory ricorsivamente
   */
  scanDirectory(dir, extensions) {
    const files = [];
    
    if (!existsSync(dir)) return files;
    
    const scan = (currentDir) => {
      const items = readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldExclude(fullPath)) {
          scan(fullPath);
        } else if (stat.isFile() && extensions.includes(extname(item))) {
          files.push(fullPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  /**
   * Verifica se un file/directory deve essere escluso
   */
  shouldExclude(path) {
    return this.excludePatterns.some(pattern => path.includes(pattern));
  }

  /**
   * Esegue coverage solo sui test che funzionano
   */
  async runCoverageOnWorkingTests() {
    console.log('\n📊 Eseguendo coverage sui test funzionanti...');
    
    const workingTestPaths = [
      'tests/unit/shared/components/',
      'tests/unit/shared/utils/',
      'tests/unit/core/stateService.test.js',
      'tests/unit/tools/'
    ];
    
    try {
      const command = `npm test -- --coverage ${workingTestPaths.join(' ')}`;
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      
      // Estrai informazioni di coverage dall'output
      this.parseCoverageOutput(output);
      
    } catch (error) {
      console.warn('⚠️  Errore durante l\'esecuzione della coverage:', error.message);
      console.log('Continuando con l\'analisi statica...');
    }
  }

  /**
   * Estrae informazioni di coverage dall'output
   */
  parseCoverageOutput(output) {
    // Cerca pattern di coverage nell'output
    const coverageLines = output.split('\n').filter(line => 
      line.includes('%') && (line.includes('src/') || line.includes('All files'))
    );
    
    if (coverageLines.length > 0) {
      console.log('\n📈 Coverage attuale:');
      coverageLines.forEach(line => console.log(`  ${line.trim()}`));
    }
  }

  /**
   * Trova file sorgente senza test corrispondenti
   */
  findFilesWithoutTests() {
    const filesWithoutTests = [];
    
    for (const sourceFile of this.sourceFiles) {
      const hasTest = this.hasCorrespondingTest(sourceFile);
      if (!hasTest) {
        filesWithoutTests.push(sourceFile);
      }
    }
    
    return filesWithoutTests;
  }

  /**
   * Verifica se un file sorgente ha un test corrispondente
   */
  hasCorrespondingTest(sourceFile) {
    const relativePath = relative(this.srcDir, sourceFile);
    const baseName = relativePath.replace(/\.js$/, '');
    
    // Cerca test con vari pattern di naming
    const testPatterns = [
      `${baseName}.test.js`,
      `${baseName}.spec.js`,
      `${baseName.split('/').pop()}.test.js`,
      `${baseName.split('/').pop()}.spec.js`
    ];
    
    return this.testFiles.some(testFile => 
      testPatterns.some(pattern => testFile.includes(pattern))
    );
  }

  /**
   * Analizza le priorità per i file senza test
   */
  analyzePriorities(filesWithoutTests) {
    const priorities = {
      high: [],
      medium: [],
      low: []
    };
    
    for (const file of filesWithoutTests) {
      const priority = this.calculatePriority(file);
      priorities[priority].push(file);
    }
    
    return priorities;
  }

  /**
   * Calcola la priorità di un file basata su vari fattori
   */
  calculatePriority(file) {
    const content = this.getFileContent(file);
    const size = content.length;
    const complexity = this.estimateComplexity(content);
    
    // File critici (core, services)
    if (file.includes('/core/') || file.includes('/services/')) {
      return 'high';
    }
    
    // File grandi o complessi
    if (size > 2000 || complexity > 10) {
      return 'high';
    }
    
    // File di utilità o componenti
    if (file.includes('/utils/') || file.includes('/components/')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Ottiene il contenuto di un file
   */
  getFileContent(file) {
    try {
      return readFileSync(file, 'utf8');
    } catch (error) {
      return '';
    }
  }

  /**
   * Stima la complessità di un file
   */
  estimateComplexity(content) {
    // Conta funzioni, classi, condizioni, loop
    const patterns = [
      /function\s+\w+/g,
      /class\s+\w+/g,
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g
    ];
    
    return patterns.reduce((total, pattern) => {
      const matches = content.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Genera un report dettagliato
   */
  generateReport(filesWithoutTests, priorities) {
    const report = this.buildReportContent(filesWithoutTests, priorities);
    writeFileSync('coverage-analysis.md', report);
  }

  /**
   * Costruisce il contenuto del report
   */
  buildReportContent(filesWithoutTests, priorities) {
    const totalFiles = this.sourceFiles.length;
    const testedFiles = totalFiles - filesWithoutTests.length;
    const coveragePercentage = ((testedFiles / totalFiles) * 100).toFixed(1);
    
    return `# Coverage Analysis Report

## Sommario

- **File sorgente totali**: ${totalFiles}
- **File con test**: ${testedFiles}
- **File senza test**: ${filesWithoutTests.length}
- **Coverage stimata**: ${coveragePercentage}%

## File senza test per priorità

### 🔴 Alta Priorità (${priorities.high.length} file)
${priorities.high.map(file => `- \`${file}\``).join('\n')}

### 🟡 Media Priorità (${priorities.medium.length} file)
${priorities.medium.map(file => `- \`${file}\``).join('\n')}

### 🟢 Bassa Priorità (${priorities.low.length} file)
${priorities.low.map(file => `- \`${file}\``).join('\n')}

## Raccomandazioni

### Prossimi passi per migliorare la coverage:

1. **Inizia dai file ad alta priorità** - Questi sono file critici per il funzionamento dell'applicazione
2. **Usa il TestSuiteGenerator** - Genera rapidamente boilerplate per i test:
   \`\`\`bash
   node tests/__helpers__/generate-test.js component NomeComponente path/to/component.js
   \`\`\`
3. **Focus sui file core e services** - Hanno il maggior impatto sulla stabilità
4. **Test incrementali** - Aggiungi test gradualmente, iniziando con i casi base

### Template per test mancanti:

Per ogni file ad alta priorità, considera di implementare:
- Test di istanziazione/inizializzazione
- Test dei metodi pubblici principali
- Test di gestione errori
- Test dei casi edge

## File di test esistenti

I seguenti test sono già implementati e funzionanti:
${this.testFiles.filter(f => !f.includes('__')).map(file => `- \`${file}\``).join('\n')}

---
*Report generato il ${new Date().toLocaleString()}*
`;
  }
}

// Esegui l'analisi se lo script viene chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new CoverageAnalyzer();
  analyzer.analyze().catch(console.error);
}

export { CoverageAnalyzer };