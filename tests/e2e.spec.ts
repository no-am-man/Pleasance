// tests/e2e.spec.ts
import { test, expect, Page } from '@playwright/test';

test('has title and main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance/);
  await expect(page.getByTestId('main-heading')).toBeVisible();
});


test('main heading on community page', async ({ page }) => {
  await page.goto('/community');
  await expect(page.getByTestId('main-heading')).toHaveText('The Pleasance Federation');
});

test('main heading on museum page', async ({ page }) => {
  await page.goto('/museum');
  await expect(page.getByTestId('main-heading')).toHaveText(/Virtual Museum/);
});


test('main heading on treasury page', async ({ page }) => {
  await page.goto('/treasury');
  await expect(page.getByTestId('main-heading')).toHaveText(/Treasury/);
});


test('main heading on roadmap page', async ({ page }) => {
  await page.goto('/roadmap');
  await expect(page.getByTestId('main-heading')).toHaveText(/Roadmap/);
});

test('main heading on bug tracker page', async ({ page }) => {
  await page.goto('/bugs');
  await expect(page.getByTestId('main-heading')).toHaveText(/Bug Tracker/);
});


test('main heading on story (Nuncy Lingua) page', async ({ page }) => {
  await page.goto('/story');
  await expect(page.getByTestId('main-heading')).toHaveText(/Nuncy Lingua/);
});


test('main heading on AI Workshop (svg3d) page', async ({ page }) => {
  await page.goto('/svg3d');
  await expect(page.getByTestId('main-heading')).toHaveText(/AI Workshop/);
});


test('main heading on pricing page', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByTestId('main-heading')).toHaveText(/Tiers of Contribution/);
});


test('login page has sign-in button', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
});
