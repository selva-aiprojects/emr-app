import { test, expect } from '@playwright/test';

test.describe('UI Label Clarification Audit (v1.5.8)', () => {
  const TENANT = 'NHGL Healthcare Institute';
  const ADMIN_EMAIL = 'admin@ehs.com';
  const PASSWORD = 'admin123';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('select[name="tenantId"]').selectOption({ label: TENANT });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button:has-text("Login")').click();
    await page.waitForLoadState('networkidle');
  });

  test('Verify simplified navigation labels', async ({ page }) => {
    // 1. Check Sidebar Group Names
    await expect(page.getByText('Hospital Summary')).toBeVisible();
    await expect(page.getByText('Patient Desk')).toBeVisible();
    await expect(page.getByText('Lab & Test Services')).toBeVisible();
    await expect(page.getByText('Bed & Patient Care')).toBeVisible();
    await expect(page.getByText('Medicine & Stock')).toBeVisible();
    await expect(page.getByText('Billing & Payments')).toBeVisible();
    
    // 2. Check Module Titles inside groups
    // Hospital Summary Group
    await expect(page.locator('nav button:has-text("Hospital Summary")')).toBeVisible();
    await expect(page.locator('nav button:has-text("Reports & Analysis")')).toBeVisible();
  });

  test('Verify Hospital Control Room header badge', async ({ page }) => {
    // Check for the simplified badge in the header
    await expect(page.getByText('Hospital Control Room')).toBeVisible();
  });

  test('Verify simplified Dashboard metrics', async ({ page }) => {
    await page.locator('nav button:has-text("Hospital Summary")').click();
    
    // Check for simplified metric titles
    await expect(page.getByText('Total Registered Patients')).toBeVisible();
    await expect(page.getByText('Total Income')).toBeVisible();
    await expect(page.getByText('Check-up Bookings')).toBeVisible();
    await expect(page.getByText('System Alerts')).toBeVisible();
    
    // Check for chart titles
    await expect(page.getByText('Daily Income Analysis')).toBeVisible();
    await expect(page.getByText('Department Wise Patients')).toBeVisible();
  });

  test('Verify EMR / Patient Visit Notes labels', async ({ page }) => {
    // Navigate to EMR (Bed & Patient Care group or directly)
    await page.locator('nav button:has-text("Check-up & Prescription")').click();
    
    // Check Page Title
    await expect(page.getByRole('heading', { name: /Patient Visit Notes/i })).toBeVisible();
    await expect(page.getByText('Doctor\'s Visit')).toBeVisible();
    
    // Check Tab names
    await expect(page.getByRole('button', { name: /Active Patients/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Past Visits/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /New Assessment/i })).toBeVisible();
  });
});
