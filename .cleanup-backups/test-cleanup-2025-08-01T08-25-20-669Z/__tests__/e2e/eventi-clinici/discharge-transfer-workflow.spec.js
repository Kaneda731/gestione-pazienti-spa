import { test, expect } from '@playwright/test';

test.describe('Discharge and Transfer Workflow E2E Tests', () => {
  let testPatientId;

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Mock authentication - assuming we have a test user
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Create a test patient for discharge/transfer testing
    await page.goto('/inserimento');
    await page.fill('[data-testid="nome"]', 'Test Patient Discharge');
    await page.fill('[data-testid="cognome"]', 'E2E Test');
    await page.fill('[data-testid="data_nascita"]', '1990-01-01');
    await page.selectOption('[data-testid="sesso"]', 'M');
    await page.fill('[data-testid="codice_fiscale"]', 'TSTPNT90A01H501Z');
    await page.fill('[data-testid="data_ricovero"]', '2024-01-15');
    await page.selectOption('[data-testid="reparto"]', 'Cardiologia');
    
    await page.click('[data-testid="submit-patient"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Get the patient ID from the URL or response
    const url = page.url();
    testPatientId = url.match(/\/list\?.*id=([^&]+)/)?.[1];
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    if (testPatientId) {
      await page.evaluate((id) => {
        // Clean up test patient and related events
        return fetch(`/api/patients/${id}`, { method: 'DELETE' });
      }, testPatientId);
    }
  });

  test('should complete internal transfer workflow', async ({ page }) => {
    // Navigate to patient list and find our test patient
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    // Click on discharge button for the patient
    await page.click(`[data-testid="discharge-btn-${testPatientId}"]`);
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    // Fill discharge form for internal transfer
    await page.fill('[data-testid="data_dimissione"]', '2024-01-20');
    await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_interno');
    
    // Verify internal transfer fields appear
    await expect(page.locator('[data-testid="reparto_destinazione"]')).toBeVisible();
    await page.selectOption('[data-testid="reparto_destinazione"]', 'Neurologia');
    await page.selectOption('[data-testid="codice_dimissione"]', '3');
    
    // Submit the discharge
    await page.click('[data-testid="submit-discharge"]');
    await page.waitForSelector('[data-testid="discharge-success"]');
    
    // Verify the patient status is updated
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    
    const patientCard = page.locator('[data-testid="patient-card"]').first();
    await expect(patientCard.locator('[data-testid="transfer-badge"]')).toContainText('Trasferimento Interno');
    await expect(patientCard.locator('[data-testid="destination-info"]')).toContainText('Neurologia');
  });

  test('should complete external transfer workflow', async ({ page }) => {
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    await page.click(`[data-testid="discharge-btn-${testPatientId}"]`);
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    // Fill discharge form for external transfer
    await page.fill('[data-testid="data_dimissione"]', '2024-01-20');
    await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_esterno');
    
    // Verify external transfer fields appear
    await expect(page.locator('[data-testid="clinica_destinazione"]')).toBeVisible();
    await expect(page.locator('[data-testid="codice_clinica"]')).toBeVisible();
    
    await page.fill('[data-testid="clinica_destinazione"]', 'Clinica di Riabilitazione San Marco');
    await page.selectOption('[data-testid="codice_clinica"]', '56');
    await page.selectOption('[data-testid="codice_dimissione"]', '6');
    
    await page.click('[data-testid="submit-discharge"]');
    await page.waitForSelector('[data-testid="discharge-success"]');
    
    // Verify the patient status is updated
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    
    const patientCard = page.locator('[data-testid="patient-card"]').first();
    await expect(patientCard.locator('[data-testid="transfer-badge"]')).toContainText('Trasferimento Esterno');
    await expect(patientCard.locator('[data-testid="destination-info"]')).toContainText('Clinica di Riabilitazione San Marco');
  });

  test('should complete regular discharge workflow', async ({ page }) => {
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    await page.click(`[data-testid="discharge-btn-${testPatientId}"]`);
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    // Fill discharge form for regular discharge
    await page.fill('[data-testid="data_dimissione"]', '2024-01-20');
    await page.selectOption('[data-testid="tipo_dimissione"]', 'dimissione');
    await page.selectOption('[data-testid="codice_dimissione"]', '3');
    
    // Verify transfer-specific fields are hidden
    await expect(page.locator('[data-testid="reparto_destinazione"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="clinica_destinazione"]')).not.toBeVisible();
    
    await page.click('[data-testid="submit-discharge"]');
    await page.waitForSelector('[data-testid="discharge-success"]');
    
    // Verify the patient status is updated
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    
    const patientCard = page.locator('[data-testid="patient-card"]').first();
    await expect(patientCard.locator('[data-testid="status-badge"]')).toContainText('Dimesso');
  });

  test('should validate discharge form fields', async ({ page }) => {
    await page.goto('/list');
    await page.fill('[data-testid="search-input"]', 'Test Patient Discharge');
    await page.waitForSelector('[data-testid="patient-card"]');
    
    await page.click(`[data-testid="discharge-btn-${testPatientId}"]`);
    await page.waitForSelector('[data-testid="discharge-modal"]');
    
    // Try to submit without required fields
    await page.click('[data-testid="submit-discharge"]');
    
    // Verify validation errors appear
    await expect(page.locator('[data-testid="error-data_dimissione"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-tipo_dimissione"]')).toBeVisible();
    
    // Fill required fields and test type-specific validation
    await page.fill('[data-testid="data_dimissione"]', '2024-01-20');
    await page.selectOption('[data-testid="tipo_dimissione"]', 'trasferimento_interno');
    
    // Try to submit without department destination
    await page.click('[data-testid="submit-discharge"]');
    await expect(page.locator('[data-testid="error-reparto_destinazione"]')).toBeVisible();
  });
});