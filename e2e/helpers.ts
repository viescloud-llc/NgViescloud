import { expect, Page } from '@playwright/test';

export const ADMIN = { username: process.env['E2E_USER'] ?? 'admin', password: process.env['E2E_PASS'] ?? 'admin' };
export const API = process.env['E2E_API_URL'] ?? 'http://localhost:8085';

// Lib form widgets emit on focusout, not per keystroke — always blur after fill.
export async function fillLibInput(page: Page, label: string, value: string) {
  const input = page.locator('app-mat-form-field-input', { has: page.locator(`mat-label:text-is("${label}")`) }).locator('input').first();
  await input.fill(value);
  await input.blur();
}

export async function login(page: Page) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  const box = page.locator('viescloud-login');
  await box.locator('input').first().fill(ADMIN.username);
  await box.locator('input[type="password"]').first().fill(ADMIN.password);
  await box.getByRole('button', { name: /login/i }).first().click();
  await expect(page.locator('viescloud-login')).toHaveCount(0, { timeout: 20_000 });
}

export async function apiToken(): Promise<string> {
  const res = await fetch(`${API}/api/v1/authenticators/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ADMIN) });
  return (await res.json()).jwt;
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return await res.json() as T;
}
