import { test, expect } from '@playwright/test';

test('has title and main heading', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pleasance/);

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on community page', async ({ page }) => {
  await page.goto('/community');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on museum page', async ({ page }) => {
  await page.goto('/museum');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on treasury page', async ({ page }) => {
  await page.goto('/treasury');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on roadmap page', async ({ page }) => {
  await page.goto('/roadmap');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on bug tracker page', async ({ page }) => {
  await page.goto('/bugs');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on story (Nuncy Lingua) page', async ({ page }) => {
  await page.goto('/story');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on AI Workshop (svg3d) page', async ({ page }) => {
  await page.goto('/svg3d');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on pricing page', async ({ page }) => {
  await page.goto('/pricing');

  // Expect the main heading to be visible
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('login page has sign-in button', async ({ page }) => {
  await page.goto('/login');

  // Expect the sign in button to be visible
  await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
});
