/**
 * Test per TestSuiteGenerator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { TestSuiteGenerator } from '../../__helpers__/TestSuiteGenerator.js';

describe('TestSuiteGenerator', () => {
  let generator;
  let generatedFiles = [];
  
  beforeEach(() => {
    generator = new TestSuiteGenerator();
    generatedFiles = [];
  });
  
  afterEach(() => {
    // Cleanup generated test files
    generatedFiles.forEach(file => {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Could not cleanup ${file}:`, error.message);
      }
    });
  });
  
  describe('Instantiation', () => {
    it('should be instantiated with default options', () => {
      expect(generator).toBeInstanceOf(TestSuiteGenerator);
      expect(generator.options.baseDir).toBe('tests');
      expect(generator.options.useFixtures).toBe(true);
      expect(generator.options.useMocks).toBe(true);
    });
    
    it('should be instantiated with custom options', () => {
      const customGenerator = new TestSuiteGenerator({
        baseDir: 'custom-tests',
        author: 'Custom Author',
        useFixtures: false
      });
      
      expect(customGenerator.options.baseDir).toBe('custom-tests');
      expect(customGenerator.options.author).toBe('Custom Author');
      expect(customGenerator.options.useFixtures).toBe(false);
    });
  });
  
  describe('Template Generation', () => {
    it('should have all required templates', () => {
      expect(generator.templates).toHaveProperty('component');
      expect(generator.templates).toHaveProperty('service');
      expect(generator.templates).toHaveProperty('utility');
      expect(generator.templates).toHaveProperty('integration');
    });
    
    it('should generate component template', () => {
      const template = generator.getComponentTemplate();
      
      expect(template).toContain('{{COMPONENT_NAME}}');
      expect(template).toContain('{{IMPORT_PATH}}');
      expect(template).toContain('describe(');
      expect(template).toContain('beforeEach(');
    });
    
    it('should generate service template', () => {
      const template = generator.getServiceTemplate();
      
      expect(template).toContain('{{SERVICE_NAME}}');
      expect(template).toContain('{{IMPORT_PATH}}');
      expect(template).toContain('describe(');
    });
  });
  
  describe('Path Calculation', () => {
    it('should calculate correct test path for component', () => {
      const path = generator.getTestPath('component', 'TestComponent');
      
      expect(path).toBe('tests/unit/shared/components/TestComponent.test.js');
    });
    
    it('should calculate correct test path for service', () => {
      const path = generator.getTestPath('service', 'TestService');
      
      expect(path).toBe('tests/unit/core/TestService.test.js');
    });
    
    it('should calculate correct test path for utility', () => {
      const path = generator.getTestPath('utility', 'TestUtility');
      
      expect(path).toBe('tests/unit/shared/utils/TestUtility.test.js');
    });
    
    it('should calculate correct test path for integration', () => {
      const path = generator.getTestPath('integration', 'TestFeature');
      
      expect(path).toBe('tests/integration/TestFeature.test.js');
    });
  });
  
  describe('Import Path Calculation', () => {
    it('should calculate correct import path', () => {
      const testPath = 'tests/unit/shared/components/TestComponent.test.js';
      const sourcePath = 'src/shared/components/ui/TestComponent.js';
      
      const importPath = generator.getImportPath(testPath, sourcePath);
      
      expect(importPath).toBe('../../../../src/shared/components/ui/TestComponent.js');
    });
  });
  
  describe('Test Case Generation', () => {
    it('should generate component test cases', () => {
      const testCases = generator.getComponentTestCases('TestComponent');
      
      expect(testCases).toContain('Instantiation');
      expect(testCases).toContain('Rendering');
      expect(testCases).toContain('Methods');
      expect(testCases).toContain('Edge Cases');
    });
    
    it('should generate service test cases', () => {
      const testCases = generator.getServiceTestCases('TestService');
      
      expect(testCases).toContain('Service Definition');
      expect(testCases).toContain('Core Functionality');
      expect(testCases).toContain('Error Handling');
    });
    
    it('should generate utility test cases', () => {
      const testCases = generator.getUtilityTestCases('TestUtility');
      
      expect(testCases).toContain('Basic Functionality');
      expect(testCases).toContain('Input Validation');
      expect(testCases).toContain('Edge Cases');
    });
  });
  
  describe('Import Generation', () => {
    it('should generate fixtures import', () => {
      const fixturesImport = generator.getFixturesImport('testData');
      
      expect(fixturesImport).toContain("import { testData } from '../../__fixtures__/testData.js';");
    });
    
    it('should generate mocks import', () => {
      const mocksImport = generator.getMocksImport('testMock');
      
      expect(mocksImport).toContain("import { testMock } from '../../__mocks__/testMock.js';");
    });
    
    it('should handle array of fixtures', () => {
      const fixturesImport = generator.getFixturesImport(['data1', 'data2']);
      
      expect(fixturesImport).toContain('data1');
      expect(fixturesImport).toContain('data2');
    });
  });
});