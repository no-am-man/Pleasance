// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

// Test to check the home page title
test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pleasance | A Federation of Social Communities/);
});

// Test for the main heading on the community page
test('main heading on community page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/community"]').click();
  await page.waitForURL('**/community');
  await expect(page.getByRole('heading', { name: 'The Pleasance Federation' })).toBeVisible();
});

// Test to ensure login is required for creating a community
test('creating a community requires login', async ({ page }) => {
  await page.goto('/community');
  await page.getByRole('button', { name: 'Create a New Community' }).click();
  await expect(page.getByRole('button', { name: 'Login to Create & Manage' })).toBeVisible();
});

// Test for navigating to the museum
test('get to museum page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/museum"]').click();
  await page.waitForURL('**/museum');
  await expect(page.getByRole('heading', { name: 'Virtual Museum' })).toBeVisible();
});

// Test for navigating to the treasury
test('get to treasury page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/treasury"]').click();
  await page.waitForURL('**/treasury');
  await expect(page.getByRole('heading', { name: 'The Treasury' })).toBeVisible();
});

// Test for navigating to the roadmap
test('get to roadmap page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/roadmap"]').click();
  await page.waitForURL('**/roadmap');
  await expect(page.getByRole('heading', { name: 'Project Roadmap' })).toBeVisible();
});

// Test for navigating to the bug tracker
test('get to bug tracker page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.locator('a[href="/bugs"]').click();
  await page.waitForURL('**/bugs');
  await expect(page.getByRole('heading', { name: 'Bug Tracker' })).toBeVisible();
});

// Test for navigating to the story page
test('get to story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/story"]').click();
    await page.waitForURL('**/story');
    await expect(page.getByRole('heading', { name: 'Nuncy Lingua' })).toBeVisible();
});

// Test for navigating to the AI Workshop page
test('get to AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/svg3d"]').click();
    await page.waitForURL('**/svg3d');
    await expect(page.getByRole('heading', { name: 'AI Workshop' })).toBeVisible();
});

// Test for navigating to the pricing page
test('get to pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('a[href="/pricing"]').click();
    await page.waitForURL('**/pricing');
    await expect(page.getByRole('heading', { name: 'Tiers of Contribution' })).toBeVisible();
});

// Test for login page functionality
test('login page', async ({ page }) => {
    await page.goto('/login');
    // Expect a button with the text "Sign in with Google" to be visible.
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
