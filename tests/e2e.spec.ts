// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance | A Federation of Social Communities/);
});

test('main heading on community page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/community"]').click();
  await expect(page.getByRole('heading', { name: 'The Pleasance Federation' })).toBeVisible();
});

test('main heading on museum page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/museum"]').click();
  await expect(page.getByRole('heading', { name: 'Virtual Museum' })).toBeVisible();
});

test('main heading on treasury page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/treasury"]').click();
  await expect(page.getByRole('heading', { name: 'The Treasury' })).toBeVisible();
});

test('main heading on roadmap page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/roadmap"]').click();
  await expect(page.getByRole('heading', { name: 'Project Roadmap' })).toBeVisible();
});

test('main heading on bug tracker page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/bugs"]').click();
  await expect(page.getByRole('heading', { name: 'Bug Tracker' })).toBeVisible();
});

test('main heading on story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/story"]').click();
    await expect(page.getByRole('heading', { name: 'Nuncy Lingua' })).toBeVisible();
});

test('main heading on AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/svg3d"]').click();
    await expect(page.getByRole('heading', { name: 'AI Workshop' })).toBeVisible();
});

test('main heading on pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/pricing"]').click();
    await expect(page.getByRole('heading', { name: 'Tiers of Contribution' })).toBeVisible();
});

test('login page has sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
