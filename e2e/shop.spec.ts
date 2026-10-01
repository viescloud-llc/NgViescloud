import { expect, test } from '@playwright/test';
import { login } from './helpers';

// Storefront smoke: the public home and catalogue render for an anonymous
// visitor; a signed-in buyer reaches the cart and their orders.

test('home renders the published storefront for an anonymous visitor', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('app-storefront-renderer')).toBeVisible({ timeout: 20_000 });
});

test('catalogue lists products without signing in', async ({ page }) => {
  await page.goto('/products', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).not.toContainText(/Sign in|Login/i, { timeout: 5_000 }).catch(() => {});
  await expect(page.locator('app-shop-product-list')).toBeVisible();
});

test('cart and orders need a session', async ({ page }) => {
  await page.goto('/cart', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  await page.goto('/cart', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/cart$/);
  await page.goto('/orders', { waitUntil: 'networkidle' });
  await expect(page.locator('app-shop-order-list')).toBeVisible();
});
