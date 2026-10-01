import { expect, test } from '@playwright/test';
import { apiGet, apiToken, fillLibInput, login } from './helpers';

// Three smoke journeys that used to be manual browser rounds: login, product
// create, and the order workflow (a counter sale through the POS page, then the
// order editor). Runs against the live dev servers; leaves test data behind.

test.describe.configure({ mode: 'serial' });

const stamp = Date.now().toString(36);
let productName = `E2E Mug ${stamp}`;

test('login lands on the dashboard', async ({ page }) => {
  await login(page);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await expect(page.locator('.tile').first()).toBeVisible();
  await expect(page.locator('body')).toContainText(/Today's orders/);
});

test('product create → appears in the catalog list', async ({ page }) => {
  await login(page);
  await page.goto('/catalog/products/new', { waitUntil: 'networkidle' });
  await fillLibInput(page, 'Name', productName);
  await fillLibInput(page, 'Base SKU (Stock Keeping Unit)', `E2E-${stamp}`.toUpperCase());
  // Category is a searchable autocomplete: open it and take the first option.
  const category = page.locator('app-mat-form-field-input', { has: page.locator('mat-label:text-is("Category")') }).locator('input').first();
  await category.click();
  await page.locator('mat-option').first().click();
  const [res] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && /\/api\/v1\/products$/.test(r.url())),
    page.getByRole('button', { name: /^Save$/ }).click()
  ]);
  expect(res.status(), 'POST /products').toBeLessThan(300);
  const token = await apiToken();
  const found = await apiGet<{ totalElements: number }>(`/api/v1/products/search?q=${encodeURIComponent(productName)}`, token);
  expect(found.totalElements, 'product saved through the editor').toBeGreaterThan(0);
});

test('order workflow: counter sale through the POS page, then the order editor', async ({ page }) => {
  await login(page);
  await page.goto('/commerce/orders/new', { waitUntil: 'networkidle' });
  await fillLibInput(page, 'Walk-in name', `E2E walk-in ${stamp}`);
  // add a line through product search (any active product with stock)
  const search = page.locator('input[placeholder*="search products"]');
  await search.fill('mug'); await page.waitForTimeout(1500);
  // Pick a line that can actually be sold (the results show "stock N"; generated test variants may have 0).
  const inStock = page.locator('.results button').filter({ hasText: /stock [1-9]/ });
  await ((await inStock.count()) > 0 ? inStock.first() : page.locator('.results button').first()).click();
  await expect(page.locator('table.lines tr').first()).toBeVisible();
  await page.waitForTimeout(1500); // server preview
  await expect(page.locator('body')).toContainText(/Total/);
  await page.getByRole('button', { name: /Create order/ }).click();
  await page.getByRole('button', { name: /^Create$/ }).click();
  await expect(page.locator('body')).toContainText(/created/, { timeout: 20_000 });
  await page.getByRole('button', { name: /Open order/ }).click();
  await expect(page).toHaveURL(/commerce\/orders\/[0-9a-f-]{36}$/);
  await expect(page.locator('body')).toContainText(/VEN-[A-F0-9]{8}/);
  await page.getByRole('tab', { name: /Payment/ }).click();
  await expect(page.locator('body')).toContainText(/Staff-created order|Paid by|CASH/);
});
