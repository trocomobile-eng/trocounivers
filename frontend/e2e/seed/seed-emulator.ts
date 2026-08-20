/**
 * Seed pour l'émulateur Firebase local (Auth + Firestore).
 * Nécessite Java + `firebase emulators:start` préalablement démarré.
 */

const AUTH_EMULATOR = "http://localhost:9099";
const FS_EMULATOR = "http://localhost:8080";
const PROJECT = "troco-6c56c";

const CAMILLE = {
  email: "camille.test@troco-e2e.local",
  password: "Troco_Test_2026!",
  displayName: "Camille (test)",
};
const THOMAS = {
  email: "thomas.test@troco-e2e.local",
  password: "Troco_Test_2026!",
  displayName: "Thomas (test)",
};

export const TEST_USERS = { CAMILLE, THOMAS };

async function createAuthUser(user: typeof CAMILLE) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    }
  );
  const data = await res.json() as { localId: string; idToken: string };
  return { uid: data.localId, token: data.idToken };
}

function fsField(v: unknown): object {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return { integerValue: String(v) };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsField) } };
  if (v === null || v === undefined) return { nullValue: null };
  return { stringValue: String(v) };
}

async function writeDoc(collection: string, docId: string, data: Record<string, unknown>) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, fsField(v)]));
  await fetch(`${FS_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

export async function seedEmulator() {
  // Réinitialise tout
  await fetch(`${FS_EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });

  const camille = await createAuthUser(CAMILLE);
  const thomas = await createAuthUser(THOMAS);

  await writeDoc("users", camille.uid, { displayName: CAMILLE.displayName, email: CAMILLE.email, avatarUrl: "", locationArea: "Paris 11e", isTestData: true });
  await writeDoc("users", thomas.uid, { displayName: THOMAS.displayName, email: THOMAS.email, avatarUrl: "", locationArea: "Paris 11e", isTestData: true });

  const lampId = `e2e-lamp-${camille.uid.slice(0, 8)}`;
  await writeDoc("items", lampId, {
    title: "Lampe de bureau vintage",
    itemType: "Lampe de bureau vintage",
    category: "deco_maison",
    condition: "good",
    description: "Belle lampe vintage en métal.",
    ownerId: camille.uid,
    ownerName: CAMILLE.displayName,
    ownerEmail: CAMILLE.email,
    locationArea: "Paris 11e",
    status: "active",
    isTestData: true,
  });

  const book1Id = `e2e-book1-${thomas.uid.slice(0, 8)}`;
  await writeDoc("items", book1Id, {
    title: "Les Misérables — Victor Hugo",
    itemType: "Les Misérables — Victor Hugo",
    category: "livres",
    condition: "very_good",
    description: "Édition de poche.",
    ownerId: thomas.uid,
    ownerName: THOMAS.displayName,
    ownerEmail: THOMAS.email,
    locationArea: "Paris 11e",
    status: "active",
    isTestData: true,
  });

  const book2Id = `e2e-book2-${thomas.uid.slice(0, 8)}`;
  await writeDoc("items", book2Id, {
    title: "Le Petit Prince — Antoine de Saint-Exupéry",
    itemType: "Le Petit Prince — Antoine de Saint-Exupéry",
    category: "livres",
    condition: "good",
    description: "Bel exemplaire illustré.",
    ownerId: thomas.uid,
    ownerName: THOMAS.displayName,
    ownerEmail: THOMAS.email,
    locationArea: "Paris 11e",
    status: "active",
    isTestData: true,
  });

  return {
    camilleId: camille.uid,
    camilleToken: camille.token,
    thomasId: thomas.uid,
    thomasToken: thomas.token,
    camilleEmail: CAMILLE.email,
    thomasEmail: THOMAS.email,
    camillePassword: CAMILLE.password,
    thomasPassword: THOMAS.password,
    lampId,
    book1Id,
    book2Id,
  };
}
