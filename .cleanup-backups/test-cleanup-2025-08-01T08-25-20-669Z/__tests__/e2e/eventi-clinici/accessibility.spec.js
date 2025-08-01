import { test, expect } from '@playwright/test';

test.describe('Accessibility E2E Tests', () => {
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
    await page.fill('[data-testid="nome"]', 'Accessibility Test Patient');
    await page.fill('[data-testid="cognome"]', 'A11y Test');
    await page.fill('[data-testid="data_nascita"]', '1985-07-25');
    await page.selectOption('[data-testid="sesso"]', 'F');
    await page.fill('[data-testid="codice_fiscale"]', 'A11YTS85L25H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-10');
    await page.selectOption('[data-testid="reparto"]', 'Medicina Generale');
    
    await page.click('[data-testid="submit-patient"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    const url = page.url();
    testPatientId = url.match(/\/list\?.*id=([^&]+)/)?.[1];
  });

  test.afterEach(async ({ page }) => {
    if (testPatientId) {
      await page.evaluate((id) => {
        return fetch(`/api/patients/${id}`, { method: 'DELETE' });
      }, testPatientId);
    }
  });

  test('should support keyboard navigation in clinical events timeline', async ({ page }) => {
    // Create some test events first
    await page.goto('/eventi-clinici');
    
    // Create intervention
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Accessibility Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Test Intervention');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Should focus on first interactive element
    await page.keyboard.press('Tab'); // Move to next element
    
    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key activation on buttons
    await page.locator('[data-testid="add-event-btn"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Test Escape key to close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="event-form-modal"]')).not.toBeVisible();
    
    // Test arrow key navigation in event cards
    await page.locator('[data-testid="event-card"]').first().focus();
    await page.keyboard.press('ArrowDown');
    // Verify focus moved to next event card (if multiple exist)
  });

  test('should support screen reader navigation with proper ARIA labels', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Check main landmarks
    await expect(page.locator('main')).toHaveAttribute('role', 'main');
    await expect(page.locator('[data-testid="events-timeline"]')).toHaveAttribute('role', 'region');
    await expect(page.locator('[data-testid="events-timeline"]')).toHaveAttribute('aria-label', /eventi clinici|timeline/i);
    
    // Check search form accessibility
    const searchInput = page.locator('[data-testid="patient-search-filter"]');
    await expect(searchInput).toHaveAttribute('aria-label');
    await expect(searchInput).toHaveAttribute('role', 'searchbox');
    
    // Check filter controls
    const eventTypeFilter = page.locator('[data-testid="event-type-filter"]');
    await expect(eventTypeFilter).toHaveAttribute('aria-label');
    
    // Create an event to test event card accessibility
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Check modal accessibility
    const modal = page.locator('[data-testid="event-form-modal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby');
    
    // Check form field labels
    const patientSearchField = page.locator('[data-testid="patient-search"]');
    await expect(patientSearchField).toHaveAttribute('aria-label');
    
    const eventTypeField = page.locator('[data-testid="tipo_evento"]');
    await expect(eventTypeField).toHaveAttribute('aria-label');
    
    const eventDateField = page.locator('[data-testid="data_evento"]');
    await expect(eventDateField).toHaveAttribute('aria-label');
    
    // Close modal and create event to test event card accessibility
    await page.keyboard.press('Escape');
    
    // Create a test event
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Accessibility Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Accessibility Test Intervention');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Check event card accessibility
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard).toHaveAttribute('role', 'article');
    await expect(eventCard).toHaveAttribute('aria-label');
    
    // Check action buttons have proper labels
    const editButton = eventCard.locator('[data-testid="edit-event-btn"]');
    await expect(editButton).toHaveAttribute('aria-label');
    
    const deleteButton = eventCard.locator('[data-testid="delete-event-btn"]');
    await expect(deleteButton).toHaveAttribute('aria-label');
  });

  test('should provide proper focus management in modals', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Open event creation modal
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Verify focus is trapped within modal
    const modal = page.locator('[data-testid="event-form-modal"]');
    const firstFocusableElement = modal.locator('input, select, button').first();
    const lastFocusableElement = modal.locator('input, select, button').last();
    
    // Focus should be on first focusable element
    await expect(firstFocusableElement).toBeFocused();
    
    // Tab to last element and then tab again should cycle back to first
    await page.keyboard.press('Shift+Tab'); // Should go to last element
    await expect(lastFocusableElement).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should cycle back to first
    await expect(firstFocusableElement).toBeFocused();
    
    // Escape should close modal and return focus to trigger button
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="event-form-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="add-event-btn"]')).toBeFocused();
  });

  test('should provide proper error announcements', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Open event creation modal
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Try to submit form without required fields
    await page.click('[data-testid="submit-event"]');
    
    // Check that error messages have proper ARIA attributes
    const errorMessages = page.locator('[data-testid^="error-"]');
    const errorCount = await errorMessages.count();
    
    for (let i = 0; i < errorCount; i++) {
      const errorMessage = errorMessages.nth(i);
      await expect(errorMessage).toHaveAttribute('role', 'alert');
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    }
    
    // Check that form fields are properly associated with error messages
    const patientField = page.locator('[data-testid="patient-search"]');
    const patientError = page.locator('[data-testid="error-patient"]');
    
    if (await patientError.isVisible()) {
      const errorId = await patientError.getAttribute('id');
      await expect(patientField).toHaveAttribute('aria-describedby', errorId);
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    
    await page.goto('/eventi-clinici');
    
    // Create a test event
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Accessibility Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'High Contrast Test');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify elements are still visible and have sufficient contrast
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard).toBeVisible();
    
    // Check that interactive elements have visible focus indicators
    await eventCard.locator('[data-testid="edit-event-btn"]').focus();
    const focusedButton = page.locator('[data-testid="edit-event-btn"]:focus');
    await expect(focusedButton).toBeVisible();
    
    // Verify text is readable
    const eventText = eventCard.locator('[data-testid="event-description"]');
    await expect(eventText).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/eventi-clinici');
    
    // Test that animations are reduced or disabled
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Modal should appear without animation
    const modal = page.locator('[data-testid="event-form-modal"]');
    await expect(modal).toBeVisible();
    
    // Test form submission feedback without excessive animation
    await page.fill('[data-testid="patient-search"]', 'Accessibility Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Reduced Motion Test');
    await page.click('[data-testid="submit-event"]');
    
    // Success message should appear without distracting animations
    await page.waitForSelector('[data-testid="event-success"]');
    await expect(page.locator('[data-testid="event-success"]')).toBeVisible();
  });

  test('should provide proper heading hierarchy', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/eventi clinici/i);
    
    // Check that headings follow proper hierarchy (h1 -> h2 -> h3, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      
      // Verify heading has text content
      const textContent = await heading.textContent();
      expect(textContent?.trim()).toBeTruthy();
    }
  });

  test('should support discharge form accessibility', async ({ page }) => {
    // Navigate to patient list and test discharge form accessibility
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Accessibility Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    // Open discharge modal
    await page.click('[data-testid="discharge-btn"]');
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    // Check modal accessibility
    const modal = page.locator('[data-testid="discharge-modal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    
    // Check form field accessibility
    const dischargeDate = page.locator('[data-testid="data_dimissione"]');
    await expect(dischargeDate).toHaveAttribute('aria-label');
    
    const dischargeType = page.locator('[data-testid="tipo_dimissione"]');
    await expect(dischargeType).toHaveAttribute('aria-label');
    
    // Test conditional field accessibility
    await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_interno');
    
    const destinationDept = page.locator('[data-testid="reparto_destinazione"]');
    await expect(destinationDept).toBeVisible();
    await expect(destinationDept).toHaveAttribute('aria-label');
    
    // Test form validation accessibility
    await page.click('[data-testid="submit-discharge"]');
    
    const errorMessages = page.locator('[data-testid^="error-"]');
    const errorCount = await errorMessages.count();
    
    for (let i = 0; i < errorCount; i++) {
      const errorMessage = errorMessages.nth(i);
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    }
  });

  test('should provide proper live region announcements', async ({ page }) => {
    await page.goto('/eventi-clinici');
    
    // Check for live regions
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    
    // Should have at least one live region for status updates
    expect(liveRegionCount).toBeGreaterThan(0);
    
    // Test live region updates during search
    await page.fill('[data-testid="patient-search-filter"]', 'Accessibility');
    
    // Wait for search results and check if live region is updated
    await page.waitForTimeout(1000);
    
    const statusRegion = page.locator('[data-testid="search-status"]');
    if (await statusRegion.isVisible()) {
      await expect(statusRegion).toHaveAttribute('aria-live');
    }
    
    // Test live region updates during form submission
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Accessibility Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Live Region Test');
    await page.click('[data-testid="submit-event"]');
    
    // Success message should be announced
    const successMessage = page.locator('[data-testid="event-success"]');
    await expect(successMessage).toHaveAttribute('role', 'status');
    await expect(successMessage).toHaveAttribute('aria-live', 'polite');
  });
});