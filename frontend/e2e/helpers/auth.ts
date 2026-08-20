import { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Attend que les champs soient disponibles
  await page.waitForSelector('input[type="email"]', { timeout: 15_000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Bouton "Se connecter" (loginWithEmail dans LoginPage.jsx)
  await page.click('button:has-text("Se connecter")');

  // Attend la redirection vers /feed
  await page.waitForURL("**/feed**", { timeout: 30_000 });
}

export async function logout(page: Page) {
  await page.goto("/profile");
  const logoutBtn = page.locator("button").filter({ hasText: /déconnexion|se déconnecter/i });
  if (await logoutBtn.count() > 0) {
    await logoutBtn.first().click();
    await page.waitForURL("**/login**", { timeout: 10_000 }).catch(() => {});
  }
}
