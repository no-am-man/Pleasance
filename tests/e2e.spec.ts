// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test('has title and main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance | A Federation of Social Communities/);
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on community page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/community"]').click();
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on museum page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/museum"]').click();
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on treasury page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/treasury"]').click();
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on roadmap page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/roadmap"]').click();
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on bug tracker page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/bugs"]').click();
  await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/story"]').click();
    await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/svg3d"]').click();
    await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('main heading on pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/pricing"]').click();
    await expect(page.getByTestId('main-heading')).toBeVisible();
});

test('login page has sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
