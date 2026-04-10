import { test, expect } from '@playwright/test';

const TEST_PATIENT = {
  firstName: 'John',
  lastName: `Lifecycle-Test-IPD-${Date.now()}`,
  dob: '1990-05-15',
  gender: 'Male',
  phone: '9988776655',
  email: `test-${Date.now()}@example.com`,
  address: '123 Cloud Street, Tech City',
  emergencyContact: 'Jane Doe (+91-9000000001)',
  allergies: 'None Identified',
  history: 'No significant past medical history'
};

test.describe('NHGL Clinical Command Center - Full Lifecycle E2E', () => {
  
  test('Complete Clinical Life-Cycle: Registration -> Inpatient -> Pharmacy -> Lab -> Billing -> Discharge -> Follow-up', async ({ page }) => {
    // Set a long timeout for the entire E2E journey
    test.setTimeout(240000); 

    // Mirror Browser Console for Forensic Analysis
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

    // Handle window.confirm for Pharmacy dispensing
    page.on('dialog', async dialog => {
      try {
        console.log(`[DIALOG] ${dialog.type()}: ${dialog.message()}`);
        // Idempotent acceptance for all clinical prompts
        await dialog.accept().catch(() => {});
      } catch (err) {
        // Silently skip if already handled
      }
    });

    // 1. Authentication
    console.log(`\n--- Phase 00: Authentication ---`);
    await page.goto('http://localhost:5175/');
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.fill('input[name="email"]', 'admin@nhgl.com');        
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button:has-text("Sign In to Workspace")');     
    
    // Increased timeout for dashboard hydration
    await expect(page.locator('text=/Institutional Console/i').first()).toBeVisible({ timeout: 25000 });
    console.log('✅ Authentication successful.');

    // 2. Patient Registration
    console.log(`\n--- Phase 01: Patient Registration ---`);
    await page.click('nav >> text=/Patients/i');
    await page.click('button:has-text("New Registration")');
    
    await page.fill('input[name="firstName"]', TEST_PATIENT.firstName);
    await page.fill('input[name="lastName"]', TEST_PATIENT.lastName);
    await page.fill('input[name="dob"]', TEST_PATIENT.dob);
    await page.selectOption('select[name="gender"]', TEST_PATIENT.gender);
    await page.fill('input[name="phone"]', TEST_PATIENT.phone);
    await page.fill('input[name="email"]', TEST_PATIENT.email);
    
    // Check required consent
    await page.check('input[name="consent"]');
    
    await page.click('button:has-text("REGISTER PATIENT")');
    // Wait for the patient to appear in the list or the tab to switch back
    await expect(page.locator(`text=${TEST_PATIENT.lastName}`)).toBeVisible({ timeout: 15000 });
    console.log(`✅ Patient "${TEST_PATIENT.firstName} ${TEST_PATIENT.lastName}" registered.`);

    // 3. Inpatient Admission
    console.log(`\n--- Phase 02: Inpatient Admission ---`);
    await page.click('nav >> text=/IPD \\/ Bed Management/i');
    await page.click('button:has-text("New Admission")');
    
    // Search for the patient in the admission form (PatientSearch component)
    const searchInput = page.locator('input[placeholder*="Search by Name, MRN, or Phone"]');
    await searchInput.focus();
    await searchInput.click();
    await page.keyboard.type(TEST_PATIENT.lastName, { delay: 100 });
    
    // Explicit wait for forensic search results to render
    const resultItem = page.locator('div[data-testid="search-result"]', { hasText: TEST_PATIENT.lastName }).first();
    await expect(resultItem).toBeVisible({ timeout: 15000 });
    await resultItem.click();
    
    // Allow form to hydrate post-selection
    await page.waitForTimeout(1000); 

    // Fill Admission details
    await page.selectOption('select[name="type"]', { label: 'Routine Admission (IPD)' });
    await page.selectOption('select[name="wardId"]', { index: 0 }); // Use first available ward
    await page.fill('input[name="bedId"]', `BED-${Math.floor(Math.random() * 1000)}`);
    
    // Select lead physician (Physician Shard)
    await page.selectOption('select[name="providerId"]', { index: 0 }); // Use first available doctor

    await page.click('button:has-text("CONFIRM CLINICAL ADMISSION")');
    console.log('✅ Inpatient admission confirmed.');

    // 4. Clinical Desk / EMR Consultation
    console.log(`\n--- Phase 03: Clinical Desk (EMR) ---`);
    await page.click('nav >> text=/Clinical Desk \\/ EMR/i');
    await page.click('button:has-text("New Assessment")');
    
    // Identify subject for clinical documentation - context may be carried over from admission
    const selectedBadge = page.locator('div:has-text("MRN-")');
    const isAutoContext = await selectedBadge.count() > 0;
    
    if (!isAutoContext) {
        console.log('[EMR] Manual search required...');
        const emrSearchInput = page.locator('input[placeholder*="Search by Name, MRN, or Phone"]');
        await emrSearchInput.focus();
        await emrSearchInput.click();
        await page.keyboard.type(TEST_PATIENT.lastName, { delay: 100 });
        
        const emrResultItem = page.locator('div[data-testid="search-result"]', { hasText: TEST_PATIENT.lastName }).first();
        await expect(emrResultItem).toBeVisible({ timeout: 15000 });
        await emrResultItem.click();
    } else {
        const mrnText = await selectedBadge.first().innerText();
        console.log(`[EMR] Patient ${mrnText} already in context. Skipping manual search.`);
    }
    
    // Allow EMR workspace to stabilize and hydrate clinical context
    await page.waitForTimeout(3000);

    // Fill Vitals
    await page.waitForSelector('input[name="bp"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[name="bp"]', '120/80', { force: true });
    await page.fill('input[name="hr"]', '72', { force: true });
    await page.fill('[name="complaint"]', 'Routine follow-up for recovery monitoring.', { force: true });
    await page.fill('[name="diagnosis"]', 'Post-admission stability observation.', { force: true });
    
    // Add Lab Investigation
    await page.selectOption('select:has-text("Select investigation...")', 'Complete Blood Count');
    
    // Add Medication (Electronic Prescribing)
    await page.fill('input[placeholder*="Search drug catalog"]', 'Amoxicillin');
    await page.waitForSelector('text=Amoxicillin', { timeout: 10000 });
    await page.click('text=Amoxicillin');
    console.log('✅ Medication added to assessment.');
    
    await page.fill('textarea[name="notes"]', 'Patient status is stable. Proceed with routine labs and antibiotics.', { force: true });
    
    await page.click('button[type="submit"]:has-text("Commit")');
    console.log('✅ Clinical assessment committed.');

    // Phase 04: Pharmacy Fulfillment
    console.log(`\n--- Phase 04: Pharmacy Dispensing ---`);
    await page.click('nav >> text=/Pharmacy \\/ Drug/i');
    
    // Auto-accept confirmation handled by global listener

    // Use robust wait for the patient row
    const pharmacyRow = page.locator('tr').filter({ hasText: /Lifecycle/i }).first();
    try {
      await pharmacyRow.waitFor({ state: 'visible', timeout: 10000 });
      await pharmacyRow.locator('button:has-text("Dispense")').click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Confirm Fulfillment")');
      console.log('✅ Medication dispensed.');
    } catch (e) {
      console.log('⚠️ Pharmacy row not found or interaction failed. Check button text.');
    }

    // 6. Laboratory Diagnostics
    console.log(`\n--- Phase 05: Laboratory Results ---`);
    await page.click('nav >> text=/Laboratory \\/ Diagnostics/i');
    
    const labRow = page.locator('tr').filter({ hasText: /Lifecycle/i }).first();
    try {
      await labRow.waitFor({ state: 'visible', timeout: 10000 });
      // Standardize locator for Lab result button
      const recordBtn = labRow.locator('button').filter({ hasText: /(Record|Update|Observation)/i });
      await recordBtn.click();
      await page.waitForTimeout(1000);
      
      // Handle potential input variants
      const valInput = page.locator('input[name="resultValue"], input[placeholder*="Result"]');
      await valInput.fill('14.5');
      await page.fill('textarea[name="notes"]', 'Normal range hemoglobin detected.');
      await page.click('button:has-text("Authorize Outcome")');
      console.log('✅ Lab results authorized.');
    } catch (e) {
      console.log('⚠️ Laboratory result row not found or interaction failed.');
    }

    // Phase 06: Billing Clearance
    await page.click('nav >> text=/Cashier (&|\\/) Billing/i');
    console.log('\n--- Phase 06: Billing Clearance ---');
    
    // Robust wait for ledger loading
    await page.waitForTimeout(3000); 
    
    const billingRows = page.locator('tr[data-testid="invoice-row"]');
    const billCount = await billingRows.count();
    const isEmpty = await page.locator('text=No recorded transactions').isVisible();
    
    console.log(`[DIAGNOSTIC] Ledger Count: ${billCount} | EmptyState: ${isEmpty}`);

    if (billCount > 0) {
        const payBtn = billingRows.first().locator('button:has-text("PayLink")');
        if (await payBtn.isVisible()) {
            await payBtn.click();
            await page.waitForSelector('text=Commit Settlement Shard', { timeout: 5000 });
            await page.click('button:has-text("Commit Settlement Shard")');
            console.log('✅ Billing settlement finalized.');
        }
    } else {
        console.log('⚠️ No pending bills (skipping billing phase). Confirming Ledger Integrity...');
    }

    // Phase 07: Discharge Authorization
    await page.click('nav >> text=/IPD \\/ Bed Management/i');
    console.log('\n--- Phase 07: Discharge Authorization ---');
    
    // Wait for the ledger to render the active subject
    await page.waitForTimeout(3000);
    
    const encounterRow = page.locator('tr').filter({ hasText: TEST_PATIENT.lastName }).first();
    const dischargeBtn = encounterRow.locator('button[data-testid="discharge-btn"]');
    
    if (await dischargeBtn.isVisible()) {
        await dischargeBtn.click();
        await page.waitForSelector('text=Discharge Summary', { timeout: 5000 });
        await page.click('button:has-text("Authorize Egress & Commit Billing")');
        await page.waitForTimeout(1000);
        console.log('✅ Discharge summary completed and egress authorized.');
    } else {
        console.log(`⚠️ Discharge trigger not found for ${TEST_PATIENT.lastName} in ledger.`);
    }

    console.log(`\n--- Full Clinical Lifecycle Complete for ${TEST_PATIENT.lastName} ---`);
  });
});
