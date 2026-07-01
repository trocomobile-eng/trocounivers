const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");

const serviceAccount = require("/Users/alexandreranson/Downloads/troco-6c56c-firebase-adminsdk-fbsvc-aace54228a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "troco-6c56c.firebasestorage.app",
});

const bucket = admin.storage().bucket();
const MAX_SIZE = 800; // px max width ou height

async function resizeFile(file) {
  const [buffer] = await file.download();
  const metadata = await file.getMetadata();
  const contentType = metadata[0].contentType || "image/jpeg";

  if (!contentType.startsWith("image/")) return;

  const resized = await sharp(buffer)
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  // On re-uploade seulement si la taille diminue
  if (resized.length >= buffer.length) {
    console.log(`  ⏭  ${file.name} — déjà optimisée, ignorée`);
    return;
  }

  await file.save(resized, {
    metadata: { contentType: "image/jpeg" },
    resumable: false,
  });

  const savedKB = Math.round((buffer.length - resized.length) / 1024);
  console.log(`  ✅ ${file.name} — ${Math.round(buffer.length/1024)}KB → ${Math.round(resized.length/1024)}KB (−${savedKB}KB)`);
}

async function main() {
  console.log("🔍 Listage des images dans items/...\n");
  const [files] = await bucket.getFiles({ prefix: "items/" });

  const images = files.filter((f) => {
    const name = f.name.toLowerCase();
    return name.match(/\.(jpg|jpeg|png|webp)$/);
  });

  console.log(`📸 ${images.length} image(s) trouvée(s)\n`);

  for (const file of images) {
    try {
      await resizeFile(file);
    } catch (err) {
      console.error(`  ❌ ${file.name} — erreur: ${err.message}`);
    }
  }

  console.log("\n✨ Terminé !");
}

main().catch(console.error);
