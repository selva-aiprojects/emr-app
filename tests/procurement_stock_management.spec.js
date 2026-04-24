import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const TENANT_NAME = 'City General Hospital';
const OPS_MANAGER = { email: 'ops@ehs.local', password: 'Test@123', name: 'Ops Manager' };

const PROCUREMENT_ITEMS = [
    {
        type: 'Medicine',
        name: 'Amoxicillin 500mg',
        category: 'Antibiotics',
        supplier: 'MediSupply Corp',
        quantity: 1000,
        unitPrice: 15.50,
        unit: 'tablets',
        expiryDate: '2025-12-31'
    },
    {
        type: 'Medicine',
        name: 'Paracetamol 650mg',
        category: 'Analgesics',
        supplier: 'PharmaCare Ltd',
        quantity: 2000,
        unitPrice: 8.25,
        unit: 'tablets',
        expiryDate: '2025-10-31'
    },
    {
        type: 'Equipment',
        name: 'Digital Blood Pressure Monitor',
        category: 'Diagnostic Equipment',
        supplier: 'MedTech Solutions',
        quantity: 10,
        unitPrice: 250.00,
        unit: 'units',
        warrantyPeriod: '2 years'
    },
    {
        type: 'Equipment',
        name: 'Patient Bed Electric',
        category: 'Hospital Furniture',
        supplier: 'HealthCare Furnishings',
        quantity: 5,
        unitPrice: 1500.00,
        unit: 'units',
        warrantyPeriod: '5 years'
    },
    {
        type: 'Consumables',
        name: 'Surgical Gloves',
        category: 'Medical Consumables',
        supplier: 'SafeMedical Supplies',
        quantity: 5000,
        unitPrice: 0.50,
        unit: 'pairs'
    }
];

const STOCK_ADJUSTMENTS = [
    {
        itemName: 'Amoxicillin 500mg',
        adjustmentType: 'dispensed',
        quantity: 50,
        reason: 'Patient dispensing',
        department: 'Pharmacy'
    },
    {
        itemName: 'Paracetamol 650mg',
        adjustmentType: 'dispensed',
        quantity: 100,
        reason: 'OPD prescriptions',
        department: 'Pharmacy'
    },
    {
        itemName: 'Surgical Gloves',
        adjustmentType: 'used',
        quantity: 200,
        reason: 'Surgery procedures',
        department: 'Operating Theater'
    }
];

