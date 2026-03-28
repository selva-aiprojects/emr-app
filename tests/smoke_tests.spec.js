import { test, expect } from '@playwright/test';

// Simplified smoke tests - verify login works for New Age Hospital only
const TENANT = 'New Age Hospital';

const users = [
    { tenant: TENANT, email: 'admin@nah.local', password: 'Admin@123', name: /Sarah/i, role: 'Admin' },
    { tenant: TENANT, email: 'cmo@nah.local', password: 'Admin@123', name: /Michael/i, role: 'Doctor' },
];

for (const user of users) {
    test(`${user.role} can login - ${user.tenant}`, async ({ page }) => {
        await page.goto('/');

        // Wait for tenant dropdown to be visible
        const tenantSelect = page.locator('select[name="tenantId"]');
        await tenantSelect.waitFor({ state: 'visible', timeout: 10000 });
        
        await tenantSelect.selectOption({ label: user.tenant });
        
        // Fill and submit login
        await page.locator('input[type="email"]').fill(user.email);
        await page.locator('input[type="password"]').fill(user.password);
        await page.getByRole('button', { name: /Authorize Entry|Continue to Workflow|Login/i }).click();

        // Verify login successful - user name appears
        await expect(page.getByText(user.name).first()).toBeVisible({ timeout: 20000 });

        // Verify dashboard/main page loaded
        await expect(page.locator('.app-layout, .view, main')).toBeVisible();
    });
}
