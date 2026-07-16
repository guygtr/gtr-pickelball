import { type Page, expect } from "@playwright/test";

export function e2eCreds() {
  return {
    adminEmail:
      process.env.E2E_ADMIN_EMAIL ||
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
      "guy.gtr@gmail.com",
    adminPassword: process.env.E2E_ADMIN_PASSWORD || "E2E-Admin-GTR-Dev-2026!",
  };
}

export async function loginAsAdmin(page: Page) {
  const c = e2eCreds();
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /Connexion/i })).toBeVisible();
  await page.locator('input[name="email"]').fill(c.adminEmail);
  await page.locator('input[name="password"]').fill(c.adminPassword);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), {
    timeout: 30_000,
  });
}

export async function expectOnLogin(page: Page) {
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole("heading", { name: /Connexion/i })).toBeVisible();
}
