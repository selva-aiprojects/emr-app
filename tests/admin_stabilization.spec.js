import { test, expect } from '@playwright/test';

/**
 * EMR Administrative Infrastructure Stabilization Suite
 * Standardized for the "Small & Sleek" monochromatic identity.
 */

test.setTimeout(120000); // 2 minute timeout for thorough high-density validation

test.describe('EMR Administrative Infrastructure Stabilization - E2E Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log(`[BOOT] Authenticating for Administrative Audit...`);
    await page.goto('http://localhost:5175/');
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.fill('input[type="email"]', 'admin@nhgl.com');        
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('button:has-text("Sign In to Workspace")');     
    
    // Multi-browser wait for the dashboard shard to hydrate
    await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 45000 });
    console.log('✅ Authentication successful.');
  });

  test('Module: Institutional Branding & Theme Persistence', async ({ page }) => {
    console.log(`\n--- Branding Integrity Test ---`);
    await page.click('[data-testid="nav-hospital_settings"]');
    
    await page.waitForSelector('input[label="Primary Brand Color"]', { timeout: 20000 });
    const primaryColorInput = page.locator('input[label="Primary Brand Color"]');
    const newColor = '#1e293b'; // Slate 800
    
    await primaryColorInput.fill(newColor);
    await page.click('button:has-text("Update Institutional Identity")');
    
    await expect(page.locator('body')).toContainText('updated successfully');
    
    // Deep Audit: Verify CSS Variable Injection
    const rootStyle = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--clinical-primary').trim();
    });
    
    console.log(`✅ Institutional Theme Sync: Expected ${newColor}, Found ${rootStyle}`);
    expect(rootStyle.toLowerCase()).toBe(newColor);
  });

  test('Module: Staff Governance & Workforce Shard', async ({ page }) => {
    console.log(`\n--- Personnel Governance Test ---`);
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
  });

  test('Module: Payroll & Statutory Hub', async ({ page }) => {
    console.log(`\n--- Payroll Institutional Test ---`);
    await page.click('[data-testid="nav-payroll_service"]');
    
    await expect(page.locator('text=/Payroll & Statutory Hub/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test Fiscal Year Shard Switching
    await page.selectOption('select', '2025-2026');
    await expect(page.locator('text=/So far in 2025-2026/i')).toBeVisible();
    
    // Verify Monthly Registry Access
    await page.click('button:has-text("Payroll Ledger")');
    await expect(page.locator('text=/Monthly Disbursement Registry/i')).toBeVisible();
    await expect(page.locator('text=/Net Payout/i')).toBeVisible();
    console.log('✅ Payroll & Statutory shards validated.');
  });

  test('Module: Institutional Ledger & Governance', async ({ page }) => {
    console.log(`\n--- Governance Ledger Test ---`);
    await page.click('[data-testid="nav-financial_ledger"]');
    
    await expect(page.locator('text=/Institutional Ledger & Governance/i').first()).toBeVisible({ timeout: 20000 });
    
    // Test P&L Fragment Sync
    await expect(page.locator('text=/Profit & Loss/i')).toBeVisible();
    await expect(page.locator('text=/Total Realized Institutional Income/i')).toBeVisible();
    
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
