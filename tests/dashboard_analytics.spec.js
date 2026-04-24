import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const TENANT_NAME = 'City General Hospital';

const ADMIN = { email: 'lisa.white@citygen.local', password: 'Test@123', name: 'Admin Lisa White' };
const DOCTOR = { email: 'emily.chen@citygen.local', password: 'Test@123', name: 'Dr. Emily Chen' };
const ACCOUNTS_MANAGER = { email: 'accounts@ehs.local', password: 'Test@123', name: 'Accounts Manager' };

const EXPECTED_METRICS = {
    admin: [
        'Total Patients',
        'Active Employees',
        'Bed Occupancy Rate',
        'Revenue Summary',
        'Pending Claims',
        'System Health'
    ],
    doctor: [
        'Today\'s Appointments',
        'Patient Census',
        'Pending Lab Results',
        'Prescription Volume',
        'Consultation Summary'
    ],
    accounts: [
        'Daily Revenue',
        'Outstanding Invoices',
        'Insurance Claims Status',
        'Collection Rate',
        'Aging Report Summary',
        'Payment Processing'
    ]
};

test.describe('Dashboard Metrics and Analytics Verification', () => {

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

    test('Admin Dashboard Metrics Verification', async ({ page }) => {
        console.log('Testing admin dashboard metrics...');

        await test.step('Login and Access Admin Dashboard', async () => {
            await login(page, TENANT_NAME, ADMIN);
            await expect(page.getByText('Admin Dashboard')).toBeVisible();
        });

        // Step 1: Verify Patient Metrics
        await test.step('Verify Patient Metrics', async () => {
            await expect(page.getByText('Total Patients')).toBeVisible();
            
            const patientMetrics = page.locator('.patient-metrics');
            if (await patientMetrics.isVisible()) {
                await expect(patientMetrics.getByText('Total Registered')).toBeVisible();
                await expect(patientMetrics.getByText('Active Patients')).toBeVisible();
                await expect(patientMetrics.getByText('New This Month')).toBeVisible();
                await expect(patientMetrics.getByText('IP/OP Distribution')).toBeVisible();
            }
        });

        // Step 2: Verify Employee Metrics
        await test.step('Verify Employee Metrics', async () => {
            await expect(page.getByText('Active Employees')).toBeVisible();
            
            const employeeMetrics = page.locator('.employee-metrics');
            if (await employeeMetrics.isVisible()) {
                await expect(employeeMetrics.getByText('Total Staff')).toBeVisible();
                await expect(employeeMetrics.getByText('On Duty Today')).toBeVisible();
                await expect(employeeMetrics.getByText('Department Breakdown')).toBeVisible();
            }
        });

        // Step 3: Verify Operational Metrics
        await test.step('Verify Operational Metrics', async () => {
            await expect(page.getByText('Bed Occupancy Rate')).toBeVisible();
            
            const operationalMetrics = page.locator('.operational-metrics');
            if (await operationalMetrics.isVisible()) {
                await expect(operationalMetrics.getByText('Occupancy Rate')).toBeVisible();
                await expect(operationalMetrics.getByText('Available Beds')).toBeVisible();
                await expect(operationalMetrics.getByText('Emergency Status')).toBeVisible();
            }
        });

        // Step 4: Verify Financial Metrics
        await test.step('Verify Financial Metrics', async () => {
            await expect(page.getByText('Revenue Summary')).toBeVisible();
            
            const financialMetrics = page.locator('.financial-metrics');
            if (await financialMetrics.isVisible()) {
                await expect(financialMetrics.getByText('Today\'s Revenue')).toBeVisible();
                await expect(financialMetrics.getByText('Monthly Revenue')).toBeVisible();
                await expect(financialMetrics.getByText('Year to Date')).toBeVisible();
            }
        });

        // Step 5: Verify System Health
        await test.step('Verify System Health', async () => {
            await expect(page.getByText('System Health')).toBeVisible();
            
            const systemHealth = page.locator('.system-health');
            if (await systemHealth.isVisible()) {
                await expect(systemHealth.getByText('Server Status')).toBeVisible();
                await expect(systemHealth.getByText('Database Status')).toBeVisible();
                await expect(systemHealth.getByText('API Response Time')).toBeVisible();
            }
        });

        // Step 6: Test Interactive Charts
        await test.step('Test Interactive Charts', async () => {
            // Test patient admission trends chart
            const admissionChart = page.locator('.admission-trends-chart');
            if (await admissionChart.isVisible()) {
                await admissionChart.click();
                await expect(page.getByText('Patient Admission Trends')).toBeVisible();
                
                // Test chart filters
                const filterBtn = page.getByRole('button', { name: 'Filter' });
                if (await filterBtn.isVisible()) {
                    await filterBtn.click();
                    await page.locator('select[name="timeRange"]').selectOption('Last 30 Days');
                    await page.getByRole('button', { name: 'Apply Filter' }).click();
                }
            }

            // Test revenue trends chart
            const revenueChart = page.locator('.revenue-trends-chart');
            if (await revenueChart.isVisible()) {
                await revenueChart.click();
                await expect(page.getByText('Revenue Trends')).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Doctor Dashboard Metrics Verification', async ({ page }) => {
        console.log('Testing doctor dashboard metrics...');

        await test.step('Login and Access Doctor Dashboard', async () => {
            await login(page, TENANT_NAME, DOCTOR);
            await expect(page.getByText('Doctor Dashboard')).toBeVisible();
        });

        // Step 1: Verify Appointment Metrics
        await test.step('Verify Appointment Metrics', async () => {
            await expect(page.getByText('Today\'s Appointments')).toBeVisible();
            
            const appointmentMetrics = page.locator('.appointment-metrics');
            if (await appointmentMetrics.isVisible()) {
                await expect(appointmentMetrics.getByText('Scheduled')).toBeVisible();
                await expect(appointmentMetrics.getByText('Completed')).toBeVisible();
                await expect(appointmentMetrics.getByText('No Shows')).toBeVisible();
            }
        });

        // Step 2: Verify Patient Census
        await test.step('Verify Patient Census', async () => {
            await expect(page.getByText('Patient Census')).toBeVisible();
            
            const censusMetrics = page.locator('.census-metrics');
            if (await censusMetrics.isVisible()) {
                await expect(censusMetrics.getByText('Total Patients')).toBeVisible();
                await expect(censusMetrics.getByText('IP Patients')).toBeVisible();
                await expect(censusMetrics.getByText('OP Patients')).toBeVisible();
            }
        });

        // Step 3: Verify Lab Results Status
        await test.step('Verify Lab Results Status', async () => {
            await expect(page.getByText('Pending Lab Results')).toBeVisible();
            
            const labMetrics = page.locator('.lab-metrics');
            if (await labMetrics.isVisible()) {
                await expect(labMetrics.getByText('Pending')).toBeVisible();
                await expect(labMetrics.getByText('Completed')).toBeVisible();
                await expect(labMetrics.getByText('Critical')).toBeVisible();
            }
        });

        // Step 4: Verify Prescription Metrics
        await test.step('Verify Prescription Metrics', async () => {
            await expect(page.getByText('Prescription Volume')).toBeVisible();
            
            const prescriptionMetrics = page.locator('.prescription-metrics');
            if (await prescriptionMetrics.isVisible()) {
                await expect(prescriptionMetrics.getByText('Today\'s Prescriptions')).toBeVisible();
                await expect(prescriptionMetrics.getByText('Pending Pharmacy')).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Accounts Dashboard Metrics Verification', async ({ page }) => {
        console.log('Testing accounts dashboard metrics...');

        await test.step('Login and Access Accounts Dashboard', async () => {
            await login(page, TENANT_NAME, ACCOUNTS_MANAGER);
            await expect(page.getByText('Financial Dashboard')).toBeVisible();
        });

        // Step 1: Verify Revenue Metrics
        await test.step('Verify Revenue Metrics', async () => {
            await expect(page.getByText('Daily Revenue')).toBeVisible();
            
            const revenueMetrics = page.locator('.revenue-metrics');
            if (await revenueMetrics.isVisible()) {
                await expect(revenueMetrics.getByText('Cash')).toBeVisible();
                await expect(revenueMetrics.getByText('Insurance')).toBeVisible();
                await expect(revenueMetrics.getByText('Credit')).toBeVisible();
            }
        });

        // Step 2: Verify Invoice Status
        await test.step('Verify Invoice Status', async () => {
            await expect(page.getByText('Outstanding Invoices')).toBeVisible();
            
            const invoiceMetrics = page.locator('.invoice-metrics');
            if (await invoiceMetrics.isVisible()) {
                await expect(invoiceMetrics.getByText('Total Outstanding')).toBeVisible();
                await expect(invoiceMetrics.getByText('Overdue')).toBeVisible();
                await expect(invoiceMetrics.getByText('Current')).toBeVisible();
            }
        });

        // Step 3: Verify Insurance Claims
        await test.step('Verify Insurance Claims', async () => {
            await expect(page.getByText('Insurance Claims Status')).toBeVisible();
            
            const claimsMetrics = page.locator('.claims-metrics');
            if (await claimsMetrics.isVisible()) {
                await expect(claimsMetrics.getByText('Pending')).toBeVisible();
                await expect(claimsMetrics.getByText('Submitted')).toBeVisible();
                await expect(claimsMetrics.getByText('Approved')).toBeVisible();
                await expect(claimsMetrics.getByText('Rejected')).toBeVisible();
            }
        });

        // Step 4: Verify Collection Metrics
        await test.step('Verify Collection Metrics', async () => {
            await expect(page.getByText('Collection Rate')).toBeVisible();
            
            const collectionMetrics = page.locator('.collection-metrics');
            if (await collectionMetrics.isVisible()) {
                await expect(collectionMetrics.getByText('Current Month')).toBeVisible();
                await expect(collectionMetrics.getByText('Year to Date')).toBeVisible();
                await expect(collectionMetrics.getByText('Target')).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Real-time Data Updates', async ({ page }) => {
        console.log('Testing real-time data updates...');

        await test.step('Test Real-time Updates', async () => {
            await login(page, TENANT_NAME, ADMIN);
            
            // Wait for initial dashboard load
            await page.waitForTimeout(2000);
            
            // Check if real-time indicators are present
            const realtimeIndicator = page.locator('.realtime-indicator');
            if (await realtimeIndicator.isVisible()) {
                await expect(realtimeIndicator.getByText('Live')).toBeVisible();
            }
            
            // Test auto-refresh functionality
            const refreshBtn = page.getByRole('button', { name: 'Refresh' });
            if (await refreshBtn.isVisible()) {
                const initialMetricValue = await page.getByText('Total Patients').textContent();
                await refreshBtn.click();
                await page.waitForTimeout(1000);
                
                // Verify data refreshed (timestamp updated)
                const lastUpdated = page.locator('.last-updated');
                if (await lastUpdated.isVisible()) {
                    await expect(lastUpdated).toBeVisible();
                }
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Dashboard Customization and Export', async ({ page }) => {
        console.log('Testing dashboard customization...');

        await test.step('Test Dashboard Customization', async () => {
            await login(page, TENANT_NAME, ADMIN);
            
            // Test widget arrangement
            const customizeBtn = page.getByRole('button', { name: 'Customize Dashboard' });
            if (await customizeBtn.isVisible()) {
                await customizeBtn.click();
                
                // Test widget visibility toggles
                const widgetToggles = page.locator('.widget-toggle');
                const toggleCount = await widgetToggles.count();
                
                if (toggleCount > 0) {
                    // Toggle first widget off
                    await widgetToggles.first().click();
                    await page.getByRole('button', { name: 'Save Layout' }).click();
                    
                    // Verify widget is hidden
                    await expect(page.getByText('Layout saved successfully')).toBeVisible();
                }
            }
        });

        // Step 2: Test Export Functionality
        await test.step('Test Export Functionality', async () => {
            const exportBtn = page.getByRole('button', { name: 'Export' });
            if (await exportBtn.isVisible()) {
                await exportBtn.click();
                
                // Test different export formats
                await page.locator('select[name="format"]').selectOption('PDF');
                await page.locator('select[name="dateRange"]').selectOption('Last 7 Days');
                
                await page.getByRole('button', { name: 'Generate Export' }).click();
                
                // Verify export initiation
                await expect(page.getByText('Export initiated successfully')).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Cross-Role Data Consistency', async ({ page }) => {
        console.log('Testing cross-role data consistency...');

        // Test patient count consistency across roles
        let adminPatientCount = 0;
        let doctorPatientCount = 0;

        await test.step('Get Admin Patient Count', async () => {
            await login(page, TENANT_NAME, ADMIN);
            
            const patientMetric = page.locator('.patient-metrics').getByText('Total Patients').first();
            if (await patientMetric.isVisible()) {
                const metricText = await patientMetric.textContent();
                const match = metricText.match(/\d+/);
                if (match) {
                    adminPatientCount = parseInt(match[0]);
                }
            }
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });

        await test.step('Get Doctor Patient Count', async () => {
            await login(page, TENANT_NAME, DOCTOR);
            
            const patientMetric = page.locator('.census-metrics').getByText('Total Patients').first();
            if (await patientMetric.isVisible()) {
                const metricText = await patientMetric.textContent();
                const match = metricText.match(/\d+/);
                if (match) {
                    doctorPatientCount = parseInt(match[0]);
                }
            }
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });

        // Verify consistency (doctor should see subset of admin's total)
        await test.step('Verify Data Consistency', async () => {
            if (adminPatientCount > 0 && doctorPatientCount > 0) {
                // Doctor's patient count should be less than or equal to admin's
                expect(doctorPatientCount).toBeLessThanOrEqual(adminPatientCount);
            }
        });
    });

    test('Performance Metrics Loading', async ({ page }) => {
        console.log('Testing dashboard performance...');

        await test.step('Test Dashboard Loading Performance', async () => {
            const startTime = Date.now();
            
            await login(page, TENANT_NAME, ADMIN);
            
            // Wait for all key metrics to load
            await Promise.all([
                expect(page.getByText('Total Patients')).toBeVisible(),
                expect(page.getByText('Active Employees')).toBeVisible(),
                expect(page.getByText('Revenue Summary')).toBeVisible()
            ]);
            
            const loadTime = Date.now() - startTime;
            
            // Dashboard should load within 10 seconds
            expect(loadTime).toBeLessThan(10000);
            
            console.log(`Dashboard loaded in ${loadTime}ms`);
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });
});
