import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const UI_BASE_URL = 'http://localhost:5175';
const today = new Date().toISOString().slice(0, 10);
const outDir = path.join('Docs', '07-Deployment', `ehs-role-snapshots-${today}`);
const outJson = path.join(outDir, 'ehs_role_capture_results.json');

const users = [
  { role: 'Admin', email: 'admin.ehs@emr.local', password: 'Test@123' },
  { role: 'Nurse', email: 'nurse.ehs@emr.local', password: 'Test@123' },
  { role: 'Lab', email: 'lab.ehs@emr.local', password: 'Test@123' },
  { role: 'Insurance', email: 'insurance.ehs@emr.local', password: 'Test@123' },
  { role: 'Billing', email: 'billing.ehs@emr.local', password: 'Test@123' },
  { role: 'Accounts', email: 'accounts.ehs@emr.local', password: 'Test@123' },
  { role: 'Auditor', email: 'auditor.ehs@emr.local', password: 'Test@123' },
  { role: 'Management', email: 'management.ehs@emr.local', password: 'Test@123' },
];

function safeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function login(page, user) {
  await page.goto(UI_BASE_URL, { waitUntil: 'domcontentloaded' });
  const tenantSelect = page.locator('select').first();
  await tenantSelect.waitFor({ state: 'visible', timeout: 30000 });
  await tenantSelect.selectOption('EHS');

  await page.locator('input[type="email"]').first().fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.locator('.app-root').waitFor({ state: 'visible', timeout: 25000 });
  await page.getByRole('button', { name: /sign out/i }).waitFor({ state: 'visible', timeout: 25000 });
}

async function getNavItems(page) {
  const items = await page.locator('.sidebar-nav .nav-item').allInnerTexts();
  return items.map((x) => x.trim()).filter(Boolean);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const results = [];

  for (const user of users) {
    const slug = safeSlug(user.role);
    const fileName = `ehs-${slug}.png`;
    const filePath = path.join(outDir, fileName);

    try {
      await login(page, user);
      const navItems = await getNavItems(page);
      await page.screenshot({ path: filePath, fullPage: true });

      results.push({
        tenant: 'Enterprise Hospital Systems',
        role: user.role,
        email: user.email,
        status: 'success',
        navItems,
        screenshot: fileName,
      });
    } catch (error) {
      const errName = `ehs-${slug}-error.png`;
      const errPath = path.join(outDir, errName);
      try {
        await page.screenshot({ path: errPath, fullPage: true });
      } catch {
        // ignore
      }
      results.push({
        tenant: 'Enterprise Hospital Systems',
        role: user.role,
        email: user.email,
        status: 'failed',
        navItems: [],
        screenshot: errName,
        error: String(error.message || error),
      });
    }
  }

  await context.close();
  await browser.close();

  const payload = {
    date: today,
    baseUrl: UI_BASE_URL,
    tenant: 'Enterprise Hospital Systems',
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };

  fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved: ${outJson}`);
}

main().catch((error) => {
  console.error('EHS capture failed:', error);
  process.exit(1);
});
