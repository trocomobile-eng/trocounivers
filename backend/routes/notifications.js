// backend/routes/notifications.js
// Route pour envoyer des push notifications via Firebase Admin SDK
// À ajouter dans ton server.js : app.use('/api/notifications', require('./routes/notifications'))

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Initialiser Firebase Admin si pas déjà fait
// Télécharge ta clé de service : Firebase Console → Project Settings → Service Accounts
// → Generate new private key → Enregistre sous backend/serviceAccountKey.json
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Envoyer une notification push à un utilisateur
 * POST /api/notifications/send
 * Body: { userId, title, body, url }
 */
router.post("/send", async (req, res) => {
  const { userId, title, body, url } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "userId et title requis" });
  }

  try {
    // Récupérer les tokens FCM de l'utilisateur
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const tokens = Object.keys(userData?.fcmTokens || {});

    if (!tokens.length) {
      return res.json({ sent: 0, message: "Aucun token FCM pour cet utilisateur" });
    }

    // Envoyer à tous les appareils de l'utilisateur
    const message = {
      notification: { title, body: body || "" },
      data: { url: url || "/exchanges" },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Nettoyer les tokens invalides (appareils déconnectés)
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length) {
      const tokenUpdates = {};
      invalidTokens.forEach((token) => {
        tokenUpdates[`fcmTokens.${token}`] = admin.firestore.FieldValue.delete();
      });
      await db.collection("users").doc(userId).update(tokenUpdates);
    }

    return res.json({
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error) {
    console.error("Erreur push notification :", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Notifier l'utilisateur quand c'est son tour dans un échange
 * Appelé depuis les routes d'échange (exchanges.js) après updateDoc
 * 
 * Exemple d'utilisation dans exchanges.js :
 *   await notifyUser(receiverId, "Nouvelle proposition de troc", "Quelqu'un veut échanger avec toi !", `/exchanges/${exchangeId}`);
 */
async function notifyUser(userId, title, body, url) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const tokens = Object.keys(userDoc.data()?.fcmTokens || {});

    if (!tokens.length) return;

    await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      data: { url: url || "/exchanges" },
      tokens,
    });
  } catch (error) {
    console.warn("notifyUser failed:", error.message);
  }
}

module.exports = router;
module.exports.notifyUser = notifyUser;
