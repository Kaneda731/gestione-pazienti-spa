import { test, expect } from '@playwright/test';

test.describe('Clinical Events CRUD Operations E2E Tests', () => {
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
    await page.fill('[data-testid="nome"]', 'Test Patient Events');
    await page.fill('[data-testid="cognome"]', 'E2E Test');
    await page.fill('[data-testid="data_nascita"]', '1985-05-15');
    await page.selectOption('[data-testid="sesso"]', 'F');
    await page.fill('[data-testid="codice_fiscale"]', 'TSTEVT85E15H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-10');
    await page.selectOption('[data-testid="reparto"]', 'Chirurgia');
    
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

  test('should create surgical intervention event', async ({ page }) => {
    // Navigate to clinical events page
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Click add new event button
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Search and select patient
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.waitForSelector('[data-testid="patient-search-results"]');
    await page.click('[data-testid="patient-option"]');
    
    // Fill intervention form
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Appendicectomia laparoscopica');
    await page.fill('[data-testid="descrizione"]', 'Intervento di routine senza complicazioni');
    
    // Submit the form
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify event appears in timeline
    await page.waitForSelector('[data-testid="event-card"]');
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard.locator('[data-testid="event-type"]')).toContainText('Intervento');
    await expect(eventCard.locator('[data-testid="event-description"]')).toContainText('Appendicectomia laparoscopica');
  });

  test('should create infection event', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Search and select patient
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.waitForSelector('[data-testid="patient-search-results"]');
    await page.click('[data-testid="patient-option"]');
    
    // Fill infection form
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-15');
    await page.fill('[data-testid="agente_patogeno"]', 'Staphylococcus aureus');
    await page.fill('[data-testid="descrizione"]', 'Infezione della ferita chirurgica');
    
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify event appears in timeline
    await page.waitForSelector('[data-testid="event-card"]');
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard.locator('[data-testid="event-type"]')).toContainText('Infezione');
    await expect(eventCard.locator('[data-testid="pathogen"]')).toContainText('Staphylococcus aureus');
  });

  test('should edit existing clinical event', async ({ page }) => {
    // First create an event
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Original Intervention');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Edit the event
    await page.click('[data-testid="edit-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Update the intervention type
    await page.fill('[data-testid="tipo_intervento"]', 'Updated Intervention Type');
    await page.fill('[data-testid="descrizione"]', 'Updated description');
    
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify changes are reflected
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard.locator('[data-testid="event-description"]')).toContainText('Updated Intervention Type');
  });

  test('should delete clinical event', async ({ page }) => {
    // First create an event
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-15');
    await page.fill('[data-testid="agente_patogeno"]', 'Test Pathogen');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Delete the event
    await page.click('[data-testid="delete-event-btn"]');
    await page.waitForSelector('[data-testid="confirm-delete-modal"]');
    await page.click('[data-testid="confirm-delete"]');
    await page.waitForSelector('[data-testid="delete-success"]');
    
    // Verify event is removed from timeline
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);
  });

  test('should validate event form fields', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="add-event-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Try to submit without required fields
    await page.click('[data-testid="submit-event"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="error-patient"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-tipo_evento"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-data_evento"]')).toBeVisible();
    
    // Fill patient and event type, test type-specific validation
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    
    // Try to submit without intervention type
    await page.click('[data-testid="submit-event"]');
    await expect(page.locator('[data-testid="error-tipo_intervento"]')).toBeVisible();
    
    // Switch to infection and test pathogen validation
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.click('[data-testid="submit-event"]');
    // Note: agente_patogeno might be optional based on requirements
  });

  test('should display post-operative days correctly', async ({ page }) => {
    // Create an intervention first
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="tipo_intervento"]', 'Test Surgery');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Create a subsequent event
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Test Patient Events');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-15');
    await page.fill('[data-testid="agente_patogeno"]', 'Test Pathogen');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify post-operative day display
    const infectionCard = page.locator('[data-testid="event-card"]').filter({ hasText: 'Infezione' });
    await expect(infectionCard.locator('[data-testid="post-op-day"]')).toContainText('Giorno post-operatorio 3');
  });
});