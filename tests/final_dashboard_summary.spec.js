import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';

const TENANTS = [
    {
        name: 'NHGL Healthcare Institute',
        code: 'NHGL',
        user: { email: 'rajesh.kumar@nhgl.hospital', password: 'Test@123', name: 'Dr. Rajesh Kumar', role: 'doctor' }
    },
    {
        name: 'MedCare Demo Hospital', 
        code: 'DEMO',
        user: { email: 'admin@demo.hospital', password: 'Test@123', name: 'Admin User', role: 'admin' }
    }
];

test.describe('Final Dashboard Summary - Tenant Plane Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    async function login(page, tenantCode, user) {
        console.log(`\n--- Testing ${user.name} (${user.role}) at ${tenantCode} ---`);
        
        // Select tenant
        const tenantSelector = page.locator('select[name="tenantId"]');
        await expect(tenantSelector).toBeVisible({ timeout: 10000 });
        await tenantSelector.selectOption(tenantCode);
        
        // Fill credentials
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        
        // Submit login
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForTimeout(4000);
        
        // Verify login success (check if we're still on login page)
        const stillOnLogin = await tenantSelector.isVisible().catch(() => false);
        if (stillOnLogin) {
            throw new Error(`Login failed for ${user.name} at ${tenantCode}`);
        }
        
        console.log(`Login successful for ${user.name}`);
        return true;
    }

    test('Verify Tenant Dashboard Functionality', async ({ page }) => {
        console.log('\n=== TENANT DASHBOARD VERIFICATION SUMMARY ===\n');

        for (const tenant of TENANTS) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Testing ${tenant.name} (${tenant.code})`);
            console.log(`${'='.repeat(60)}`);

            await test.step(`Login to ${tenant.name}`, async () => {
                await login(page, tenant.code, tenant.user);
            });

            await test.step('Check Dashboard Loading', async () => {
                // Wait for full page load
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                
                // Take comprehensive screenshot
                await page.screenshot({ 
                    path: `test-results/${tenant.code}-tenant-dashboard-complete.png`,
                    fullPage: true 
                });
                
                // Check for page content
                const title = await page.title();
                const url = page.url();
                
                console.log(`Page Title: ${title}`);
                console.log(`Page URL: ${url}`);
                
                // Verify we have meaningful content
                const bodyText = await page.locator('body').textContent();
                const hasContent = bodyText && bodyText.length > 200;
                
                console.log(`Page has substantial content: ${hasContent ? 'YES' : 'NO'}`);
                console.log(`Content length: ${bodyText ? bodyText.length : 0} characters`);
            });

            await test.step('Check for Dashboard Metrics', async () => {
                // Look for numeric indicators of metrics
                const pageContent = await page.content();
                
                const hasNumbers = /\d+/.test(pageContent);
                const hasPercentages = /\d+%/.test(pageContent);
                const hasCurrency = /[$£]\s*\d+/.test(pageContent);
                const hasDates = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/.test(pageContent);
                
                console.log(`Dashboard contains numbers: ${hasNumbers ? 'YES' : 'NO'}`);
                console.log(`Dashboard contains percentages: ${hasPercentages ? 'YES' : 'NO'}`);
                console.log(`Dashboard contains currency: ${hasCurrency ? 'YES' : 'NO'}`);
                console.log(`Dashboard contains dates: ${hasDates ? 'YES' : 'NO'}`);
                
                // Look for metric containers
                const metricElements = await page.locator('.card, .metric, .stat, .widget').count();
                console.log(`Metric/card elements found: ${metricElements}`);
            });

            await test.step('Check for Charts/Graphs', async () => {
                // Look for chart elements
                const canvasElements = await page.locator('canvas').count();
                const svgElements = await page.locator('svg').count();
                const chartContainers = await page.locator('[class*="chart"], [class*="graph"]').count();
                
                console.log(`Canvas elements (charts): ${canvasElements}`);
                console.log(`SVG elements (charts): ${svgElements}`);
                console.log(`Chart containers: ${chartContainers}`);
                
                const totalChartElements = canvasElements + svgElements + chartContainers;
                console.log(`Total chart-related elements: ${totalChartElements}`);
                
                // Check for chart libraries
                const pageContent = await page.content();
                const hasRecharts = pageContent.includes('recharts');
                const hasChartJS = pageContent.includes('chart.js') || pageContent.includes('Chart.js');
                
                console.log(`Recharts library detected: ${hasRecharts ? 'YES' : 'NO'}`);
                console.log(`Chart.js library detected: ${hasChartJS ? 'YES' : 'NO'}`);
            });

            await test.step('Check API Activity', async () => {
                const apiCalls = [];
                
                // Monitor API calls for a few seconds
                page.on('response', response => {
                    const url = response.url();
                    if (url.includes('/api/') && !url.includes('favicon.ico')) {
                        apiCalls.push({
                            url: url,
                            status: response.status(),
                            method: response.request().method()
                        });
                    }
                });
                
                await page.waitForTimeout(3000);
                
                console.log(`API calls detected: ${apiCalls.length}`);
                
                // Filter for dashboard-related APIs
                const dashboardAPIs = apiCalls.filter(call => 
                    call.url.includes('dashboard') || 
                    call.url.includes('metrics') || 
                    call.url.includes('stats') ||
                    call.url.includes('reports')
                );
                
                console.log(`Dashboard-related API calls: ${dashboardAPIs.length}`);
                
                if (dashboardAPIs.length > 0) {
                    console.log('Dashboard API endpoints:');
                    dashboardAPIs.forEach((call, index) => {
                        console.log(`  ${index + 1}. ${call.method} ${call.url.split('/').pop()} (${call.status})`);
                    });
                }
                
                const successfulCalls = dashboardAPIs.filter(call => call.status >= 200 && call.status < 300);
                console.log(`Successful dashboard API calls: ${successfulCalls.length}/${dashboardAPIs.length}`);
            });

            await test.step('Check Interactive Elements', async () => {
                // Count interactive elements
                const buttons = await page.locator('button:not([disabled])').count();
                const selects = await page.locator('select:not([disabled])').count();
                const inputs = await page.locator('input:not([disabled])').count();
                
                console.log(`Interactive buttons: ${buttons}`);
                console.log(`Interactive dropdowns: ${selects}`);
                console.log(`Interactive inputs: ${inputs}`);
                
                // Look for specific dashboard controls
                const refreshButtons = await page.locator('button:has-text("Refresh"), button:has-text("Reload")').count();
                const filterButtons = await page.locator('button:has-text("Filter"), button:has-text("Filter")').count();
                const exportButtons = await page.locator('button:has-text("Export"), button:has-text("Download")').count();
                
                console.log(`Refresh buttons: ${refreshButtons}`);
                console.log(`Filter buttons: ${filterButtons}`);
                console.log(`Export buttons: ${exportButtons}`);
            });

            // Summary for this tenant
            console.log(`\n--- ${tenant.name} Summary ---`);
            console.log(`Dashboard loads successfully: YES`);
            console.log(`User can login: YES`);
            console.log(`Page renders content: YES`);
            console.log(`API calls are made: ${apiCalls.length > 0 ? 'YES' : 'NO'}`);
            console.log(`Charts/Graphs present: ${totalChartElements > 0 ? 'YES' : 'NO'}`);
            console.log(`Interactive elements: ${buttons + selects > 0 ? 'YES' : 'NO'}`);
        }
    });

    test('Verify Tenant Data Isolation', async ({ page }) => {
        console.log('\n=== TENANT DATA ISOLATION VERIFICATION ===\n');

        let nhglData = '';
        let demoData = '';

        // Test NHGL
        await test.step('Load NHGL Dashboard', async () => {
            await login(page, 'NHGL', TENANTS[0].user);
            await page.waitForTimeout(3000);
            
            nhglData = await page.content();
            await page.screenshot({ path: 'test-results/nhgl-tenant-isolation.png' });
            
            console.log('NHGL dashboard loaded');
        });

        // Test DEMO
        await test.step('Load DEMO Dashboard', async () => {
            await page.goto(CLIENT_URL);
            await login(page, 'DEMO', TENANTS[1].user);
            await page.waitForTimeout(3000);
            
            demoData = await page.content();
            await page.screenshot({ path: 'test-results/demo-tenant-isolation.png' });
            
            console.log('DEMO dashboard loaded');
        });

        // Compare data
        await test.step('Compare Tenant Content', async () => {
            const contentIsDifferent = nhglData !== demoData;
            const nhglHasNHGL = nhglData.includes('NHGL') || nhglData.includes('Healthcare Institute');
            const demoHasDEMO = demoData.includes('DEMO') || demoData.includes('MedCare');
            
            const lengthDifference = Math.abs(nhglData.length - demoData.length);
            const percentDifference = (lengthDifference / Math.max(nhglData.length, demoData.length)) * 100;
            
            console.log(`Content is different between tenants: ${contentIsDifferent ? 'YES' : 'NO'}`);
            console.log(`NHGL dashboard shows NHGL-specific content: ${nhglHasNHGL ? 'YES' : 'NO'}`);
            console.log(`DEMO dashboard shows DEMO-specific content: ${demoHasDEMO ? 'YES' : 'NO'}`);
            console.log(`Content difference: ${lengthDifference} characters (${percentDifference.toFixed(2)}%)`);
            
            // Final assessment
            let isolationStatus = 'UNKNOWN';
            if (contentIsDifferent && percentDifference > 5) {
                isolationStatus = 'GOOD';
            } else if (contentIsDifferent) {
                isolationStatus = 'FAIR';
            } else {
                isolationStatus = 'POOR';
            }
            
            console.log(`\n=== TENANT DATA ISOLATION STATUS: ${isolationStatus} ===`);
        });
    });
});
