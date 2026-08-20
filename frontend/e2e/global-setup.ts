/**
 * globalSetup Playwright — Lance l'émulateur Firebase et seed les données de test.
 *
 * Si Java n'est pas disponible (macOS 10.15), il bascule sur le mode "REST API Firebase"
 * qui utilise le projet Firebase réel avec des comptes de test dédiés (préfixe e2e.test.*).
 * Ces données sont nettoyées par globalTeardown.
 */

import { execSync, spawn, ChildProcess } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { seedEmulator } from "./seed/seed-emulator";
import { seedRealFirebase } from "./seed/seed-real-firebase";

const STATE_FILE = path.resolve(__dirname, "../.e2e-state.json");

let emulatorProcess: ChildProcess | null = null;

function hasJava(): boolean {
  try {
    execSync("java -version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function startEmulator(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("[setup] Démarrage de l'émulateur Firebase...");
    emulatorProcess = spawn(
      "firebase",
      ["emulators:start", "--only", "auth,firestore,storage", "--import", ".e2e-emulator-data", "--export-on-exit", ".e2e-emulator-data"],
      {
        cwd: path.resolve(__dirname, "../.."),
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      }
    );

    let ready = false;
    const timeout = setTimeout(() => {
      if (!ready) {
        console.warn("[setup] L'émulateur n'a pas répondu dans les 30s — basculement sur Firebase réel.");
        resolve(false);
      }
    }, 30_000);

    emulatorProcess.stdout?.on("data", (chunk: Buffer) => {
      const line = chunk.toString();
      if (line.includes("All emulators ready")) {
        ready = true;
        clearTimeout(timeout);
        console.log("[setup] Émulateur prêt.");
        resolve(true);
      }
    });

    emulatorProcess.on("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

export default async function globalSetup() {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });

  const useEmulator = hasJava() ? await startEmulator() : false;

  if (useEmulator) {
    console.log("[setup] Seed via émulateur local...");
    const state = await seedEmulator();
    writeFileSync(STATE_FILE, JSON.stringify({ mode: "emulator", ...state }));
  } else {
    console.log("[setup] Java absent — seed via Firebase REST API (comptes de test dédiés).");
    const state = await seedRealFirebase();
    writeFileSync(STATE_FILE, JSON.stringify({ mode: "real", ...state }));
  }

  console.log("[setup] Données de test prêtes.");
}

export { emulatorProcess };
