import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pleasance/);
});

test('get started link', async ({ page }) => {
  await page.goto('/home');

  // Click the get started link.
  await page.getByRole('link', { name: 'Explore Communities' }).click();

  // Expects the URL to contain /community.
  await expect(page).toHaveURL(/.*community/);
});
