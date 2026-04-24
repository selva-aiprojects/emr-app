import { test, expect } from '@playwright/test';

/**
 * NHGL Clinical Command Center - Patient Journey E2E
 * Validates the complete clinical lifecycle within the NHGL environment.
 * Port: 5175 (Vite Dev Server)
 */

test.describe('NHGL Clinical Command Center - Patient Journey E2E', () => {
  
  test('Complete Clinical Life-Cycle: Admin -> Doctor -> Billing', async ({ page }) => {
    // Increase timeout for this long multi-step test
    test.setTimeout(180000);

    const timestamp = Date.now();
    const patientLastName = `Test-IPD-${timestamp}`;

    // 1. ADMIN - LOGIN & REGISTRATION
    await test.step('Admin: Patient Registration', async () => {
      await page.goto('http://localhost:5175/');
      
      // Wait for the login form to be interactive
      const tenantSelect = page.locator('select[name="tenantId"]');
      await tenantSelect.waitFor({ state: 'visible', timeout: 15000 });
      
      // Selection by label is preferred over :has-text() for <select> elements
      // NHGL is the code, "NHGL Healthcare Institute" is the label
      await tenantSelect.selectOption({ label: 'NHGL Healthcare Institute' });
      
      await page.locator('input[type="email"]').fill('admin@nhgl.com');
      await page.locator('input[type="password"]').fill('Test@123');
      
      // Use more robust button selector that handles various possible labels
      const loginButton = page.getByRole('button', { name: /Authorize Entry|Authenticate Protocol|Login|Sign In/i });
      await loginButton.click();

      // Wait for navigation and dashboard load
      // We skip networkidle because the ECharts on the dashboard can keep the network busy
      await page.waitForLoadState('load');
      
      // Check for login errors first to provide better feedback
      const errorMsg = page.locator('.bg-rose-50, text=/Sign in failed|Invalid/i').first();
      const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasError) {
          const text = await errorMsg.innerText();
          throw new Error(`Login failed with error: ${text}`);
      }

      // Use the specific title found in DashboardPage.jsx
      // Increased timeout slightly for first dashboard load
      await expect(page.locator('text=/Institutional Console/i').first()).toBeVisible({ timeout: 25000 });

      // Navigate to Patients module
      // Using data-testid or role is better than just button text if available, 
      // but sticking to standard locators for now since IDs might be missing.
      await page.locator('aside button, .page-shell-premium button').filter({ hasText: /^Patients$/i }).first().click();
      
      // Registration flow
      await page.locator('button').filter({ hasText: /New Registration|Add Patient/i }).click();

      // Fill Patient Details
      await page.locator('input[name="firstName"]').fill('John');
      await page.locator('input[name="lastName"]').fill(patientLastName);
      await page.locator('input[name="dob"]').fill('1990-05-15');
      await page.locator('input[name="phone"]').fill('9988776655');
      
      const genderSelect = page.locator('select[name="gender"]');
      if (await genderSelect.isVisible()) {
          await genderSelect.selectOption('Male');
      }
      
      const consentCheckbox = page.locator('input[name="consent"], input[type="checkbox"]');
      if (await consentCheckbox.isVisible()) {
          await consentCheckbox.check();
      }
      
      await page.locator('button').filter({ hasText: /REGISTER PATIENT|Save Patient|Submit/i }).first().click();
      
      // Verify Success - Handle both toast and redirect
      await expect(page.locator('text=/registered|successfully|provisioned/i').first()).toBeVisible({ timeout: 15000 });
      console.log(`✅ Patient "John ${patientLastName}" registered.`);
    });

    // 2. APPOINTMENT BOOKING
    await test.step('Admin: Appointment Booking', async () => {
      // Toggle sidebar if collapsed (check for Expand button)
      const expandBtn = page.locator('button[title*="Expand sidebar"]');
      if (await expandBtn.isVisible()) {
        await expandBtn.click();
      }

      // Navigate to Appointments - look in sidebar or main area
      const appointmentsBtn = page.locator('aside button, .page-shell-premium button').filter({ hasText: /Appointments/i }).first();
      await appointmentsBtn.waitFor({ state: 'visible', timeout: 15000 });
      await appointmentsBtn.click();
      
      await page.locator('button').filter({ hasText: /Book Appointment|Schedule/i }).click();
      
      // Patient Search - handling potential dynamic loading
      const searchInput = page.locator('input[placeholder*="Search by Name, MRN"], input[name="patientSearch"]');
      await searchInput.fill(patientLastName);
      
      // Wait for search result and click
      const searchResult = page.locator(`text=${patientLastName}`).first();
      await searchResult.waitFor({ state: 'visible' });
      await searchResult.click();
      
      // Select Doctor (if available)
      const docSelect = page.locator('select[name="doctorId"], select[name="providerId"]');
      if (await docSelect.isVisible()) {
        const docOptions = await docSelect.locator('option').all();
        if (docOptions.length > 1) {
            await docSelect.selectOption({ index: 1 });
        }
      }
      
      await page.locator('textarea, input').filter({ hasText: /Reason/i }).or(page.getByPlaceholder(/Reason/i)).first().fill('E2E Clinical Validation Run');
      
      await page.locator('button').filter({ hasText: /Confirm|Schedule|Book/i }).first().click();
      await expect(page.locator('text=/scheduled|success/i').first()).toBeVisible();
      console.log('✅ Appointment confirmed.');
    });

    // 3. DOCTOR - CONSULTATION
    await test.step('Doctor: EMR Consultation', async () => {
      // Step A: Go to Patients module to find our specific patient
      const patientsBtn = page.locator('aside button, .page-shell-premium button').filter({ hasText: /Patients/i }).first();
      await patientsBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Step B: Search for the patient with retry logic
      const performSearch = async (name) => {
        let localSearch = page.locator('#patient-directory-search').first();
        
        // If not on the Patients page (e.g. after reload), navigate back
        const isSearchVisible = await localSearch.isVisible().catch(() => false);
        if (!isSearchVisible) {
            console.log('Search input missing, navigating back to Patients module...');
            const patientsBtn = page.locator('aside button, .page-shell-premium button').filter({ hasText: /^Patients$/i }).first();
            await patientsBtn.click();
            await page.waitForLoadState('networkidle');
        }

        await localSearch.waitFor({ state: 'visible', timeout: 15000 });
        await localSearch.clear();
        await localSearch.fill(name);
        
        // Wait for the specific search API response
        const responsePromise = page.waitForResponse(r => r.url().includes('/patients/search') && r.status() === 200, { timeout: 10000 }).catch(() => null);
        await page.keyboard.press('Enter');
        await responsePromise;
        
        // Final sanity check of the table content on failure
        const tableHtml = await page.locator('.premium-table').innerHTML().catch(() => 'Table not found');
        const patientsState = await page.evaluate(() => window.EMR_PATIENTS).catch(() => []);
        console.log(`DEBUG: Table Search Result. HTML exists: ${!tableHtml.includes('No patients found')}`);
        console.log(`DEBUG: EMR_PATIENTS State Length: ${patientsState?.length || 0}`);
        if ((patientsState?.length || 0) > 0) {
            console.log(`DEBUG: First Patient in State: ${JSON.stringify(patientsState[0]).substring(0, 200)}`);
        }
      };

      await performSearch(patientLastName);
      
      // Step C: Open Patient Chart to set activePatientId in state
      let patientRow = page.locator(`tr[data-patient-name*="${patientLastName}"]`).first();
      
      const isVisible = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isVisible) {
          console.log(`Patient ${patientLastName} not visible after first search, attempting reload fallback...`);
          await page.reload();
          await page.waitForLoadState('networkidle');
          await performSearch(patientLastName);
          patientRow = page.locator(`tr[data-patient-name*="${patientLastName}"]`).first();
      }

      await expect(patientRow).toBeVisible({ timeout: 15000 });
      await patientRow.click();
      console.log('✅ Patient selected from directory.');
      await page.waitForTimeout(3000);
      
      // Step D: Ensure we are in EMR / Clinical Desk view
      const clinicalBtn = page.locator('aside button, .page-shell-premium button').filter({ hasText: /Clinical Desk \/ EMR|EMR/i }).first();
      await clinicalBtn.click();
      await page.waitForLoadState('load');
      
      // Start/Resume Consultation - Align with EmrPage.jsx labels
      const startBtn = page.locator('button').filter({ hasText: /New Assessment|Start Consultation|Open Visit/i }).first();
      await startBtn.click();
      
      // Add Clinical Findings
      const chiefComplaint = page.locator('input[name="complaint"], textarea[name="complaint"], [placeholder*="Subjective reasoning"]');
      await chiefComplaint.fill('Persistent headache and blurred vision for 3 days.');
      
      const diagnosisInput = page.locator('input[name="diagnosis"], [placeholder*="assessment"]');
      await diagnosisInput.fill('Acute migraine with visual aura. Rule out hypertension.');
      
      const clinicalNotes = page.locator('textarea[name="notes"], [placeholder*="Advice given"]');
      await clinicalNotes.fill('Prescribed analgesics and dark room rest. Follow up if visual symptoms persist.');

      // Commit Assessment
      const commitBtn = page.locator('button[type="submit"]').filter({ hasText: /Commit|Save|Submit/i }).first();
      await commitBtn.click();
      
      console.log('✅ Consultation completed.');
    });

    // 4. BILLING - INVOICING
    await test.step('Billing: Revenue Generation', async () => {
      // --- Billing Interaction ---
      console.log('--- Billing: Revenue Generation ---');
      await page.locator('aside button, .page-shell-premium button').filter({ hasText: /Billing|Account|Cashier/i }).first().click();
      await page.waitForLoadState('load');

      // Click "New Statement" tab to open invoice form
      const newStatementBtn = page.locator('button').filter({ hasText: /New Statement|Generate Invoice|New Bill/i }).first();
      await newStatementBtn.click();

      // Search and Select Patient in the Billing Search component
      const billSearch = page.locator('input[placeholder*="Search by Name"], input[placeholder*="MRN"]').first();
      await billSearch.waitFor({ state: 'visible', timeout: 10000 });
      
      // Wait for the specific search API response to ensure results are loaded
      const searchPromise = page.waitForResponse(
        r => r.url().includes('/patients/search') && r.status() === 200,
        { timeout: 15000 }
      ).catch(() => null);
      
      await billSearch.fill(patientLastName);
      await searchPromise;
      
      // Wait for result dropdown to appear and be visible
      const billResult = page.locator('[data-testid="search-result"]').filter({ hasText: patientLastName }).first();
      await billResult.waitFor({ state: 'visible', timeout: 10000 });
      await billResult.click();

      // Fill Invoice Details
      await page.locator('input[name="description"]').fill('Standard Consultation & Diagnostic Protocol');
      await page.locator('input[name="amount"]').fill('2500');
      
      // Finalize
      const finalizeBtn = page.locator('button').filter({ hasText: /FINALISE & AUTHORISE/i });
      await finalizeBtn.click();

      console.log('✅ Billing completed.');
    });

  });
});
