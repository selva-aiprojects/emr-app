import { test, expect } from '@playwright/test';

const ADMIN = {
  tenantCode: 'NHGL',
  email: 'admin@nhgl.com',
  password: 'Test@123',
};

function buildPatient(prefix) {
  const stamp = Date.now();
  return {
    firstName: 'John',
    lastName: `${prefix}-${stamp}`,
    dob: '1990-05-15',
    gender: 'Male',
    phone: `99${String(stamp).slice(-8)}`,
    email: `${prefix.toLowerCase()}-${stamp}@example.com`,
  };
}

async function loginAsAdmin(page) {
  await page.goto('http://localhost:5175/');
  await page.selectOption('select[name="tenantId"]', ADMIN.tenantCode);
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await page.click('button:has-text("Sign In to Workspace")');
  await expect(page.locator('text=/Institutional Control Plane/i').first()).toBeVisible({ timeout: 30000 });
}

async function openNav(page, moduleName, headingPattern) {
  await page.locator(`[data-testid="nav-${moduleName}"]`).first().click({ force: true });
  if (headingPattern) {
    await expect(page.locator(headingPattern).first()).toBeVisible({ timeout: 15000 });
  }
}

async function selectPatientFromSearch(page, patientLastName) {
  const searchInput = page.locator('input[placeholder*="Search by Name, MRN, or Phone"]').first();
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type(patientLastName, { delay: 40 });
  await page.waitForTimeout(800);
  const result = page.locator('div[data-testid="search-result"]', { hasText: patientLastName }).first();
  await expect(result).toBeVisible({ timeout: 15000 });
  await result.click();
}

