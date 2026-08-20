import { readFileSync, existsSync } from "fs";
import path from "path";

const STATE_FILE = path.resolve(__dirname, "../../.e2e-state.json");

export interface E2EState {
  mode: "emulator" | "real";
  camilleId: string;
  thomasId: string;
  camilleEmail: string;
  thomasEmail: string;
  camillePassword: string;
  thomasPassword: string;
  lampId: string;
  book1Id: string;
  book2Id: string;
  exchangeId?: string;
}

export function getTestState(): E2EState {
  if (!existsSync(STATE_FILE)) {
    throw new Error("Fichier d'état des tests introuvable. Relance `npm run test:e2e`.");
  }
  return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as E2EState;
}

export function saveExchangeId(id: string) {
  const state = getTestState();
  state.exchangeId = id;
  const { writeFileSync } = require("fs");
  writeFileSync(STATE_FILE, JSON.stringify(state));
}
