import { test, expect } from '@playwright/test';

/**
 * Patient Journey Across Tiers (E2E)
 * Validates module visibility and core workflows per subscription level.
 */

test.setTimeout(240000); // 4-minute timeout for environment stability

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5175';
const PASSWORD = 'Test@123';

const TIERS = {
  Free: { tenant: 'MedFlow Demo: Free Tier', admin: 'admin@seedling.local' },
  Basic: { tenant: 'MedFlow Demo: Basic Tier', admin: 'admin@greenvalley.local' },
  Professional: { tenant: 'MedFlow Demo: Pro Tier', admin: 'admin@sunrise.local' },
  Enterprise: { tenant: 'MedFlow Demo: Enterprise Tier', admin: 'admin@apollo.local' }
};

test.describe('Multi-Tier Patient Journey Validation', () => {

  // Helper: Login and ensure landing page loads
  async function login(page, tenantName, email) {
    page.on('console', msg => console.log('BROWSER CONSOLE: ' + msg.type() + ' ' + msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR: ' + error.message));

    console.log(`\n[TEST] Logging in to ${tenantName} as ${email}...`);
    await page.goto('/');
    await page.waitForSelector('select[name="tenantId"]', { timeout: 30000 });
    
    // Wait for list of tenants to be populated
    await page.waitForFunction(() => {
      const select = document.querySelector('select[name="tenantId"]');
      return select && select.options.length >= 4; 
    }, null, { timeout: 60000 });

    await page.selectOption('select[name="tenantId"]', { label: tenantName });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Landing page success indicator
    await page.waitForSelector('.premium-sidebar', { timeout: 150000 });
    // Ensure data is loaded
    await page.waitForLoadState('networkidle');
  }

  test('Free Tier Journey: Registration to Encounter', async ({ page }) => {
    const { tenant, admin } = TIERS.Free;
    await login(page, tenant, admin);

    const sidebar = page.locator('.premium-sidebar');
    await expect(sidebar).toContainText('Patients');
    await expect(sidebar).toContainText('Appointments');
    
    // Navigate to Patients
    await page.click('.premium-sidebar >> text=Patients');
    await expect(page.locator('h1 >> text=Master Clinical Registry')).toBeVisible({ timeout: 15000 });

    // Onboard new patient
    await page.click('button >> text=New Registration');
    await page.fill('input[name="firstName"]', 'TestFree');
    await page.fill('input[name="lastName"]', 'Patient');
    await page.fill('input[name="dob"]', '1990-05-15');
    await page.check('input[name="consent"]');
    await page.click('button >> text=COMMIT TO CLINICAL REGISTRY');

    // Should switch to EMR automatically
    try {
      await expect(page.locator('h1 >> text=EMR Clinical Workspace')).toBeVisible({ timeout: 15000 });
      
      // Negative check: Free tier should NOT see Pharmacy or Assets
      await expect(sidebar).not.toContainText('Pharmacy');
      await expect(sidebar).not.toContainText('Asset Logistics');
      await expect(sidebar).not.toContainText('Inpatient');
    } catch(e) {
      console.log('--- PAGE CONTENT ON ERROR ---');
      console.log(await page.content());
      throw e;
    }
  });

  test('Basic Tier Journey: Nurse Triage & Pharmacy Audit', async ({ page }) => {
    const { tenant, admin } = TIERS.Basic;
    await login(page, tenant, admin);

    const sidebar = page.locator('.premium-sidebar');
    await expect(sidebar).toContainText('Pharmacy');
    await expect(sidebar).toContainText('Asset Logistics');

    // Check Appointments / Triage
    await page.click('.premium-sidebar >> text=Appointments');
    await expect(page.locator('h1 >> text=Scheduling & Resource Node')).toBeVisible({ timeout: 15000 });
    // Seeded patient 'Arun Nair' should be in the encounter ledger
    await expect(page.getByText(/Arun Nair/i).first()).toBeVisible();
    
    // Check Pharmacy
    await page.click('.premium-sidebar >> text=Pharmacy');
    try {
      await expect(page.locator('h1 >> text=Pharmacy Dispatch & Logistics')).toBeVisible({ timeout: 15000 });
      
      // Negative check: Basic tier should NOT see Inpatient or Employees
      await expect(sidebar).not.toContainText('Inpatient');
      await expect(sidebar).not.toContainText('Employees');
    } catch (e) {
      console.log('--- PAGE CONTENT ON ERROR (BASIC) ---');
      console.log(await page.content());
      throw e;
    }
  });

  test('Professional Tier Journey: IPD & Billing Settlement', async ({ page }) => {
    const { tenant, admin } = TIERS.Professional;
    await login(page, tenant, admin);

    const sidebar = page.locator('.premium-sidebar');
    await expect(sidebar).toContainText('Inpatient');
    await expect(sidebar).toContainText('Financial Logistics');

    // Check Inpatient
    await page.click('.premium-sidebar >> text=Inpatient');
    await expect(page.locator('h1 >> text=Institutional Inpatient Care Hub')).toBeVisible({ timeout: 15000 });

    // Check Billing
    await page.click('.premium-sidebar >> text=Financial Logistics');
    await expect(page.locator('h1 >> text=Financial Governance Ledger')).toBeVisible({ timeout: 15000 });

    // Negative check: Professional should NOT see HR/Employees
    await expect(sidebar).not.toContainText('Employees');
  });

  test('Enterprise Tier Journey: Institutional HR & Insurance', async ({ page }) => {
    const { tenant, admin } = TIERS.Enterprise;
    await login(page, tenant, admin);

    const sidebar = page.locator('.premium-sidebar');
    await expect(sidebar).toContainText('Employees');
    await expect(sidebar).toContainText('Insurance Registry');

    // Check Employees
    await page.click('.premium-sidebar >> text=Employees');
    await expect(page.locator('h1 >> text=Human Capital & Workforce Hub')).toBeVisible({ timeout: 15000 });

    // Check Insurance
    await page.click('.premium-sidebar >> text=Insurance Registry');
    await expect(page.locator('h1 >> text=Insurance & Payer Governance')).toBeVisible({ timeout: 15000 });
  });

});
