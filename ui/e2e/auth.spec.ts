import { test, expect } from '@playwright/test';

const PASSWORD = 'TestPassword123!';

test.describe('Authentication', () => {

  test('user can register and lands on My Trips', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;

    await page.goto('/');

    // The login card should be visible
    await expect(page.getByRole('heading', { name: 'TravelPlanner' })).toBeVisible();

    // Switch to register mode
    await page.locator('button[type="button"]').filter({ hasText: 'Sign up' }).click();
    await expect(page.locator('#confirmPassword')).toBeVisible();

    // Fill and submit
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.fill('#confirmPassword', PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Should reach the authenticated app
    await expect(page.getByRole('heading', { name: 'My Trips' })).toBeVisible({ timeout: 10_000 });
  });

  test('user can log out and log back in', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;

    // Register
    await page.goto('/');
    await page.locator('button[type="button"]').filter({ hasText: 'Sign up' }).click();
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.fill('#confirmPassword', PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole('heading', { name: 'My Trips' })).toBeVisible({ timeout: 10_000 });

    // Log out
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.locator('#email')).toBeVisible();

    // Log back in
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'My Trips' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows error banner on wrong credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('#email', 'nobody@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8_000 });
  });

});
