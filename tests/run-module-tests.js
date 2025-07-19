#!/usr/bin/env node

/**
 * Test runner script per i nuovi moduli refactorizzati
 * 
 * Questo script esegue tutti i test per i moduli creati durante il refactoring
 * e genera un report dettagliato dei risultati.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const TEST_CATEGORIES = {
  'charts/components/responsive-adapter': 'Chart Responsive Adapter Components',
  'charts/services/chart-loader': 'Chart Loader Service',
  'charts/services/chart-config': 'Chart Configuration Manager',
  'patients/services/patient-crud': 'Patient CRUD Operations',
  'patients/services/patient-validation': 'Patient Data Validation',
  'patients/services/patient-cache': 'Patient Caching System'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logHeader(message) {
  log(`\n${COLORS.BOLD}${COLORS.BLUE}=== ${message} ===${COLORS.RESET}`);
}

function logSuccess(message) {
  log(`${COLORS.GREEN}✓ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`${COLORS.RED}✗ ${message}`, COLORS.RED);
}

function logWarning(message) {
  log(`${COLORS.YELLOW}⚠ ${message}`, COLORS.YELLOW);
}

function runTestSuite(testPath, description) {
  logHeader(`Testing: ${description}`);
  
  try {
    const command = `npx vitest run ${testPath} --reporter=verbose`;
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logSuccess(`${description} - All tests passed`);
    
    // Parse output for test count
    const testCountMatch = output.match(/(\d+) passed/);
    if (testCountMatch) {
      log(`  Tests passed: ${testCountMatch[1]}`);
    }
    
    return { success: true, output };
  } catch (error) {
    logError(`${description} - Tests failed`);
    log(error.stdout || error.message);
    return { success: false, error: error.stdout || error.message };
  }
}

function checkTestFileExists(testPath) {
  const fullPath = path.join(process.cwd(), testPath);
  return existsSync(fullPath);
}

function generateTestReport(results) {
  logHeader('Test Summary Report');
  
  const totalSuites = results.length;
  const passedSuites = results.filter(r => r.success).length;
  const failedSuites = totalSuites - passedSuites;
  
  log(`Total test suites: ${totalSuites}`);
  logSuccess(`Passed: ${passedSuites}`);
  
  if (failedSuites > 0) {
    logError(`Failed: ${failedSuites}`);
  }
  
  const successRate = ((passedSuites / totalSuites) * 100).toFixed(1);
  log(`Success rate: ${successRate}%`);
  
  if (failedSuites > 0) {
    logHeader('Failed Test Suites');
    results
      .filter(r => !r.success)
      .forEach(r => logError(`- ${r.description}`));
  }
  
  return {
    total: totalSuites,
    passed: passedSuites,
    failed: failedSuites,
    successRate: parseFloat(successRate)
  };
}

function runCoverageReport() {
  logHeader('Generating Coverage Report');
  
  try {
    const command = 'npx vitest run --coverage tests/features/';
    execSync(command, { stdio: 'inherit' });
    logSuccess('Coverage report generated');
  } catch (error) {
    logWarning('Coverage report generation failed');
    log(error.message);
  }
}

function main() {
  logHeader('Refactored Modules Test Runner');
  log('Running tests for all refactored modules...\n');
  
  const testSuites = [
    {
      path: 'tests/features/charts/components/responsive-adapter/',
      description: TEST_CATEGORIES['charts/components/responsive-adapter']
    },
    {
      path: 'tests/features/charts/services/chart-loader/',
      description: TEST_CATEGORIES['charts/services/chart-loader']
    },
    {
      path: 'tests/features/charts/services/chart-config/',
      description: TEST_CATEGORIES['charts/services/chart-config']
    },
    {
      path: 'tests/features/patients/services/patient-crud/',
      description: TEST_CATEGORIES['patients/services/patient-crud']
    },
    {
      path: 'tests/features/patients/services/patient-validation/',
      description: TEST_CATEGORIES['patients/services/patient-validation']
    },
    {
      path: 'tests/features/patients/services/patient-cache/',
      description: TEST_CATEGORIES['patients/services/patient-cache']
    }
  ];
  
  const results = [];
  
  // Check if test files exist
  logHeader('Checking Test Files');
  testSuites.forEach(suite => {
    if (checkTestFileExists(suite.path)) {
      logSuccess(`Found: ${suite.path}`);
    } else {
      logWarning(`Missing: ${suite.path}`);
    }
  });
  
  // Run test suites
  testSuites.forEach(suite => {
    if (checkTestFileExists(suite.path)) {
      const result = runTestSuite(suite.path, suite.description);
      results.push({
        ...result,
        description: suite.description,
        path: suite.path
      });
    } else {
      results.push({
        success: false,
        description: suite.description,
        path: suite.path,
        error: 'Test file not found'
      });
    }
  });
  
  // Generate report
  const summary = generateTestReport(results);
  
  // Run coverage if all tests pass
  if (summary.failed === 0) {
    runCoverageReport();
  }
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTestSuite, generateTestReport, TEST_CATEGORIES };