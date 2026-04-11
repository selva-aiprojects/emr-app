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

test.describe('NHGL Institutional Lifecycle', () => {
  
  test('Complete Clinical Journey Registration Encounter Discharge', async ({ page }) => {
    // 1. Authentication
    console.log(`\n--- Phase 00: Authentication ---`);
    await page.goto('http://localhost:5175/');
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.fill('input[name="email"]', 'admin@nhgl.com');        
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button:has-text("Sign In to Workspace")');     
    
    await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 25000 });
    console.log('✅ Authentication successful.');

    // 2. Patient Registration
    console.log(`\n--- Phase 01: Patient Registration ---`);
    await page.click('[data-testid="nav-patients"]');
    await page.click('button:has-text("New Registration")');
    
    await page.fill('input[name="firstName"]', TEST_PATIENT.firstName);
    await page.fill('input[name="lastName"]', TEST_PATIENT.lastName);
    await page.fill('input[name="dob"]', TEST_PATIENT.dob);
    await page.selectOption('select[name="gender"]', TEST_PATIENT.gender);
    await page.fill('input[name="phone"]', TEST_PATIENT.phone);
    await page.fill('input[name="email"]', TEST_PATIENT.email);
    await page.check('input[name="consent"]');
    
    await page.click('button:has-text("REGISTER PATIENT")');
    await expect(page.locator(`text=${TEST_PATIENT.lastName}`)).toBeVisible({ timeout: 15000 });
    console.log(`✅ Patient registered.`);

    // 2.5 Find a Doctor & Availability (Consolidated Workflow)
    console.log(`\n--- Phase 01.5: Provider Discovery ---`);
    await page.click('[data-testid="nav-find_doctor"]');
    await expect(page.locator('h1:has-text("Find a Doctor")')).toBeVisible();

    // 2.7 Inpatient Admission & Bed Allocation 
    console.log(`\n--- Phase 01.7: Inpatient Bed Allocation ---`);
    await page.click('[data-testid="nav-inpatient"]');
    await page.click('button:has-text("New Admission")');
    
    // Patient Search in Admission context
    const admissionSearch = page.locator('input[placeholder*="Search by Name, MRN, or Phone"]');
    await admissionSearch.fill(TEST_PATIENT.lastName);
    await page.click(`text=${TEST_PATIENT.lastName}`);
    
    // Bed Allocation Protocol (Searchable & Available Only)
    // Fixed: specify the h3 to avoid strict mode collision with labels
    await expect(page.locator('h3:has-text("Bed Allocation Protocol")')).toBeVisible();
    const bedSearch = page.locator('input[placeholder*="Search bed number"]');
    await bedSearch.fill('101'); // Search for a specific available node
    
    await page.selectOption('select[name="wardId"]', { index: 0 });
    await page.click('button:has-text("Confirm Admission")');
    console.log('✅ Inpatient Admission & Bed Allocation complete.');

    // 3. Clinical Encounter (EMR)
    console.log(`\n--- Phase 02: Clinical Encounter (EMR) ---`);
    await page.click('[data-testid="nav-emr"]');
    await page.click('button:has-text("New Assessment")');
    
    const emrSearchInput = page.locator('input[placeholder*="Search by Name, MRN, or Phone"]');
    await emrSearchInput.focus();
    await emrSearchInput.click();
    await page.keyboard.type(TEST_PATIENT.lastName, { delay: 100 });
    
    const emrResultItem = page.locator('div[data-testid="search-result"]', { hasText: TEST_PATIENT.lastName }).first();
    await expect(emrResultItem).toBeVisible({ timeout: 15000 });
    await emrResultItem.click();
    
    await page.waitForTimeout(2000); // Stabilization for clinical context shard

    await page.fill('input[name="bp"]', '120/80');
    await page.fill('input[name="hr"]', '72');
    await page.fill('[name="complaint"]', 'Institutional Lifecycle Validation');
    await page.fill('[name="diagnosis"]', 'E2E Stability Verified');
    
    // Add Lab Investigation
    await page.selectOption('select:has-text("Select investigation...")', 'Complete Blood Count');
    
    // Add Medication
    await page.fill('input[placeholder*="Search drug catalog"]', 'Amoxicillin');
    await page.waitForSelector('text=Amoxicillin', { timeout: 10000 });
    await page.click('text=Amoxicillin');
    
    await page.click('button[type="submit"]:has-text("Commit")');
    console.log('✅ Clinical Encounter committed.');

    // 4. Pharmacy Fulfillment (Medicine & Store)
    console.log(`\n--- Phase 03: Medicine & Store Fulfillment ---`);
    await page.click('[data-testid="nav-pharmacy"]');
    await page.click('[data-testid="tab-queue"]');
    
    const pharmacyRow = page.locator('tr').filter({ hasText: TEST_PATIENT.lastName }).first();
    await pharmacyRow.waitFor({ state: 'visible', timeout: 15000 });
    await pharmacyRow.locator('button:has-text("Release Node")').click();
    await page.click('button:has-text("Authorize Release")');
    console.log('✅ Pharmacy fulfillment complete.');

    // 5. Laboratory Shard (Lab & Test Reports)
    console.log(`\n--- Phase 04: Lab Diagnostics Shard ---`);
    await page.click('[data-testid="nav-lab"]');
    await page.click('button:has-text("Clinical Orders Queue")');
    
    const labRow = page.locator('tr').filter({ hasText: TEST_PATIENT.lastName }).first();
    await labRow.waitFor({ state: 'visible' });
    await labRow.locator('button:has-text("Record Observation")').click();
    
    // Verify visibility of Clinical Shards in the results modal
    await expect(page.locator('text=/Clinical Shard/i').first()).toBeVisible();
    await expect(page.locator('text=/Recent Patient Record/i')).toBeVisible();

    await page.fill('input[name="resultValue"]', '14.5');
    await page.click('button:has-text("Authorize & Commit Outcome")');
    console.log('✅ Lab diagnostic outcome authorized.');

    // 6. Institutional Billing (Bills & Payments)
    console.log(`\n--- Phase 05: Institutional Billing ---`);
    await page.click('[data-testid="nav-billing"]');
    await page.waitForTimeout(2000); 
    
    const billingRows = page.locator('tr[data-testid="invoice-row"]');
    if (await billingRows.count() > 0) {
        await billingRows.first().locator('button:has-text("PayLink")').click();
        await page.click('button:has-text("Commit Settlement Shard")');
        console.log('✅ Billing settlement finalized.');
    }

    console.log(`\n--- Full Clinical Lifecycle Complete for ${TEST_PATIENT.lastName} ---`);
  });
});
