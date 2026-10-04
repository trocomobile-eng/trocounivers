const admin = require("firebase-admin");
const sa = require("/Users/alexandreranson/Downloads/troco-6c56c-firebase-adminsdk-fbsvc-11923d89ed.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("items").get();
  snap.docs.forEach(d => {
    const data = d.data();
    if ((data.ownerName || "").toLowerCase().includes("camille")) {
      console.log(d.id, "|", data.title, "|", data.ownerName, "|", data.ownerEmail);
    }
  });
}
run().catch(console.error).finally(() => process.exit());