test.describe('Procurement and Stock Management Workflow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    async function login(page, tenantName, user) {
        await page.selectOption('select[name="tenantId"]', { label: tenantName });
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        await page.click('button[type="submit"]');
        await expect(page.getByText(user.name)).toBeVisible();
    }

    test('Complete Procurement Workflow', async ({ page }) => {
        console.log('Starting procurement workflow...');

        // Step 1: Login as Operations Manager
        await test.step('Login as Operations Manager', async () => {
            await login(page, TENANT_NAME, OPS_MANAGER);
            await expect(page.getByText('Asset Logistics')).toBeVisible();
        });

        // Step 2: Create Procurement Requests
        for (const item of PROCUREMENT_ITEMS) {
            await test.step(`Create Procurement for ${item.name}`, async () => {
                await page.getByRole('link', { name: 'Procurement' }).click();
                await page.getByRole('button', { name: 'New Procurement Request' }).click();

                const form = page.locator('form.procurement-form');
                await form.locator('select[name="type"]').selectOption(item.type);
                await form.locator('input[name="itemName"]').fill(item.name);
                await form.locator('input[name="category"]').fill(item.category);
                await form.locator('input[name="supplier"]').fill(item.supplier);
                await form.locator('input[name="quantity"]').fill(item.quantity.toString());
                await form.locator('input[name="unitPrice"]').fill(item.unitPrice.toString());
                await form.locator('select[name="unit"]').selectOption(item.unit);

                // Add type-specific fields
                if (item.expiryDate) {
                    await form.locator('input[name="expiryDate"]').fill(item.expiryDate);
                }
                if (item.warrantyPeriod) {
                    await form.locator('input[name="warrantyPeriod"]').fill(item.warrantyPeriod);
                }

                await page.getByRole('button', { name: 'Submit Procurement Request' }).click();

                // Verify procurement request creation
                await expect(page.getByText('Procurement request submitted successfully')).toBeVisible();
                await expect(page.getByText(item.name)).toBeVisible();
            });
        }

        // Step 3: Approve Procurement Requests
        await test.step('Approve Procurement Requests', async () => {
            await page.getByRole('link', { name: 'Procurement Approval' }).click();
            
            const requests = await page.locator('.procurement-request').count();
            expect(requests).toBeGreaterThan(0);

            // Approve all pending requests
            for (let i = 0; i < requests; i++) {
                const request = page.locator('.procurement-request').nth(i);
                await request.getByRole('button', { name: 'Approve' }).click();
                await page.getByRole('button', { name: 'Confirm Approval' }).click();
            }

            await expect(page.getByText('All requests approved')).toBeVisible();
        });

        // Step 4: Verify Stock Addition
        await test.step('Verify Stock Addition', async () => {
            await page.getByRole('link', { name: 'Inventory' }).click();
            
            for (const item of PROCUREMENT_ITEMS) {
                await expect(page.getByText(item.name)).toBeVisible();
                
                // Check stock details
                const stockRow = page.locator('.stock-row').filter({ hasText: item.name }).first();
                await expect(stockRow.getByText(item.quantity.toString())).toBeVisible();
                await expect(stockRow.getByText(item.unit)).toBeVisible();
            }
        });
    });

    test('Stock Management and Adjustments', async ({ page }) => {
        console.log('Testing stock management...');

        // Step 1: Login and go to inventory
        await test.step('Access Inventory Management', async () => {
            await login(page, TENANT_NAME, OPS_MANAGER);
            await page.getByRole('link', { name: 'Inventory' }).click();
            await expect(page.getByText('Stock Management')).toBeVisible();
        });

        // Step 2: Process Stock Adjustments
        for (const adjustment of STOCK_ADJUSTMENTS) {
            await test.step(`Process Stock Adjustment: ${adjustment.itemName}`, async () => {
                // Find the item in inventory
                const itemRow = page.locator('.stock-row').filter({ hasText: adjustment.itemName }).first();
                await itemRow.getByRole('button', { name: 'Adjust Stock' }).click();

                const form = page.locator('form.stock-adjustment-form');
                await form.locator('select[name="adjustmentType"]').selectOption(adjustment.adjustmentType);
                await form.locator('input[name="quantity"]').fill(adjustment.quantity.toString());
                await form.locator('textarea[name="reason"]').fill(adjustment.reason);
                await form.locator('input[name="department"]').fill(adjustment.department);

                await page.getByRole('button', { name: 'Process Adjustment' }).click();

                // Verify adjustment success
                await expect(page.getByText('Stock adjustment processed successfully')).toBeVisible();
            });
        }

        // Step 3: Check Low Stock Alerts
        await test.step('Check Low Stock Alerts', async () => {
            await page.getByRole('link', { name: 'Dashboard' }).click();
            
            // Check if low stock alerts are displayed
            const alertsSection = page.locator('.low-stock-alerts');
            if (await alertsSection.isVisible()) {
                await expect(alertsSection.getByText('Low Stock')).toBeVisible();
            }
        });

        // Step 4: Generate Stock Reports
        await test.step('Generate Stock Reports', async () => {
            await page.getByRole('link', { name: 'Reports' }).click();
            await page.getByRole('button', { name: 'Inventory Report' }).click();
            
            // Set report parameters
            const form = page.locator('form.report-form');
            await form.locator('input[name="startDate"]').fill('2024-01-01');
            await form.locator('input[name="endDate"]').fill('2024-12-31');
            await form.locator('select[name="reportType"]').selectOption('Stock Summary');
            
            await page.getByRole('button', { name: 'Generate Report' }).click();
            
            // Verify report generation
            await expect(page.getByText('Inventory Report Generated')).toBeVisible();
            await expect(page.locator('.report-content')).toBeVisible();
        });
    });

    test('Supplier Management', async ({ page }) => {
        console.log('Testing supplier management...');

        await test.step('Manage Suppliers', async () => {
            await login(page, TENANT_NAME, OPS_MANAGER);
            await page.getByRole('link', { name: 'Suppliers' }).click();
            
            // Add new supplier
            await page.getByRole('button', { name: 'Add Supplier' }).click();
            
            const form = page.locator('form.supplier-form');
            await form.locator('input[name="name"]').fill('New Medical Supplier');
            await form.locator('input[name="contact"]').fill('contact@newsupplier.com');
            await form.locator('input[name="phone"]').fill('555-SUPPLIER');
            await form.locator('input[name="address"]').fill('456 Supplier Ave, Supplier City');
            await form.locator('select[name="category"]').selectOption('Pharmaceuticals');
            
            await page.getByRole('button', { name: 'Add Supplier' }).click();
            
            // Verify supplier addition
            await expect(page.getByText('Supplier added successfully')).toBeVisible();
            await expect(page.getByText('New Medical Supplier')).toBeVisible();
        });
    });

    test('Equipment Maintenance Tracking', async ({ page }) => {
        console.log('Testing equipment maintenance...');

        await test.step('Track Equipment Maintenance', async () => {
            await login(page, TENANT_NAME, OPS_MANAGER);
            await page.getByRole('link', { name: 'Equipment' }).click();
            
            // Schedule maintenance for equipment
            const equipmentRow = page.locator('.equipment-row').filter({ hasText: 'Digital Blood Pressure Monitor' }).first();
            await equipmentRow.getByRole('button', { name: 'Schedule Maintenance' }).click();
            
            const form = page.locator('form.maintenance-form');
            await form.locator('input[name="scheduledDate"]').fill('2024-06-15');
            await form.locator('select[name="maintenanceType"]').selectOption('Routine Check');
            await form.locator('textarea[name="notes"]').fill('Quarterly maintenance and calibration');
            
            await page.getByRole('button', { name: 'Schedule Maintenance' }).click();
            
            // Verify maintenance scheduling
            await expect(page.getByText('Maintenance scheduled successfully')).toBeVisible();
        });
    });
});
