import { test, expect } from '@playwright/test';

test.describe('Cross-Feature Integration E2E Tests', () => {
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

    // Create a test patient with clinical events
    await page.goto('/inserimento');
    await page.fill('[data-testid="nome"]', 'Integration Test Patient');
    await page.fill('[data-testid="cognome"]', 'Cross Feature');
    await page.fill('[data-testid="data_nascita"]', '1980-03-20');
    await page.selectOption('[data-testid="sesso"]', 'M');
    await page.fill('[data-testid="codice_fiscale"]', 'INTGRT80C20H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-05');
    await page.selectOption('[data-testid="reparto"]', 'Ortopedia');
    
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

  test('should show clinical events in patient detail view', async ({ page }) => {
    // First create some clinical events
    await page.goto('/eventi-clinici');
    
    // Create intervention
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Integration Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-08');
    await page.fill('[data-testid="tipo_intervento"]', 'Artroscopia ginocchio');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Create infection
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Integration Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-12');
    await page.fill('[data-testid="agente_patogeno"]', 'E. coli');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Navigate to patient list and view patient details
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    // Click on patient to view details
    await page.click('[data-testid="view-patient-btn"]');
    await page.waitForSelector('[data-testid="patient-detail-view"]');
    
    // Verify clinical events timeline is displayed
    await expect(page.locator('[data-testid="clinical-events-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    
    // Verify post-operative day display
    await expect(page.locator('[data-testid="post-op-day-display"]')).toContainText('Giorno post-operatorio');
    
    // Verify quick action buttons
    await expect(page.locator('[data-testid="add-event-quick-btn"]')).toBeVisible();
  });

  test('should update patient list when discharge with transfer is completed', async ({ page }) => {
    // Navigate to patient list
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    // Verify initial status
    const patientCard = page.locator('[data-testid="patient-card"]').first();
    await expect(patientCard.locator('[data-testid="status-badge"]')).toContainText('Ricoverato');
    
    // Discharge with internal transfer
    await page.click('[data-testid="discharge-btn"]');
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    await page.fill('[data-testid="data_dimissione"]', '2024-01-15');
    await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_interno');
    await page.selectOption('[data-testid="reparto_destinazione"]', 'Riabilitazione');
    await page.selectOption('[data-testid="codice_dimissione"]', '3');
    
    await page.click('[data-testid="submit-discharge"]');
    await page.waitForSelector('[data-testid="discharge-success"]');
    
    // Verify patient list is updated
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    
    const updatedCard = page.locator('[data-testid="patient-card"]').first();
    await expect(updatedCard.locator('[data-testid="transfer-badge"]')).toContainText('Trasferimento Interno');
    await expect(updatedCard.locator('[data-testid="destination-info"]')).toContainText('Riabilitazione');
    
    // Verify clinical events are still accessible
    await page.click('[data-testid="view-events-btn"]');
    await page.waitForSelector('[data-testid="patient-events-modal"]');
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount.greaterThanOrEqual(1);
  });

  test('should create clinical event from patient detail view', async ({ page }) => {
    // Navigate to patient detail view
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    await page.click('[data-testid="view-patient-btn"]');
    await page.waitForSelector('[data-testid="patient-detail-view"]');
    
    // Click quick add event button
    await page.click('[data-testid="add-event-quick-btn"]');
    await page.waitForSelector('[data-testid="event-form-modal"]');
    
    // Verify patient is pre-selected
    await expect(page.locator('[data-testid="patient-search"]')).toHaveValue('Integration Test Patient');
    
    // Create intervention
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-10');
    await page.fill('[data-testid="tipo_intervento"]', 'Medicazione ferita');
    
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify event appears in patient timeline
    await expect(page.locator('[data-testid="clinical-events-timeline"] [data-testid="event-card"]')).toHaveCount(1);
    
    // Navigate to main events page and verify event is there too
    await page.goto('/eventi-clinici');
    await page.fill('[data-testid="patient-search-filter"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="event-card"]');
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
  });

  test('should maintain data consistency across features', async ({ page }) => {
    // Create clinical events
    await page.goto('/eventi-clinici');
    
    // Create intervention
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Integration Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-07');
    await page.fill('[data-testid="tipo_intervento"]', 'Sutura ferita');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify event in events timeline
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard.locator('[data-testid="event-description"]')).toContainText('Sutura ferita');
    
    // Navigate to patient list and verify post-op display
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    const patientCard = page.locator('[data-testid="patient-card"]').first();
    await expect(patientCard.locator('[data-testid="post-op-indicator"]')).toBeVisible();
    
    // Edit event and verify changes propagate
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="edit-event-btn"]');
    await page.fill('[data-testid="tipo_intervento"]', 'Sutura ferita - Aggiornata');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify changes in patient detail view
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.click('[data-testid="view-patient-btn"]');
    await page.waitForSelector('[data-testid="clinical-events-timeline"]');
    
    const timelineEvent = page.locator('[data-testid="clinical-events-timeline"] [data-testid="event-card"]').first();
    await expect(timelineEvent.locator('[data-testid="event-description"]')).toContainText('Sutura ferita - Aggiornata');
  });

  test('should handle patient deletion with clinical events', async ({ page }) => {
    // Create clinical events first
    await page.goto('/eventi-clinici');
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Integration Test Patient');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-07');
    await page.fill('[data-testid="tipo_intervento"]', 'Test Intervention');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Verify event exists
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    
    // Delete patient
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await page.waitForSelector('[data-testid="patient-card"]');
    await page.click('[data-testid="delete-patient-btn"]');
    await page.waitForSelector('[data-testid="confirm-delete-modal"]');
    await page.click('[data-testid="confirm-delete"]');
    await page.waitForSelector('[data-testid="delete-success"]');
    
    // Verify patient is removed from list
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Integration Test Patient');
    await expect(page.locator('[data-testid="patient-card"]')).toHaveCount(0);
    
    // Verify associated events are also removed
    await page.goto('/eventi-clinici');
    await page.fill('[data-testid="patient-search-filter"]', 'Integration Test Patient');
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);
  });
});