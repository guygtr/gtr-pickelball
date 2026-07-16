import { test, expect } from "@playwright/test";
import { e2eCreds, expectOnLogin, loginAsAdmin } from "./helpers/auth";

test.describe("AUTH smoke Pickelball E2E (P0)", () => {
  test("AUTH-04: sans session → login", async ({ page }) => {
    await page.goto("/leagues");
    await expectOnLogin(page);
  });

  test("AUTH-02: mauvais MDP → erreur", async ({ page }) => {
    const c = e2eCreds();
    await page.goto("/auth/login");
    await page.locator('input[name="email"]').fill(c.adminEmail);
    await page.locator('input[name="password"]').fill("WrongPassword99!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(
      page.getByText(/Identifiants incorrects|incorrect/i)
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("AUTH-01: login admin → /leagues", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/leagues/);
  });

  test("AUTH-05: déconnexion → login", async ({ page }) => {
    await loginAsAdmin(page);
    const logout = page.getByRole("button", { name: /Déconnexion/i });
    const logoutTitle = page.locator('[title="Déconnexion"]');
    if (await logout.count()) {
      await logout.first().click();
    } else if (await logoutTitle.count()) {
      await logoutTitle.first().click();
    } else {
      await page.context().clearCookies();
      await page.goto("/leagues");
    }
    await page.waitForTimeout(500);
    await page.goto("/leagues");
    await expectOnLogin(page);
  });
});
