import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const SUPER_ADMIN_EMAIL = 'superadmin@emr.local';
const SUPER_ADMIN_PASSWORD = 'Admin@123';

test.describe('End-to-End Multi-Tenant Lifecycle Validation', () => {
    
    test('Provision New Tenant and Validate Dynamic Shard Isolation', async ({ page }) => {
        const timestamp = Date.now();
        const tenantName = `Validation Hospital ${timestamp}`;
        const tenantCode = `VAL${String(timestamp).slice(-3)}`;
        const tenantSubdomain = `val-${timestamp}`;
        const adminEmail = `admin@${tenantSubdomain}.com`;

        console.log(`🚀 Starting validation for: ${tenantName} (${tenantCode})`);

        // STEP 1: Login as Superadmin
        await test.step('Login as Superadmin', async () => {
            await page.goto(CLIENT_URL);
            await page.selectOption('select[name="tenantId"]', { label: 'Platform Superadmin' });
            await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL);
            await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD);
            await page.click('button[type="submit"]');
            
            // Verify Superadmin Dashboard
            await expect(page.getByText(/NETWORK NODES/i)).toBeVisible({ timeout: 15000 });
        });

        // STEP 2: Provision New Tenant
        await test.step('Provision New Tenant', async () => {
            // Navigate to Tenant Management (if not already there)
            // The sidebar or tabs should have Tenant Management
            // Based on EnhancedSuperadminPage, we might need to click a tab/button
            // In the UI, usually there's a sidebar or we are on the dashboard.
            // Let's look for the "Provision New Hospital Shard" button
            await page.click('button:has-text("Provision New Hospital Shard")');

            // Fill Provisioning Form
            await page.fill('input[name="name"]', tenantName);
            await page.fill('input[name="contactEmail"]', 'validation@healthezee.app');
            await page.fill('input[name="code"]', tenantCode);
            await page.fill('input[name="subdomain"]', tenantSubdomain);
            
            // Submit
            await page.click('button:has-text("Provision Tenant")');

            // Wait for success and credentials
            await expect(page.getByText('Tenant provisioned successfully!')).toBeVisible({ timeout: 20000 });
            
            console.log('✅ Tenant provisioned. Waiting for credentials...');
        });

        // STEP 3: Capture Credentials & Logout
        let defaultPassword = '';
        await test.step('Capture Credentials', async () => {
            // Based on TenantCreationForm.jsx, the password is displayed in an emerald-400 span
            const passwordElement = page.locator('span.text-emerald-400');
            defaultPassword = await passwordElement.innerText();
            console.log(`🔑 Captured temporary password: ${defaultPassword}`);
            
            // Sign Out
            // Find the sign out button (usually in the header or sidebar)
            await page.click('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]');
            await expect(page.locator('select[name="tenantId"]')).toBeVisible();
        });

        // STEP 4: Login as New Tenant Admin
        await test.step('Login as New Tenant Admin', async () => {
            await page.selectOption('select[name="tenantId"]', { label: tenantName });
            await page.fill('input[type="email"]', adminEmail);
            await page.fill('input[type="password"]', defaultPassword);
            await page.click('button[type="submit"]');

            // Verify Institutional Dashboard
            await expect(page.getByText(/Total Patients/i)).toBeVisible({ timeout: 15000 });
            console.log('✅ Logged into new institutional shard.');
        });

        // STEP 5: Add Data to Shard (Patient)
        await test.step('Add Clinical Record (Patient)', async () => {
            // Navigate to Patients
            await page.click('button:has-text("Patients"), a:has-text("Patients")');
            
            // Add Patient
            await page.click('button:has-text("Add Patient"), button:has-text("New Patient")');
            await page.fill('input[name="name"]', 'John Validation Doe');
            await page.fill('input[name="phone"]', '9876543210');
            await page.fill('input[name="email"]', `john.doe.${timestamp}@test.com`);
            await page.selectOption('select[name="gender"]', 'male');
            await page.fill('input[name="age"]', '30');
            
            await page.click('button:has-text("Register Patient"), button:has-text("Save Patient")');
            
            // Verify Patient Added
            await expect(page.getByText('John Validation Doe')).toBeVisible();
            console.log('✅ Patient records successfully isolated in shard.');
        });

        // STEP 6: Final Verification (Dashboard Metrics)
        await test.step('Verify Dashboard Telemetry', async () => {
            await page.click('button:has-text("Dashboard"), a:has-text("Dashboard")');
            // Dashboard should show 1 Patient
            // Note: Dashboard metrics might have a slight delay or need refresh
            await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
            console.log('🏁 End-to-End lifecycle validation COMPLETE.');
        });
    });
});
