import { test, expect } from '@playwright/test';

const TENANT_NAME = 'New Age Hospital';
const ADMIN = { email: 'admin@nah.local', password: 'Admin@123', name: 'Dr. Sarah Johnson' };

test('Login performance (NAH admin)', async ({ page }) => {
  await page.goto('/');

  await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('select[name="tenantId"]').selectOption({ label: TENANT_NAME });

  await page.locator('input[type="email"]').fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);

  const start = Date.now();
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByText('Institutional Console')).toBeVisible({ timeout: 15000 });
  const elapsedMs = Date.now() - start;

  console.log(`Login time: ${elapsedMs} ms`);
});
