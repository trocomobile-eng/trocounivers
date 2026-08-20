import { readFileSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { cleanupRealFirebase } from "./seed/seed-real-firebase";

const STATE_FILE = path.resolve(__dirname, "../.e2e-state.json");

export default async function globalTeardown() {
  if (!existsSync(STATE_FILE)) return;

  const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));

  if (state.mode === "real") {
    console.log("[teardown] Nettoyage des données de test Firebase réel...");
    await cleanupRealFirebase(state);
    console.log("[teardown] Nettoyage terminé.");
  } else {
    console.log("[teardown] Émulateur — pas de nettoyage nécessaire (données éphémères).");
  }

  try {
    unlinkSync(STATE_FILE);
  } catch {}
}
