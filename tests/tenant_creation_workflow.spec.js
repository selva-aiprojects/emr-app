import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const SUPER_ADMIN_EMAIL = 'superadmin@emr.local';
const SUPER_ADMIN_PASSWORD = 'Admin@123';

const NEW_TENANT = {
    name: `Test Hospital_${Date.now()}`,
    domain: `testhospital${Date.now()}.local`,
    address: '123 Test Street, Test City',
    phone: '555-TEST-001',
    email: `admin@${Date.now()}.local`
};

const EMPLOYEES = [
    {
        firstName: 'John',
        lastName: 'Smith',
        email: `john.smith.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Doctor',
        department: 'General Medicine',
        license: 'MD123456'
    },
    {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: `sarah.johnson.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Nurse',
        department: 'Emergency',
        license: 'RN789012'
    },
    {
        firstName: 'Michael',
        lastName: 'Brown',
        email: `michael.brown.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Lab',
        department: 'Pathology',
        license: 'LAB345678'
    },
    {
        firstName: 'Emily',
        lastName: 'Davis',
        email: `emily.davis.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Pharmacist',
        department: 'Pharmacy',
        license: 'PH901234'
    },
    {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: `robert.wilson.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'HR',
        department: 'Human Resources'
    },
    {
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: `lisa.anderson.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Support Staff',
        department: 'Administration'
    },
    {
        firstName: 'David',
        lastName: 'Martinez',
        email: `david.martinez.${Date.now()}@${NEW_TENANT.domain}`,
        role: 'Admin',
        department: 'IT'
    }
];

test.describe('Tenant Creation and Employee Management Workflow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    test('Create New Tenant and Add All Employee Types', async ({ page }) => {
        console.log('Starting tenant creation workflow...');

        // Step 1: Login as Super Admin
        await test.step('Login as Super Admin', async () => {
            await page.selectOption('select[name="tenantId"]', { label: 'Platform Governance Center' });
            await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL);
            await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD);
            await page.click('button[type="submit"]');
            
            await expect(page.getByText('Super Admin Dashboard')).toBeVisible({ timeout: 10000 });
        });

        // Step 2: Create New Tenant
        await test.step('Create New Tenant', async () => {
            await page.getByRole('link', { name: 'Tenant Management' }).click();
            await page.getByRole('button', { name: 'Create New Tenant' }).click();

            const form = page.locator('form.tenant-creation-form');
            await form.locator('input[name="name"]').fill(NEW_TENANT.name);
            await form.locator('input[name="domain"]').fill(NEW_TENANT.domain);
            await form.locator('input[name="address"]').fill(NEW_TENANT.address);
            await form.locator('input[name="phone"]').fill(NEW_TENANT.phone);
            await form.locator('input[name="email"]').fill(NEW_TENANT.email);

            await page.getByRole('button', { name: 'Create Tenant' }).click();

            // Verify tenant creation success
            await expect(page.getByText('Tenant created successfully')).toBeVisible();
            await expect(page.getByText(NEW_TENANT.name)).toBeVisible();
        });

        // Step 3: Add Employees for Each Role
        for (const employee of EMPLOYEES) {
            await test.step(`Add ${employee.role}: ${employee.firstName} ${employee.lastName}`, async () => {
                await page.getByRole('link', { name: 'Employee Management' }).click();
                await page.getByRole('button', { name: 'Add New Employee' }).click();

                const form = page.locator('form.employee-form');
                await form.locator('input[name="firstName"]').fill(employee.firstName);
                await form.locator('input[name="lastName"]').fill(employee.lastName);
                await form.locator('input[name="email"]').fill(employee.email);
                await form.locator('select[name="role"]').selectOption(employee.role);
                await form.locator('input[name="department"]').fill(employee.department);

                // Add license/credential if applicable
                if (employee.license) {
                    await form.locator('input[name="license"]').fill(employee.license);
                }

                await page.getByRole('button', { name: 'Add Employee' }).click();

                // Verify employee addition success
                await expect(page.getByText('Employee added successfully')).toBeVisible();
                await expect(page.getByText(`${employee.firstName} ${employee.lastName}`)).toBeVisible();
            });
        }

        // Step 4: Verify Tenant Dashboard
        await test.step('Verify Tenant Dashboard Metrics', async () => {
            await page.getByRole('link', { name: 'Dashboard' }).click();
            
            // Check tenant statistics
            await expect(page.getByText('Total Tenants')).toBeVisible();
            await expect(page.getByText('Active Employees')).toBeVisible();
            await expect(page.getByText('System Health')).toBeVisible();
        });

        // Step 5: Logout and Verify New Tenant Access
        await test.step('Verify New Tenant Access', async () => {
            await page.getByRole('button', { name: 'Sign Out' }).click();
            
            // Verify new tenant appears in login dropdown
            await expect(page.locator('select[name="tenantId"]')).toContainText(NEW_TENANT.name);
        });
    });

    test('Verify Employee Role-Based Access', async ({ page }) => {
        console.log('Testing role-based access for new employees...');

        // Test each employee role access
        for (const employee of EMPLOYEES) {
            await test.step(`Test ${employee.role} Access`, async () => {
                await page.goto(CLIENT_URL);
                await page.selectOption('select[name="tenantId"]', { label: NEW_TENANT.name });
                await page.fill('input[type="email"]', employee.email);
                await page.fill('input[type="password"]', 'Temp@123'); // Default password
                await page.click('button[type="submit"]');

                // Verify role-specific dashboard elements
                switch (employee.role) {
                    case 'Doctor':
                        await expect(page.getByText('Appointments')).toBeVisible();
                        await expect(page.getByText('EMR')).toBeVisible();
                        break;
                    case 'Nurse':
                        await expect(page.getByText('Patients')).toBeVisible();
                        await expect(page.getByText('Triage')).toBeVisible();
                        break;
                    case 'Lab':
                        await expect(page.getByText('Lab Reports')).toBeVisible();
                        await expect(page.getByText('Test Results')).toBeVisible();
                        break;
                    case 'Pharmacist':
                        await expect(page.getByText('Pharmacy')).toBeVisible();
                        await expect(page.getByText('Medication')).toBeVisible();
                        break;
                    case 'HR':
                        await expect(page.getByText('Employee Roster')).toBeVisible();
                        await expect(page.getByText('Payroll')).toBeVisible();
                        break;
                    case 'Support Staff':
                        await expect(page.getByText('Patient Registration')).toBeVisible();
                        await expect(page.getByText('Appointments')).toBeVisible();
                        break;
                    case 'Admin':
                        await expect(page.getByText('System Settings')).toBeVisible();
                        await expect(page.getByText('User Management')).toBeVisible();
                        break;
                }

                await page.getByRole('button', { name: 'Sign Out' }).click();
            });
        }
    });
});
