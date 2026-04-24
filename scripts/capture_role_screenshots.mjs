import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const UI_BASE_URL = 'http://localhost:5175';
const today = new Date().toISOString().slice(0, 10);
const outDir = path.join('Docs', '07-Deployment', `role-snapshots-${today}`);

const scenarios = [
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Admin', email: 'admin.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Nurse', email: 'nurse.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Lab', email: 'lab.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Insurance', email: 'insurance.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Billing', email: 'billing.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Accounts', email: 'accounts.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Auditor', email: 'auditor.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'city_general', tenantLabel: 'City General Hospital', role: 'Management', email: 'management.city_general@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Admin', email: 'admin.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Nurse', email: 'nurse.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Lab', email: 'lab.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Insurance', email: 'insurance.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Billing', email: 'billing.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Accounts', email: 'accounts.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Auditor', email: 'auditor.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'EHS', tenantLabel: 'Enterprise Hospital Systems', role: 'Management', email: 'management.ehs@emr.local', password: 'Test@123' },
  { tenantValue: 'superadmin', tenantLabel: 'Platform Superadmin', role: 'Superadmin', email: 'superadmin@emr.local', password: 'Admin@123' },
];

function fileSafe(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function login(page, user) {
  await page.goto(UI_BASE_URL, { waitUntil: 'domcontentloaded' });
  const tenantSelect = page.locator('select').first();
  await tenantSelect.waitFor({ state: 'visible', timeout: 30000 });
  await tenantSelect.selectOption(user.tenantValue);
  await page.locator('input[type="email"]').first().fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.locator('.app-root').waitFor({ state: 'visible', timeout: 25000 });
  await page.getByRole('button', { name: /sign out/i }).waitFor({ state: 'visible', timeout: 25000 });
}

async function collectNavItems(page) {
  const navItems = await page.locator('.sidebar-nav .nav-item').allInnerTexts();
  return navItems.map((s) => s.trim()).filter(Boolean);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const results = [];

  for (const user of scenarios) {
    const id = `${fileSafe(user.tenantValue)}-${fileSafe(user.role)}`;
    const imageFile = `${id}.png`;
    const imagePath = path.join(outDir, imageFile);

    try {
      await login(page, user);
      const navItems = await collectNavItems(page);
      await page.screenshot({ path: imagePath, fullPage: true });
      results.push({ ...user, ok: true, imageFile, navItems });
    } catch (error) {
      const errorFile = `${id}-error.png`;
      const errorPath = path.join(outDir, errorFile);
      try {
        await page.screenshot({ path: errorPath, fullPage: true });
      } catch {
        // ignore screenshot failure
      }
      results.push({ ...user, ok: false, imageFile: errorFile, navItems: [], error: String(error.message || error) });
    }
  }

  await context.close();
  await browser.close();

  const lines = [];
  lines.push('# Role-Based Application Snapshot Report');
  lines.push('');
  lines.push(`Date: ${today}`);
  lines.push(`UI Base URL: \`${UI_BASE_URL}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total roles attempted: ${results.length}`);
  lines.push(`- Successful captures: ${results.filter((r) => r.ok).length}`);
  lines.push(`- Failed captures: ${results.filter((r) => !r.ok).length}`);
  lines.push('');
  lines.push('## Role Screenshots and Access View');
  lines.push('');

  for (const result of results) {
    lines.push(`### ${result.role} - ${result.tenantLabel}`);
    lines.push('');
    lines.push(`- Login: ${result.ok ? 'Success' : 'Failed'}`);
    lines.push(`- User: \`${result.email}\``);
    if (result.ok) {
      lines.push(`- Visible navigation: ${result.navItems.length ? result.navItems.join(', ') : 'Not captured'}`);
    } else {
      lines.push(`- Error: ${result.error || 'Unknown error'}`);
    }
    lines.push('');
    lines.push(`![${result.role} ${result.tenantLabel}](./${path.basename(outDir)}/${result.imageFile})`);
    lines.push('');
  }

  const reportPath = path.join('Docs', '07-Deployment', `ROLE_SNAPSHOT_REPORT_${today}.md`);
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`Saved report: ${reportPath}`);
  console.log(`Saved images: ${outDir}`);
}

main().catch((error) => {
  console.error('Capture run failed:', error);
  process.exit(1);
});
