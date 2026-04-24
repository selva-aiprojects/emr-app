import { test, expect } from '@playwright/test';

test.describe('Institutional Branding Standards Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Phase 00: Authentication is required to access clinical pages
    await page.goto('http://localhost:5175/');
    await page.fill('input[name="email"]', 'admin@nhgl.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.selectOption('select[name="tenantId"]', 'NHGL');
    await page.click('button:has-text("Sign In to Workspace")');
    await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 25000 });
  });

  const checkPageBranding = async (page, pageName) => {
    console.log(`\n--- Validating Branding: ${pageName} ---`);
    
    // 1. Verify Typography Standard (Inter)
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    console.log(`✅ Font Family: ${fontFamily}`);
    expect(fontFamily).toContain('Inter');

    // 2. Verify Background Consistency (--page-bg)
    const bgColor = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return window.getComputedStyle(main).backgroundColor;
    });
    // #EFF5FA in RGB is rgb(239, 245, 250)
    console.log(`✅ Background Color: ${bgColor}`);
    expect(bgColor).toBe('rgb(239, 245, 250)');

    // 3. Verify Premium Component Shards (Check for clinical-card or similar)
    const cardRadius = await page.evaluate(() => {
      const card = document.querySelector('.clinical-card') || document.querySelector('.bg-white.rounded-xl');
      return card ? window.getComputedStyle(card).borderRadius : 'N/A';
    });
    console.log(`✅ Component Curvature: ${cardRadius}`);
    if (cardRadius !== 'N/A') {
      // 16px is rounded-xl, 32px is radius-xl
      const radiusValue = parseInt(cardRadius);
      expect(radiusValue).toBeGreaterThanOrEqual(12); // Minimum professional curvature
    }
  };

  test('Standardization Check: Dashboard Page', async ({ page }) => {
    await page.click('[data-testid="nav-dashboard"]');
    await checkPageBranding(page, 'Dashboard');
  });

  test('Standardization Check: Provider Discovery Page', async ({ page }) => {
    await page.click('[data-testid="nav-find_doctor"]');
    await expect(page.locator('h1:has-text("Find a Doctor")')).toBeVisible();
    await checkPageBranding(page, 'Find Doctor');
  });

  test('Standardization Check: Bed Management Page', async ({ page }) => {
    await page.click('[data-testid="nav-bed_management"]');
    await expect(page.locator('text=/Bed Status/i').first()).toBeVisible();
    await checkPageBranding(page, 'Bed Management');
  });

});
