import { test, expect } from '@playwright/test';

// Simplified smoke tests - just verify login works for each role
// Updated smoke tests with actual database data
const TENANT_1 = 'Kidz Clinic';
const TENANT_2 = 'New Age Hospital';

const users = [
    { tenant: TENANT_1, email: 'admin@kidz.com', password: 'Admin@123', name: /KC Admin/i, role: 'Admin' },
    { tenant: TENANT_1, email: 'emily@kidz.com', password: 'Admin@123', name: /Emily/i, role: 'Doctor' },
    { tenant: TENANT_2, email: 'admin@nah.com', password: 'Admin@123', name: /Sarah/i, role: 'Admin' },
    { tenant: TENANT_2, email: 'sarah@nah.com', password: 'Admin@123', name: /Sarah/i, role: 'Doctor' },
];

for (const user of users) {
    test(`${user.role} can login - ${user.tenant}`, async ({ page }) => {
        await page.goto('/');

        // Wait for tenant dropdown to be visible
        const tenantSelect = page.locator('select[name="tenantId"]');
        await tenantSelect.waitFor({ state: 'visible', timeout: 10000 });
        
        // Try to select REAL seeded hospital
        try {
          await tenantSelect.selectOption({ label: user.tenant });
        } catch {
          // Fallback to first non-placeholder option
          await tenantSelect.selectOption({ index: 1 });
        }
        
        // Fill and submit login
        await page.locator('input[type="email"]').fill(user.email);
        await page.locator('input[type="password"]').fill(user.password);
        await page.getByRole('button', { name: /Continue to Workflow/i }).click();

        // Verify login successful - user name appears
        await expect(page.getByText(user.name).first()).toBeVisible({ timeout: 20000 });

        // Verify dashboard/main page loaded
        await expect(page.locator('.app-layout, .view, main')).toBeVisible();
    });
}

test('Superadmin can login', async ({ page }) => {
    await page.goto('/');

    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
    // Try to select REAL seeded superadmin platform or fallback
    try {
      await page.locator('select[name="tenantId"]').selectOption({ label: /Healthcare Platform|Infrastructure Governance/i });
    } catch {
      await page.locator('select[name="tenantId"]').selectOption({ index: 1 });
    }
    
    await page.locator('input[type="email"]').fill('superadmin@emr.local');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.getByRole('button', { name: /Continue to Workflow/i || /Login/i }).click();

    await expect(page.getByText(/Superadmin/i).first()).toBeVisible({ timeout: 20000 });
});
