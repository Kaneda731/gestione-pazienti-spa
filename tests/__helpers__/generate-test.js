#!/usr/bin/env node

/**
 * CLI Script per generare test usando TestSuiteGenerator
 * 
 * Usage:
 *   node tests/__helpers__/generate-test.js component MyComponent src/components/MyComponent.js
 *   node tests/__helpers__/generate-test.js service MyService src/services/MyService.js
 *   node tests/__helpers__/generate-test.js utility myUtility src/utils/myUtility.js
 */

import { TestSuiteGenerator } from './TestSuiteGenerator.js';
import { existsSync } from 'fs';

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
Usage: node generate-test.js <type> <name> <sourcePath> [options]

Types:
  component  - Generate component test
  service    - Generate service test  
  utility    - Generate utility test
  integration - Generate integration test

Examples:
  node generate-test.js component MyComponent src/components/MyComponent.js
  node generate-test.js service MyService src/services/MyService.js
  node generate-test.js utility myUtility src/utils/myUtility.js
  node generate-test.js integration MyFeature --components Component1,Component2

Options:
  --fixtures <name>     - Include fixtures import
  --mocks <name>        - Include mocks import
  --components <list>   - Comma-separated list of components (for integration tests)
  --force              - Overwrite existing test file
  `);
  process.exit(1);
}

const [type, name, sourcePath] = args;
const options = parseOptions(args.slice(3));

const generator = new TestSuiteGenerator();

try {
  let testPath;
  
  switch (type.toLowerCase()) {
    case 'component':
      if (!sourcePath) {
        console.error('Source path is required for component tests');
        process.exit(1);
      }
      testPath = generator.generateComponentTest(name, sourcePath, options);
      break;
      
    case 'service':
      if (!sourcePath) {
        console.error('Source path is required for service tests');
        process.exit(1);
      }
      testPath = generator.generateServiceTest(name, sourcePath, options);
      break;
      
    case 'utility':
      if (!sourcePath) {
        console.error('Source path is required for utility tests');
        process.exit(1);
      }
      testPath = generator.generateUtilityTest(name, sourcePath, options);
      break;
      
    case 'integration':
      const components = options.components || [];
      testPath = generator.generateIntegrationTest(name, components, options);
      break;
      
    default:
      console.error(`Unknown test type: ${type}`);
      console.error('Valid types: component, service, utility, integration');
      process.exit(1);
  }
  
  console.log(`✅ Test generated successfully: ${testPath}`);
  
  // Check if source file exists
  if (sourcePath && !existsSync(sourcePath)) {
    console.warn(`⚠️  Warning: Source file does not exist: ${sourcePath}`);
  }
  
} catch (error) {
  console.error(`❌ Error generating test: ${error.message}`);
  process.exit(1);
}

function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--fixtures' && i + 1 < args.length) {
      options.fixtures = args[i + 1];
      i++;
    } else if (arg === '--mocks' && i + 1 < args.length) {
      options.mocks = args[i + 1];
      i++;
    } else if (arg === '--components' && i + 1 < args.length) {
      options.components = args[i + 1].split(',').map(comp => ({
        name: comp.trim(),
        path: `src/components/${comp.trim()}.js` // Default path
      }));
      i++;
    } else if (arg === '--force') {
      options.force = true;
    }
  }
  
  return options;
}