import { test, expect } from '@playwright/test';

const PASSWORD = 'Test@123';

const TENANTS = [
  { code: 'EHS', label: 'Enterprise Hospital Systems' },
  { code: 'city_general', label: 'City General Hospital' },
];

const ROLES = [
  { key: 'admin', displayName: (tenantCode) => `Platform Admin ${tenantCode.toUpperCase()}` },
  { key: 'nurse', displayName: (tenantCode) => `Senior Nurse ${tenantCode.toUpperCase()}` },
  { key: 'lab', displayName: (tenantCode) => `Lab Specialist ${tenantCode.toUpperCase()}` },
  { key: 'insurance', displayName: (tenantCode) => `Insurance Desk ${tenantCode.toUpperCase()}` },
  { key: 'billing', displayName: (tenantCode) => `Billing Executive ${tenantCode.toUpperCase()}` },
  { key: 'accounts', displayName: (tenantCode) => `Accounts Team ${tenantCode.toUpperCase()}` },
  { key: 'auditor', displayName: (tenantCode) => `Internal Auditor ${tenantCode.toUpperCase()}` },
  { key: 'management', displayName: (tenantCode) => `Management User ${tenantCode.toUpperCase()}` },
];

async function login(page, tenantCode, email) {
  await page.goto('/');
  const tenantSelect = page.locator('select').first();
  await tenantSelect.waitFor({ state: 'visible' });
  await tenantSelect.selectOption(tenantCode);
  await expect(tenantSelect).toHaveValue(tenantCode);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In to Dashboard/i }).click();
}

for (const tenant of TENANTS) {
  for (const role of ROLES) {
    test(`Smoke: ${role.key} login works on ${tenant.code}`, async ({ page }) => {
      const email = `${role.key}.${tenant.code.toLowerCase()}@emr.local`;
      const expectedName = role.displayName(tenant.code);

      await login(page, tenant.code, email);

      await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible({ timeout: 20000 });
      await expect(page.getByText(expectedName).first()).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole('button', { name: /Help/i })).toBeVisible();
    });
  }
}
