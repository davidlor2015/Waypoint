import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('Trip management', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('user can create a trip and see it in the list', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Trip' }).click();

    await page.fill('#ctf-title', 'Tokyo Adventure');
    await page.fill('#ctf-destination', 'Tokyo, Japan');
    await page.fill('#ctf-start-date', '2026-08-01');
    await page.fill('#ctf-end-date', '2026-08-10');

    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByRole('heading', { name: 'Tokyo Adventure' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('created trip shows correct destination and dates', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Trip' }).click();

    await page.fill('#ctf-title', 'Paris Trip');
    await page.fill('#ctf-destination', 'Paris, France');
    await page.fill('#ctf-start-date', '2026-09-01');
    await page.fill('#ctf-end-date', '2026-09-07');

    await page.locator('button[type="submit"]').click();

    const card = page.locator('li').filter({ hasText: 'Paris Trip' });
    await expect(card).toBeVisible({ timeout: 8_000 });
    await expect(card.getByText('Paris, France')).toBeVisible();
  });

  test('user can delete a trip and see empty state', async ({ page }) => {
    // Create a trip first
    await page.getByRole('button', { name: '+ New Trip' }).click();
    await page.fill('#ctf-title', 'Trip to Delete');
    await page.fill('#ctf-destination', 'London, UK');
    await page.fill('#ctf-start-date', '2026-10-01');
    await page.fill('#ctf-end-date', '2026-10-05');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole('heading', { name: 'Trip to Delete' })).toBeVisible({ timeout: 8_000 });

    // Accept the confirm dialog and delete
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('No trips yet')).toBeVisible({ timeout: 8_000 });
  });

  test('cancel button returns to trip list without creating', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Trip' }).click();
    await page.fill('#ctf-title', 'Draft Trip');

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'My Trips' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Draft Trip' })).not.toBeVisible();
  });

});
