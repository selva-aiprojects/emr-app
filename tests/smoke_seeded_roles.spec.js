import { test, expect } from '@playwright/test';

const PASSWORD = 'Test@123';

// Use New Age Hospital (NAH) which has a full staff roster
const TENANTS = [
  { code: 'nah', label: 'New Age Hospital' },
];

const ROLES = [
  { key: 'admin', email: 'admin@nah.com', password: 'Admin@123', displayName: /Admin/i },
  { key: 'doctor', email: 'sarah@nah.com', password: 'Admin@123', displayName: /Sarah/i },
  { key: 'nurse', email: 'joy@nah.com', password: 'Admin@123', displayName: /Joy/i },
  { key: 'lab', email: 'leo@nah.com', password: 'Admin@123', displayName: /Leo/i },
  { key: 'pharmacy', email: 'peter@nah.com', password: 'Admin@123', displayName: /Peter/i },
  { key: 'billing', email: 'alex@nah.com', password: 'Admin@123', displayName: /Alex/i },
];

async function login(page, tenantLabel, email, password) {
  await page.goto('/');
  
  // Wait for tenant select to load
  await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
  
  // Login
  await page.locator('select[name="tenantId"]').selectOption({ label: tenantLabel });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Continue to Workflow/i }).click();
}

for (const tenant of TENANTS) {
  for (const role of ROLES) {
    test(`Smoke: ${role.key} login works on ${tenant.code}`, async ({ page }) => {
      await login(page, tenant.label, role.email, role.password);

      await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible({ timeout: 20000 });
      await expect(page.getByText(role.displayName).first()).toBeVisible({ timeout: 20000 });
    });
  }
}
