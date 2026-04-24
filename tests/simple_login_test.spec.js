import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';

test.describe('Simple Login Test', () => {

    test('Check Login Page Structure', async ({ page }) => {
        console.log('Checking login page structure...');
        
        await page.goto(CLIENT_URL);
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/login-page-structure.png' });
        
        // Check if tenant selector exists
        const tenantSelector = page.locator('select[name="tenantId"]');
        if (await tenantSelector.isVisible()) {
            console.log('Tenant selector found');
            
            // Get available options
            const options = await tenantSelector.locator('option').allTextContents();
            console.log('Available tenant options:', options);
        } else {
            console.log('Tenant selector NOT found');
        }
        
        // Check for email field
        const emailField = page.locator('input[type="email"]');
        if (await emailField.isVisible()) {
            console.log('Email field found');
        } else {
            console.log('Email field NOT found');
        }
        
        // Check for password field
        const passwordField = page.locator('input[type="password"]');
        if (await passwordField.isVisible()) {
            console.log('Password field found');
        } else {
            console.log('Password field NOT found');
        }
        
        // Check for submit button
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
            console.log('Submit button found');
            const buttonText = await submitButton.textContent();
            console.log('Submit button text:', buttonText);
        } else {
            console.log('Submit button NOT found');
        }
        
        // Check page title
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check for any error messages
        const errorElements = page.locator('.error, .alert, [role="alert"]');
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
            console.log(`Found ${errorCount} error/alert elements`);
            for (let i = 0; i < errorCount; i++) {
                const errorText = await errorElements.nth(i).textContent();
                console.log(`Error ${i + 1}: ${errorText}`);
            }
        }
    });

    test('Try Login with DEMO Admin', async ({ page }) => {
        console.log('Trying login with DEMO admin...');
        
        await page.goto(CLIENT_URL);
        await page.waitForTimeout(2000);
        
        // Select DEMO tenant
        const tenantSelector = page.locator('select[name="tenantId"]');
        await expect(tenantSelector).toBeVisible({ timeout: 10000 });
        await tenantSelector.selectOption('DEMO');
        
        // Fill credentials
        await page.fill('input[type="email"]', 'admin@demo.hospital');
        await page.fill('input[type="password"]', 'Test@123');
        
        // Take screenshot before login
        await page.screenshot({ path: 'test-results/before-login-demo.png' });
        
        // Submit login
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Take screenshot after login
        await page.screenshot({ path: 'test-results/after-login-demo.png' });
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after login:', currentUrl);
        
        // Check for any dashboard content
        const bodyContent = await page.content();
        const hasDashboard = bodyContent.includes('dashboard') || 
                           bodyContent.includes('Dashboard') ||
                           bodyContent.includes('admin') ||
                           bodyContent.includes('Admin');
        
        console.log('Has dashboard content:', hasDashboard);
        
        // Check for error messages
        const errorElements = page.locator('.error, .alert, [role="alert"]');
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
            console.log('Found error messages after login:');
            for (let i = 0; i < errorCount; i++) {
                const errorText = await errorElements.nth(i).textContent();
                console.log(`Error ${i + 1}: ${errorText}`);
            }
        }
    });

    test('Try Login with NHGL Doctor', async ({ page }) => {
        console.log('Trying login with NHGL doctor...');
        
        await page.goto(CLIENT_URL);
        await page.waitForTimeout(2000);
        
        // Select NHGL tenant
        const tenantSelector = page.locator('select[name="tenantId"]');
        await expect(tenantSelector).toBeVisible({ timeout: 10000 });
        await tenantSelector.selectOption('NHGL');
        
        // Fill credentials
        await page.fill('input[type="email"]', 'rajesh.kumar@nhgl.hospital');
        await page.fill('input[type="password"]', 'Test@123');
        
        // Take screenshot before login
        await page.screenshot({ path: 'test-results/before-login-nhgl.png' });
        
        // Submit login
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Take screenshot after login
        await page.screenshot({ path: 'test-results/after-login-nhgl.png' });
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after login:', currentUrl);
        
        // Check for any dashboard content
        const bodyContent = await page.content();
        const hasDashboard = bodyContent.includes('dashboard') || 
                           bodyContent.includes('Dashboard') ||
                           bodyContent.includes('doctor') ||
                           bodyContent.includes('Doctor');
        
        console.log('Has dashboard content:', hasDashboard);
        
        // Check for error messages
        const errorElements = page.locator('.error, .alert, [role="alert"]');
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
            console.log('Found error messages after login:');
            for (let i = 0; i < errorCount; i++) {
                const errorText = await errorElements.nth(i).textContent();
                console.log(`Error ${i + 1}: ${errorText}`);
            }
        }
    });
});
