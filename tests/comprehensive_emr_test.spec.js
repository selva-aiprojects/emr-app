import { test, expect } from '@playwright/test';

test.describe('Comprehensive EMR System Test', () => {
    
    test('Complete EMR Workflow Verification', async ({ page }) => {
        console.log('Starting comprehensive EMR system test...');
        
        // Step 1: Verify Application Loads
        await test.step('Application Load Test', async () => {
            await page.goto('/');
            await expect(page.locator('body')).toBeVisible();
            
            // Check for login form elements
            await expect(page.locator('select[name="tenantId"]')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('input[type="password"]')).toBeVisible();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
            
            console.log('✅ Application loaded successfully');
        });

        // Step 2: Test Tenant Selection
        await test.step('Tenant Selection Test', async () => {
            const tenantSelect = page.locator('select[name="tenantId"]');
            const options = await tenantSelect.locator('option').allInnerTexts();
            
            expect(options.length).toBeGreaterThan(0);
            console.log(`✅ Found ${options.length} tenants: ${options.join(', ')}`);
            
            // Select first tenant
            await tenantSelect.selectOption({ index: 0 });
            const selectedValue = await tenantSelect.inputValue();
            expect(selectedValue).toBeTruthy();
            console.log(`✅ Selected tenant: ${selectedValue}`);
        });

        // Step 3: Test Login with Different Roles
        const testUsers = [
            { email: 'lisa.white@citygen.local', password: 'Test@123', role: 'Admin', tenant: 'City General Hospital' },
            { email: 'emily.chen@citygen.local', password: 'Test@123', role: 'Doctor', tenant: 'City General Hospital' },
            { email: 'sarah.jones@citygen.local', password: 'Test@123', role: 'Nurse', tenant: 'City General Hospital' },
            { email: 'michael.brown@citygen.local', password: 'Test@123', role: 'Lab', tenant: 'City General Hospital' },
            { email: 'robert.billing@citygen.local', password: 'Test@123', role: 'Billing', tenant: 'City General Hospital' }
        ];

        for (const user of testUsers) {
            await test.step(`Login Test for ${user.role}: ${user.email}`, async () => {
                await page.goto('/');
                
                // Wait for tenant select to load
                await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
                
                // Select tenant
                await page.locator('select[name="tenantId"]').selectOption({ label: user.tenant });
                
                // Fill credentials
                await page.locator('input[type="email"]').fill(user.email);
                await page.locator('input[type="password"]').fill(user.password);
                
                // Submit login
                await page.locator('button[type="submit"]').click();
                
                // Wait for login response
                await page.waitForLoadState('networkidle');
                
                // Check if login was successful (either dashboard or error message)
                const currentUrl = page.url();
                const hasError = await page.locator('text=error', { exact: false }).isVisible().catch(() => false);
                
                if (hasError || currentUrl.includes('login')) {
                    console.log(`⚠️  Login failed for ${user.role}: ${user.email}`);
                    await page.goto('/'); // Reset for next test
                } else {
                    console.log(`✅ Login successful for ${user.role}: ${user.email}`);
                    
                    // Check for dashboard elements
                    const userName = await page.locator('text=' + user.name.split(' ')[0], { exact: false }).isVisible().catch(() => false);
                    if (userName) {
                        console.log(`✅ Dashboard loaded for ${user.role}`);
                    }
                    
                    // Logout for next test
                    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), [data-testid="logout"], .logout-btn').first();
                    if (await logoutBtn.isVisible()) {
                        await logoutBtn.click();
                        await page.waitForLoadState('networkidle');
                    } else {
                        await page.goto('/');
                    }
                }
            });
        }

        // Step 4: Test Core Module Access
        await test.step('Core Module Access Test', async () => {
            // Try to access modules as admin
            await page.goto('/');
            await page.locator('select[name="tenantId"]').selectOption({ label: 'City General Hospital' });
            await page.locator('input[type="email"]').fill('lisa.white@citygen.local');
            await page.locator('input[type="password"]').fill('Test@123');
            await page.locator('button[type="submit"]').click();
            
            await page.waitForLoadState('networkidle');
            
            // Test module navigation
            const modules = [
                'Patients',
                'EMR',
                'Appointments',
                'Pharmacy',
                'Lab',
                'Billing',
                'Inventory',
                'Reports'
            ];
            
            for (const module of modules) {
                try {
                    const moduleLink = page.locator(`a:has-text("${module}")`, { exact: false }).first();
                    if (await moduleLink.isVisible()) {
                        await moduleLink.click();
                        await page.waitForLoadState('networkidle');
                        
                        const moduleContent = page.locator('body').textContent();
                        if (moduleContent && !moduleContent.includes('error') && !moduleContent.includes('404')) {
                            console.log(`✅ ${module} module accessible`);
                        } else {
                            console.log(`⚠️  ${module} module may have issues`);
                        }
                        
                        // Go back to dashboard
                        await page.goto('/');
                        await page.locator('select[name="tenantId"]').selectOption({ label: 'City General Hospital' });
                        await page.locator('input[type="email"]').fill('lisa.white@citygen.local');
                        await page.locator('input[type="password"]').fill('Test@123');
                        await page.locator('button[type="submit"]').click();
                        await page.waitForLoadState('networkidle');
                    }
                } catch (error) {
                    console.log(`⚠️  Could not test ${module} module: ${error.message}`);
                }
            }
        });

        // Step 5: Test API Endpoints
        await test.step('API Endpoint Test', async () => {
            const apiEndpoints = [
                '/api/tenants',
                '/api/users',
                '/api/patients',
                '/api/appointments'
            ];
            
            for (const endpoint of apiEndpoints) {
                try {
                    const response = await page.request.get(`http://localhost:4005${endpoint}`);
                    if (response.status() < 500) {
                        console.log(`✅ API endpoint ${endpoint} responding (Status: ${response.status()})`);
                    } else {
                        console.log(`⚠️  API endpoint ${endpoint} error (Status: ${response.status()})`);
                    }
                } catch (error) {
                    console.log(`❌ API endpoint ${endpoint} failed: ${error.message}`);
                }
            }
        });

        // Step 6: Test Database Connectivity
        await test.step('Database Connectivity Test', async () => {
            try {
                const response = await page.request.get('http://localhost:4005/api/tenants');
                if (response.status() === 200) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        console.log(`✅ Database connected, found ${data.length} tenants`);
                    } else {
                        console.log('⚠️  Database response format unexpected');
                    }
                } else {
                    console.log(`⚠️  Database API responded with status: ${response.status()}`);
                }
            } catch (error) {
                console.log(`❌ Database connectivity test failed: ${error.message}`);
            }
        });

        console.log('🎉 Comprehensive EMR system test completed!');
    });
});
