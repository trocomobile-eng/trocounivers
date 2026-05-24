import { doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const INTEREST_POINTS = {
  view_universe: 2,
  search_universe: 4,
  view_item: 1,
  favorite_item: 5,
  propose_exchange: 8,
  complete_exchange: 10,
};

function normalizeUniverse(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9_-]/g, "_");
}

export async function trackInterest(userId, universe, action = "view_universe", extra = {}) {
  const cleanUniverse = normalizeUniverse(universe);
  if (!userId || !cleanUniverse) return;

  const points = Number(extra.points || INTEREST_POINTS[action] || 1);

  try {
    await setDoc(
      doc(db, "users", userId, "interests", cleanUniverse),
      {
        universe: cleanUniverse,
        score: increment(points),
        [`actions.${action}`]: increment(1),
        lastAction: action,
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Tracking intérêt Troco ignoré :", error);
  }
}
