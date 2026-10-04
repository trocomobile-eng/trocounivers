/**
 * Seed via Firebase REST API — FALLBACK quand l'émulateur n'est pas disponible.
 *
 * Utilise le projet Firebase réel MAIS avec des comptes de test dédiés
 * dont l'email commence par "e2e.troco.test+" pour les identifier clairement.
 * Ces données sont SUPPRIMÉES dans globalTeardown.
 *
 * Ne crée JAMAIS de données sans le préfixe de test.
 */

const API_KEY = "AIzaSyC35vkEGuN04IAW-gnuW-NTEVAIm1CYU6s";
const PROJECT = "troco-6c56c";
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// Comptes de test dédiés — créés et supprimés automatiquement
const CAMILLE = {
  email: "e2e.troco.test+camille@gmail.com",
  password: "Troco_E2E_Camille_2026!",
  displayName: "Camille (test)",
};

const THOMAS = {
  email: "e2e.troco.test+thomas@gmail.com",
  password: "Troco_E2E_Thomas_2026!",
  displayName: "Thomas (test)",
};

// Expose les credentials pour les tests
export const TEST_USERS = { CAMILLE, THOMAS };

async function signUp(email: string, password: string, displayName: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  );
  const data = await res.json() as { localId?: string; idToken?: string; error?: { message: string } };

  if (data.error) {
    if (data.error.message === "EMAIL_EXISTS") {
      // Connexion si le compte existe déjà (run précédent non nettoyé)
      return signIn(email, password);
    }
    throw new Error(`signUp failed: ${data.error.message}`);
  }
  return { uid: data.localId!, token: data.idToken! };
}

async function signIn(email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json() as { localId: string; idToken: string };
  return { uid: data.localId, token: data.idToken };
}

function fsField(v: unknown): object {
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return { timestampValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsField) } };
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, fsField(val)])) } };
  }
  return { stringValue: String(v) };
}

