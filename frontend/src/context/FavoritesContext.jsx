import { createContext, useContext, useEffect, useState } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext({ favoriteIds: [], toggle: async () => {} });

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (!user?.uid) { setFavoriteIds([]); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const ids = snap.data()?.favoriteItemIds || [];
      setFavoriteIds(Array.isArray(ids) ? ids : []);
    });
    return () => unsub();
  }, [user?.uid]);

  async function toggle(itemId) {
    if (!user?.uid || !itemId) return;
    const isFav = favoriteIds.includes(itemId);
    // Optimistic update
    setFavoriteIds((cur) => isFav ? cur.filter((id) => id !== itemId) : [...cur, itemId]);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        favoriteItemIds: isFav ? arrayRemove(itemId) : arrayUnion(itemId),
      });
    } catch {
      try {
        await setDoc(doc(db, "users", user.uid), {
          favoriteItemIds: isFav ? [] : [itemId],
        }, { merge: true });
      } catch (err) {
        console.error("Erreur toggle favori :", err);
        // Rollback
        setFavoriteIds((cur) => isFav ? [...cur, itemId] : cur.filter((id) => id !== itemId));
      }
    }
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
