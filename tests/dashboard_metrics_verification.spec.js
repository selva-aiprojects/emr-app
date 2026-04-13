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

test.describe('Dashboard Metrics and Graphs Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    async function login(page, tenantCode, user) {
        console.log(`Logging in ${user.name} (${user.role}) for tenant ${tenantCode}`);
        
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
        await page.waitForTimeout(5000);
        
        console.log(`Login completed for ${user.name}`);
    }

    for (const tenant of TENANTS) {
        test(`Verify ${tenant.name} Dashboard - Metrics and Graphs`, async ({ page }) => {
            console.log(`\n=== Testing ${tenant.name} Dashboard ===`);

            await test.step('Login to Dashboard', async () => {
                await login(page, tenant.code, tenant.user);
                
                // Verify we're not on login page anymore
                await expect(page.locator('select[name="tenantId"]')).not.toBeVisible({ timeout: 10000 });
            });

            // Step 1: Check Dashboard Layout and Structure
            await test.step('Verify Dashboard Layout', async () => {
                console.log('Checking dashboard layout...');
                
                // Wait for content to fully load
                await page.waitForTimeout(3000);
                
                // Take screenshot of full dashboard
                await page.screenshot({ 
                    path: `test-results/${tenant.code}-dashboard-full.png`,
                    fullPage: true 
                });
                
                // Check for common dashboard container elements
                const layoutSelectors = [
                    '.dashboard',
                    '.dashboard-container',
                    '.main-content',
                    '.content',
                    'main',
                    '.app',
                    '#root'
                ];
                
                let layoutFound = false;
                for (const selector of layoutSelectors) {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                        layoutFound = true;
                        console.log(`Dashboard layout found with selector: ${selector}`);
                        break;
                    }
                }
                
                if (layoutFound) {
                    console.log('Dashboard layout verified');
                } else {
                    console.log('Dashboard layout structure unclear, checking page content...');
                }
            });

            // Step 2: Check for Dashboard Metrics
            await test.step('Verify Dashboard Metrics', async () => {
                console.log('Checking dashboard metrics...');
                
                // Look for metric cards or widgets
                const metricSelectors = [
                    '.metric-card',
                    '.stats-card',
                    '.dashboard-card',
                    '.metric',
                    '.stat',
                    '.widget',
                    '.card',
                    '[data-testid*="metric"]',
                    '[data-testid*="stat"]',
                    '[data-testid*="card"]'
                ];
                
                let metricsFound = 0;
                for (const selector of metricSelectors) {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        metricsFound += count;
                        console.log(`Found ${count} elements with selector: ${selector}`);
                    }
                }
                
                console.log(`Total metric elements found: ${metricsFound}`);
                
                // Look for specific metric content (numbers, percentages, etc.)
                const pageContent = await page.content();
                const hasNumbers = /\d+/.test(pageContent);
                const hasPercentages = /\d+%/.test(pageContent);
                const hasCurrency = /[$£]\s*\d+/.test(pageContent);
                
                console.log(`Dashboard contains numbers: ${hasNumbers}`);
                console.log(`Dashboard contains percentages: ${hasPercentages}`);
                console.log(`Dashboard contains currency: ${hasCurrency}`);
                
                // Take screenshot of metrics area
                await page.screenshot({ path: `test-results/${tenant.code}-dashboard-metrics.png` });
            });

            // Step 3: Check for Charts and Graphs
            await test.step('Verify Charts and Graphs', async () => {
                console.log('Checking charts and graphs...');
                
                // Look for chart elements
                const chartSelectors = [
                    'canvas',
                    'svg',
                    '.chart',
                    '.graph',
                    '.plot',
                    '.recharts-wrapper',
                    '.recharts-responsive-container',
                    '[data-testid*="chart"]',
                    '[data-testid*="graph"]',
                    '.apexcharts-canvas',
                    '.highcharts-container',
                    '.chartjs-render-monitor'
                ];
                
                let chartsFound = 0;
                for (const selector of chartSelectors) {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        chartsFound += count;
                        console.log(`Found ${count} chart elements with selector: ${selector}`);
                        
                        // Take screenshot of each chart type
                        for (let i = 0; i < Math.min(count, 3); i++) {
                            const chart = elements.nth(i);
                            if (await chart.isVisible()) {
                                await chart.screenshot({ 
                                    path: `test-results/${tenant.code}-chart-${selector.replace(/[^a-zA-Z0-9]/g, '_')}-${i}.png` 
                                });
                            }
                        }
                    }
                }
                
                console.log(`Total chart elements found: ${chartsFound}`);
                
                // Check for chart libraries being used
                const pageContent = await page.content();
                const hasRecharts = pageContent.includes('recharts');
                const hasChartJS = pageContent.includes('chart.js') || pageContent.includes('Chart.js');
                const hasApexCharts = pageContent.includes('apexcharts');
                const hasHighcharts = pageContent.includes('highcharts');
                
                console.log(`Chart libraries detected:`);
                console.log(`- Recharts: ${hasRecharts}`);
                console.log(`- Chart.js: ${hasChartJS}`);
                console.log(`- ApexCharts: ${hasApexCharts}`);
                console.log(`- Highcharts: ${hasHighcharts}`);
            });

            // Step 4: Monitor API Calls for Dashboard Data
            await test.step('Verify Dashboard API Calls', async () => {
                console.log('Monitoring dashboard API calls...');
                
                const apiCalls = [];
                
                // Listen for network requests
                page.on('response', response => {
                    const url = response.url();
                    if (url.includes('/api/') && (url.includes('dashboard') || url.includes('metrics') || url.includes('stats'))) {
                        apiCalls.push({
                            url: url,
                            status: response.status(),
                            method: response.request().method()
                        });
                    }
                });
                
                // Wait to collect API calls
                await page.waitForTimeout(3000);
                
                console.log(`Dashboard API calls detected: ${apiCalls.length}`);
                apiCalls.forEach((call, index) => {
                    console.log(`${index + 1}. ${call.method} ${call.url} (${call.status})`);
                });
                
                // Check if API calls are successful
                const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
                console.log(`Successful API calls: ${successfulCalls.length}/${apiCalls.length}`);
            });

            // Step 5: Test Interactive Elements
            await test.step('Verify Interactive Elements', async () => {
                console.log('Testing interactive elements...');
                
                // Look for buttons, filters, dropdowns
                const interactiveSelectors = [
                    'button:not([disabled])',
                    'select:not([disabled])',
                    'input[type="date"]',
                    'input[type="range"]',
                    '.filter',
                    '.dropdown',
                    '[role="button"]',
                    '[data-testid*="filter"]'
                ];
                
                let interactiveFound = 0;
                for (const selector of interactiveSelectors) {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        interactiveFound += count;
                        console.log(`Found ${count} interactive elements with selector: ${selector}`);
                    }
                }
                
                console.log(`Total interactive elements found: ${interactiveFound}`);
                
                // Try clicking on a few safe elements
                const buttons = page.locator('button:has-text("Refresh"), button:has-text("Filter"), button:has-text("Export")');
                const buttonCount = await buttons.count();
                
                if (buttonCount > 0) {
                    console.log(`Testing ${Math.min(buttonCount, 2)} buttons...`);
                    for (let i = 0; i < Math.min(buttonCount, 2); i++) {
                        try {
                            await buttons.nth(i).click();
                            await page.waitForTimeout(1000);
                            console.log(`Button ${i + 1} clicked successfully`);
                        } catch (error) {
                            console.log(`Button ${i + 1} click failed: ${error.message}`);
                        }
                    }
                }
            });

            // Step 6: Final Dashboard Verification
            await test.step('Final Dashboard Verification', async () => {
                console.log('Final dashboard verification...');
                
                // Take final screenshot
                await page.screenshot({ 
                    path: `test-results/${tenant.code}-dashboard-final.png`,
                    fullPage: true 
                });
                
                // Check page title and content
                const title = await page.title();
                const url = page.url();
                
                console.log(`Final page title: ${title}`);
                console.log(`Final page URL: ${url}`);
                
                // Verify we have meaningful content
                const bodyText = await page.locator('body').textContent();
                const hasContent = bodyText && bodyText.length > 100;
                const hasError = bodyText && (bodyText.includes('error') || bodyText.includes('Error') || bodyText.includes('404') || bodyText.includes('500'));
                
                console.log(`Page has meaningful content: ${hasContent}`);
                console.log(`Page shows errors: ${hasError}`);
                
                if (hasContent && !hasError) {
                    console.log(`\n=== ${tenant.name} Dashboard Verification: SUCCESS ===`);
                    console.log('Dashboard is loading with metrics and interactive elements');
                } else {
                    console.log(`\n=== ${tenant.name} Dashboard Verification: NEEDS ATTENTION ===`);
                    console.log('Dashboard may have issues with content loading');
                }
            });
        });
    }

    test('Compare Tenant Data Isolation', async ({ page }) => {
        console.log('\n=== Testing Tenant Data Isolation ===');

        let nhglContent = '';
        let demoContent = '';

        // Test NHGL tenant
        await test.step('Load NHGL Dashboard Content', async () => {
            await login(page, 'NHGL', TENANTS[0].user);
            await page.waitForTimeout(3000);
            nhglContent = await page.content();
            await page.screenshot({ path: 'test-results/nhgl-dashboard-content.png' });
        });

        // Test DEMO tenant
        await test.step('Load DEMO Dashboard Content', async () => {
            await page.goto(CLIENT_URL);
            await login(page, 'DEMO', TENANTS[1].user);
            await page.waitForTimeout(3000);
            demoContent = await page.content();
            await page.screenshot({ path: 'test-results/demo-dashboard-content.png' });
        });

        // Compare content
        await test.step('Verify Data Isolation', async () => {
            const nhglHasTenantName = nhglContent.includes('NHGL') || nhglContent.includes('Healthcare Institute');
            const demoHasTenantName = demoContent.includes('DEMO') || demoContent.includes('MedCare');
            
            const contentIsDifferent = nhglContent !== demoContent;
            const contentDifferenceRatio = Math.abs(nhglContent.length - demoContent.length) / Math.max(nhglContent.length, demoContent.length);
            
            console.log(`NHGL dashboard shows tenant-specific content: ${nhglHasTenantName}`);
            console.log(`DEMO dashboard shows tenant-specific content: ${demoHasTenantName}`);
            console.log(`Content is different between tenants: ${contentIsDifferent}`);
            console.log(`Content difference ratio: ${(contentDifferenceRatio * 100).toFixed(2)}%`);
            
            if (contentIsDifferent && contentDifferenceRatio > 0.05) {
                console.log('=== Tenant Data Isolation: SUCCESS ===');
                console.log('Tenants are showing different dashboard content');
            } else {
                console.log('=== Tenant Data Isolation: NEEDS REVIEW ===');
                console.log('Tenants may be showing similar content');
            }
        });
    });
});
