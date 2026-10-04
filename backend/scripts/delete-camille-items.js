const admin = require("firebase-admin");
const sa = require("/Users/alexandreranson/Downloads/troco-6c56c-firebase-adminsdk-fbsvc-11923d89ed.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("items").get();
  let deleted = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if ((data.ownerEmail || "").startsWith("e2e.troco.test+")) {
      await d.ref.delete();
      console.log(`Supprimé : ${data.title} (${data.ownerName})`);
      deleted++;
    }
  }
  console.log(`\n${deleted} items supprimés.`);
}
run().catch(console.error).finally(() => process.exit());
