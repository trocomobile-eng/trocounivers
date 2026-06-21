import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function belongsToUser(item, uid) {
  if (!uid) return false;
  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean)
    .map(String)
    .includes(String(uid));
}

export function useFavoriteUsers() {
  const { user } = useAuth();
  const [favoriteUserIds, setFavoriteUserIds] = useState([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Écoute la liste des IDs en temps réel
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const ids = snap.data()?.favoriteUsers || [];
      setFavoriteUserIds(Array.isArray(ids) ? ids : []);
    });
    return () => unsub();
  }, [user?.uid]);

  // Charge les profils + leurs objets récents à chaque changement de liste
  useEffect(() => {
    if (!favoriteUserIds.length) {
      setFavoriteProfiles([]);
      setFavoriteItems([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        // Profils
        const profiles = await Promise.all(
          favoriteUserIds.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? { id: snap.id, ...snap.data() } : null;
            } catch { return null; }
          })
        );
        setFavoriteProfiles(profiles.filter(Boolean));

        // Objets récents (30 derniers, filtrés côté client par auteur)
        const itemsSnap = await getDocs(
          query(collection(db, "items"), orderBy("createdAt", "desc"))
        );
        const all = itemsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.status !== "deleted")
          .filter((item) => favoriteUserIds.some((uid) => belongsToUser(item, uid)));

        setFavoriteItems(all);
      } catch (e) {
        console.error("useFavoriteUsers:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [favoriteUserIds.join(",")]);

  const isFavorite = useCallback(
    (uid) => favoriteUserIds.includes(uid),
    [favoriteUserIds]
  );

  const toggle = useCallback(
    async (uid) => {
      if (!user?.uid || !uid || uid === user.uid) return;
      const next = isFavorite(uid)
        ? favoriteUserIds.filter((id) => id !== uid)
        : [...favoriteUserIds, uid];
      try {
        await setDoc(doc(db, "users", user.uid), { favoriteUsers: next }, { merge: true });
      } catch (e) {
        console.error("toggle favoriteUser:", e);
      }
    },
    [user?.uid, favoriteUserIds, isFavorite]
  );

  return { favoriteUserIds, favoriteProfiles, favoriteItems, loading, isFavorite, toggle };
}
