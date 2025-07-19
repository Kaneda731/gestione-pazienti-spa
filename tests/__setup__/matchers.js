/**
 * Custom matchers per asserzioni specifiche del dominio
 */

import { expect } from 'vitest';

// Matcher per verificare struttura paziente
expect.extend({
  toBeValidPatient(received) {
    const requiredFields = ['id', 'nome', 'cognome', 'reparto_appartenenza'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected patient to have fields: ${missingFields.join(', ')}`,
        pass: false
      };
    }
    
    // Verifica tipi
    if (typeof received.id !== 'number') {
      return {
        message: () => 'Expected patient.id to be a number',
        pass: false
      };
    }
    
    if (typeof received.nome !== 'string' || received.nome.length === 0) {
      return {
        message: () => 'Expected patient.nome to be a non-empty string',
        pass: false
      };
    }
    
    if (typeof received.cognome !== 'string' || received.cognome.length === 0) {
      return {
        message: () => 'Expected patient.cognome to be a non-empty string',
        pass: false
      };
    }
    
    return {
      message: () => 'Patient structure is valid',
      pass: true
    };
  }
});

// Matcher per verificare configurazione grafico Chart.js
expect.extend({
  toBeValidChartConfig(received) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => 'Expected chart config to be an object',
        pass: false
      };
    }
    
    // Verifica campi obbligatori
    const requiredFields = ['type', 'data', 'options'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected chart config to have fields: ${missingFields.join(', ')}`,
        pass: false
      };
    }
    
    // Verifica tipo grafico valido
    const validTypes = ['pie', 'bar', 'line', 'doughnut', 'radar', 'polarArea'];
    if (!validTypes.includes(received.type)) {
      return {
        message: () => `Expected chart type to be one of: ${validTypes.join(', ')}`,
        pass: false
      };
    }
    
    // Verifica struttura dati
    if (!received.data.labels || !Array.isArray(received.data.labels)) {
      return {
        message: () => 'Expected chart data to have labels array',
        pass: false
      };
    }
    
    if (!received.data.datasets || !Array.isArray(received.data.datasets)) {
      return {
        message: () => 'Expected chart data to have datasets array',
        pass: false
      };
    }
    
    return {
      message: () => 'Chart config is valid',
      pass: true
    };
  }
});

// Matcher per verificare mock Supabase response
expect.extend({
  toBeValidSupabaseResponse(received) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => 'Expected Supabase response to be an object',
        pass: false
      };
    }
    
    // Deve avere data o error
    if (!('data' in received) && !('error' in received)) {
      return {
        message: () => 'Expected Supabase response to have data or error field',
        pass: false
      };
    }
    
    // Se ha error, deve essere null o oggetto con message
    if ('error' in received && received.error !== null) {
      if (typeof received.error !== 'object' || !received.error.message) {
        return {
          message: () => 'Expected Supabase error to be null or object with message',
          pass: false
        };
      }
    }
    
    return {
      message: () => 'Supabase response is valid',
      pass: true
    };
  }
});

// Matcher per verificare performance
expect.extend({
  toBeWithinPerformanceThreshold(received, threshold) {
    if (typeof received !== 'number') {
      return {
        message: () => 'Expected performance value to be a number',
        pass: false
      };
    }
    
    if (received > threshold) {
      return {
        message: () => `Expected ${received}ms to be within threshold of ${threshold}ms`,
        pass: false
      };
    }
    
    return {
      message: () => `Performance ${received}ms is within threshold ${threshold}ms`,
      pass: true
    };
  }
});

// Matcher per verificare DOM element con attributi specifici
expect.extend({
  toHaveAccessibleAttributes(received) {
    if (!received || !received.tagName) {
      return {
        message: () => 'Expected DOM element',
        pass: false
      };
    }
    
    const tagName = received.tagName.toLowerCase();
    const issues = [];
    
    // Verifica attributi accessibilità per diversi elementi
    switch (tagName) {
      case 'button':
        if (!received.getAttribute('aria-label') && !received.textContent.trim()) {
          issues.push('Button should have aria-label or text content');
        }
        break;
        
      case 'input':
        if (!received.getAttribute('aria-label') && !received.getAttribute('aria-labelledby')) {
          issues.push('Input should have aria-label or aria-labelledby');
        }
        break;
        
      case 'img':
        if (!received.getAttribute('alt')) {
          issues.push('Image should have alt attribute');
        }
        break;
    }
    
    if (issues.length > 0) {
      return {
        message: () => `Accessibility issues: ${issues.join(', ')}`,
        pass: false
      };
    }
    
    return {
      message: () => 'Element has proper accessibility attributes',
      pass: true
    };
  }
});

// Matcher per verificare mock function calls con pattern specifici
expect.extend({
  toHaveBeenCalledWithPattern(received, pattern) {
    if (!received || typeof received.mock === 'undefined') {
      return {
        message: () => 'Expected a mock function',
        pass: false
      };
    }
    
    const calls = received.mock.calls;
    const matchingCalls = calls.filter(call => {
      return call.some(arg => {
        if (typeof pattern === 'string') {
          return JSON.stringify(arg).includes(pattern);
        }
        if (pattern instanceof RegExp) {
          return pattern.test(JSON.stringify(arg));
        }
        if (typeof pattern === 'function') {
          return pattern(arg);
        }
        return false;
      });
    });
    
    if (matchingCalls.length === 0) {
      return {
        message: () => `Expected mock to be called with pattern: ${pattern}`,
        pass: false
      };
    }
    
    return {
      message: () => `Mock was called with matching pattern`,
      pass: true
    };
  }
});

export default {};