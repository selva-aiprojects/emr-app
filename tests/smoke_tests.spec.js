import { test, expect } from '@playwright/test';

// Use New Age Hospital (NAH) which is a stable tenant in the database
const TENANT_LABEL = 'New Age Hospital';

const users = [
<<<<<<< HEAD
    { tenant: TENANT_LABEL, email: 'admin@newage.hospital', password: 'Admin@123', name: /Sarah/i, role: 'Admin' },
=======
    { tenant: TENANT_LABEL, email: 'admin@nah.local', password: 'Admin@123', name: /Sarah/i, role: 'Admin' },
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe
    { tenant: TENANT_LABEL, email: 'cmo@nah.local', password: 'Admin@123', name: /Michael/i, role: 'Doctor' },
];

for (const user of users) {
    test(`${user.role} can login - ${user.tenant}`, async ({ page }) => {
<<<<<<< HEAD
await page.goto('http://localhost:5175/');
=======
        await page.goto('/');
>>>>>>> 52791cbe98012868f178ca6ba1e3c297477226fe

        // Wait for tenant dropdown to be interactive
        const tenantSelect = page.locator('select[name="tenantId"]');
        await tenantSelect.waitFor({ state: 'visible', timeout: 15000 });
        
        // Use label selection but ensure we wait for the option to exist
        await expect(tenantSelect.locator(`option:has-text("${user.tenant}")`)).toBeAttached();
        await tenantSelect.selectOption({ label: user.tenant });
        
        // Fill and submit login
        await page.locator('input[type="email"]').fill(user.email);
        await page.locator('input[type="password"]').fill(user.password);
        
        const loginButton = page.getByRole('button', { name: /Authorize Entry|Authenticate Protocol|Login|Sign In/i });
        await loginButton.click();

        // Wait for login to complete and dashboard to load
        await page.waitForLoadState('networkidle');

        // Verify login successful - check for user's name on dashboard
        // We use a broader search to accommodate different layout headers
        const userGreeting = page.getByText(user.name).first();
        await expect(userGreeting).toBeVisible({ timeout: 20000 });

        // Verify a core dashboard element is visible
        // Common selectors for the main app layout across different roles
        await expect(page.locator('.app-layout, .view, main, [role="main"]')).toBeVisible();
    });
}
