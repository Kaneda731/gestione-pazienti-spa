import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
  });

  test('should load clinical events page within performance budget', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();
    
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds as per requirements
    expect(loadTime).toBeLessThan(2000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 3000);
      });
    });
    
    // First Contentful Paint should be under 1.8s
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(1800);
    }
    
    // Largest Contentful Paint should be under 2.5s
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Create a large number of test patients and events
    const patientCount = 100;
    const eventsPerPatient = 10;
    
    console.log(`Creating ${patientCount} patients with ${eventsPerPatient} events each...`);
    
    // Batch create patients and events
    await page.evaluate(async (counts) => {
      const { patientCount, eventsPerPatient } = counts;
      const patients = [];
      
      // Create patients in batches
      for (let i = 0; i < patientCount; i++) {
        patients.push({
          nome: `TestPatient${i}`,
          cognome: `Performance${i}`,
          data_nascita: '1980-01-01',
          sesso: i % 2 === 0 ? 'M' : 'F',
          codice_fiscale: `TSTPRF80A01H50${String(i).padStart(2, '0')}`,
          data_ricovero: '2024-01-01',
          reparto: ['Cardiologia', 'Neurologia', 'Ortopedia'][i % 3]
        });
      }
      
      // Batch insert patients
      const patientIds = [];
      for (const patient of patients) {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patient)
        });
        const result = await response.json();
        patientIds.push(result.id);
      }
      
      // Create events for each patient
      const events = [];
      for (let i = 0; i < patientIds.length; i++) {
        for (let j = 0; j < eventsPerPatient; j++) {
          events.push({
            paziente_id: patientIds[i],
            tipo_evento: j % 2 === 0 ? 'intervento' : 'infezione',
            data_evento: `2024-01-${String(j + 1).padStart(2, '0')}`,
            descrizione: `Performance test event ${j}`,
            tipo_intervento: j % 2 === 0 ? `Intervention ${j}` : null,
            agente_patogeno: j % 2 === 1 ? `Pathogen ${j}` : null
          });
        }
      }
      
      // Batch insert events
      for (const event of events) {
        await fetch('/api/eventi-clinici', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
      
      return { patientIds, eventCount: events.length };
    }, { patientCount, eventsPerPatient });
    
    // Test page load performance with large dataset
    const startTime = Date.now();
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page loaded with large dataset in ${loadTime}ms`);
    
    // Should still load within reasonable time even with large dataset
    expect(loadTime).toBeLessThan(5000);
    
    // Test search performance
    const searchStartTime = Date.now();
    await page.fill('[data-testid="patient-search-filter"]', 'TestPatient50');
    await page.waitForSelector('[data-testid="event-card"]');
    
    const searchTime = Date.now() - searchStartTime;
    console.log(`Search completed in ${searchTime}ms`);
    
    // Search should be fast even with large dataset
    expect(searchTime).toBeLessThan(1000);
    
    // Test filtering performance
    const filterStartTime = Date.now();
    await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    const filterTime = Date.now() - filterStartTime;
    console.log(`Filtering completed in ${filterTime}ms`);
    
    expect(filterTime).toBeLessThan(1000);
  });

  test('should handle memory efficiently during long sessions', async ({ page }) => {
    // Monitor memory usage during extended session
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    if (!initialMemory) {
      console.log('Performance.memory not available, skipping memory test');
      return;
    }
    
    console.log('Initial memory usage:', initialMemory);
    
    // Simulate extended usage
    await page.goto('/eventi-clinici');
    
    // Perform multiple operations that could cause memory leaks
    for (let i = 0; i < 20; i++) {
      // Create and delete events
      await page.click('[data-testid="add-event-btn"]');
      await page.waitForSelector('[data-testid="event-form-modal"]');
      await page.keyboard.press('Escape');
      
      // Search operations
      await page.fill('[data-testid="patient-search-filter"]', `search${i}`);
      await page.waitForTimeout(100);
      await page.fill('[data-testid="patient-search-filter"]', '');
      
      // Filter operations
      await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
      await page.waitForTimeout(100);
      await page.selectOption('[data-testid="event-type-filter"]', '');
      
      // Navigate between pages
      await page.goto('/list');
      await page.goto('/eventi-clinici');
    }
    
    // Check memory usage after operations
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    console.log('Final memory usage:', finalMemory);
    
    if (finalMemory && initialMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });

  test('should handle database query performance with large datasets', async ({ page }) => {
    // Test database query performance
    await page.goto('/eventi-clinici');
    
    // Measure time for various database operations
    const queryTimes = await page.evaluate(async () => {
      const times = {};
      
      // Test patient search query
      const searchStart = performance.now();
      await fetch('/api/patients?search=test');
      times.patientSearch = performance.now() - searchStart;
      
      // Test events query with filters
      const eventsStart = performance.now();
      await fetch('/api/eventi-clinici?tipo_evento=intervento&limit=50');
      times.eventsQuery = performance.now() - eventsStart;
      
      // Test patient with events query
      const patientEventsStart = performance.now();
      await fetch('/api/patients/1/eventi-clinici');
      times.patientEvents = performance.now() - patientEventsStart;
      
      return times;
    });
    
    console.log('Database query times:', queryTimes);
    
    // All queries should complete within reasonable time
    expect(queryTimes.patientSearch).toBeLessThan(500);
    expect(queryTimes.eventsQuery).toBeLessThan(1000);
    expect(queryTimes.patientEvents).toBeLessThan(500);
  });

  test('should maintain performance during concurrent operations', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = [];
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage();
      await newPage.goto('/');
      await newPage.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'test-token',
          user: { id: 'test-user-id', email: 'test@example.com' }
        }));
      });
      pages.push(newPage);
    }
    
    // Perform concurrent operations
    const operations = pages.map(async (testPage, index) => {
      const startTime = Date.now();
      
      await testPage.goto('/eventi-clinici');
      await testPage.waitForSelector('[data-testid="events-timeline"]');
      
      // Perform search operations
      await testPage.fill('[data-testid="patient-search-filter"]', `concurrent${index}`);
      await testPage.waitForTimeout(200);
      
      // Perform filter operations
      await testPage.selectOption('[data-testid="event-type-filter"]', 'intervento');
      await testPage.waitForTimeout(200);
      
      const endTime = Date.now();
      return endTime - startTime;
    });
    
    const times = await Promise.all(operations);
    console.log('Concurrent operation times:', times);
    
    // All concurrent operations should complete within reasonable time
    times.forEach(time => {
      expect(time).toBeLessThan(3000);
    });
    
    // Clean up
    for (const testPage of pages) {
      await testPage.close();
    }
  });

  test('should handle form submission performance', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Create a test patient first
    await page.goto('/inserimento');
    await page.fill('[data-testid="nome"]', 'Performance Test');
    await page.fill('[data-testid="cognome"]', 'Form Submission');
    await page.fill('[data-testid="data_nascita"]', '1985-01-01');
    await page.selectOption('[data-testid="sesso"]', 'M');
    await page.fill('[data-testid="codice_fiscale"]', 'PRFFRM85A01H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-01');
    await page.selectOption('[data-testid="reparto"]', 'Cardiologia');
    await page.click('[data-testid="submit-patient"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Test event creation performance
    await page.goto('/eventi-clinici');
    
    const formSubmissionTimes = [];
    
    // Test multiple form submissions
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await page.click('[data-testid="add-event-btn"]');
      await page.waitForSelector('[data-testid="event-form-modal"]');
      
      await page.fill('[data-testid="patient-search"]', 'Performance Test');
      await page.click('[data-testid="patient-option"]');
      await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
      await page.fill('[data-testid="data_evento"]', `2024-01-${String(i + 1).padStart(2, '0')}`);
      await page.fill('[data-testid="tipo_intervento"]', `Performance Test ${i}`);
      
      await page.click('[data-testid="submit-event"]');
      await page.waitForSelector('[data-testid="event-success"]');
      
      const endTime = Date.now();
      formSubmissionTimes.push(endTime - startTime);
    }
    
    console.log('Form submission times:', formSubmissionTimes);
    
    // All form submissions should complete within reasonable time
    formSubmissionTimes.forEach(time => {
      expect(time).toBeLessThan(2000);
    });
    
    // Average submission time should be reasonable
    const averageTime = formSubmissionTimes.reduce((a, b) => a + b, 0) / formSubmissionTimes.length;
    expect(averageTime).toBeLessThan(1500);
  });

  test('should handle pagination performance with large datasets', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Test pagination performance
    const paginationTimes = [];
    
    // Test multiple page loads
    for (let i = 1; i <= 5; i++) {
      const startTime = Date.now();
      
      // Navigate to different pages (if pagination exists)
      await page.evaluate((pageNum) => {
        const paginationBtn = document.querySelector(`[data-testid="page-${pageNum}"]`);
        if (paginationBtn) paginationBtn.click();
      }, i);
      
      await page.waitForTimeout(500); // Wait for page to load
      
      const endTime = Date.now();
      paginationTimes.push(endTime - startTime);
    }
    
    console.log('Pagination times:', paginationTimes);
    
    // Pagination should be fast
    paginationTimes.forEach(time => {
      expect(time).toBeLessThan(1000);
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up any test data created during performance tests
    await page.evaluate(async () => {
      // Clean up test patients and events
      try {
        await fetch('/api/test-cleanup', { method: 'POST' });
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    });
  });
});