async function writeFirestoreDoc(collection: string, docId: string, data: Record<string, unknown>, token: string) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, fsField(v)]));
  const res = await fetch(`${FS_BASE}/${collection}/${docId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(`Firestore write failed: ${err.error?.message}`);
  }
}

async function deleteFirestoreDoc(collection: string, docId: string, token: string) {
  await fetch(`${FS_BASE}/${collection}/${docId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deleteAuthAccount(token: string) {
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
}

export async function seedRealFirebase() {
  const camille = await signUp(CAMILLE.email, CAMILLE.password, CAMILLE.displayName);
  const thomas = await signUp(THOMAS.email, THOMAS.password, THOMAS.displayName);

  // User documents
  await writeFirestoreDoc("users", camille.uid, {
    displayName: CAMILLE.displayName,
    email: CAMILLE.email,
    avatarUrl: "",
    locationArea: "Paris 11e",
    isTestData: true,
  }, camille.token);

  await writeFirestoreDoc("users", thomas.uid, {
    displayName: THOMAS.displayName,
    email: THOMAS.email,
    avatarUrl: "",
    locationArea: "Paris 11e",
    isTestData: true,
  }, thomas.token);

  // Objets de test
  const now = new Date().toISOString();
  // Coordonnées Paris 11e — nécessaires pour apparaître dans le feed avec filtrage distance
  const paris11 = { lat: 48.8589, lng: 2.3790 };

  const lampId = `e2e-lamp-${camille.uid.slice(0, 8)}`;
  await writeFirestoreDoc("items", lampId, {
    title: "Lampe de bureau vintage",
    itemType: "Lampe de bureau vintage",
    category: "deco_maison",
    condition: "good",
    description: "Belle lampe vintage en métal, fonctionne parfaitement.",
    ownerId: camille.uid,
    ownerName: CAMILLE.displayName,
    ownerEmail: CAMILLE.email,
    locationArea: "Paris 11e",
    arrondissement: "11e",
    lat: paris11.lat,
    lng: paris11.lng,
    status: "active",
    isTestData: true,
    createdAt: now,
    publishedAt: now,
  }, camille.token);

  const book1Id = `e2e-book1-${thomas.uid.slice(0, 8)}`;
  await writeFirestoreDoc("items", book1Id, {
    title: "Les Misérables — Victor Hugo",
    itemType: "Les Misérables — Victor Hugo",
    category: "livres",
    condition: "very_good",
    description: "Édition de poche, très bon état.",
    ownerId: thomas.uid,
    ownerName: THOMAS.displayName,
    ownerEmail: THOMAS.email,
    locationArea: "Paris 11e",
    arrondissement: "11e",
    lat: paris11.lat,
    lng: paris11.lng,
    status: "active",
    isTestData: true,
    createdAt: now,
    publishedAt: now,
  }, thomas.token);

  const book2Id = `e2e-book2-${thomas.uid.slice(0, 8)}`;
  await writeFirestoreDoc("items", book2Id, {
    title: "Le Petit Prince — Antoine de Saint-Exupéry",
    itemType: "Le Petit Prince — Antoine de Saint-Exupéry",
    category: "livres",
    condition: "good",
    description: "Bel exemplaire illustré.",
    ownerId: thomas.uid,
    ownerName: THOMAS.displayName,
    ownerEmail: THOMAS.email,
    locationArea: "Paris 11e",
    arrondissement: "11e",
    lat: paris11.lat,
    lng: paris11.lng,
    status: "active",
    isTestData: true,
    createdAt: now,
    publishedAt: now,
  }, thomas.token);

  const book3Id = `e2e-book3-${thomas.uid.slice(0, 8)}`;
  await writeFirestoreDoc("items", book3Id, {
    title: "Dune — Frank Herbert",
    itemType: "Dune — Frank Herbert",
    category: "livres",
    condition: "good",
    description: "Édition collector, légèrement cornée.",
    ownerId: thomas.uid,
    ownerName: THOMAS.displayName,
    ownerEmail: THOMAS.email,
    locationArea: "Paris 11e",
    arrondissement: "11e",
    lat: paris11.lat,
    lng: paris11.lng,
    status: "active",
    isTestData: true,
    createdAt: now,
    publishedAt: now,
  }, thomas.token);

  // Item de secours pour les tests de cas limites (indépendant du flow principal)
  const lamp2Id = `e2e-lamp2-${camille.uid.slice(0, 8)}`;
  await writeFirestoreDoc("items", lamp2Id, {
    title: "Vélo de ville — 7 vitesses",
    itemType: "Vélo de ville — 7 vitesses",
    category: "sport",
    condition: "good",
    description: "Vélo en bon état, idéal pour la ville.",
    ownerId: camille.uid,
    ownerName: CAMILLE.displayName,
    ownerEmail: CAMILLE.email,
    locationArea: "Paris 11e",
    arrondissement: "11e",
    lat: paris11.lat,
    lng: paris11.lng,
    status: "active",
    isTestData: true,
    createdAt: now,
    publishedAt: now,
  }, camille.token);

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
    lamp2Id,
    book1Id,
    book2Id,
    book3Id,
  };
}

export async function cleanupRealFirebase(state: {
  camilleId: string; camilleToken: string;
  thomasId: string; thomasToken: string;
  lampId: string; book1Id: string; book2Id: string;
  [key: string]: unknown;
}) {
  const { camilleId, camilleToken, thomasId, thomasToken, lampId, book1Id, book2Id } = state;

  // Supprime les échanges de test
  for (const id of [state.exchangeId as string].filter(Boolean)) {
    try { await deleteFirestoreDoc("exchanges", id, camilleToken); } catch {}
  }

  // Supprime les échanges secondaires
  for (const id of [state.extraExchangeId as string].filter(Boolean)) {
    try { await deleteFirestoreDoc("exchanges", id, thomasToken); } catch {}
  }

  // Supprime les items
  const book3Id = state.book3Id as string;
  const lamp2Id = state.lamp2Id as string;
  for (const [id, token] of [
    [lampId, camilleToken], [lamp2Id, camilleToken],
    [book1Id, thomasToken], [book2Id, thomasToken], [book3Id, thomasToken],
  ]) {
    try { await deleteFirestoreDoc("items", id, token as string); } catch {}
  }

  // Supprime les documents utilisateurs
  try { await deleteFirestoreDoc("users", camilleId, camilleToken); } catch {}
  try { await deleteFirestoreDoc("users", thomasId, thomasToken); } catch {}

  // Supprime les comptes Firebase Auth
  try { await deleteAuthAccount(camilleToken); } catch {}
  try { await deleteAuthAccount(thomasToken); } catch {}
}
