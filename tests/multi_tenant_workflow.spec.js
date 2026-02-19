import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';

const users = [
    // --- Existing Checks ---
    {
        name: 'Admin Lisa White',
        email: 'lisa.white@citygen.local',
        tenant: 'City General Hospital',
        role: 'Admin',
        expectedText: 'Manage Access'
    },
    {
        name: 'Dr. Emily Chen',
        email: 'emily.chen@citygen.local',
        tenant: 'City General Hospital',
        role: 'Doctor',
        expectedText: 'Appointments'
    },

    // --- Enterprise Hospital Systems (EHS) - New Module Checks ---
    {
        name: 'HR Manager',
        email: 'hr@ehs.local',
        tenant: 'Enterprise Hospital Systems',
        role: 'HR',
        expectedText: 'Employee Roster' // From EmployeesPage.jsx
    },
    {
        name: 'Accounts Manager',
        email: 'accounts@ehs.local',
        tenant: 'Enterprise Hospital Systems',
        role: 'Billing',
        expectedText: 'Financial Snapshot' // From AccountsPage.jsx
    },
    {
        name: 'Insurance Coordinator',
        email: 'insurance@ehs.local',
        tenant: 'Enterprise Hospital Systems',
        role: 'Insurance',
        expectedText: 'Insurance & Claims Registry' // From InsurancePage.jsx
    },
    {
        name: 'Pharmacist John',
        email: 'pharmacy@ehs.local',
        tenant: 'Enterprise Hospital Systems',
        role: 'Pharmacy',
        expectedText: 'Pharmaceutical Oversight' // From PharmacyPage.jsx
    },
    {
        name: 'Ops Manager',
        email: 'ops@ehs.local',
        tenant: 'Enterprise Hospital Systems',
        role: 'Operations',
        expectedText: 'Asset Logistics' // From InventoryPage.jsx
    }
];

test.describe('Multi-Tenant User Workflows', () => {

    for (const user of users) {
        test(`Login and Verify Workflow for ${user.name} (${user.role} at ${user.tenant})`, async ({ page }) => {
            console.log(`Testing login for ${user.name}...`);

            await page.goto(CLIENT_URL);

            // Select Tenant
            await page.selectOption('select', { label: user.tenant });

            // Fill Credentials
            await page.fill('input[type="email"]', user.email);
            // Assuming default password for all test users
            await page.fill('input[type="password"]', 'Test@123');

            // Login
            await page.click('button[type="submit"]');

            // Verify Dashboard access
            await expect(page.locator('.app-root')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=Sign In')).not.toBeVisible();

            // Check for role-specific expected text to verify module access
            if (user.expectedText) {
                await expect(page.getByText(user.expectedText).first()).toBeVisible({ timeout: 10000 });
            }

            console.log(`Successfully verified ${user.name}`);

            // Logout
            // In new layout, logout is in sidebar footer
            const logoutBtn = page.getByText('Sign Out');
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
                await expect(page.locator('text=Sign In')).toBeVisible();
            }
        });
    }
});
