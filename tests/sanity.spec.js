import { test, expect } from '@playwright/test';

test('Sanity check', async ({ page }) => {
  await page.goto('http://localhost:5175/');
  await expect(page).toHaveTitle(/Next-Gen Hospital|Healthezee|EMR/i);
  console.log('✅ Sanity check passed');
});
