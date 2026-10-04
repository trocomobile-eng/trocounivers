const admin = require("firebase-admin");
const serviceAccount = require("/Users/alexandreranson/Downloads/troco-6c56c-firebase-adminsdk-fbsvc-11923d89ed.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const TEST_EMAIL_PREFIX = "e2e.troco.test+";

async function cleanup() {
  console.log("Recherche des utilisateurs de test...");

  // Récupérer tous les users Firebase Auth avec email test
  let testUids = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    const testUsers = result.users.filter(u => u.email?.startsWith(TEST_EMAIL_PREFIX));
    testUids.push(...testUsers.map(u => u.uid));
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`Trouvé ${testUids.length} utilisateurs de test : ${testUids.join(", ")}`);

  if (testUids.length === 0) {
    console.log("Aucun utilisateur de test trouvé.");
    return;
  }

  // Supprimer les items appartenant aux users de test
  const itemsSnap = await db.collection("items")
    .where("ownerId", "in", testUids)
    .get();
  console.log(`Suppression de ${itemsSnap.size} items...`);
  for (const doc of itemsSnap.docs) {
    await doc.ref.delete();
    console.log(`  - item supprimé : ${doc.data().title}`);
  }

  // Supprimer les échanges impliquant les users de test
  for (const uid of testUids) {
    const exSnap = await db.collection("exchanges")
      .where("participants", "array-contains", uid)
      .get();
    for (const doc of exSnap.docs) {
      // Supprimer sous-collection messages
      const msgs = await doc.ref.collection("messages").get();
      for (const msg of msgs.docs) await msg.ref.delete();
      await doc.ref.delete();
      console.log(`  - échange supprimé : ${doc.id}`);
    }
  }

  // Supprimer les docs users dans Firestore
  for (const uid of testUids) {
    await db.collection("users").doc(uid).delete();
    console.log(`  - user Firestore supprimé : ${uid}`);
  }

  // Supprimer les comptes Firebase Auth
  await auth.deleteUsers(testUids);
  console.log(`Comptes Auth supprimés.`);

  console.log("Nettoyage terminé.");
}

cleanup().catch(console.error).finally(() => process.exit());
