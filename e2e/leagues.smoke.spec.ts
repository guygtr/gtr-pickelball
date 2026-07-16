import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Leagues navigation E2E (P0)", () => {
  test("UI-01: page ligues charge après login", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/leagues/);
    await expect(page.locator("body")).toBeVisible();
    // Titre / CTA typique
    await expect(
      page.getByText(/ligue|créer|mes ligues|pickleball|gtr/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("UI-02: ouvrir une ligue existante si présente", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/leagues");
    // Lien vers /leagues/[id]
    const leagueLink = page.locator('a[href^="/leagues/"]').filter({
      hasNot: page.locator('[href="/leagues/create"]'),
    });
    const count = await leagueLink.count();
    if (count === 0) {
      test.skip(true, "Aucune ligue en Dev pour cet user");
      return;
    }
    await leagueLink.first().click();
    await expect(page).toHaveURL(/\/leagues\/[^/]+/);
    // Sous-nav sessions / joueurs souvent présents
    const sub = page.getByRole("link", {
      name: /Joueurs|Sessions|Paramètres|Hall/i,
    });
    if ((await sub.count()) > 0) {
      await expect(sub.first()).toBeVisible();
    }
  });
});
