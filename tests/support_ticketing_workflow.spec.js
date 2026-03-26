import { test, expect } from '@playwright/test';

const NAH_TENANT = 'New Age Hospital';
const PASSWORD = 'Admin@123';

test.describe('Support Ticketing Persona Workflows', () => {

  test('Tenant Admin can access Support and create a ticket', async ({ page }) => {
    // Login as Admin
    await page.goto('/');
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });
    await page.getByPlaceholder('professional@medflow.org').fill('admin@nah.local');
    await page.getByPlaceholder('••••••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: /Authorize Entry/i }).click();

    // Wait for dashboard Navigation
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    // Expand Notice & Helpdesk section if needed (sidebar groups)
    // Actually, buttons are usually directly visible. Let's just click the Unit Maintenance button.
    const supportBtn = page.getByRole('button', { name: /Unit Maintenance/i, exact: false });
    await supportBtn.waitFor({ state: 'visible', timeout: 5000 });
    await supportBtn.click();

    // Verify Support Page loaded
    await expect(page.getByText('Facility Operations', { exact: false })).toBeVisible({ timeout: 10000 });

    // Create a new Ticket
    const raiseBtn = page.getByRole('button', { name: /\+ Raise Ticket/i, exact: false });
    await raiseBtn.waitFor({ state: 'visible' });
    await raiseBtn.click();
    
    // Fill the ticket form
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'Maintenance' }).click();

    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'High' }).click();

    await page.getByPlaceholder(/e\.g\. ICU Ward 3/i).fill('Ward C - Bed 12');
    await page.getByPlaceholder(/Detail the issue/i).fill('Automated Test: AC is leaking water.');
    
    // Submit
    await page.getByRole('button', { name: /Create Ticket/i, exact: false }).click();

    // Verify ticket appears in the list
    await expect(page.getByText('Automated Test: AC is leaking water.')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Admin successfully created a support ticket');
  });

  test('Doctor cannot access the Support module', async ({ page }) => {
    // Login as Doctor
    await page.goto('/');
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });
    await page.getByPlaceholder('professional@medflow.org').fill('cmo@nah.local');
    await page.getByPlaceholder('••••••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: /Authorize Entry/i }).click();

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});

    // Verify Support Link is NOT visible
    const supportBtn = page.getByRole('button', { name: /Unit Maintenance/i, exact: false });
    await expect(supportBtn).toHaveCount(0);
    
    console.log('✅ Doctor correctly restricted from Support module');
  });

});
