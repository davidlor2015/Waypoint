import type { Page } from '@playwright/test';

const PASSWORD = 'TestPassword123!';

/**
 * Registers a fresh account and logs in.
 * Uses a unique email per call so tests never collide.
 * Waits for the "My Trips" heading before returning.
 */
export async function registerAndLogin(page: Page): Promise<void> {
  const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  await page.goto('/');

  // Switch to register mode
  await page.locator('button[type="button"]').filter({ hasText: 'Sign up' }).click();

  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.fill('#confirmPassword', PASSWORD);

  await page.locator('button[type="submit"]').click();

  // Wait until the authenticated view is visible
  await page.getByRole('heading', { name: 'My Trips' }).waitFor({ timeout: 10_000 });
}
