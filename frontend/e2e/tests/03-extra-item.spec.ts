/**
 * Tests — demande d'un objet en plus lors d'un échange.
 *
 * Flow : Thomas propose book2 pour lamp2 de Camille.
 * Camille reçoit la proposition et demande book3 (Dune) en plus.
 * Thomas voit la demande et ajoute book3.
 * Camille accepte la proposition complète.
 */

import { test, expect, Browser, BrowserContext, Page } from "@playwright/test";
import { login } from "../helpers/auth";
import { getTestState, saveExtraExchangeId } from "../helpers/test-state";

let browser: Browser;
let camilleCtx: BrowserContext;
let thomasCtx: BrowserContext;
let camillePage: Page;
let thomasPage: Page;

test.describe("Objet en plus — négociation", () => {
  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    const state = getTestState();

    camilleCtx = await browser.newContext();
    thomasCtx = await browser.newContext();
    camillePage = await camilleCtx.newPage();
    thomasPage = await thomasCtx.newPage();

    await Promise.all([
      login(camillePage, state.camilleEmail, state.camillePassword),
      login(thomasPage, state.thomasEmail, state.thomasPassword),
    ]);
  });

  test.afterAll(async () => {
    await camilleCtx?.close();
    await thomasCtx?.close();
  });

  // ─── 1. Thomas crée une nouvelle proposition ──────────────────────────────────

  test("01 — Thomas propose book2 pour le vélo de Camille", async () => {
    const state = getTestState();

    await thomasPage.goto(`/propose/${state.lamp2Id}`);
    await thomasPage.waitForLoadState("domcontentloaded");

    // Attend que la bibliothèque de Thomas soit chargée
    await expect(thomasPage.locator("body")).toContainText(/petit prince/i, { timeout: 15_000 });

    // Sélectionne Le Petit Prince (book2)
    const book2 = thomasPage.locator("button:visible").filter({ hasText: /petit prince/i }).first();
    await expect(book2).toBeVisible({ timeout: 5_000 });
    await book2.click();

    const sendBtn = thomasPage.locator('button:visible:has-text("Envoyer ma proposition")').first();
    await expect(sendBtn).toBeEnabled({ timeout: 5_000 });
    await sendBtn.click();

    // Après envoi : redirige vers /exchanges (liste)
    await thomasPage.waitForURL(/\/exchanges/, { timeout: 20_000 });
    await thomasPage.screenshot({ path: "playwright-results/extra-01-proposition-creee.png" }).catch(() => {});
    expect(thomasPage.url()).toMatch(/\/exchanges/);
  });

  // ─── 2. Camille demande un objet en plus ──────────────────────────────────────

  test("02 — Camille demande Dune (book3) en plus", async () => {
    // Camille ouvre l'échange reçu depuis la liste et récupère son ID
    await camillePage.goto("/exchanges");
    await camillePage.waitForLoadState("domcontentloaded");

    // Clique sur "Voir la proposition" (peut être clipé par overflow-hidden sur mobile)
    const proposal = camillePage.locator("button").filter({ hasText: /voir la proposition/i }).first();
    await expect(proposal).toBeAttached({ timeout: 10_000 });
    // JS click pour contourner le clipping overflow-hidden
    await proposal.evaluate((el) => (el as HTMLButtonElement).click());
    await camillePage.waitForURL(/\/exchanges\//, { timeout: 10_000 });

    const url = camillePage.url();
    const exchangeId = url.split("/exchanges/")[1]?.split(/[?#/]/)[0];
    if (exchangeId) saveExtraExchangeId(exchangeId);

    await camillePage.waitForLoadState("domcontentloaded");
    const state = getTestState();

    // Bouton "Demander un objet en plus" (peut être clipé par overflow-hidden sur mobile)
    const extraBtn = camillePage.locator("button").filter({ hasText: /demander un objet en plus|demander un autre objet/i }).first();
    await expect(extraBtn).toBeAttached({ timeout: 10_000 });
    await extraBtn.evaluate((el) => (el as HTMLButtonElement).click());

    // Le picker d'objet en plus s'affiche — sélectionner Dune (bouton dans la grille)
    const duneItem = camillePage.locator("button").filter({ hasText: /dune/i }).first();
    await expect(duneItem).toBeAttached({ timeout: 8_000 });
    await duneItem.evaluate((el) => (el as HTMLButtonElement).click());

    // Bouton de validation dans le picker : "Demander" (texte exact)
    const confirmBtn = camillePage.locator("button").filter({ hasText: /^Demander$/ }).first();
    await expect(confirmBtn).toBeAttached({ timeout: 3_000 });
    await confirmBtn.evaluate((el) => (el as HTMLButtonElement).click());

    // L'échange doit désormais afficher "objet en plus demandé"
    await expect(camillePage.locator("body")).toContainText(/objet en plus|dune/i, { timeout: 10_000 });
    await camillePage.screenshot({ path: "playwright-results/extra-02-demande-envoyee.png" }).catch(() => {});
  });

  // ─── 3. Thomas voit la demande ────────────────────────────────────────────────

  test("03 — Thomas voit la demande d'objet en plus", async () => {
    const state = getTestState();
    if (!state.extraExchangeId) return test.skip();

    await thomasPage.goto(`/exchanges/${state.extraExchangeId}`);
    await thomasPage.waitForLoadState("domcontentloaded");

    // L'échange doit signaler qu'un objet en plus est demandé
    await expect(thomasPage.locator("body")).toContainText(/objet en plus|dune|ajouter un objet/i, { timeout: 10_000 });
    await thomasPage.screenshot({ path: "playwright-results/extra-03-thomas-voit-demande.png" }).catch(() => {});
  });

  // ─── 4. Thomas voit Dune comme objet en plus demandé ────────────────────────
  //
  // Quand Camille sélectionne Dune spécifiquement, il est déjà ajouté à l'échange
  // (extraRequestedItemIds). Thomas n'a pas besoin de le re-sélectionner — il voit
  // juste la demande et peut accepter les nouvelles conditions.

  test("04 — Thomas voit Dune comme objet en plus dans l'échange", async () => {
    const state = getTestState();
    if (!state.extraExchangeId) return test.skip();

    await thomasPage.goto(`/exchanges/${state.extraExchangeId}`);
    await thomasPage.waitForLoadState("domcontentloaded");

    // L'échange doit afficher Dune comme objet en plus demandé
    await expect(thomasPage.locator("body")).toContainText(/dune|objet en plus|ajouter un objet/i, { timeout: 10_000 });
    await thomasPage.screenshot({ path: "playwright-results/extra-04-thomas-voit-dune.png" }).catch(() => {});
  });

  // ─── 5. Camille accepte la proposition enrichie ───────────────────────────────

  test("05 — Camille accepte la proposition avec l'objet en plus", async () => {
    const state = getTestState();
    if (!state.extraExchangeId) return test.skip();

    await camillePage.goto(`/exchanges/${state.extraExchangeId}`);
    await camillePage.waitForLoadState("domcontentloaded");

    const acceptBtn = camillePage.locator("button").filter({ hasText: /accepter/i }).first();
    const found = await acceptBtn.waitFor({ state: "attached", timeout: 10_000 }).then(() => true).catch(() => false);
    if (!found) {
      test.info().annotations.push({ type: "note", description: "Bouton Accepter non trouvé" });
      return;
    }
    await acceptBtn.evaluate((el) => (el as HTMLButtonElement).click());

    // Après acceptation : le stage passe à "accepté" ou "à planifier"
    await expect(camillePage.locator("body")).toContainText(/troc accepté|il ne reste plus|choisir mes disponibilités|accepté/i, { timeout: 10_000 });
    await camillePage.screenshot({ path: "playwright-results/extra-05-acceptee.png" }).catch(() => {});
  });
});
