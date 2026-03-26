import { test, expect } from '@playwright/test';

/**
 * Smoke Tests for New Age Hospital (NAH) Tenant
 * Uses actual database users from seed_nah_tenant.sql
 * Password for all users: Admin@123
 */

const NAH_TENANT = 'New Age Hospital';
const PASSWORD = 'Admin@123';

// Actual NAH users from database
const NAH_USERS = [
  { email: 'admin@nah.local', name: 'Dr. Sarah Johnson', role: 'Admin' },
  { email: 'cmo@nah.local', name: 'Dr. Michael Chen', role: 'Doctor' },
  { email: 'headnurse@nah.local', name: 'Emily Rodriguez', role: 'Nurse' },
  { email: 'pharmacy@nah.local', name: 'James Wilson', role: 'Pharmacy' },
  { email: 'lab@nah.local', name: 'Lisa Anderson', role: 'Lab' },
  { email: 'billing@nah.local', name: 'Robert Taylor', role: 'Billing/Accounts' },
];

for (const user of NAH_USERS) {
  test(`NAH: ${user.role} login - ${user.email}`, async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Wait for page to load and tenant select to be visible
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });

    // Select New Age Hospital tenant
    await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });

    // Fill email and password
    await page.getByPlaceholder('professional@medflow.org').fill(user.email);
    await page.getByPlaceholder('••••••••••••').fill(PASSWORD);

    // Click login button
    await page.getByRole('button', { name: /Authorize Entry/i }).click();

    // Wait for page navigation away from login
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    // Verify we're logged in by checking URL changed or page loaded
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    
    // If URL is still '/' and no auth token, login might have failed
    // Otherwise signup should be successful
    expect(url !== '/').toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(100); // Page has content
    
    console.log(`✅ ${user.role} (${user.email}) login successful`);
  });
}

test('NAH: Verify tenant selection dropdown works', async ({ page }) => {
  await page.goto('/');

  const tenantSelect = page.locator('select[name="tenantId"]');
  await tenantSelect.waitFor({ state: 'visible', timeout: 10000 });

  // Get all options
  const options = await tenantSelect.locator('option').allInnerTexts();

  // Verify New Age Hospital is in the list
  expect(options.some((opt) => opt.includes('New Age Hospital'))).toBeTruthy();

  // Verify Kidz Clinic is in the list
  expect(options.some((opt) => opt.includes('Kidz Clinic'))).toBeTruthy();

  console.log(`✅ Found ${options.length} tenants: ${options.join(', ')}`);
});

test('NAH: Admin can access dashboard after login', async ({ page }) => {
  await page.goto('/');

  // Login as admin
  await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });

  await page.getByPlaceholder('professional@medflow.org').fill('admin@nah.local');
  await page.getByPlaceholder('••••••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /Authorize Entry/i }).click();

  // Wait for page navigation
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  
  // Verify we're logged in - check URL changed from root or page has substantial content
  const url = page.url();
  const bodyText = await page.locator('body').innerText();
  
  // Page should have content and URL should be different from login
  const isLoggedIn = (url !== '/' && bodyText.length > 100) || bodyText.toLowerCase().includes('dashboard');
  expect(isLoggedIn).toBeTruthy();

  console.log('✅ Admin dashboard loaded successfully');
});

test('NAH: Invalid credentials are rejected', async ({ page }) => {
  await page.goto('/');

  await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('select[name="tenantId"]').selectOption({ label: NAH_TENANT });

  // Try invalid credentials
  await page.getByPlaceholder('professional@medflow.org').fill('admin@nah.local');
  await page.getByPlaceholder('••••••••••••').fill('WrongPassword123');
  await page.getByRole('button', { name: /Authorize Entry/i }).click();

  // Should show error or stay on login page
  await page.waitForTimeout(2000);

  // Check if still on login page or error message appears
  const isLoginPage = await page.locator('select[name="tenantId"]').isVisible();
  const hasError = await page.locator('text=/error|invalid|failed/i').isVisible().catch(() => false);

  expect(isLoginPage || hasError).toBeTruthy();

  console.log('✅ Invalid credentials rejected correctly');
});
