import { test, expect } from '@playwright/test';

test('Institutional Gateway Connectivity Check', async ({ page }) => {
  await page.goto('http://localhost:5175/');
  console.log('✅ Local server reachable.');
  await expect(page.locator('body')).toBeVisible();
});
