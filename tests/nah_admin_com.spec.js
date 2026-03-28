import { test, expect } from '@playwright/test';

test.describe('NAH Admin Login Verification', () => {
  const NAH_TENANT = 'New Age Hospital';
  const EMAIL = 'admin@nah.com';
  const PASSWORD = 'Admin@123';

  test('should login as admin and see the dashboard on RENDER', async ({ page }) => {
    // Navigate to RENDER server
    await page.goto('https://emr-app-l02m.onrender.com');

    // Wait for the login form (Wait 1 min for Render wake up)
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 60000 });
    
    // Select the tenant
    await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });

    // Fill credentials
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type=\"password\"]').fill(PASSWORD);

    // Click Login
    await page.getByRole('button', { name: /Sign In|Continue|Login/i }).click();

    // Verify we stayed on the page (no forced reloads to login)
    // and that the dashboard content is visible
    await page.waitForTimeout(5000); // Wait for potential bootstrap
    
    const bodyText = await page.locator('body').innerText();
    
    // Diagnostic check
    console.log('Page URL after login:', page.url());
    console.log('Page inner text (first 500 chars):', bodyText.substring(0, 500));

    // Verify dashboard elements (adjust these to your real dashboard layout)
    const indicators = ['Patients', 'Appointments', 'Invoices', 'Dashboard', 'Sign Out'];
    let foundCount = 0;
    for (const indicator of indicators) {
      if (bodyText.includes(indicator)) {
        foundCount++;
        console.log(`✅ Found dashboard indicator: ${indicator}`);
      }
    }

    expect(foundCount).toBeGreaterThanOrEqual(1); // At least some dashboard content
  });
});
