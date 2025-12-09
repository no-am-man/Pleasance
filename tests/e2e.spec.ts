import { test, expect } from '@playwright/test';

test('has title and main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance/);
  const mainHeading = page.getByTestId('main-heading');
  await expect(mainHeading).toBeVisible();
});

test('main heading on community page', async ({ page }) => {
  await page.goto('/community');
  const mainHeading = page.getByTestId('main-heading');
  await expect(mainHeading).toBeVisible();
});

test('main heading on museum page', async ({ page }) => {
  await page.goto('/museum');
  const mainHeading = page.getByTestId('main-heading');
  await expect(mainHeading).toBeVisible();
});

test('main heading on treasury page', async ({ page }) => {
    await page.goto('/treasury');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('main heading on roadmap page', async ({ page }) => {
    await page.goto('/roadmap');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('main heading on bug tracker page', async ({ page }) => {
    await page.goto('/bugs');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('main heading on story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/story');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('main heading on AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/svg3d');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('main heading on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    const mainHeading = page.getByTestId('main-heading');
    await expect(mainHeading).toBeVisible();
});

test('login page has sign-in button', async ({ page }) => {
    await page.goto('/login');
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(signInButton).toBeVisible();
});
