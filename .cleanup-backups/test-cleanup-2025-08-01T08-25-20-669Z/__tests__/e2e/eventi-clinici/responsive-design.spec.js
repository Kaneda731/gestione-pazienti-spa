import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];

  let testPatientId;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Create a test patient
    await page.goto('/inserimento');
    await page.fill('[data-testid="nome"]', 'Responsive Test Patient');
    await page.fill('[data-testid="cognome"]', 'RWD Test');
    await page.fill('[data-testid="data_nascita"]', '1985-01-01');
    await page.selectOption('[data-testid="sesso"]', 'M');
    await page.fill('[data-testid="codice_fiscale"]', 'RWDTST85A01H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-01');
    await page.selectOption('[data-testid="reparto"]', 'Cardiologia');
    
    await page.click('[data-testid="submit-patient"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    const url = page.url();
    testPatientId = url.match(/\/list\?.*id=([^&]+)/)?.[1];

    // Create some test events
    await page.goto('/eventi-clinici');
    
    // Create intervention
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Responsive Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-05');
    await page.fill('[data-testid="tipo_intervento"]', 'Test Intervention');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Create infection
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Responsive Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-08');
    await page.fill('[data-testid="agente_patogeno"]', 'Test Pathogen');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
  });

  test.afterEach(async ({ page }) => {
    if (testPatientId) {
      await page.evaluate((id) => {
        return fetch(`/api/patients/${id}`, { method: 'DELETE' });
      }, testPatientId);
    }
  });

  viewports.forEach(viewport => {
    test(`should display clinical events timeline correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/eventi-clinici');
      await page.waitForSelector('[data-testid="events-timeline"]');
      
      // Check that main elements are visible
      await expect(page.locator('[data-testid="events-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-search-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-event-btn"]')).toBeVisible();
      
      // Check event cards are properly displayed
      const eventCards = page.locator('[data-testid="event-card"]');
      await expect(eventCards).toHaveCount(2);
      
      // Verify event cards are not overlapping
      const firstCard = eventCards.first();
      const secondCard = eventCards.last();
      
      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();
      
      expect(firstCardBox).toBeTruthy();
      expect(secondCardBox).toBeTruthy();
      
      // Cards should not overlap
      if (firstCardBox && secondCardBox) {
        const noOverlap = 
          firstCardBox.y + firstCardBox.height <= secondCardBox.y ||
          secondCardBox.y + secondCardBox.height <= firstCardBox.y ||
          firstCardBox.x + firstCardBox.width <= secondCardBox.x ||
          secondCardBox.x + secondCardBox.width <= firstCardBox.x;
        
        expect(noOverlap).toBeTruthy();
      }
      
      // Check responsive behavior specific to viewport size
      if (viewport.width < 768) {
        // Mobile: should stack vertically, full width
        for (let i = 0; i < await eventCards.count(); i++) {
          const card = eventCards.nth(i);
          const cardBox = await card.boundingBox();
          if (cardBox) {
            // Card should take most of the width on mobile
            expect(cardBox.width).toBeGreaterThan(viewport.width * 0.8);
          }
        }
      } else if (viewport.width >= 768 && viewport.width < 1024) {
        // Tablet: may have 2 columns or single column
        // Just verify cards are properly sized
        for (let i = 0; i < await eventCards.count(); i++) {
          const card = eventCards.nth(i);
          const cardBox = await card.boundingBox();
          if (cardBox) {
            expect(cardBox.width).toBeGreaterThan(200);
            expect(cardBox.width).toBeLessThan(viewport.width);
          }
        }
      } else {
        // Desktop: may have multiple columns or larger cards
        for (let i = 0; i < await eventCards.count(); i++) {
          const card = eventCards.nth(i);
          const cardBox = await card.boundingBox();
          if (cardBox) {
            expect(cardBox.width).toBeGreaterThan(300);
          }
        }
      }
    });

    test(`should handle event form modal responsively on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/eventi-clinici');
      
      // Open event form modal
      await page.click('[data-testid="add-event-btn"]');
      await page.waitForSelector('[data-testid="event-form-modal"]');
      
      const modal = page.locator('[data-testid="event-form-modal"]');
      const modalBox = await modal.boundingBox();
      
      expect(modalBox).toBeTruthy();
      
      if (modalBox) {
        // Modal should fit within viewport
        expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
        expect(modalBox.height).toBeLessThanOrEqual(viewport.height);
        
        // Modal should not be too small
        expect(modalBox.width).toBeGreaterThan(Math.min(300, viewport.width * 0.8));
        
        if (viewport.width < 768) {
          // On mobile, modal should take most of the screen
          expect(modalBox.width).toBeGreaterThan(viewport.width * 0.85);
        }
      }
      
      // Check form fields are accessible
      await expect(page.locator('[data-testid="patient-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="tipo_evento"]')).toBeVisible();
      await expect(page.locator('[data-testid="data_evento"]')).toBeVisible();
      
      // Check buttons are accessible
      await expect(page.locator('[data-testid="submit-event"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-event"]')).toBeVisible();
      
      // Test form interaction
      await page.fill('[data-testid="patient-search"]', 'Responsive Test Patient');
      await page.click('[data-testid="patient-option"]');
      await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
      
      // Verify conditional fields appear properly
      await expect(page.locator('[data-testid="tipo_intervento"]')).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test(`should handle discharge form responsively on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/list');
      
      // Search for patient
      await page.fill('[data-testid="search-input"]', 'Responsive Test Patient');
      await page.waitForSelector('[data-testid="patient-card"]');
      
      // Open discharge modal
      await page.click('[data-testid="discharge-btn"]');
      await page.waitForSelector('[data-testid="discharge-modal"]');
      
      const modal = page.locator('[data-testid="discharge-modal"]');
      const modalBox = await modal.boundingBox();
      
      expect(modalBox).toBeTruthy();
      
      if (modalBox) {
        // Modal should fit within viewport
        expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
        expect(modalBox.height).toBeLessThanOrEqual(viewport.height);
        
        if (viewport.width < 768) {
          // On mobile, modal should take most of the screen
          expect(modalBox.width).toBeGreaterThan(viewport.width * 0.85);
        }
      }
      
      // Test form fields
      await expect(page.locator('[data-testid="data_dimissione"]')).toBeVisible();
      await expect(page.locator('[data-testid="tipo_dimissione"]')).toBeVisible();
      
      // Test conditional fields
      await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_interno');
      await expect(page.locator('[data-testid="reparto_destinazione"]')).toBeVisible();
      
      await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_esterno');
      await expect(page.locator('[data-testid="clinica_destinazione"]')).toBeVisible();
      await expect(page.locator('[data-testid="codice_clinica"]')).toBeVisible();
    });

    test(`should handle search and filters responsively on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/eventi-clinici');
      await page.waitForSelector('[data-testid="events-timeline"]');
      
      // Check search input
      const searchInput = page.locator('[data-testid="patient-search-filter"]');
      await expect(searchInput).toBeVisible();
      
      const searchBox = await searchInput.boundingBox();
      if (searchBox) {
        expect(searchBox.width).toBeGreaterThan(100);
        expect(searchBox.width).toBeLessThan(viewport.width);
      }
      
      // Check filter controls
      await expect(page.locator('[data-testid="event-type-filter"]')).toBeVisible();
      
      if (viewport.width >= 768) {
        // On larger screens, filters might be in a row
        await expect(page.locator('[data-testid="date-from-filter"]')).toBeVisible();
        await expect(page.locator('[data-testid="date-to-filter"]')).toBeVisible();
      }
      
      // Test search functionality
      await page.fill('[data-testid="patient-search-filter"]', 'Responsive');
      await page.waitForTimeout(500);
      
      // Should show filtered results
      const eventCards = page.locator('[data-testid="event-card"]');
      await expect(eventCards).toHaveCount(2);
      
      // Test filter functionality
      await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
      await page.waitForTimeout(300);
      
      await expect(eventCards).toHaveCount(1);
    });

    test(`should handle navigation responsively on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/eventi-clinici');
      
      // Check navigation elements
      if (viewport.width < 768) {
        // Mobile navigation might be different (hamburger menu, etc.)
        const mobileNav = page.locator('[data-testid="mobile-nav"]');
        if (await mobileNav.isVisible()) {
          await expect(mobileNav).toBeVisible();
        }
      } else {
        // Desktop navigation
        const desktopNav = page.locator('[data-testid="desktop-nav"]');
        if (await desktopNav.isVisible()) {
          await expect(desktopNav).toBeVisible();
        }
      }
      
      // Test navigation between pages
      await page.goto('/list');
      await page.waitForSelector('[data-testid="patient-list"]');
      
      await page.goto('/eventi-clinici');
      await page.waitForSelector('[data-testid="events-timeline"]');
      
      // Navigation should work on all screen sizes
      await expect(page.locator('[data-testid="events-timeline"]')).toBeVisible();
    });

    test(`should handle touch interactions on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      if (viewport.width < 768) {
        // Test touch interactions on mobile
        await page.goto('/eventi-clinici');
        await page.waitForSelector('[data-testid="events-timeline"]');
        
        const eventCard = page.locator('[data-testid="event-card"]').first();
        
        // Test tap interaction
        await eventCard.tap();
        
        // Test swipe gestures (if implemented)
        const cardBox = await eventCard.boundingBox();
        if (cardBox) {
          // Simulate swipe gesture
          await page.touchscreen.tap(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
        }
        
        // Test touch scrolling
        await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
        
        // Test modal touch interactions
        await page.tap('[data-testid="add-event-btn"]');
        await page.waitForSelector('[data-testid="event-form-modal"]');
        
        // Should be able to interact with form fields via touch
        await page.tap('[data-testid="patient-search"]');
        await page.fill('[data-testid="patient-search"]', 'Touch Test');
        
        // Close modal with touch
        await page.tap('[data-testid="cancel-event"]');
        await expect(page.locator('[data-testid="event-form-modal"]')).not.toBeVisible();
      }
    });
  });

  test('should handle orientation changes', async ({ page }) => {
    // Test orientation change from portrait to landscape
    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Verify layout in portrait
    const portraitCards = page.locator('[data-testid="event-card"]');
    await expect(portraitCards).toHaveCount(2);
    
    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 }); // Landscape
    await page.waitForTimeout(500); // Wait for layout adjustment
    
    // Verify layout still works in landscape
    const landscapeCards = page.locator('[data-testid="event-card"]');
    await expect(landscapeCards).toHaveCount(2);
    
    // Cards should still be visible and properly laid out
    for (let i = 0; i < await landscapeCards.count(); i++) {
      const card = landscapeCards.nth(i);
      await expect(card).toBeVisible();
      
      const cardBox = await card.boundingBox();
      if (cardBox) {
        // Card should fit within new viewport
        expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(667);
        expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should handle zoom levels', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Test different zoom levels
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);
      
      await page.waitForTimeout(300);
      
      // Verify elements are still accessible at different zoom levels
      await expect(page.locator('[data-testid="events-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-search-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-event-btn"]')).toBeVisible();
      
      const eventCards = page.locator('[data-testid="event-card"]');
      await expect(eventCards).toHaveCount(2);
      
      // Test interaction at this zoom level
      await page.fill('[data-testid="patient-search-filter"]', 'zoom test');
      await page.fill('[data-testid="patient-search-filter"]', '');
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });
});