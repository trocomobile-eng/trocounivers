import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext({ items: [], add: async () => {}, remove: async () => {} });

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user?.uid) { setItems([]); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const wishlist = snap.data()?.wishlist || [];
      setItems(Array.isArray(wishlist) ? wishlist : []);
    });
    return () => unsub();
  }, [user?.uid]);

  const add = useCallback(({ title, category = "", note = "" }) => {
    if (!user?.uid || !title.trim()) return;
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      category,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    setItems((cur) => {
      const next = [...cur, newItem];
      setDoc(doc(db, "users", user.uid), { wishlist: next }, { merge: true }).catch(() => {
        setItems((c) => c.filter((i) => i.id !== newItem.id));
      });
      return next;
    });
  }, [user?.uid]);

  const remove = useCallback((itemId) => {
    if (!user?.uid) return;
    setItems((cur) => {
      const next = cur.filter((i) => i.id !== itemId);
      setDoc(doc(db, "users", user.uid), { wishlist: next }, { merge: true }).catch(() => {
        setItems(cur);
      });
      return next;
    });
  }, [user?.uid]);

  return (
    <WishlistContext.Provider value={{ items, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
