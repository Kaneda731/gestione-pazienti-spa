/**
 * Analizzatore automatico per test esistenti
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export class TestAnalyzer {
  constructor(testDirectory = 'tests') {
    this.testDirectory = testDirectory;
    this.testFiles = [];
    this.analysis = {
      totalFiles: 0,
      categories: {
        unit: [],
        integration: [],
        component: [],
        service: [],
        utility: []
      },
      patterns: {
        imports: new Map(),
        mocks: new Map(),
        describes: [],
        its: [],
        duplicatedSetup: []
      },
      issues: {
        emptyTests: [],
        missingAssertions: [],
        duplicatedMocks: [],
        inconsistentNaming: []
      }
    };
  }
  
  /**
   * Analizza tutti i test nella directory
   */
  analyzeAll() {
    this.scanDirectory(this.testDirectory);
    this.categorizeTests();
    this.findPatterns();
    this.identifyIssues();
    
    return this.generateReport();
  }
  
  /**
   * Scansiona directory ricorsivamente
   */
  scanDirectory(dir) {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip directory di infrastruttura
          if (!['__setup__', '__mocks__', '__fixtures__', '__helpers__'].includes(item)) {
            this.scanDirectory(fullPath);
          }
        } else if (this.isTestFile(item)) {
          this.testFiles.push({
            path: fullPath,
            name: item,
            content: readFileSync(fullPath, 'utf8'),
            size: stat.size
          });
        }
      }
    } catch (error) {
      console.warn(`Cannot scan directory ${dir}:`, error.message);
    }
  }
  
  /**
   * Verifica se è un file di test
   */
  isTestFile(filename) {
    return (filename.endsWith('.test.js') || 
            filename.endsWith('.spec.js')) &&
           !filename.includes('template');
  }
  
  /**
   * Categorizza test per tipo
   */
  categorizeTests() {
    for (const testFile of this.testFiles) {
      const category = this.determineCategory(testFile);
      this.analysis.categories[category].push(testFile);
    }
    
    this.analysis.totalFiles = this.testFiles.length;
  }
  
  /**
   * Determina categoria del test
   */
  determineCategory(testFile) {
    const { path, content } = testFile;
    
    // Integration tests
    if (path.includes('integration') || 
        content.includes('integration') ||
        content.includes('chartjsService.integration')) {
      return 'integration';
    }
    
    // Component tests
    if (path.includes('components') ||
        content.includes('Component') ||
        content.includes('render') ||
        content.includes('mount')) {
      return 'component';
    }
    
    // Service tests
    if (path.includes('services') ||
        content.includes('Service') ||
        testFile.name.includes('Service')) {
      return 'service';
    }
    
    // Utility tests
    if (path.includes('utils') ||
        path.includes('helpers') ||
        content.includes('helper') ||
        content.includes('util')) {
      return 'utility';
    }
    
    // Default to unit
    return 'unit';
  }
  
  /**
   * Trova pattern comuni nei test
   */
  findPatterns() {
    for (const testFile of this.testFiles) {
      this.analyzeImports(testFile);
      this.analyzeMocks(testFile);
      this.analyzeStructure(testFile);
    }
  }
  
  /**
   * Analizza import nei test
   */
  analyzeImports(testFile) {
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(testFile.content)) !== null) {
      const importPath = match[1];
      
      if (!this.analysis.patterns.imports.has(importPath)) {
        this.analysis.patterns.imports.set(importPath, []);
      }
      
      this.analysis.patterns.imports.get(importPath).push(testFile.name);
    }
  }
  
  /**
   * Analizza mock nei test
   */
  analyzeMocks(testFile) {
    const mockPatterns = [
      /vi\.fn\(\)/g,
      /vi\.mock\(/g,
      /mockImplementation/g,
      /mockReturnValue/g,
      /mockResolvedValue/g,
      /mockRejectedValue/g
    ];
    
    for (const pattern of mockPatterns) {
      const matches = testFile.content.match(pattern);
      if (matches) {
        const patternName = pattern.source;
        if (!this.analysis.patterns.mocks.has(patternName)) {
          this.analysis.patterns.mocks.set(patternName, []);
        }
        
        this.analysis.patterns.mocks.get(patternName).push({
          file: testFile.name,
          count: matches.length
        });
      }
    }
  }
  
  /**
   * Analizza struttura test (describe/it)
   */
  analyzeStructure(testFile) {
    // Trova describe blocks
    const describeRegex = /describe\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = describeRegex.exec(testFile.content)) !== null) {
      this.analysis.patterns.describes.push({
        file: testFile.name,
        description: match[1]
      });
    }
    
    // Trova it/test blocks
    const itRegex = /(it|test)\(['"`]([^'"`]+)['"`]/g;
    
    while ((match = itRegex.exec(testFile.content)) !== null) {
      this.analysis.patterns.its.push({
        file: testFile.name,
        type: match[1],
        description: match[2]
      });
    }
  }
  
  /**
   * Identifica problemi nei test
   */
  identifyIssues() {
    for (const testFile of this.testFiles) {
      this.checkEmptyTests(testFile);
      this.checkMissingAssertions(testFile);
      this.checkInconsistentNaming(testFile);
    }
    
    this.findDuplicatedMocks();
  }
  
  /**
   * Verifica test vuoti o superficiali
   */
  checkEmptyTests(testFile) {
    const itBlocks = testFile.content.match(/(it|test)\(['"`][^'"`]+['"`][^}]+}/g) || [];
    
    for (const block of itBlocks) {
      // Test molto corti (probabilmente vuoti)
      if (block.length < 100) {
        this.analysis.issues.emptyTests.push({
          file: testFile.name,
          block: block.substring(0, 50) + '...'
        });
      }
    }
  }
  
  /**
   * Verifica test senza asserzioni
   */
  checkMissingAssertions(testFile) {
    const assertionPatterns = [
      /expect\(/g,
      /assert\./g,
      /should\./g,
      /toBe/g,
      /toEqual/g,
      /toHaveBeenCalled/g
    ];
    
    const hasAssertions = assertionPatterns.some(pattern => 
      pattern.test(testFile.content)
    );
    
    if (!hasAssertions && testFile.content.includes('it(')) {
      this.analysis.issues.missingAssertions.push(testFile.name);
    }
  }
  
  /**
   * Verifica naming inconsistente
   */
  checkInconsistentNaming(testFile) {
    const content = testFile.content;
    
    // Mix di it() e test()
    const hasIt = content.includes('it(');
    const hasTest = content.includes('test(');
    
    if (hasIt && hasTest) {
      this.analysis.issues.inconsistentNaming.push({
        file: testFile.name,
        issue: 'Mixed it() and test() usage'
      });
    }
  }
  
  /**
   * Trova mock duplicati
   */
  findDuplicatedMocks() {
    const mockSetups = new Map();
    
    for (const testFile of this.testFiles) {
      const mockPatterns = [
        /const\s+mock\w+\s*=\s*vi\.fn\(\)/g,
        /vi\.mock\(['"`][^'"`]+['"`]/g
      ];
      
      for (const pattern of mockPatterns) {
        let match;
        while ((match = pattern.exec(testFile.content)) !== null) {
          const mockCode = match[0];
          
          if (!mockSetups.has(mockCode)) {
            mockSetups.set(mockCode, []);
          }
          
          mockSetups.get(mockCode).push(testFile.name);
        }
      }
    }
    
    // Trova duplicati
    for (const [mockCode, files] of mockSetups.entries()) {
      if (files.length > 1) {
        this.analysis.issues.duplicatedMocks.push({
          mockCode,
          files,
          count: files.length
        });
      }
    }
  }
  
  /**
   * Genera report completo
   */
  generateReport() {
    const report = {
      summary: {
        totalFiles: this.analysis.totalFiles,
        categorization: Object.fromEntries(
          Object.entries(this.analysis.categories).map(([key, value]) => [key, value.length])
        ),
        topImports: this.getTopImports(10),
        issuesSummary: {
          emptyTests: this.analysis.issues.emptyTests.length,
          missingAssertions: this.analysis.issues.missingAssertions.length,
          duplicatedMocks: this.analysis.issues.duplicatedMocks.length,
          inconsistentNaming: this.analysis.issues.inconsistentNaming.length
        }
      },
      details: this.analysis,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  /**
   * Ottiene import più comuni
   */
  getTopImports(limit = 10) {
    return Array.from(this.analysis.patterns.imports.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, limit)
      .map(([path, files]) => ({ path, count: files.length }));
  }
  
  /**
   * Genera raccomandazioni per miglioramenti
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Mock duplicati
    if (this.analysis.issues.duplicatedMocks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'duplication',
        title: 'Consolidate Duplicated Mocks',
        description: `Found ${this.analysis.issues.duplicatedMocks.length} duplicated mock patterns that should be moved to centralized mock factory`,
        files: this.analysis.issues.duplicatedMocks.map(d => d.files).flat()
      });
    }
    
    // Test vuoti
    if (this.analysis.issues.emptyTests.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'quality',
        title: 'Improve Empty Tests',
        description: `Found ${this.analysis.issues.emptyTests.length} potentially empty or superficial tests`,
        files: this.analysis.issues.emptyTests.map(t => t.file)
      });
    }
    
    // Test senza asserzioni
    if (this.analysis.issues.missingAssertions.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'quality',
        title: 'Add Missing Assertions',
        description: `Found ${this.analysis.issues.missingAssertions.length} tests without assertions`,
        files: this.analysis.issues.missingAssertions
      });
    }
    
    // Naming inconsistente
    if (this.analysis.issues.inconsistentNaming.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'consistency',
        title: 'Standardize Test Naming',
        description: 'Standardize usage of it() vs test() across all test files',
        files: this.analysis.issues.inconsistentNaming.map(i => i.file)
      });
    }
    
    // Import comuni che potrebbero essere centralizzati
    const commonImports = this.getTopImports(5);
    const highUsageImports = commonImports.filter(imp => imp.count > 5);
    
    if (highUsageImports.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'structure',
        title: 'Centralize Common Imports',
        description: `Consider creating barrel exports for commonly used imports: ${highUsageImports.map(i => i.path).join(', ')}`,
        files: []
      });
    }
    
    return recommendations;
  }
}

/**
 * Esegue analisi e salva report
 */
export async function analyzeTestSuite(outputPath = 'test-analysis-report.json') {
  const analyzer = new TestAnalyzer();
  const report = analyzer.analyzeAll();
  
  // Salva report se in ambiente Node.js
  if (typeof require !== 'undefined') {
    try {
      const fs = require('fs');
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`Test analysis report saved to ${outputPath}`);
    } catch (error) {
      console.warn('Could not save report:', error.message);
    }
  }
  
  return report;
}

/**
 * Stampa summary del report
 */
export function printAnalysisSummary(report) {
  console.log('\n=== TEST SUITE ANALYSIS SUMMARY ===\n');
  
  console.log(`📊 Total test files: ${report.summary.totalFiles}`);
  console.log('\n📂 Categorization:');
  for (const [category, count] of Object.entries(report.summary.categorization)) {
    console.log(`  ${category}: ${count} files`);
  }
  
  console.log('\n📦 Top imports:');
  report.summary.topImports.forEach(imp => {
    console.log(`  ${imp.path}: ${imp.count} files`);
  });
  
  console.log('\n⚠️  Issues found:');
  for (const [issue, count] of Object.entries(report.summary.issuesSummary)) {
    if (count > 0) {
      console.log(`  ${issue}: ${count}`);
    }
  }
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
    console.log(`     ${rec.description}`);
  });
  
  console.log('\n=====================================\n');
}