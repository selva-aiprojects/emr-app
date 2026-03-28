
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.playwright' });

test.describe('Golden Path E2E Workflow', () => {
  // Use real Superadmin credentials from CORRECTED_CREDENTIALS.md
  const superadmin = {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD
  };
  let tenantName = `TestHospital-${Date.now()}`;
  let tenantAdmin = { email: faker.internet.email(), password: 'Admin@123' };
  let users = {
    doctor: { email: faker.internet.email(), password: 'Doc@123' },
    nurse: { email: faker.internet.email(), password: 'Nurse@123' },
    lab: { email: faker.internet.email(), password: 'Lab@123' },
    pharmacist: { email: faker.internet.email(), password: 'Pharm@123' },
    hr: { email: faker.internet.email(), password: 'HR@123' },
    support: { email: faker.internet.email(), password: 'Support@123' },
    admin: tenantAdmin,
  };
  let stockBefore: number, stockAfter: number;
  let patientIP = { name: faker.person.fullName(), type: 'IP' };
  let patientOP = { name: faker.person.fullName(), type: 'OP' };

  test('Tenant Management: Create new hospital tenant', async ({ page }) => {
    await page.goto('/login');
    // Select organization (superadmin)
    await page.selectOption('select[name="tenantId"]', { label: 'Platform Governance Center' });
    await page.fill('input[type="email"]', superadmin.email);
    await page.fill('input[type="password"]', superadmin.password);
    await page.click('button[type="submit"]');
    // TODO: Update the following steps to match your actual tenant management UI
    // await page.goto('/admin/tenants');
    // await page.click('[data-testid="add-tenant-btn"]');
    // await page.fill('[data-testid="tenant-name"]', tenantName);
    // await page.fill('[data-testid="tenant-admin-email"]', tenantAdmin.email);
    // await page.fill('[data-testid="tenant-admin-password"]', tenantAdmin.password);
    // await page.click('[data-testid="save-tenant-btn"]');
    // await expect(page.locator(`[data-testid="tenant-row-${tenantName}"]`)).toBeVisible();
  });

  test('HR & User Provisioning: Add users for all roles', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', tenantAdmin.email);
    await page.fill('input[type="password"]', tenantAdmin.password);
    await page.click('button[type="submit"]');
    await page.goto('/admin');
    for (const [role, creds] of Object.entries(users)) {
      if (role === 'admin') continue;
      await page.fill('input[name="name"]', `${role.charAt(0).toUpperCase() + role.slice(1)} TestUser`);
      await page.fill('input[name="email"]', creds.email);
      await page.selectOption('select[name="role"]', { label: role.charAt(0).toUpperCase() + role.slice(1) });
      await page.click('button:has-text("AUTHORIZE CLINICAL IDENTITY NODE")');
      // Optionally, check for a success message or user in the list
      // await expect(page.locator(`text=${creds.email}`)).toBeVisible();
    }
  });

  test('Inventory & Procurement: Procure and stock items', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.click('button[type="submit"]');
    await page.goto('/procurement');
    await page.click('[data-testid="new-procurement-btn"]');
    await page.fill('[data-testid="item-name"]', 'Paracetamol');
    await page.fill('[data-testid="item-qty"]', '100');
    await page.fill('[data-testid="item-type"]', 'Medicine');
    await page.click('[data-testid="submit-procurement-btn"]');
    await expect(page.locator('[data-testid="procurement-status"]')).toHaveText('Pending');
    await page.click('[data-testid="approve-procurement-btn"]');
    await expect(page.locator('[data-testid="procurement-status"]')).toHaveText('Approved');
    await page.goto('/inventory');
    stockBefore = await page.locator('[data-testid="stock-Paracetamol"]').innerText();
    expect(Number(stockBefore)).toBeGreaterThanOrEqual(100);
  });

  test('Patient Life Cycle: Register IP and OP', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.hr.email);
    await page.fill('input[type="password"]', users.hr.password);
    await page.click('button[type="submit"]');
    for (const patient of [patientIP, patientOP]) {
      await page.goto('/patients/register');
      await page.fill('[data-testid="patient-name"]', patient.name);
      await page.selectOption('[data-testid="patient-type"]', patient.type);
      await page.click('[data-testid="register-patient-btn"]');
      await expect(page.locator(`[data-testid="patient-row-${patient.name}"]`)).toBeVisible();
    }
  });

  test('Assign Lab Test and Enter Result', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.doctor.email);
    await page.fill('input[type="password"]', users.doctor.password);
    await page.click('button[type="submit"]');
    await page.goto('/patients');
    await page.click(`[data-testid="assign-lab-btn-${patientIP.name}"]`);
    await page.selectOption('[data-testid="lab-test-type"]', 'Blood Test');
    await page.click('[data-testid="assign-test-btn"]');
    await expect(page.locator('[data-testid="lab-status"]')).toHaveText('Assigned');
    await page.goto('/logout');
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.lab.email);
    await page.fill('input[type="password"]', users.lab.password);
    await page.click('button[type="submit"]');
    await page.goto('/lab');
    await page.click(`[data-testid="enter-result-btn-${patientIP.name}"]`);
    await page.fill('[data-testid="lab-result"]', 'Normal');
    await page.click('[data-testid="submit-result-btn"]');
    await expect(page.locator('[data-testid="lab-status"]')).toHaveText('Completed');
  });

  test('Pharmacy: Fulfill Prescription and Update Stock', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.pharmacist.email);
    await page.fill('input[type="password"]', users.pharmacist.password);
    await page.click('button[type="submit"]');
    await page.goto('/pharmacy');
    await page.click(`[data-testid="fulfill-prescription-btn-${patientIP.name}"]`);
    await page.fill('[data-testid="medicine-name"]', 'Paracetamol');
    await page.fill('[data-testid="medicine-qty"]', '10');
    await page.click('[data-testid="dispense-btn"]');
    await expect(page.locator('[data-testid="prescription-status"]')).toHaveText('Dispensed');
    await page.goto('/inventory');
    stockAfter = await page.locator('[data-testid="stock-Paracetamol"]').innerText();
    expect(Number(stockAfter)).toBe(Number(stockBefore) - 10);
  });

  test('Billing: Generate Final Bill', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.click('button[type="submit"]');
    await page.goto('/billing');
    await page.click(`[data-testid="generate-bill-btn-${patientIP.name}"]`);
    await expect(page.locator('[data-testid="bill-total"]')).toContainText('Consultation');
    await expect(page.locator('[data-testid="bill-total"]')).toContainText('Lab');
    await expect(page.locator('[data-testid="bill-total"]')).toContainText('Pharmacy');
  });

  test('Analytics: Verify Admin Dashboard Metrics', async ({ page }) => {
    await page.goto('/login');
    await page.selectOption('select[name="tenantId"]', tenantAdmin.tenantId || '');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.click('button[type="submit"]');
    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="dashboard-total-patients"]')).toContainText('2');
    await expect(page.locator('[data-testid="dashboard-revenue"]')).not.toContainText('0');
    await expect(page.locator('[data-testid="dashboard-stock-Paracetamol"]')).toContainText(String(stockAfter));
  });
});
