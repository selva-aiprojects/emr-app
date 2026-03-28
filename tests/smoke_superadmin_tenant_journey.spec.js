import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { query } from '../server/db/connection.js';

test.describe('Smoke: Superadmin -> Tenant Admin -> Role Journey', () => {
  test('End-to-end tenant workflow with fresh patient journey', async ({ page, request }) => {
    test.setTimeout(10 * 60 * 1000);

    const suffix = Date.now().toString().slice(-6);
    const tenantName = `Smoke Hospital ${suffix}`;
    const tenantCode = `SM${suffix}`.slice(0, 6).toUpperCase();
    const tenantSub = `smoke-${suffix}`.toLowerCase();
    const tenantAdminEmail = `admin+${suffix}@smoke.local`;
    const tenantAdminPassword = 'Test@123';

    // --- Superadmin: create tenant via UI
    await page.goto('/');
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('select[name="tenantId"]').selectOption({ label: 'Platform Governance Center' });
    await page.locator('input[type="email"]').fill('superadmin@emr.local');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.getByRole('button', { name: /Sign in|Authorize Entry|Continue to Workflow|Login/i }).click();
    await expect(page.getByText(/Provision New Tenant/i)).toBeVisible({ timeout: 20000 });

    await page.locator('input[name="name"]').fill(tenantName);
    await page.locator('input[name="contactEmail"]').fill(tenantAdminEmail);
    await page.locator('input[name="code"]').fill(tenantCode);
    await page.locator('input[name="subdomain"]').fill(tenantSub);
    await page.getByRole('button', { name: /Enterprise/i }).click();
    await page.getByRole('button', { name: /Provision Tenant/i }).click();
    await expect(page.getByText(/Tenant provisioned successfully!/i)).toBeVisible({ timeout: 20000 });

    // --- Fetch tenant id
    const tenantsRes = await request.get('http://127.0.0.1:4000/api/tenants');
    const tenants = await tenantsRes.json();
    const tenant = tenants.find((t) => t.name === tenantName);
    expect(tenant).toBeTruthy();

    // --- Seed Tenant Admin user directly (superadmin has no UI for this yet)
    const passwordHash = await bcrypt.hash(tenantAdminPassword, 10);
    await query(
      `INSERT INTO emr.users (tenant_id, email, password_hash, role, name, is_active)
       VALUES ($1, $2, $3, 'Admin', $4, true)
       ON CONFLICT (tenant_id, email)
       DO UPDATE SET role = 'Admin', name = $4, password_hash = $3, is_active = true`,
      [tenant.id, tenantAdminEmail, passwordHash, 'Tenant Admin']
    );

    // --- Tenant Admin login
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.locator('select[name="tenantId"]').selectOption({ label: tenantName });
    await page.locator('input[type="email"]').fill(tenantAdminEmail);
    await page.locator('input[type="password"]').fill(tenantAdminPassword);
    await page.getByRole('button', { name: /Sign in|Authorize Entry|Continue to Workflow|Login/i }).click();
    await expect(page.getByText(/Hospital Dashboard/i)).toBeVisible({ timeout: 20000 });

    // --- Tenant Admin: create masters (Department + Service)
    await page.getByRole('button', { name: /Departments Master|Departments/i }).click();
    await expect(page.getByText(/Institutional Departments Master/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Add Department Shard/i }).click();
    await page.getByPlaceholder(/Cardiology/i).fill(`Cardiology ${suffix}`);
    await page.getByPlaceholder(/CARD-01/i).fill(`CARD-${suffix.slice(0, 3)}`);
    await page.getByRole('button', { name: /Persist Shard/i }).click();
    await expect(page.getByText(new RegExp(`Cardiology ${suffix}`))).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Service Engine|Service Catalog/i }).click();
    await expect(page.getByText(/Institutional Service Catalog/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Add Service Shard/i }).click();
    await page.getByPlaceholder(/CBC Test/i).fill(`General Consultation ${suffix}`);
    await page.getByPlaceholder(/LAB-001/i).fill(`CONS-${suffix.slice(0, 3)}`);
    await page.locator('select').first().selectOption('Clinical');
    await page.locator('input[type=\"number\"]').first().fill('500');
    await page.getByRole('button', { name: /Persist Shard/i }).click();

    // --- Tenant Admin: create role users via UI
    await page.getByRole('button', { name: /Support Zone/i }).click();
    await expect(page.getByText(/Identity Authorization/i)).toBeVisible({ timeout: 15000 });

    const roleUsers = [
      { role: 'Doctor', email: `doctor+${suffix}@smoke.local`, name: 'Dr. Smoke Doctor' },
      { role: 'Nurse', email: `nurse+${suffix}@smoke.local`, name: 'Smoke Nurse' },
      { role: 'Lab', email: `lab+${suffix}@smoke.local`, name: 'Smoke Lab' },
      { role: 'Pharmacy', email: `pharmacy+${suffix}@smoke.local`, name: 'Smoke Pharmacist' },
      { role: 'HR', email: `hr+${suffix}@smoke.local`, name: 'Smoke HR' },
      { role: 'Accounts', email: `accounts+${suffix}@smoke.local`, name: 'Smoke Accountant' },
      { role: 'Support Staff', email: `support+${suffix}@smoke.local`, name: 'Smoke Service Staff' },
      { role: 'Front Office', email: `frontoffice+${suffix}@smoke.local`, name: 'Smoke Front Office' }
    ];

    for (const user of roleUsers) {
      await page.locator('input[name="name"]').fill(user.name);
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('select[name="role"]').selectOption({ label: user.role });
      await page.getByRole('button', { name: /Authorize Clinical Identity Node/i }).click();
      await page.waitForTimeout(500);
    }

    // --- Create a fresh patient journey via API (tenant admin token)
    const loginRes = await request.post('http://127.0.0.1:4000/api/login', {
      data: { tenantId: tenant.id, email: tenantAdminEmail, password: tenantAdminPassword }
    });
    const session = await loginRes.json();

    const patientPayload = {
      tenantId: tenant.id,
      userId: session.user.id,
      firstName: 'Fresh',
      lastName: `Patient${suffix}`,
      dob: '1991-01-01',
      gender: 'Male',
      phone: `90000${suffix}`,
      email: `patient+${suffix}@smoke.local`,
      bloodGroup: 'O+',
      insurance: 'Self'
    };

    const patientRes = await request.post('http://127.0.0.1:4000/api/patients', {
      data: patientPayload,
      headers: {
        Authorization: `Bearer ${session.token}`,
        'x-tenant-id': tenant.id
      }
    });
    const patient = await patientRes.json();

    const usersRes = await request.get(`http://127.0.0.1:4000/api/users?tenantId=${tenant.id}`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    const users = await usersRes.json();
    const doctor = users.find((u) => u.email === `doctor+${suffix}@smoke.local`);
    expect(doctor).toBeTruthy();

    await request.post('http://127.0.0.1:4000/api/appointments', {
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        patientId: patient.id,
        providerId: doctor.id,
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 60000).toISOString(),
        status: 'scheduled',
        reason: 'Smoke Check'
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
        'x-tenant-id': tenant.id
      }
    });

    const patientLabel = `${patient.firstName} ${patient.lastName}`;

    // --- Verify each role can find the fresh patient
    const roleChecks = [
      { role: 'Doctor', email: `doctor+${suffix}@smoke.local` },
      { role: 'Nurse', email: `nurse+${suffix}@smoke.local` },
      { role: 'Lab', email: `lab+${suffix}@smoke.local` },
      { role: 'Pharmacy', email: `pharmacy+${suffix}@smoke.local` },
      { role: 'HR', email: `hr+${suffix}@smoke.local` },
      { role: 'Accounts', email: `accounts+${suffix}@smoke.local` },
      { role: 'Support Staff', email: `support+${suffix}@smoke.local` },
      { role: 'Front Office', email: `frontoffice+${suffix}@smoke.local` }
    ];

    for (const check of roleChecks) {
      await page.evaluate(() => localStorage.clear());
      await page.goto('/');
      await page.locator('select[name="tenantId"]').selectOption({ label: tenantName });
      await page.locator('input[type="email"]').fill(check.email);
      await page.locator('input[type="password"]').fill(tenantAdminPassword);
      await page.getByRole('button', { name: /Sign in|Authorize Entry|Continue to Workflow|Login/i }).click();

      await page.locator('input[placeholder="Search patients, records..."]').waitFor({ state: 'visible', timeout: 20000 });
      await page.locator('input[placeholder="Search patients, records..."]').fill(patient.lastName);
      await expect(page.getByText(patientLabel)).toBeVisible({ timeout: 15000 });
    }
  });
});
