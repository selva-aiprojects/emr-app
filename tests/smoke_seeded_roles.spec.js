import { test, expect } from '@playwright/test';

const PASSWORD = 'Test@123';

// Use New Age Hospital (NAH) which has a full staff roster
const TENANTS = [
  { code: 'nah', label: 'New Age Hospital' },
];

const ROLES = [
  { key: 'admin', email: 'admin@newage.hospital', password: 'Admin@123', displayName: /Sarah/i },
  { key: 'doctor', email: 'cmo@nah.local', password: 'Admin@123', displayName: /Michael/i },
  { key: 'nurse', email: 'headnurse@nah.local', password: 'Admin@123', displayName: /Emily/i },
  { key: 'lab', email: 'lab@nah.local', password: 'Admin@123', displayName: /Lisa/i },
  { key: 'pharmacy', email: 'pharmacy@nah.local', password: 'Admin@123', displayName: /James/i },
  { key: 'billing', email: 'billing@nah.local', password: 'Admin@123', displayName: /Robert/i },
];

async function login(page, tenantLabel, email, password) {
  await page.goto('/');
  
  // Wait for tenant select to load and be interactive
  const tenantSelect = page.locator('select[name="tenantId"]');
  await tenantSelect.waitFor({ state: 'visible', timeout: 15000 });
  
  // Login
  await tenantSelect.selectOption({ label: tenantLabel });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  
  const loginButton = page.getByRole('button', { name: /Authorize Entry|Authenticate Protocol|Login|Sign In/i });
  await loginButton.click();
  
  // Wait for the application to load post-login
  await page.waitForLoadState('networkidle');
}

for (const tenant of TENANTS) {
  for (const role of ROLES) {
    test(`Smoke: ${role.key} login works on ${tenant.code}`, async ({ page }) => {
      await login(page, tenant.label, role.email, role.password);

      // Verify sign out button is present, confirming successful session
      const signoutBtn = page.getByRole('button', { name: /Sign Out|Logout|Authenticate Protocol/i }).first();
      // Note: "Authenticate Protocol" is the label on the button itself while it might be loading or if we haven't transitioned
      // Better to check for actual dashboard indicators
      
      const userDisplay = page.getByText(role.displayName).first();
      await expect(userDisplay).toBeVisible({ timeout: 25000 });
      
      // Secondary check for the sign out option which is a clear indicator of being logged in
      const signout = page.locator('button').filter({ hasText: /Sign Out|Logout/i });
      await expect(signout.first()).toBeVisible({ timeout: 10000 });
    });
  }
}