test.describe.serial('NHGL Complete Lifecycle Coverage', () => {
  test('covers outpatient, inpatient, diagnostics, pharmacy, billing, and major navigation tabs', async ({ page }) => {
    test.setTimeout(360000);
    const patient = buildPatient('Lifecycle-Patient');

    await loginAsAdmin(page);

    await openNav(page, 'dashboard', 'text=/Institutional Control Plane|Hospital Summary/i');
    await openNav(page, 'find_doctor', 'h1:has-text("Find a Doctor")');
    await openNav(page, 'doctor_availability', 'text=/Doctor Timing|Availability|Doctor/i');

    await openNav(page, 'patients', 'text=/Patient Records|Patient Desk|Registration/i');
    await page.click('button:has-text("New Registration")');
    await page.fill('input[name="firstName"]', patient.firstName);
    await page.fill('input[name="lastName"]', patient.lastName);
    await page.fill('input[name="dob"]', patient.dob);
    await page.selectOption('select[name="gender"]', patient.gender);
    await page.fill('input[name="phone"]', patient.phone);
    await page.fill('input[name="email"]', patient.email);
    await page.check('input[name="consent"]');
    await page.click('button:has-text("REGISTER PATIENT")');
    const patientRow = page.locator('tr[data-testid="patient-row"]', { hasText: patient.lastName }).first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();

    await expect(page.locator('button:has-text("New Assessment")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Active Patients")');
    await page.click('button:has-text("Past Visits")');
    await page.click('button:has-text("New Assessment")');
    await page.selectOption('select[name="type"]', 'Out-patient');
    await page.fill('input[name="bp"]', '120/80');
    await page.fill('input[name="hr"]', '72');
    await page.fill('[name="complaint"]', 'NHGL outpatient validation');
    await page.fill('[name="diagnosis"]', 'Stable for workflow validation');
    await page.selectOption('select:has-text("Select investigation")', 'Complete Blood Count');
    await page.fill('input[placeholder*="Search drug catalog"]', 'Amoxicillin');
    await page.waitForSelector('text=Amoxicillin', { timeout: 10000 });
    await page.click('text=Amoxicillin');
    await page.click('button[type="submit"]:has-text("Commit")');
    await expect(page.locator(`text=${patient.lastName}`).first()).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Clinical Timeline")');
    await expect(page.locator(`text=${patient.lastName}`).first()).toBeVisible({ timeout: 15000 });

    await openNav(page, 'inpatient', 'h1:has-text("Admissions & Bed Governance")');
    await page.locator('button:has-text("Ledger")').last().click({ force: true });
    await page.locator('button:has-text("Occupancy")').last().click({ force: true });
    await page.locator('button:has-text("Admission")').last().click({ force: true });
    await expect(page.locator('h3:has-text("Bed Allocation Protocol")')).toBeVisible();
    await selectPatientFromSearch(page, patient.lastName);
    const wardSelect = page.locator('select[name="wardId"]');
    const wardCount = await wardSelect.locator('option').count();
    await wardSelect.selectOption({ index: wardCount > 1 ? 1 : 0 });
    const bedSelect = page.locator('input[name="bedId"] ~ div select').first();
    await expect(bedSelect).toBeVisible();
    const bedOptions = bedSelect.locator('option');
    await expect.poll(async () => await bedOptions.count()).toBeGreaterThan(1);
    await bedSelect.selectOption({ index: 1 });
    await page.click('button:has-text("Confirm Admission")');
    await page.locator('button:has-text("Ledger")').last().click({ force: true });
    await expect(page.locator(`tr[data-patient-name="${patient.firstName} ${patient.lastName}"]`)).toBeVisible({ timeout: 15000 });

    await openNav(page, 'lab', 'h1:has-text("Laboratory & Diagnostic Hub")');
    await page.locator('button:has-text("Monitor")').last().click({ force: true });
    await page.locator('button:has-text("Clinical Orders")').last().click({ force: true });
    const labRow = page.locator('tr').filter({ hasText: patient.lastName }).first();
    await expect(labRow).toBeVisible({ timeout: 20000 });
    await labRow.locator('button:has-text("Record Observation")').click();
    await page.fill('input[name="resultValue"]', '14.5');
    await page.click('button:has-text("Authorize & Commit Outcome")');

    await openNav(page, 'pharmacy', 'text=/Pharmacy Inventory Intelligence|Pharmacy/i');
    await page.click('[data-testid="tab-queue"]');
    
    const prescriptionRow = page.locator('tr').filter({ hasText: patient.lastName }).first();
    await expect(prescriptionRow).toBeVisible({ timeout: 20000 });
    
    await prescriptionRow.locator('button:has-text("Release Node")').click();
    await expect(page.locator('h3:has-text("Release Protocol")')).toBeVisible();
    await page.click('button:has-text("Authorize Release")');
    await expect(page.locator('text=Medication dispensed successfully')).toBeVisible({ timeout: 15000 });

    await openNav(page, 'billing', 'text=/Revenue Cycle Hub|Billing/i');
    await page.click('button:has-text("New Statement")');
    await selectPatientFromSearch(page, patient.lastName);
    await page.fill('input[name="description"]', 'Lifecycle validation invoice');
    await page.fill('input[name="amount"]', '1500');
    await page.fill('input[name="taxPercent"]', '5');
    await page.selectOption('select[name="paymentMethod"]', 'Cash');
    await page.click('button:has-text("FINALISE & AUTHORISE STATEMENT")');
    await page.click('button:has-text("Ledger")');
    const invoiceRow = page.locator('tr[data-testid="invoice-row"]').filter({ hasText: patient.lastName }).first();
    await expect(invoiceRow).toBeVisible({ timeout: 15000 });
    await invoiceRow.locator('button:has-text("PayLink")').click();
    await page.click('button:has-text("Commit Settlement Shard")');

    // 7. INPATIENT DISCHARGE (Lifecycle Graduation)
    await openNav(page, 'inpatient', 'h1:has-text("Admissions & Bed Governance")');
    await page.locator('button:has-text("Ledger")').last().click({ force: true });
    const admittedRow = page.locator('tr').filter({ hasText: patient.lastName }).first();
    await expect(admittedRow).toBeVisible({ timeout: 15000 });
    await admittedRow.locator('button[data-testid="discharge-btn"]').click();
    await expect(page.locator('h3:has-text("Patient Discharge Summary")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Finalize Discharge & Billing")');
    await expect(page.locator('text=/Discharged|Released/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('covers hr, employee master, and doctor appointment booking flow', async ({ page }) => {
    test.setTimeout(300000);
    const stamp = Date.now();
    const patient = buildPatient('Appointment-Patient');

    await loginAsAdmin(page);

    // 1. Employee Master Verification
    await openNav(page, 'admin_masters', 'h1:has-text("Institutional Master Data Hub")');
    await page.locator('article', { hasText: 'Employee Master' }).click();
    await expect(page.locator('h1:has-text("Employee Master - Doctor Credentials")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Dr. Sarah Johnson')).toBeVisible();

    // 2. Doctor Appointment Booking Workflow
    await openNav(page, 'find_doctor', 'h1:has-text("Find a Doctor")');
    await page.fill('input[placeholder*="Search doctors"]', 'Sarah');
    const doctorCard = page.locator('.clinical-card', { hasText: 'Dr. Sarah Johnson' }).first();
    await expect(doctorCard).toBeVisible();
    await doctorCard.locator('button:has-text("Book Appointment")').click();
    
    await expect(page.locator('h1:has-text("Doctor Availability")')).toBeVisible({ timeout: 15000 });
    await page.click('text=Confirm Appointment'); // Check if modal opens
  });

  test('covers users, system configuration, departments, services, accounts, and admin navigation', async ({ page }) => {
    test.setTimeout(360000);
    const stamp = Date.now();
    const userEmail = `qa.user.${stamp}@nhgl.local`;
    const departmentName = `QA Department ${stamp}`;
    const departmentCode = `QA${String(stamp).slice(-4)}`;
    const serviceName = `QA Service ${stamp}`;
    const serviceCode = `QAS-${String(stamp).slice(-4)}`;

    await loginAsAdmin(page);

    await openNav(page, 'admin', 'text=/Institutional Master Data Hub|Master Data Hub/i');
    await page.click('text=Department Shards');
    await expect(page.locator('h1:has-text("Institutional Departments Master")')).toBeVisible({ timeout: 15000 });

    await openNav(page, 'users', 'h1:has-text("Identity & Access Governance")');
    await page.fill('input[placeholder*="name, email or operational role"]', 'admin');
    await page.click('button:has-text("Provision Identity")');
    await page.fill('input[name="name"]', `QA User ${stamp}`);
    await page.fill('input[name="email"]', userEmail);
    await page.selectOption('select[name="role"]', 'Admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button:has-text("Commit Identity")');
    await page.fill('input[placeholder*="name, email or operational role"]', userEmail);
    await expect(page.locator(`text=${userEmail}`)).toBeVisible({ timeout: 15000 });

    await openNav(page, 'hospital_settings', 'text=/Institutional Branding & Settings/i');
    await page.fill('input[type="password"][placeholder*="sk_test"]', `qa-key-${stamp}`);
    await page.click('button:has-text("Synchronize Institutional Environment")');
    await expect(page.locator('text=/Institutional Branding & Settings/i')).toBeVisible({ timeout: 15000 });

    await openNav(page, 'departments', 'h1:has-text("Institutional Departments Master")');
    await page.click('button:has-text("Add Department Shard")');
    await page.fill('input[placeholder*="Cardiology"]', departmentName);
    await page.fill('input[placeholder*="CARD-01"]', departmentCode);
    await page.click('button:has-text("Persist Shard")');
    await expect(page.locator(`text=${departmentName}`)).toBeVisible({ timeout: 15000 });

    await openNav(page, 'service_catalog', 'text=/Revenue Service Catalog|Service Catalog/i');
    await page.locator('button:has-text("clinical")').last().click({ force: true });
    await page.locator('button:has-text("laboratory")').last().click({ force: true });
    await page.locator('button:has-text("emergency")').last().click({ force: true });
    await page.locator('button:has-text("ipd")').last().click({ force: true });
    await page.locator('button:has-text("all")').last().click({ force: true });
    await page.click('button:has-text("Provision Shard")');
    await page.fill('input[placeholder*="CBC Test"]', serviceName);
    await page.fill('input[placeholder*="LAB-001"]', serviceCode);
    await page.locator('section form select').first().selectOption('Clinical');
    await page.locator('section form input[type="number"]').first().fill('999');
    await page.click('button:has-text("Persist Shard")');
    const serviceRow = page.locator('tr').filter({ hasText: serviceName }).first();
    await expect(serviceRow).toBeVisible({ timeout: 15000 });
    await serviceRow.hover();
    await serviceRow.locator('button').first().click();
    await page.fill('input[placeholder*="CBC Test"]', `${serviceName} Updated`);
    await page.locator('section form input[type="number"]').first().fill('1299');
    await page.click('button:has-text("Update Shard")');
    await expect(page.locator('tr').filter({ hasText: `${serviceName} Updated` }).first()).toBeVisible({ timeout: 15000 });
    page.once('dialog', dialog => dialog.accept());
    const updatedRow = page.locator('tr').filter({ hasText: `${serviceName} Updated` }).first();
    await updatedRow.hover();
    await updatedRow.locator('button').nth(1).click();
    await expect(page.locator('tr').filter({ hasText: `${serviceName} Updated` })).toHaveCount(0, { timeout: 15000 });

    await openNav(page, 'financial_ledger', 'text=/Institutional Ledger & Governance|Institutional Ledger/i');
    await page.click('button:has-text("P&L Shard")');
    await page.click('button:has-text("Receivables")');
    await page.click('button:has-text("Payables")');
    await page.click('button:has-text("Journal")');
    await expect(page.locator('text=/Institutional Ledger & Governance|Institutional Ledger/i').first()).toBeVisible({ timeout: 15000 });

    await openNav(page, 'reports', 'text=/Reports|Analysis|Hospital Summary/i');
  });
});
