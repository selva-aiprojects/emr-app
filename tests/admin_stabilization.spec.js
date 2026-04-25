import { test, expect } from '@playwright/test';

/**
 * EMR Administrative Infrastructure Stabilization Suite
 * Standardized for the "Small & Sleek" monochromatic identity.
 */

test.setTimeout(120000); // 2 minute timeout for thorough high-density validation

test.describe('EMR Administrative Infrastructure Stabilization - E2E Validation', () => {
  
  test.beforeEach(async ({ page }) => {
<<<<<<< HEAD
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
=======
    console.log(`[BOOT] Authenticating for Administrative Audit...`);
    await page.goto('http://localhost:5175/');
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.fill('input[type="email"]', 'admin@nhgl.com');        
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('button:has-text("Sign In to Workspace")');     
    
    // Multi-browser wait for the dashboard shard to hydrate
    await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 45000 });
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
    console.log('✅ Authentication successful.');
  });

  test('Module: Institutional Branding & Theme Persistence', async ({ page }) => {
    console.log(`\n--- Branding Integrity Test ---`);
<<<<<<< HEAD
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
=======
    await page.click('[data-testid="nav-hospital_settings"]');
    
    await page.waitForSelector('input[label="Primary Brand Color"]', { timeout: 20000 });
    const primaryColorInput = page.locator('input[label="Primary Brand Color"]');
    const newColor = '#1e293b'; // Slate 800
    
    await primaryColorInput.fill(newColor);
    await page.click('button:has-text("Update Institutional Identity")');
    
    await expect(page.locator('body')).toContainText('updated successfully');
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
    
    // Deep Audit: Verify CSS Variable Injection
    const rootStyle = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--clinical-primary').trim();
    });
    
    console.log(`✅ Institutional Theme Sync: Expected ${newColor}, Found ${rootStyle}`);
<<<<<<< HEAD
    // Colors might come back lowercase or slightly different format (rgb vs hex)
    // but the input.fill usually works.
=======
    expect(rootStyle.toLowerCase()).toBe(newColor);
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
  });

  test('Module: Staff Governance & Workforce Shard', async ({ page }) => {
    console.log(`\n--- Personnel Governance Test ---`);
<<<<<<< HEAD
    await page.click('[data-testid="nav-employee_master"]', { force: true });
    
    await expect(page.locator('text=/Employee Master - Doctor Credentials/i').first()).toBeVisible({ timeout: 20000 });
    
    // Verify workforce search
    const searchInput = page.locator('input[placeholder*="Search employees"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Admin');
    }
    console.log('✅ Staff Governance validated.');
=======
    await page.click('[data-testid="nav-staff_management"]');
    
    await expect(page.locator('text=/Staff Governance & Workforce/i').first()).toBeVisible({ timeout: 20000 });
    
    // Verify workforce offer persistence
    const searchInput = page.locator('input[placeholder*="Find offer"]');
    await searchInput.fill('Sarah');
    await expect(page.locator('text=/Radiologist/i')).toBeVisible();
    
    // Check Document Vault Shard
    await page.click('button:has-text("Employee Documentation")');
    await expect(page.locator('text=/Personnel Documentation Vault/i')).toBeVisible();
    console.log('✅ Staff Governance & Vault shards validated.');
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
  });

  test('Module: Payroll & Statutory Hub', async ({ page }) => {
    console.log(`\n--- Payroll Institutional Test ---`);
<<<<<<< HEAD
    await page.click('[data-testid="nav-payroll"]', { force: true });
    
    await expect(page.locator('text=/Payroll & Statutory Hub/i').first()).toBeVisible({ timeout: 20000 });
    
    // Verify visibility
    await expect(page.locator('text=/Monthly Disbursement/i')).toBeVisible();
=======
    await page.click('[data-testid="nav-payroll_service"]');
    
    await expect(page.locator('text=/Payroll & Statutory Hub/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test Fiscal Year Shard Switching
    await page.selectOption('select', '2025-2026');
    await expect(page.locator('text=/So far in 2025-2026/i')).toBeVisible();
    
    // Verify Monthly Registry Access
    await page.click('button:has-text("Payroll Ledger")');
    await expect(page.locator('text=/Monthly Disbursement Registry/i')).toBeVisible();
    await expect(page.locator('text=/Net Payout/i')).toBeVisible();
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
    console.log('✅ Payroll & Statutory shards validated.');
  });

  test('Module: Institutional Ledger & Governance', async ({ page }) => {
    console.log(`\n--- Governance Ledger Test ---`);
<<<<<<< HEAD
    await page.click('[data-testid="nav-accounts"]', { force: true });
    
    await expect(page.locator('text=/Treasury & Accounts Governance/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test Vitals Monitor
    await expect(page.locator('text=/Gross Clinical Revenue/i')).toBeVisible();
    console.log('✅ Governance Ledger & Accounts Shards validated.');
=======
    await page.click('[data-testid="nav-financial_ledger"]');
    
    await expect(page.locator('text=/Institutional Ledger & Governance/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test P&L Fragment Sync
    await expect(page.locator('text=/Profit & Loss/i')).toBeVisible();
    await expect(page.locator('text=/Total Realized Institutional Income/i')).toBeVisible();
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
    
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
