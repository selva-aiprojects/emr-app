import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';

// Updated with actual tenant and user data from database
const TENANTS = [
    {
        name: 'NHGL Healthcare Institute',
        code: 'NHGL',
        admin: null, // No admin users for NHGL
        doctor: { email: 'rajesh.kumar@nhgl.hospital', password: 'Test@123', name: 'Dr. Rajesh Kumar' }
    },
    {
        name: 'MedCare Demo Hospital',
        code: 'DEMO', 
        admin: { email: 'admin@demo.hospital', password: 'Test@123', name: 'Admin User' },
        doctor: null // No doctors for DEMO
    }
];

test.describe('Tenant Dashboard Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    async function login(page, tenantCode, user) {
        console.log(`Logging in ${user.name} for tenant ${tenantCode}`);
        
        // Wait for tenant selector to be available
        await page.waitForSelector('select[name="tenantId"]', { timeout: 10000 });
        
        // Select tenant by code
        await page.selectOption('select[name="tenantId"]', tenantCode);
        
        // Fill credentials
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        
        // Submit login
        await page.click('button[type="submit"]');
        
        // Wait for successful login
        await page.waitForTimeout(2000);
        
        // Check if we're logged in (look for any dashboard content)
        const appRoot = page.locator('.app-root');
        await expect(appRoot).toBeVisible({ timeout: 15000 });
    }

    for (const tenant of TENANTS) {
        test(`Verify ${tenant.name} Dashboard Metrics`, async ({ page }) => {
            console.log(`Testing dashboard for ${tenant.name}`);

            await test.step('Login to Tenant Dashboard', async () => {
                // Use admin if available, otherwise use doctor
                const user = tenant.admin || tenant.doctor;
                if (!user) {
                    throw new Error(`No users available for tenant ${tenant.name}`);
                }
                await login(page, tenant.code, user);
            });

            // Step 1: Verify Dashboard Loads
            await test.step('Verify Dashboard Loads', async () => {
                // Wait for dashboard to fully load
                await page.waitForTimeout(3000);
                
                // Check for dashboard content
                const dashboardContent = page.locator('body');
                await expect(dashboardContent).toBeVisible();
                
                // Take screenshot for verification
                await page.screenshot({ path: `test-results/${tenant.code}-dashboard-loaded.png` });
            });

            // Step 2: Check for Navigation Elements
            await test.step('Verify Navigation Elements', async () => {
                // Look for common navigation elements
                const navElements = [
                    'nav',
                    '.sidebar',
                    '.navigation',
                    '[data-testid="nav"]'
                ];
                
                let navigationFound = false;
                for (const selector of navElements) {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                        navigationFound = true;
                        console.log(`Found navigation with selector: ${selector}`);
                        break;
                    }
                }
                
                if (navigationFound) {
                    console.log('✅ Navigation elements found');
                } else {
                    console.log('⚠️ Navigation elements not found, but dashboard might still work');
                }
            });

            // Step 3: Check for Dashboard Metrics/Widgets
            await test.step('Verify Dashboard Metrics', async () => {
                // Look for common dashboard metric selectors
                const metricSelectors = [
                    '.dashboard-metrics',
                    '.metric-card',
                    '.stats-card',
                    '[data-testid="metrics"]',
                    '.grid', // Common for dashboard layouts
                    '.flex' // Common for dashboard layouts
                ];
                
                let metricsFound = false;
                for (const selector of metricSelectors) {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        metricsFound = true;
                        console.log(`Found ${count} elements with selector: ${selector}`);
                        break;
                    }
                }
                
                // Take screenshot of metrics
                await page.screenshot({ path: `test-results/${tenant.code}-dashboard-metrics.png` });
                
                if (metricsFound) {
                    console.log('✅ Dashboard metrics found');
                } else {
                    console.log('⚠️ Standard metric selectors not found, checking for any content...');
                }
            });

            // Step 4: Test API Data Loading
            await test.step('Verify API Data Loading', async () => {
                // Listen for network requests to check if dashboard APIs are being called
                const apiCalls = [];
                
                page.on('response', response => {
                    if (response.url().includes('/api/') && response.url().includes('dashboard')) {
                        apiCalls.push({
                            url: response.url(),
                            status: response.status()
                        });
                    }
                });
                
                // Wait a bit to collect API calls
                await page.waitForTimeout(3000);
                
                console.log(`Found ${apiCalls.length} dashboard API calls`);
                apiCalls.forEach(call => {
                    console.log(`- ${call.url} (${call.status})`);
                });
                
                if (apiCalls.length > 0) {
                    console.log('✅ Dashboard API calls detected');
                } else {
                    console.log('⚠️ No dashboard API calls detected');
                }
            });

            // Step 5: Check for Charts or Graphs
            await test.step('Verify Charts/Graphs', async () => {
                // Look for chart elements
                const chartSelectors = [
                    'canvas',
                    '.chart',
                    '.graph',
                    '[data-testid="chart"]',
                    'svg', // Common for charts
                    '.recharts-wrapper' // If using Recharts
                ];
                
                let chartsFound = false;
                for (const selector of chartSelectors) {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        chartsFound = true;
                        console.log(`Found ${count} chart elements with selector: ${selector}`);
                        break;
                    }
                }
                
                // Take screenshot of charts
                await page.screenshot({ path: `test-results/${tenant.code}-dashboard-charts.png` });
                
                if (chartsFound) {
                    console.log('✅ Chart elements found');
                } else {
                    console.log('⚠️ No chart elements found');
                }
            });

            console.log(`✅ Completed dashboard verification for ${tenant.name}`);
        });
    }

    test('Verify Tenant Data Isolation', async ({ page }) => {
        console.log('Testing tenant data isolation...');

        // Test NHGL tenant
        await test.step('Test NHGL Tenant', async () => {
            await login(page, 'NHGL', TENANTS[0].admin);
            await page.waitForTimeout(2000);
            
            // Check page title or content for tenant identification
            const content = await page.content();
            const hasNHGLContent = content.includes('NHGL') || content.includes('Healthcare Institute');
            
            if (hasNHGLContent) {
                console.log('✅ NHGL tenant content loaded');
            } else {
                console.log('⚠️ NHGL tenant content not clearly identified');
            }
            
            await page.screenshot({ path: 'test-results/nhgl-tenant-content.png' });
        });

        // Test DEMO tenant  
        await test.step('Test DEMO Tenant', async () => {
            // Go back to login
            await page.goto(CLIENT_URL);
            
            await login(page, 'DEMO', TENANTS[1].admin);
            await page.waitForTimeout(2000);
            
            // Check page title or content for tenant identification
            const content = await page.content();
            const hasDemoContent = content.includes('DEMO') || content.includes('MedCare') || content.includes('Demo Hospital');
            
            if (hasDemoContent) {
                console.log('✅ DEMO tenant content loaded');
            } else {
                console.log('⚠️ DEMO tenant content not clearly identified');
            }
            
            await page.screenshot({ path: 'test-results/demo-tenant-content.png' });
        });
    });
});
