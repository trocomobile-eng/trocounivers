const admin = require("firebase-admin");
const serviceAccount = require("/Users/alexandreranson/Downloads/troco-6c56c-firebase-adminsdk-fbsvc-11923d89ed.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

function buildOwnerCity(owner) {
  const locationArea = (owner.locationArea || "").trim();
  const arrondissement = (owner.arrondissement || "").trim();
  const city = (owner.city || owner.locationCity || "Paris").trim();

  // "Paris 11e" already well-formed
  if (/paris\s+\d/i.test(locationArea)) return locationArea;
  if (/paris\s+\d/i.test(arrondissement)) return arrondissement;

  // short form "11e" or "11" → "Paris 11e"
  const shortMatch = (arrondissement || locationArea).match(/^(\d{1,2})(er|e|ème|eme)?$/i);
  if (shortMatch) {
    const n = parseInt(shortMatch[1]);
    return `${city} ${n === 1 ? "1er" : n + "e"}`;
  }

  // fallback: use locationArea or arrondissement as-is, prepend city only if different
  const area = locationArea || arrondissement;
  if (area) {
    return area.toLowerCase().includes(city.toLowerCase()) ? area : `${city} ${area}`;
  }

  return city;
}

function isBadLocation(str) {
  if (!str) return true;
  const s = str.toLowerCase().trim();
  return s === "paris" || /^paris paris/.test(s);
}

async function migrate() {
  console.log("Chargement des items...");
  const itemsSnap = await db.collection("items").get();
  console.log(`${itemsSnap.size} items trouvés.`);

  const ownerIds = [...new Set(itemsSnap.docs.map(d => d.data().ownerId || d.data().userId).filter(Boolean))];
  console.log(`${ownerIds.length} owners distincts.`);

  const ownerMap = {};
  for (const uid of ownerIds) {
    const snap = await db.collection("users").doc(uid).get();
    ownerMap[uid] = snap.data() || {};
  }

  let updated = 0;
  let skipped = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of itemsSnap.docs) {
    const item = doc.data();
    const ownerId = item.ownerId || item.userId;
    if (!ownerId) { skipped++; continue; }

    const owner = ownerMap[ownerId] || {};
    const ownerCity = buildOwnerCity(owner);

    const currentLocation = item.location || "";
    const currentArrondissement = item.arrondissement || "";

    // Skip only if both fields are already correct (not "Paris" or "Paris Paris*")
    const alreadyGood = !isBadLocation(currentLocation) || !isBadLocation(currentArrondissement);
    if (alreadyGood) { skipped++; continue; }

    batch.update(doc.ref, {
      location: ownerCity,
      locationArea: ownerCity,
      arrondissement: ownerCity,
    });
    console.log(`  ✓ ${item.title?.slice(0, 40)} → ${ownerCity}`);
    updated++;
    batchCount++;

    if (batchCount === 499) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  console.log(`\nMigration terminée : ${updated} mis à jour, ${skipped} ignorés.`);
}

migrate().catch(console.error).finally(() => process.exit());
