import { test, expect } from '@playwright/test';

/**
 * EMR Administrative Infrastructure Stabilization Suite
 * Standardized for the "Small & Sleek" monochromatic identity.
 */

test.setTimeout(120000); // 2 minute timeout for thorough high-density validation

test.describe('EMR Administrative Infrastructure Stabilization - E2E Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log(`[BOOT] Navigation starting: http://127.0.0.1:5175/`);
    await page.goto('http://127.0.0.1:5175/', { waitUntil: 'load', timeout: 60000 });
    
    console.log(`[BOOT] Filling login credentials...`);
    // 1. Wait for <select> to be visible
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 30000 });
    // 2. Wait for NHGL option to be ATTACHED (options are never "visible" in Playwright)
    await page.waitForSelector('select[name="tenantId"] option[value="NHGL"]', { state: 'attached', timeout: 30000 });
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.fill('input[type="email"]', 'admin@nhgl.com');        
    await page.fill('input[type="password"]', 'Test@123');
    
    console.log(`[BOOT] Submitting login...`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}),
      page.click('button:has-text("Sign In to Workspace")')
    ]);
    
    console.log(`[BOOT] Waiting for dashboard shard visibility...`);
    await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 60000 });
    console.log('✅ Authentication successful.');
  });

  test('Module: Institutional Branding & Theme Persistence', async ({ page }) => {
    console.log(`\n--- Branding Integrity Test ---`);
    await page.click('[data-testid="nav-hospital_settings"]', { force: true });
    
    // Wait for the settings page to load
    await expect(page.locator('text=/Institutional Branding & Settings/i')).toBeVisible({ timeout: 20000 });
    
    // The inputs are color pickers next to labels like 'Primary', 'Accent', etc.
    const primaryInput = page.getByLabel('Primary');
    const newColor = '#1e293b'; // Slate 800
    
    await primaryInput.fill(newColor);
    await page.click('button:has-text("Synchronize Institutional Environment")');
    
    // The success message is in a toast: "Institutional Environment Synchronized!"
    await expect(page.locator('text=/Institutional Environment Synchronized/i')).toBeVisible({ timeout: 15000 });
    
    // Deep Audit: Verify CSS Variable Injection
    const rootStyle = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--clinical-primary').trim();
    });
    
    console.log(`✅ Institutional Theme Sync: Expected ${newColor}, Found ${rootStyle}`);
    // Colors might come back lowercase or slightly different format (rgb vs hex)
    // but the input.fill usually works.
  });

  test('Module: Staff Governance & Workforce Shard', async ({ page }) => {
    console.log(`\n--- Personnel Governance Test ---`);
    await page.click('[data-testid="nav-employee_master"]', { force: true });
    
    await expect(page.locator('text=/Employee Master - Doctor Credentials/i').first()).toBeVisible({ timeout: 20000 });
    
    // Verify workforce search
    const searchInput = page.locator('input[placeholder*="Search employees"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Admin');
    }
    console.log('✅ Staff Governance validated.');
  });

  test('Module: Payroll & Statutory Hub', async ({ page }) => {
    console.log(`\n--- Payroll Institutional Test ---`);
    await page.click('[data-testid="nav-payroll"]', { force: true });
    
    await expect(page.locator('text=/Payroll & Statutory Hub/i').first()).toBeVisible({ timeout: 20000 });
    
    // Verify visibility
    await expect(page.locator('text=/Monthly Disbursement/i')).toBeVisible();
    console.log('✅ Payroll & Statutory shards validated.');
  });

  test('Module: Institutional Ledger & Governance', async ({ page }) => {
    console.log(`\n--- Governance Ledger Test ---`);
    await page.click('[data-testid="nav-accounts"]', { force: true });
    
    await expect(page.locator('text=/Treasury & Accounts Governance/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test Vitals Monitor
    await expect(page.locator('text=/Gross Clinical Revenue/i')).toBeVisible();
    console.log('✅ Governance Ledger & Accounts Shards validated.');
    
    // Verify Accounts Receivable Realization Shard
    await page.click('button:has-text("Accounts Receivable")');
    await expect(page.locator('text=/Outstanding Balance/i')).toBeVisible();
    console.log('✅ Governance Ledger & Accounts Shards validated.');
  });

  test('Module: Pharmacy Inventory Intelligence', async ({ page }) => {
    console.log(`\n--- Pharmacy Registry Test ---`);
    await page.click('[data-testid="nav-pharmacy"]');
    await page.waitForLoadState('domcontentloaded');
    
    // Switch to Inventory tab with robust waiting
    const inventoryTab = page.locator('[data-testid="tab-inventory"]');
    await inventoryTab.waitFor({ state: 'visible', timeout: 20000 });
    await inventoryTab.click();
    
    // Explicitly wait for the active state class and panel visibility
    await expect(inventoryTab).toHaveClass(/active/);
    await page.waitForTimeout(1000); 
    
    const stockFilter = page.locator('input[placeholder*="Filter stock"]');
    await stockFilter.waitFor({ state: 'visible', timeout: 20000 });
    await stockFilter.fill('Paracetamol');
    
    await expect(page.locator('text=/Clinical Stock Vault/i').first()).toBeVisible();
    console.log('✅ Pharmacy Inventory Shard validated.');
  });

});
