import { test, expect } from '@playwright/test';

test.describe('Search and Filtering E2E Tests', () => {
  let testPatients = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Create multiple test patients with different characteristics
    const patients = [
      {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '1975-06-10',
        sesso: 'M',
        codice_fiscale: 'RSSMRA75H10H501Z',
        data_ricovero: '2024-01-05',
        reparto: 'Cardiologia'
      },
      {
        nome: 'Anna',
        cognome: 'Bianchi',
        data_nascita: '1982-09-15',
        sesso: 'F',
        codice_fiscale: 'BNCNNA82P55H501Z',
        data_ricovero: '2024-01-08',
        reparto: 'Neurologia'
      },
      {
        nome: 'Giuseppe',
        cognome: 'Verdi',
        data_nascita: '1990-12-03',
        sesso: 'M',
        codice_fiscale: 'VRDGPP90T03H501Z',
        data_ricovero: '2024-01-12',
        reparto: 'Ortopedia'
      }
    ];

    for (const patient of patients) {
      await page.goto('/inserimento');
      await page.fill('[data-testid="nome"]', patient.nome);
      await page.fill('[data-testid="cognome"]', patient.cognome);
      await page.fill('[data-testid="data_nascita"]', patient.data_nascita);
      await page.selectOption('[data-testid="sesso"]', patient.sesso);
      await page.fill('[data-testid="codice_fiscale"]', patient.codice_fiscale);
      await page.fill('[data-testid="data_ricovero"]', patient.data_ricovero);
      await page.selectOption('[data-testid="reparto"]', patient.reparto);
      
      await page.click('[data-testid="submit-patient"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      const url = page.url();
      const patientId = url.match(/\/list\?.*id=([^&]+)/)?.[1];
      testPatients.push({ ...patient, id: patientId });
    }

    // Create clinical events for testing
    await page.goto('/eventi-clinici');
    
    // Events for Mario Rossi
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Mario Rossi');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-07');
    await page.fill('[data-testid="tipo_intervento"]', 'Angioplastica coronarica');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Mario Rossi');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-10');
    await page.fill('[data-testid="agente_patogeno"]', 'Staphylococcus epidermidis');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Events for Anna Bianchi
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Anna Bianchi');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'intervento');
    await page.fill('[data-testid="data_evento"]', '2024-01-10');
    await page.fill('[data-testid="tipo_intervento"]', 'Craniotomia');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    // Events for Giuseppe Verdi
    await page.click('[data-testid="add-event-btn"]');
    await page.fill('[data-testid="patient-search"]', 'Giuseppe Verdi');
    await page.click('[data-testid="patient-option"]');
    await page.selectOption('[data-testid="tipo_evento"]', 'infezione');
    await page.fill('[data-testid="data_evento"]', '2024-01-15');
    await page.fill('[data-testid="agente_patogeno"]', 'E. coli');
    await page.click('[data-testid="submit-event"]');
    await page.waitForSelector('[data-testid="event-success"]');
    
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Clean up test data
    for (const patient of testPatients) {
      if (patient.id) {
        await page.evaluate((id) => {
          return fetch(`/api/patients/${id}`, { method: 'DELETE' });
        }, patient.id);
      }
    }
    await page.close();
  });

  test('should filter events by patient name search', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Initially should show all events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(4);
    
    // Search for Mario Rossi
    await page.fill('[data-testid="patient-search-filter"]', 'Mario');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Should show only Mario's events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first().locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
    await expect(eventCards.last().locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
    
    // Clear search
    await page.fill('[data-testid="patient-search-filter"]', '');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(4);
  });

  test('should filter events by patient ID search', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Search by patient ID (assuming we can get it from the first patient)
    const patientId = testPatients[0].id;
    await page.fill('[data-testid="patient-search-filter"]', patientId);
    await page.waitForTimeout(500);
    
    // Should show only that patient's events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first().locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
  });

  test('should filter events by event type', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Filter by interventions only
    await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
    await page.waitForTimeout(300);
    
    // Should show only intervention events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first().locator('[data-testid="event-type"]')).toContainText('Intervento');
    await expect(eventCards.last().locator('[data-testid="event-type"]')).toContainText('Intervento');
    
    // Filter by infections only
    await page.selectOption('[data-testid="event-type-filter"]', 'infezione');
    await page.waitForTimeout(300);
    
    // Should show only infection events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    const infectionCards = page.locator('[data-testid="event-card"]');
    await expect(infectionCards.first().locator('[data-testid="event-type"]')).toContainText('Infezione');
    await expect(infectionCards.last().locator('[data-testid="event-type"]')).toContainText('Infezione');
    
    // Reset filter
    await page.selectOption('[data-testid="event-type-filter"]', '');
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(4);
  });

  test('should filter events by date range', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Set date range to show only events from Jan 8-12
    await page.fill('[data-testid="date-from-filter"]', '2024-01-08');
    await page.fill('[data-testid="date-to-filter"]', '2024-01-12');
    await page.waitForTimeout(500);
    
    // Should show events within date range
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    
    // Verify dates are within range
    const eventCards = page.locator('[data-testid="event-card"]');
    for (let i = 0; i < await eventCards.count(); i++) {
      const dateText = await eventCards.nth(i).locator('[data-testid="event-date"]').textContent();
      // Verify date is within range (implementation depends on date format)
      expect(dateText).toMatch(/2024-01-(08|09|10|11|12)/);
    }
    
    // Clear date filters
    await page.fill('[data-testid="date-from-filter"]', '');
    await page.fill('[data-testid="date-to-filter"]', '');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(4);
  });

  test('should filter events by department', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Filter by Cardiologia department
    await page.selectOption('[data-testid="department-filter"]', 'Cardiologia');
    await page.waitForTimeout(300);
    
    // Should show only events for patients in Cardiologia
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first().locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
    await expect(eventCards.last().locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
    
    // Filter by Neurologia
    await page.selectOption('[data-testid="department-filter"]', 'Neurologia');
    await page.waitForTimeout(300);
    
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    const neurologiaCard = page.locator('[data-testid="event-card"]').first();
    await expect(neurologiaCard.locator('[data-testid="patient-name"]')).toContainText('Anna Bianchi');
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Combine patient search and event type filter
    await page.fill('[data-testid="patient-search-filter"]', 'Mario');
    await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
    await page.waitForTimeout(500);
    
    // Should show only Mario's intervention events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard.locator('[data-testid="patient-name"]')).toContainText('Mario Rossi');
    await expect(eventCard.locator('[data-testid="event-type"]')).toContainText('Intervento');
    
    // Add date filter
    await page.fill('[data-testid="date-from-filter"]', '2024-01-06');
    await page.fill('[data-testid="date-to-filter"]', '2024-01-08');
    await page.waitForTimeout(500);
    
    // Should still show the same event (within date range)
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    
    // Change date range to exclude the event
    await page.fill('[data-testid="date-from-filter"]', '2024-01-01');
    await page.fill('[data-testid="date-to-filter"]', '2024-01-05');
    await page.waitForTimeout(500);
    
    // Should show no events
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);
  });

  test('should reset all filters', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Apply multiple filters
    await page.fill('[data-testid="patient-search-filter"]', 'Mario');
    await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
    await page.selectOption('[data-testid="department-filter"]', 'Cardiologia');
    await page.fill('[data-testid="date-from-filter"]', '2024-01-01');
    await page.waitForTimeout(500);
    
    // Verify filters are applied
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    
    // Click reset filters button
    await page.click('[data-testid="reset-filters-btn"]');
    await page.waitForTimeout(500);
    
    // Should show all events again
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(4);
    
    // Verify filter inputs are cleared
    await expect(page.locator('[data-testid="patient-search-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="event-type-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="department-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="date-from-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="date-to-filter"]')).toHaveValue('');
  });

  test('should maintain filter state during navigation', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Apply filters
    await page.fill('[data-testid="patient-search-filter"]', 'Anna');
    await page.selectOption('[data-testid="event-type-filter"]', 'intervento');
    await page.waitForTimeout(500);
    
    // Verify filter is applied
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    
    // Navigate away and back
    await page.goto('/list');
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Verify filters are maintained (if using state persistence)
    // This test might need adjustment based on actual implementation
    await expect(page.locator('[data-testid="patient-search-filter"]')).toHaveValue('Anna');
    await expect(page.locator('[data-testid="event-type-filter"]')).toHaveValue('intervento');
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
  });

  test('should show no results message when filters return empty', async ({ page }) => {
    await page.goto('/eventi-clinici');
    await page.waitForSelector('[data-testid="events-timeline"]');
    
    // Search for non-existent patient
    await page.fill('[data-testid="patient-search-filter"]', 'NonExistentPatient');
    await page.waitForTimeout(500);
    
    // Should show no results message
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results-message"]')).toContainText('Nessun evento trovato');
  });
});