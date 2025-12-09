// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance | A Federation of Social Communities/);
});

test('loads community page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/community"]').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
});

test('loads museum page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/museum"]').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
});

test('loads treasury page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/treasury"]').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
});

test('loads roadmap page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/roadmap"]').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
});

test('loads bug tracker page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/bugs"]').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
});

test('loads story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/story"]').click();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toBeEmpty();
});

test('loads AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/svg3d"]').click();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toBeEmpty();
});

test('loads pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/pricing"]').click();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toBeEmpty();
});

test('login page has sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
