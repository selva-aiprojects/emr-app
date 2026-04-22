import { test, expect } from '@playwright/test';

test.describe('Full E2E: Superadmin → Fresh Tenant → Patient Journey + Ambulance', () => {
  test('01. Superadmin Login → Create Fresh Tenant', async ({ page }) => {
    await page.goto('http://localhost:5177/');
    
    // Login magnum superadmin
    await page.selectOption('#tenantSelect', 'magnum');
    await page.fill('#email', 'superadmin@magnum.com');
    await page.fill('#password', 'Magnum2024!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#roleBadge')).toContainText('Superadmin');
    
    // Navigate admin → Create tenant
    await page.click('[data-view="admin"]');
    await page.click('text="Create New Tenant"');
    await page.fill('input[placeholder="Tenant Name"]', 'Fresh Hospital Ltd');
    await page.fill('input[placeholder="Code"]', 'fresh');
    await page.fill('input[placeholder="Subdomain"]', 'fresh');
    await page.click('text="Enterprise"');
    await page.click('button:has-text("Create Tenant")');
    await expect(page.locator('text="fresh created"')).toBeVisible();
    
    await page.close();
  });

  test('02. Switch to Fresh Tenant → Seed Staff/Doctors/Pharmacy', async ({ page }) => {
    await page.goto('http://localhost:5177/');
    
    // Switch tenant
    await page.selectOption('#tenantSelect', 'fresh');
    await page.selectOption('#userSelect', 'Admin');  // Default admin
    await expect(page.locator('#tenantCode')).toContainText('FRESH');
    
    // Add doctors
    await page.click('[data-view="admin"]');
    await page.click('text="Add Doctor"');
    await page.fill('[name="name"]', 'Dr. Smith');
    await page.click('button[type="submit"]');
    
    // Pharmacy stock
    await page.click('[data-view="inventory"]');
    await page.click('text="Add Item"');
    await page.fill('[name="name"]', 'Paracetamol');
    await page.fill('[name="stock"]', '100');
    await page.click('button[type="submit"]');
    
    await page.close();
  });

  test('03. Patient Journey: OPD → Rx → Lab → IPD → Billing → Pharmacy → Ambulance', async ({ page }) => {
    await page.goto('http://localhost:5177/');
    
    await page.selectOption('#tenantSelect', 'fresh');
    await page.selectOption('#userSelect', 'Dr. Smith');
    
    // OPD: New patient + appt + encounter
    await page.click('[data-view="patients"]');
    await page.click('text="Add Patient"');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.click('button[type="submit"]');
    
    await page.click('[data-view="appointments"]');
    await page.selectOption('#appointmentPatient', 'John Doe');
    await page.selectOption('#appointmentProvider', 'Dr. Smith');
    await page.click('button[type="submit"]');
    
    await page.click('[data-view="emr"]');
    await page.click('text="New Encounter"');
    await page.click('button[type="submit"]');
    
    // Lab order
    await page.click('[data-view="laboratory"]');
    await page.click('text="Order Test"');
    await page.click('button[type="submit"]');
    
    // IPD: Admit
    await page.click('[data-view="inpatient"]');
    await page.click('text="Admit Patient"');
    await page.click('button[type="submit"]');
    
    // Billing
    await page.click('[data-view="billing"]');
    await page.click('text="New Invoice"');
    await page.click('button[type="submit"]');
    
    // Pharmacy dispense
    await page.click('[data-view="pharmacy"]');
    await page.click('text="Dispense"');
    await page.click('button[type="submit"]');
    
    // Ambulance request
    await page.click('[data-view="ambulances"]');
    await page.click('text="Request Ambulance"');
    await page.click('button[type="submit"]');
    
    await page.close();
  });

  test('04. Verify Dashboards & Reports', async ({ page }) => {
    await page.goto('http://localhost:5177/');
    
    // Tenant dashboard
    await page.selectOption('#tenantSelect', 'fresh');
    await expect(page.locator('#dashboardCards')).toContainText(['Patients: 1', 'Appointments: 1', 'Revenue']);
    
    // Superadmin global
    await page.selectOption('#tenantSelect', 'magnum');
    await page.click('[data-view="admin"]');
    await expect(page.locator('text="fresh"')).toBeVisible();
    await expect(page.locator('text="patients"')).toContainText('1');
    
    await page.close();
  });
});

