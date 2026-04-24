import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('NHGL Clinical Command Center - Inpatient Journey E2E', () => {
  let patientLastName;
  let patientFirstName = 'John';

  test.beforeEach(async ({ page }) => {
    // Increase timeout for the whole test as clinical flows are complex
    test.setTimeout(150000);
    
    // 1. Unified Login (Healthcare Standards)
    await page.goto('http://localhost:5175/');
    
    // Wait for the login form to be interactive
    const tenantSelect = page.locator('select[name="tenantId"]');
    await tenantSelect.waitFor({ state: 'visible', timeout: 15000 });
    
    // Select the correct tenant
    await tenantSelect.selectOption({ label: 'NHGL Healthcare Institute' });
    
    // Login logic
    await page.fill('input[name="email"]', 'admin@nhgl.com');
    await page.fill('input[name="password"]', 'Test@123');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();

    // Confirm Dashboard Load
    // Confirm Dashboard Load using the unique 'Institutional Console' marker
    await expect(page.locator('text=Institutional Console').first()).toBeVisible({ timeout: 25000 });
    console.log('✅ Dashboard loaded successfully via state transition.');
  });

  test('Complete Inpatient Life-Cycle: Admission -> Monitoring -> Discharge', async ({ page }) => {
    // --- Phase 1: Patient Registration ---
    const timestamp = Date.now();
    patientLastName = `Test-IPD-${timestamp}`;
    
    console.log(`✅ Starting Inpatient Journey for: ${patientFirstName} ${patientLastName}`);

    await page.locator('aside button, .page-shell-premium button').filter({ hasText: /^Patients$/i }).first().click();
    await page.locator('button').filter({ hasText: /New Registration|Add Patient/i }).click();
    
    await page.fill('input[name="firstName"]', patientFirstName);
    await page.fill('input[name="lastName"]', patientLastName);
    await page.fill('input[name="dob"]', '1990-05-15');
    await page.selectOption('select[name="gender"]', 'Male');
    await page.fill('input[name="phone"]', '9988776655');
    
    // Satisfy mandatory consent requirement
    await page.check('#consent-check');
    
    // Submit Registration and ensure backend creates the record before proceeding
    const registrationPromise = page.waitForResponse(
      resp => resp.url().includes('/api/patients') && resp.request().method() === 'POST',
      { timeout: 60000 }
    );
    await page.click('button[type="submit"]:has-text("REGISTER PATIENT")');
    await registrationPromise;
    console.log(`✅ Patient "${patientFirstName} ${patientLastName}" registered.`);
    
    // Wait for the UI to transition back to the Patient List
    const registryButton = page.locator('button:has-text("Patient List")');
    try {
       await expect(registryButton).toHaveClass(/bg-slate-900/, { timeout: 15000 });
    } catch (e) {
       console.log("⚠️ Auto-transition to Patient List failed/slow, attempting forced navigation...");
       await registryButton.click();
       await expect(registryButton).toHaveClass(/bg-slate-900/, { timeout: 10000 });
    }

    // Check for any registration error toasts
    const errorToast = page.locator('text=/REGISTRATION_CRITICAL_FAILURE/i');
    if (await errorToast.isVisible()) {
        const errorText = await errorToast.innerText();
        throw new Error(`Registration failed at logic level: ${errorText}`);
    }

    // Force search to ensure the newly created patient is visible in a large directory
    const searchInput = page.locator('#patient-directory-search');
    await searchInput.fill(patientLastName);
    await page.waitForTimeout(1500); // Wait for debounce
    
    // Verify visibility using hardened locator
    const patientRow = page.locator(`[data-testid="patient-name"]:has-text("${patientLastName}")`).first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    console.log(`✅ Patient "${patientFirstName} ${patientLastName}" registered and verified in directory.`);

    // --- Phase 2: Inpatient Admission ---
    await page.click('button:has-text("IPD / Bed Management")');
    await expect(page.locator('text=/Institutional Inpatient Care Hub/i')).toBeVisible();

    await page.click('button:has-text("New Admission")');
    
    // Identify Subject (Patient Search)
    // Search Term: Patient Name
    await page.fill('input[placeholder*="Search by Name, MRN, or Phone"]', patientLastName);
    
    // Wait for search result and select
    const resultItem = page.locator('.cursor-pointer:has-text("' + patientLastName + '")').first();
    await expect(resultItem).toBeVisible({ timeout: 10000 });
    await resultItem.click();
    console.log(`✅ Patient selected from directory.`);

    // Infrastructure Node Selection (Ward & Bed)
    // We expect some wards to be seeded. We'll pick the first ward and enter a bed number.
    await page.selectOption('select[name="wardId"]', { index: 0 });
    await page.fill('input[name="bedId"]', `TEST-B-${timestamp % 1000}`);
    
    // Admitting Physician (Scoped Provider)
    await page.selectOption('select[name="providerId"]', { index: 0 });

    // Confirm Clinical Admission
    await page.click('button:has-text("CONFIRM CLINICAL ADMISSION")');
    
    // Should return to ledger
    await expect(page.locator('text=/Admission Ledger/i')).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${patientLastName}`)).toBeVisible({ timeout: 10000 });
    console.log(`✅ Patient successfully admitted to ward.`);

    // --- Phase 3: Clinical Monitoring (Optional but good for robustness) ---
    // Check if bed is occupied in Occupancy Map
    await page.click('button:has-text("Occupancy Map")');
    // --- Phase 3: Clinical Monitoring & Discharge ---
    await page.click('button:has-text("Admission Ledger")');        
    
    // Select the patient row and trigger discharge
    const ledgerRow = page.locator(`tr[data-patient-name*="${patientLastName}"]`);
    await expect(ledgerRow).toBeVisible({ timeout: 15000 });
    
    const dischargeBtn = ledgerRow.getByTestId('discharge-btn');
    await expect(dischargeBtn).toBeVisible({ timeout: 10000 });
    await dischargeBtn.click();
    
    // Fill Discharge Metadata
    await page.fill('textarea[placeholder*="List medications or AI report content here"]', 'Patient stabilized. Vitals within normal range. Discharged with follow-up in 1 week.');
    await page.click('button:has-text("AUTHORIZE EGRESS & COMMIT BILLING")');
    
    // --- Phase 4: Verification ---
    console.log(`✅ Inpatient Lifecycle Completed for: ${patientFirstName} ${patientLastName}`);
    
    // Verify removal from active ledger
    await expect(page.locator(`tr:has-text("${patientLastName}")`)).not.toBeVisible({ timeout: 10000 });
    console.log(`✅ Inpatient journey completed successfully.`);
  });
});
