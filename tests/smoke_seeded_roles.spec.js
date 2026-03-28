import { test, expect } from '@playwright/test';

const PASSWORD = 'Test@123';

// Use New Age Hospital (NAH) which has a full staff roster
const TENANTS = [
  { code: 'nah', label: 'New Age Hospital' },
];

const ROLES = [
  { key: 'admin', email: 'admin@nah.local', password: 'Admin@123', displayName: /Sarah/i },
  { key: 'doctor', email: 'cmo@nah.local', password: 'Admin@123', displayName: /Michael/i },
  { key: 'nurse', email: 'headnurse@nah.local', password: 'Admin@123', displayName: /Emily/i },
  { key: 'lab', email: 'lab@nah.local', password: 'Admin@123', displayName: /Lisa/i },
  { key: 'pharmacy', email: 'pharmacy@nah.local', password: 'Admin@123', displayName: /James/i },
  { key: 'billing', email: 'billing@nah.local', password: 'Admin@123', displayName: /Robert/i },
];

async function login(page, tenantLabel, email, password) {
  await page.goto('/');
  
  // Wait for tenant select to load
  await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });
  
  // Login
  await page.locator('select[name="tenantId"]').selectOption({ label: tenantLabel });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Authorize Entry|Continue to Workflow|Login/i }).click();
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
