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
  await page.getByRole('link', { name: 'Community' }).click();
  await page.waitForURL('**/community');
  // Expect a heading with the name "The Pleasance Federation" to be visible.
  await expect(page.getByRole('heading', { name: 'The Pleasance Federation' })).toBeVisible();
});

// Test to ensure login is required for creating a community
test('creating a community requires login', async ({ page }) => {
  await page.goto('/community');
  // Click the "Create a New Community" button
  await page.getByRole('button', { name: 'Create a New Community' }).click();
  // Expect to see the "Login to Create & Manage" button, indicating the user is not logged in
  await expect(page.getByRole('button', { name: 'Login to Create & Manage' })).toBeVisible();
});

// Test for navigating to the museum
test('get to museum page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Museum' }).click();
  await page.waitForURL('**/museum');
  await expect(page).toHaveURL(/.*museum/);
});

// Test for navigating to the treasury
test('get to treasury page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Treasury' }).click();
  await page.waitForURL('**/treasury');
  await expect(page).toHaveURL(/.*treasury/);
});

// Test for navigating to the roadmap
test('get to roadmap page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Roadmap' }).click();
  await page.waitForURL('**/roadmap');
  await expect(page).toHaveURL(/.*roadmap/);
  await expect(page.getByRole('heading', { name: 'Project Roadmap' })).toBeVisible();
});

// Test for navigating to the bug tracker
test('get to bug tracker page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Bug Tracker' }).click();
  await page.waitForURL('**/bugs');
  await expect(page).toHaveURL(/.*bugs/);
  await expect(page.getByRole('heading', { name: 'Bug Tracker' })).toBeVisible();
});

// Test for navigating to the story page
test('get to story (Nuncy Lingua) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByRole('link', { name: 'Nuncy Lingua' }).click();
    await page.waitForURL('**/story');
    await expect(page).toHaveURL(/.*story/);
    await expect(page.getByRole('heading', { name: 'Nuncy Lingua' })).toBeVisible();
});

// Test for navigating to the AI Workshop page
test('get to AI Workshop (svg3d) page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByRole('link', { name: 'AI Workshop' }).click();
    await page.waitForURL('**/svg3d');
    await expect(page).toHaveURL(/.*svg3d/);
    await expect(page.getByRole('heading', { name: 'AI Workshop' })).toBeVisible();
});

// Test for navigating to the pricing page
test('get to pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByRole('link', { name: 'Pricing' }).click();
    await page.waitForURL('**/pricing');
    await expect(page).toHaveURL(/.*pricing/);
    await expect(page.getByRole('heading', { name: 'Tiers of Contribution' })).toBeVisible();
});

// Test for login page functionality
test('login page', async ({ page }) => {
    await page.goto('/login');
    // Expect a button with the text "Sign in with Google" to be visible.
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
